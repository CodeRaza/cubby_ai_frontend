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
  // Build search query from card details
  const searchTerms = [
    cardDetails.player_name,
    cardDetails.card_year,
    cardDetails.brand,
    cardDetails.sport,
    cardDetails.set_name,
  ].filter(Boolean).join(' ');

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

    const { cardId, cardDetails } = await req.json();

    if (!cardId || !cardDetails) {
      throw new Error('Missing required fields');
    }

    console.log('[FETCH-PRICING] Fetching pricing for card:', cardDetails);

    // Search eBay for sold listings (Finding Service uses App ID, not OAuth)
    const ebayData = await searchEbayListings(cardDetails);
    
    // Parse eBay response
    const searchResult = ebayData?.findCompletedItemsResponse?.[0];
    const items = searchResult?.searchResult?.[0]?.item || [];
    
    console.log('[FETCH-PRICING] Found', items.length, 'eBay listings');

    const recentSales = [];
    let totalPrice = 0;
    
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

    // Calculate average price
    const currentPrice = recentSales.length > 0 
      ? totalPrice / recentSales.length 
      : calculateBasePrice(cardDetails);

    console.log('[FETCH-PRICING] Calculated average price:', currentPrice);

    // Insert price history
    const { error: historyError } = await supabase
      .from('price_history')
      .insert(recentSales);

    if (historyError) {
      console.error('[FETCH-PRICING] Error inserting price history:', historyError);
      throw historyError;
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
        recentSales: recentSales.length
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
  let basePrice = 10; // Default base price

  // Adjust for year (older cards often more valuable)
  const currentYear = new Date().getFullYear();
  const cardAge = currentYear - (cardDetails.card_year || currentYear);
  if (cardAge > 30) basePrice *= 5;
  else if (cardAge > 20) basePrice *= 3;
  else if (cardAge > 10) basePrice *= 1.5;

  // Adjust for brand
  const premiumBrands = ['Topps', 'Upper Deck', 'Fleer'];
  if (premiumBrands.includes(cardDetails.brand)) {
    basePrice *= 1.5;
  }

  // Adjust for player (simplified)
  const legendaryPlayers = ['Jeter', 'Jordan', 'Brady', 'Gretzky', 'Ruth'];
  if (legendaryPlayers.some(name => cardDetails.player_name?.includes(name))) {
    basePrice *= 10;
  }

  // Adjust for special attributes
  if (cardDetails.special_attributes?.includes('Rookie Card')) {
    basePrice *= 3;
  }
  if (cardDetails.special_attributes?.includes('Autograph')) {
    basePrice *= 5;
  }
  if (cardDetails.special_attributes?.includes('Refractor')) {
    basePrice *= 2;
  }

  // Adjust for grading
  if (cardDetails.is_graded) {
    const grade = Number(cardDetails.grade) || 7;
    if (grade >= 9.5) basePrice *= 5;
    else if (grade >= 9) basePrice *= 3;
    else if (grade >= 8) basePrice *= 2;
  }

  // Adjust for condition (if not graded)
  if (!cardDetails.is_graded) {
    const condition = cardDetails.condition?.toLowerCase() || '';
    if (condition.includes('mint')) basePrice *= 1.5;
    else if (condition.includes('excellent')) basePrice *= 1.2;
    else if (condition.includes('poor')) basePrice *= 0.5;
  }

  return basePrice;
}