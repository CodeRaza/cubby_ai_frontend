import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TopCard {
  card_key: string;
  card_year: number;
  brand: string;
  player_name: string;
  card_number: string;
  sport: string;
  score: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[REFRESH-TOP-CARDS] Starting top cards refresh');

    // Get top cards based on multiple metrics
    const topCards = await identifyTopCards(supabase);
    console.log(`[REFRESH-TOP-CARDS] Identified ${topCards.length} top cards`);

    let refreshed = 0;
    let failed = 0;

    // Refresh pricing for top cards in batches
    const batchSize = 50;
    for (let i = 0; i < topCards.length; i += batchSize) {
      const batch = topCards.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (card) => {
          try {
            await refreshCardPricing(supabase, card);
            refreshed++;
            console.log(`[REFRESH-TOP-CARDS] Refreshed ${card.card_key}`);
          } catch (error) {
            failed++;
            console.error(`[REFRESH-TOP-CARDS] Failed to refresh ${card.card_key}:`, error);
          }
        })
      );

      // Rate limit: wait between batches
      if (i + batchSize < topCards.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`[REFRESH-TOP-CARDS] Complete: ${refreshed} refreshed, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        refreshed,
        failed,
        total: topCards.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[REFRESH-TOP-CARDS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function identifyTopCards(supabase: any): Promise<TopCard[]> {
  // Get cards with highest estimated values (top performers)
  const { data: valueCards } = await supabase
    .from('card_details')
    .select('card_year, brand, player_name, card_number, sport, estimated_value')
    .not('estimated_value', 'is', null)
    .order('estimated_value', { ascending: false })
    .limit(2000);

  // Get most frequently queued cards (high demand)
  const { data: queuedCards } = await supabase
    .from('pricing_queue')
    .select('card_key')
    .limit(3000);

  // Get cards with price alerts (user interest)
  const { data: alertCards } = await supabase
    .from('price_alerts')
    .select('card_id')
    .limit(2000);

  // Calculate scores for each card
  const cardScores = new Map<string, { card: any; score: number }>();

  // Score high-value cards
  valueCards?.forEach((card: any, index: number) => {
    const key = generateCardKey(
      card.card_year,
      card.brand,
      card.player_name,
      card.card_number,
      card.sport
    );
    const valueScore = 1000 - index; // Higher rank = higher score
    cardScores.set(key, { card, score: valueScore });
  });

  // Boost score for frequently queued cards
  const queueFrequency = new Map<string, number>();
  queuedCards?.forEach(({ card_key }: { card_key: string }) => {
    queueFrequency.set(card_key, (queueFrequency.get(card_key) || 0) + 1);
  });

  queueFrequency.forEach((count, key) => {
    const existing = cardScores.get(key);
    if (existing) {
      existing.score += count * 10; // Boost for demand
    }
  });

  // Boost score for cards with alerts
  if (alertCards) {
    for (const { card_id } of alertCards) {
      const { data: cardDetail } = await supabase
        .from('card_details')
        .select('card_year, brand, player_name, card_number, sport')
        .eq('id', card_id)
        .single();

      if (cardDetail) {
        const key = generateCardKey(
          cardDetail.card_year,
          cardDetail.brand,
          cardDetail.player_name,
          cardDetail.card_number,
          cardDetail.sport
        );
        const existing = cardScores.get(key);
        if (existing) {
          existing.score += 50; // Boost for user interest
        }
      }
    }
  }

  // Sort by score and take top 5K
  const topCards = Array.from(cardScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5000)
    .map(([card_key, { card, score }]) => ({
      card_key,
      card_year: card.card_year,
      brand: card.brand,
      player_name: card.player_name,
      card_number: card.card_number,
      sport: card.sport,
      score
    }));

  return topCards;
}

async function refreshCardPricing(supabase: any, card: TopCard) {
  const ebayAppId = Deno.env.get('EBAY_APP_ID');
  
  if (!ebayAppId) {
    throw new Error('eBay API credentials not configured');
  }

  // Search for completed eBay listings
  const listings = await searchEbayListings(ebayAppId, card);

  if (!listings || listings.length === 0) {
    // Use base price calculation if no listings found
    const basePrice = calculateBasePrice(card);
    await updateCache(supabase, card, basePrice, 0);
    return;
  }

  // Get sale prices and dates, sort by most recent, take only 10 most recent
  const salesData = listings
    .filter((item: any) => 
      item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ &&
      item.listingInfo?.[0]?.endTime?.[0]
    )
    .map((item: any) => ({
      price: parseFloat(item.sellingStatus[0].currentPrice[0].__value__),
      endTime: new Date(item.listingInfo[0].endTime[0])
    }))
    .sort((a: { price: number; endTime: Date }, b: { price: number; endTime: Date }) => 
      b.endTime.getTime() - a.endTime.getTime()
    )
    .slice(0, 10); // Take only the 10 most recent sales

  if (salesData.length === 0) {
    const basePrice = calculateBasePrice(card);
    await updateCache(supabase, card, basePrice, 0);
    return;
  }

  const averagePrice = salesData.reduce((sum: number, sale: { price: number; endTime: Date }) => 
    sum + sale.price, 0
  ) / salesData.length;
  
  // Update cache with fresh data
  await updateCache(supabase, card, averagePrice, salesData.length);
}

async function searchEbayListings(appId: string, card: TopCard) {
  const searchTerms = [
    card.card_year,
    card.brand,
    card.player_name,
    card.card_number,
    card.sport,
    'sold'
  ].filter(Boolean).join(' ');

  const params = new URLSearchParams({
    'OPERATION-NAME': 'findCompletedItems',
    'SERVICE-VERSION': '1.13.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': '',
    'keywords': searchTerms,
    'itemFilter(0).name': 'SoldItemsOnly',
    'itemFilter(0).value': 'true',
    'sortOrder': 'EndTimeSoonest',
    'paginationInput.entriesPerPage': '20'
  });

  const url = `https://svcs.ebay.com/services/search/FindingService/v1?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return data.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];
  } catch (error) {
    console.error('[EBAY-SEARCH] Error:', error);
    return [];
  }
}

async function updateCache(supabase: any, card: TopCard, price: number, saleCount: number) {
  await supabase
    .from('card_pricing_cache')
    .upsert({
      card_key: card.card_key,
      card_year: card.card_year,
      brand: card.brand,
      player_name: card.player_name,
      card_number: card.card_number,
      sport: card.sport,
      estimated_value: price,
      average_sale_price: price,
      sale_count: saleCount,
      last_ebay_fetch: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'card_key'
    });
}

function calculateBasePrice(card: TopCard): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - card.card_year;
  
  let basePrice = 5;
  
  if (age > 40) basePrice *= 3;
  else if (age > 20) basePrice *= 2;
  else if (age > 10) basePrice *= 1.5;
  
  const premiumBrands = ['topps chrome', 'bowman chrome', 'prizm', 'select', 'optic'];
  if (premiumBrands.some(b => card.brand?.toLowerCase().includes(b))) {
    basePrice *= 2;
  }
  
  return Math.round(basePrice * 100) / 100;
}

function generateCardKey(year: number, brand: string, player: string, number: string, sport: string): string {
  return [
    year || 'unknown',
    (brand || 'unknown').trim().toLowerCase(),
    (player || 'unknown').trim().toLowerCase(),
    (number || 'unknown').replace('#', '').trim(),
    (sport || 'unknown').trim().toLowerCase()
  ].join('-');
}
