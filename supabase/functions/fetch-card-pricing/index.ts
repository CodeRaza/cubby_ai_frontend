import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EBAY_APP_ID = Deno.env.get('EBAY_APP_ID');
const EBAY_CERT_ID = Deno.env.get('EBAY_CERT_ID');
const EBAY_SANDBOX = false; // Production API enabled

// Note: Finding Service API doesn't use OAuth - it uses App ID directly
async function searchEbayListings(cardDetails: any) {
  // Build search query from card details - prioritize specific details
  const searchParts = [
    cardDetails.card_year,
    cardDetails.brand,
    cardDetails.player_name,
    cardDetails.card_number?.replace('#', ''), // Remove # symbol
    cardDetails.set_name,
  ].filter(Boolean);

  // For rookie cards, add that to search
  if (cardDetails.special_attributes?.includes('Rookie Card')) {
    searchParts.push('Rookie');
  }

  const searchTerms = searchParts.join(' ');

  console.log('[FETCH-PRICING] Searching eBay for:', searchTerms);

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
    'paginationInput.entriesPerPage': '10',
  });

  const response = await fetch(`${findingUrl}?${params}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[FETCH-PRICING] eBay API error response:', errorText);
    throw new Error(`eBay API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('[FETCH-PRICING] eBay response:', JSON.stringify(data).substring(0, 500));
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { cardId, cardDetails, force_refresh } = await req.json();

    if (!cardId || !cardDetails) {
      throw new Error('Missing required fields');
    }

    console.log('[FETCH-PRICING] Fetching pricing for card:', cardDetails, 'force_refresh:', force_refresh);

    // Check if we have recent pricing data (last 24 hours) unless force refresh is requested
    if (!force_refresh) {
      const { data: existingCard } = await supabase
        .from('card_details')
        .select('estimated_value, last_price_update')
        .eq('id', cardId)
        .single();

      if (existingCard?.last_price_update) {
        const lastUpdate = new Date(existingCard.last_price_update);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate < 24 && existingCard.estimated_value) {
          console.log('[FETCH-PRICING] Using cached price from', hoursSinceUpdate.toFixed(1), 'hours ago');
          return new Response(
            JSON.stringify({
              success: true,
              currentPrice: existingCard.estimated_value,
              recentSales: 0,
              cached: true,
              cacheAge: hoursSinceUpdate.toFixed(1)
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    let recentSales = [];
    let totalPrice = 0;
    let isRateLimited = false;

    try {
      // Search eBay for sold listings (Finding Service uses App ID, not OAuth)
      const ebayData = await searchEbayListings(cardDetails);
      
      // Parse eBay response
      const searchResult = ebayData?.findCompletedItemsResponse?.[0];
      const items = searchResult?.searchResult?.[0]?.item || [];
      
      console.log('[FETCH-PRICING] Found', items.length, 'eBay listings');

      for (const item of items.slice(0, 10)) {
        const sellingStatus = item.sellingStatus?.[0];
        const price = parseFloat(sellingStatus?.currentPrice?.[0]?.__value__ || '0');
        
        if (price > 0) {
          recentSales.push({
            card_id: cardId,
            price: Number(price.toFixed(2)),
            source: 'ebay',
            condition: cardDetails.condition || 'raw',
            date_of_sale: item.listingInfo?.[0]?.endTime?.[0] || new Date().toISOString(),
            sale_url: item.viewItemURL?.[0] || null
          });
          totalPrice += price;
        }
      }
    } catch (ebayError) {
      // Check if it's a rate limit error
      if (ebayError instanceof Error && ebayError.message.includes('exceeded the number of times')) {
        console.log('[FETCH-PRICING] eBay rate limit reached, using base price calculation');
        isRateLimited = true;
      } else {
        // Re-throw non-rate-limit errors
        throw ebayError;
      }
    }

    // Calculate average price
    const currentPrice = recentSales.length > 0 
      ? totalPrice / recentSales.length 
      : calculateBasePrice(cardDetails);

    console.log('[FETCH-PRICING] Calculated price:', currentPrice, isRateLimited ? '(base price - rate limited)' : '(from eBay)');

    // Insert price history only if we got eBay data
    if (recentSales.length > 0) {
      const { error: historyError } = await supabase
        .from('price_history')
        .insert(recentSales);

      if (historyError) {
        console.error('[FETCH-PRICING] Error inserting price history:', historyError);
        // Don't throw - continue with price update
      }
    }

    // Update card details with latest pricing
    const { error: updateError } = await supabase
      .from('card_details')
      .update({
        estimated_value: Number(currentPrice.toFixed(2)),
        last_price_update: new Date().toISOString()
      })
      .eq('id', cardId);

    if (updateError) {
      console.error('[FETCH-PRICING] Error updating card details:', updateError);
      throw updateError;
    }

    console.log('[FETCH-PRICING] Successfully updated pricing for card');

    return new Response(
      JSON.stringify({
        success: true,
        currentPrice: Number(currentPrice.toFixed(2)),
        recentSales: recentSales.length,
        isEstimated: isRateLimited,
        message: isRateLimited ? 'eBay rate limit reached. Price estimated based on card attributes.' : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[FETCH-PRICING] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function calculateBasePrice(cardDetails: any): number {
  let basePrice = 2; // Start very low

  // Adjust for year (older cards often more valuable, but 1980s-90s are common)
  const currentYear = new Date().getFullYear();
  const cardAge = currentYear - (cardDetails.card_year || currentYear);
  
  if (cardAge > 50) basePrice += 20; // Pre-1975
  else if (cardAge > 40) basePrice += 10; // 1975-1985
  else if (cardAge > 30) basePrice += 3; // 1985-1995 (junk wax era)
  else if (cardAge > 20) basePrice += 5; // 1995-2005
  else if (cardAge > 10) basePrice += 8; // 2005-2015
  else basePrice += 10; // Modern cards

  // Adjust for brand (additive, not multiplicative)
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

  // Player multiplier (multiplicative for major impact)
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
    basePrice *= 1.5; // Common players
  }

  // Rookie cards get multiplier
  if (cardDetails.special_attributes?.includes('Rookie Card')) {
    basePrice *= 2.5;
  }
  
  // Autograph cards
  if (cardDetails.special_attributes?.includes('Autograph')) {
    basePrice *= 6;
  }
  
  // Special insert cards
  if (cardDetails.special_attributes?.some((attr: string) => 
    ['Refractor', 'Prizm', 'Parallel', 'Serial Numbered'].includes(attr))) {
    basePrice *= 2;
  }

  // Adjust for grading
  if (cardDetails.is_graded) {
    const grade = Number(cardDetails.grade) || 7;
    if (grade >= 10) basePrice *= 8;
    else if (grade >= 9.5) basePrice *= 5;
    else if (grade >= 9) basePrice *= 3;
    else if (grade >= 8) basePrice *= 2;
    else if (grade >= 7) basePrice *= 1.3;
  } else {
    // Condition adjustment for raw cards (smaller impact)
    const condition = cardDetails.condition?.toLowerCase() || '';
    if (condition.includes('gem mint') || condition.includes('pristine')) basePrice *= 1.8;
    else if (condition.includes('mint')) basePrice *= 1.5;
    else if (condition.includes('near mint')) basePrice *= 1.2;
    else if (condition.includes('excellent')) basePrice *= 1;
    else if (condition.includes('good')) basePrice *= 0.7;
    else if (condition.includes('poor')) basePrice *= 0.4;
  }

  return Math.max(Math.round(basePrice * 100) / 100, 0.5); // Round to 2 decimals, minimum 50 cents
}