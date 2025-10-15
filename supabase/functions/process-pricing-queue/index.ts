import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EBAY_APP_ID = Deno.env.get('EBAY_APP_ID');
const EBAY_SANDBOX = false;
const BATCH_SIZE = 100; // Process up to 100 cards per daily run
const DAILY_CALL_LIMIT = 400; // Sandbox limit (~500, we use 400 to be safe)
const DAILY_CALL_THRESHOLD = 0.9; // Stop at 90% of daily limit (360 calls)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[PROCESS-QUEUE] Starting batch processing');

    // Check if we've hit daily quota before processing
    const quotaCheck = await checkDailyQuota(supabase);
    if (quotaCheck.limitReached) {
      console.log('[PROCESS-QUEUE] Daily quota reached:', quotaCheck.todaysCalls, '/', quotaCheck.limit);
      return new Response(
        JSON.stringify({ 
          message: 'Daily API quota reached. Try again tomorrow.',
          todaysCalls: quotaCheck.todaysCalls,
          limit: quotaCheck.limit
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PROCESS-QUEUE] Quota check passed:', quotaCheck.todaysCalls, '/', quotaCheck.limit);

    // Fetch pending jobs ordered by priority
    const { data: jobs, error: fetchError } = await supabase
      .from('pricing_queue')
      .select(`
        id,
        card_details_id,
        user_id,
        card_key,
        priority,
        card_details:card_details_id (
          player_name,
          card_year,
          brand,
          card_number,
          sport,
          set_name,
          condition,
          is_graded,
          grade,
          special_attributes
        )
      `)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('[PROCESS-QUEUE] Error fetching jobs:', fetchError);
      throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('[PROCESS-QUEUE] No pending jobs');
      return new Response(
        JSON.stringify({ message: 'No pending jobs', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PROCESS-QUEUE] Processing', jobs.length, 'jobs');

    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        // Mark as processing
        await supabase
          .from('pricing_queue')
          .update({ status: 'processing' })
          .eq('id', job.id);

        const cardDetails = job.card_details as any;
        
        console.log('[PROCESS-QUEUE] Processing:', cardDetails?.player_name, cardDetails?.card_year);

        // Fetch pricing from eBay
        const ebayData = await searchEbayListings(cardDetails, job.user_id, job.card_key, supabase);
        const searchResult = ebayData?.findCompletedItemsResponse?.[0];
        const items = searchResult?.searchResult?.[0]?.item || [];

        console.log('[PROCESS-QUEUE] Found', items.length, 'eBay listings');

        // Sort by end time (most recent first) and take only the 10 most recent
        const sortedItems = items
          .filter((item: any) => item.listingInfo?.[0]?.endTime?.[0])
          .sort((a: any, b: any) => {
            const dateA = new Date(a.listingInfo[0].endTime[0]).getTime();
            const dateB = new Date(b.listingInfo[0].endTime[0]).getTime();
            return dateB - dateA; // Most recent first
          })
          .slice(0, 10);

        const recentSales = [];
        let totalPrice = 0;

        for (const item of sortedItems) {
          const sellingStatus = item.sellingStatus?.[0];
          const price = parseFloat(sellingStatus?.currentPrice?.[0]?.__value__ || '0');
          
          if (price > 0) {
            recentSales.push({
              card_id: job.card_details_id,
              price: Number(price.toFixed(2)),
              source: 'ebay',
              condition: cardDetails?.condition || 'raw',
              date_of_sale: item.listingInfo?.[0]?.endTime?.[0] || new Date().toISOString(),
              sale_url: item.viewItemURL?.[0] || null
            });
            totalPrice += price;
          }
        }

        const averagePrice = recentSales.length > 0 
          ? totalPrice / recentSales.length 
          : null;

        // Insert sales data
        if (recentSales.length > 0) {
          await supabase.from('price_history').insert(recentSales);
        }

        // Update or insert shared cache
        await supabase
          .from('card_pricing_cache')
          .upsert({
            card_key: job.card_key,
            player_name: cardDetails?.player_name,
            card_year: cardDetails?.card_year,
            brand: cardDetails?.brand,
            card_number: cardDetails?.card_number,
            sport: cardDetails?.sport,
            set_name: cardDetails?.set_name,
            condition: cardDetails?.condition || 'raw',
            is_graded: cardDetails?.is_graded || false,
            estimated_value: averagePrice || calculateBasePrice(cardDetails),
            average_sale_price: averagePrice,
            sale_count: recentSales.length,
            last_ebay_fetch: new Date().toISOString()
          }, {
            onConflict: 'card_key'
          });

        // Update user's card details
        await supabase
          .from('card_details')
          .update({
            estimated_value: averagePrice || calculateBasePrice(cardDetails),
            last_price_update: new Date().toISOString()
          })
          .eq('id', job.card_details_id);

        // Mark job as completed
        await supabase
          .from('pricing_queue')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        processed++;
        console.log('[PROCESS-QUEUE] Successfully processed job', job.id);

        // Longer delay to avoid rate limiting (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error('[PROCESS-QUEUE] Error processing job:', job.id, error);
        
        // Mark job as failed
        await supabase
          .from('pricing_queue')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            processed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        failed++;
      }
    }

    // Clean up old completed/failed jobs (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('pricing_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('processed_at', oneDayAgo);

    console.log('[PROCESS-QUEUE] Batch complete. Processed:', processed, 'Failed:', failed);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed,
        failed,
        total: jobs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PROCESS-QUEUE] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function checkDailyQuota(supabaseClient: any): Promise<{ limitReached: boolean; todaysCalls: number; limit: number }> {
  const today = new Date().toISOString().split('T')[0];
  
  // Count successful calls today
  const { data, error } = await supabaseClient
    .from('ebay_api_usage')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00`)
    .eq('status', 'success');

  if (error) {
    console.error('[QUOTA-CHECK] Error checking quota:', error);
    return { limitReached: false, todaysCalls: 0, limit: DAILY_CALL_LIMIT };
  }

  const todaysCalls = data || 0;
  const threshold = Math.floor(DAILY_CALL_LIMIT * DAILY_CALL_THRESHOLD);
  const limitReached = todaysCalls >= threshold;

  return { limitReached, todaysCalls, limit: threshold };
}

async function searchEbayListings(cardDetails: any, userId?: string, cardKey?: string, supabaseClient?: any, retryCount = 0) {
  const searchParts = [
    cardDetails.card_year,
    cardDetails.brand,
    cardDetails.player_name,
    cardDetails.card_number?.replace('#', ''),
    cardDetails.set_name,
  ].filter(Boolean);

  if (cardDetails.special_attributes?.includes('Rookie Card')) {
    searchParts.push('Rookie');
  }

  const searchTerms = searchParts.join(' ');

  console.log('[PROCESS-QUEUE] Searching eBay for:', searchTerms);

  const findingUrl = EBAY_SANDBOX
    ? 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1'
    : 'https://svcs.ebay.com/services/search/FindingService/v1';

  const params = new URLSearchParams({
    'OPERATION-NAME': 'findCompletedItems',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': EBAY_APP_ID!,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': '',
    'keywords': searchTerms,
    'itemFilter(0).name': 'SoldItemsOnly',
    'itemFilter(0).value': 'true',
    'sortOrder': 'EndTimeSoonest',
    'paginationInput.entriesPerPage': '20', // Fetch 20 to ensure we have 10 valid recent sales
  });

  const startTime = Date.now();
  let status = 'success';
  let errorMessage = null;

  try {
    const response = await fetch(`${findingUrl}?${params}`);
    
    if (!response.ok) {
      status = 'error';
      const errorText = await response.text();
      errorMessage = `eBay API error: ${response.statusText}`;
      console.error('[PROCESS-QUEUE] eBay API error:', errorText);
      
      // Check if it's a rate limit error
      if (errorText.includes('rate') || errorText.includes('limit') || errorText.includes('exceeded')) {
        console.error('[PROCESS-QUEUE] Rate limit detected, retry count:', retryCount);
        
        // Exponential backoff: 5s, 10s, 20s
        if (retryCount < 3) {
          const backoffDelay = 5000 * Math.pow(2, retryCount);
          console.log('[PROCESS-QUEUE] Backing off for', backoffDelay, 'ms');
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          
          // Retry the request
          return searchEbayListings(cardDetails, userId, cardKey, supabaseClient, retryCount + 1);
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Log successful API call
    const responseTime = Date.now() - startTime;
    if (supabaseClient) {
      const { error: logError } = await supabaseClient.from('ebay_api_usage').insert({
        endpoint: 'FindingService',
        operation: 'findCompletedItems',
        status: 'success',
        response_time_ms: responseTime,
        user_id: userId,
        card_key: cardKey
      });
      if (logError) console.error('[PROCESS-QUEUE] Error logging API usage:', logError);
    }
    
    return data;
  } catch (error) {
    // Log failed API call
    const responseTime = Date.now() - startTime;
    if (supabaseClient) {
      const { error: logError } = await supabaseClient.from('ebay_api_usage').insert({
        endpoint: 'FindingService',
        operation: 'findCompletedItems',
        status: 'error',
        response_time_ms: responseTime,
        error_message: errorMessage || (error instanceof Error ? error.message : 'Unknown error'),
        user_id: userId,
        card_key: cardKey
      });
      if (logError) console.error('[PROCESS-QUEUE] Error logging API usage:', logError);
    }
    
    throw error;
  }
}

function calculateBasePrice(cardDetails: any): number {
  let basePrice = 2;

  const currentYear = new Date().getFullYear();
  const cardAge = currentYear - (cardDetails.card_year || currentYear);
  
  if (cardAge > 50) basePrice += 20;
  else if (cardAge > 40) basePrice += 10;
  else if (cardAge > 30) basePrice += 3;
  else if (cardAge > 20) basePrice += 5;
  else if (cardAge > 10) basePrice += 8;
  else basePrice += 10;

  const premiumBrands = ['Topps Chrome', 'Bowman Chrome', 'Panini Prizm', 'Select'];
  const modernBrands = ['Topps', 'Bowman', 'Upper Deck'];
  const vintageBrands = ['Fleer', 'Donruss', 'Score'];
  
  if (premiumBrands.some(brand => cardDetails.brand?.includes(brand))) {
    basePrice += 15;
  } else if (modernBrands.includes(cardDetails.brand)) {
    basePrice += 5;
  } else if (vintageBrands.includes(cardDetails.brand)) {
    basePrice += 2;
  }

  const legendaryPlayers = ['Jeter', 'Jordan', 'Brady', 'Gretzky', 'Ruth', 'Mantle', 'Williams', 'Mays', 'Montana'];
  const superstarPlayers = ['Trout', 'Ohtani', 'Mahomes', 'Wembanyama', 'Judge'];
  const starPlayers = ['Bonds', 'Griffey', 'Rodriguez', 'Pujols', 'Soto', 'Tatum'];
  
  if (legendaryPlayers.some(name => cardDetails.player_name?.includes(name))) {
    basePrice *= 20;
  } else if (superstarPlayers.some(name => cardDetails.player_name?.includes(name))) {
    basePrice *= 12;
  } else if (starPlayers.some(name => cardDetails.player_name?.includes(name))) {
    basePrice *= 3;
  } else {
    basePrice *= 1.5;
  }

  if (cardDetails.special_attributes?.includes('Rookie Card')) {
    basePrice *= 2.5;
  }
  
  if (cardDetails.special_attributes?.includes('Autograph')) {
    basePrice *= 6;
  }
  
  if (cardDetails.special_attributes?.some((attr: string) => 
    ['Refractor', 'Prizm', 'Parallel', 'Serial Numbered'].includes(attr))) {
    basePrice *= 2;
  }

  if (cardDetails.is_graded) {
    const grade = Number(cardDetails.grade) || 7;
    if (grade >= 10) basePrice *= 8;
    else if (grade >= 9.5) basePrice *= 5;
    else if (grade >= 9) basePrice *= 3;
    else if (grade >= 8) basePrice *= 2;
    else if (grade >= 7) basePrice *= 1.3;
  } else {
    const condition = cardDetails.condition?.toLowerCase() || '';
    if (condition.includes('gem mint') || condition.includes('pristine')) basePrice *= 1.8;
    else if (condition.includes('mint')) basePrice *= 1.5;
    else if (condition.includes('near mint')) basePrice *= 1.2;
    else if (condition.includes('excellent')) basePrice *= 1;
    else if (condition.includes('good')) basePrice *= 0.7;
    else if (condition.includes('poor')) basePrice *= 0.4;
  }

  return Math.max(Math.round(basePrice * 100) / 100, 0.5);
}