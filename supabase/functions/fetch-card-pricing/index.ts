import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Simulate pricing API call
    // In production, this would call eBay API, Card Ladder, or Market Movers
    const basePrice = calculateBasePrice(cardDetails);
    const variance = (Math.random() - 0.5) * basePrice * 0.3; // ±30% variance
    const currentPrice = Math.max(1, basePrice + variance);

    // Generate recent sales history (last 5 sales)
    const recentSales = [];
    for (let i = 0; i < 5; i++) {
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - daysAgo);
      
      const saleVariance = (Math.random() - 0.5) * basePrice * 0.2;
      const salePrice = Math.max(1, basePrice + saleVariance);

      recentSales.push({
        card_id: cardId,
        price: Number(salePrice.toFixed(2)),
        source: ['ebay', 'cardladder', 'goldin'][Math.floor(Math.random() * 3)],
        condition: cardDetails.condition || 'raw',
        date_of_sale: saleDate.toISOString(),
        sale_url: `https://example.com/sale/${i}`
      });
    }

    // Sort by date (most recent first)
    recentSales.sort((a, b) => new Date(b.date_of_sale).getTime() - new Date(a.date_of_sale).getTime());

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
      JSON.stringify({ error: error.message }),
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