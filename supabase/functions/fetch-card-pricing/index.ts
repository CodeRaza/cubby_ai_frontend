import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_DURATION_DAYS = 7; // Extended from 24 hours to 7 days

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { cardId, cardDetails, force_refresh } = await req.json();

    if (!cardId || !cardDetails) {
      throw new Error('Missing required fields');
    }

    console.log('[FETCH-PRICING] Request for card:', cardDetails.player_name, cardDetails.card_year);

    // Generate card key for shared cache lookup
    const cardKey = generateCardKey(cardDetails);
    console.log('[FETCH-PRICING] Card key:', cardKey);

    // Check shared pricing cache first
    const { data: cachedPrice } = await supabase
      .from('card_pricing_cache')
      .select('*')
      .eq('card_key', cardKey)
      .single();

    const now = new Date();
    const cacheAgeHours = cachedPrice?.last_ebay_fetch 
      ? (now.getTime() - new Date(cachedPrice.last_ebay_fetch).getTime()) / (1000 * 60 * 60)
      : null;

    // If cache exists and is fresh (< 7 days) and not force refresh, use it
    if (cachedPrice && cacheAgeHours !== null && cacheAgeHours < (CACHE_DURATION_DAYS * 24) && !force_refresh) {
      console.log('[FETCH-PRICING] Using cached price, age:', cacheAgeHours.toFixed(1), 'hours');
      
      // Update user's card with cached pricing
      await supabase
        .from('card_details')
        .update({
          estimated_value: cachedPrice.estimated_value || cachedPrice.average_sale_price,
          last_price_update: cachedPrice.last_ebay_fetch
        })
        .eq('id', cardId);

      return new Response(
        JSON.stringify({
          success: true,
          currentPrice: cachedPrice.estimated_value || cachedPrice.average_sale_price,
          cached: true,
          cacheAge: cacheAgeHours.toFixed(1),
          sharedCache: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cache is stale or missing - queue a background job
    console.log('[FETCH-PRICING] Cache stale or missing, queueing background job');

    // Calculate priority based on estimated card value
    const priority = calculatePriority(cardDetails);

    // Check if already queued
    const { data: existingJob } = await supabase
      .from('pricing_queue')
      .select('id, status')
      .eq('card_details_id', cardId)
      .in('status', ['pending', 'processing'])
      .single();

    if (!existingJob) {
      // Queue the pricing job
      await supabase
        .from('pricing_queue')
        .insert({
          card_details_id: cardId,
          user_id: user.id,
          card_key: cardKey,
          priority: priority,
          status: 'pending'
        });

      console.log('[FETCH-PRICING] Job queued with priority:', priority);
    } else {
      console.log('[FETCH-PRICING] Job already queued, status:', existingJob.status);
    }

    // Return current cached or estimated value immediately
    const currentValue = cachedPrice?.estimated_value || 
                        cachedPrice?.average_sale_price || 
                        calculateBasePrice(cardDetails);

    // Update user's card with current value
    await supabase
      .from('card_details')
      .update({
        estimated_value: currentValue,
        last_price_update: cachedPrice?.last_ebay_fetch || now.toISOString()
      })
      .eq('id', cardId);

    return new Response(
      JSON.stringify({
        success: true,
        currentPrice: currentValue,
        queued: !existingJob,
        status: existingJob?.status || 'pending',
        message: 'Pricing update queued. Refresh in a few minutes for live data.',
        sharedCache: !!cachedPrice
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

function generateCardKey(cardDetails: any): string {
  return [
    cardDetails.card_year || 'unknown',
    cardDetails.brand?.trim() || 'unknown',
    cardDetails.player_name?.trim() || 'unknown',
    cardDetails.card_number?.replace('#', '').trim() || 'unknown',
    cardDetails.sport?.trim() || 'unknown'
  ].join('-').toLowerCase();
}

function calculatePriority(cardDetails: any): number {
  // Base priority on estimated card value for smart refresh
  let priority = 50; // default

  // High-value cards get higher priority
  if (cardDetails.estimated_value) {
    const value = Number(cardDetails.estimated_value);
    if (value >= 1000) priority = 100; // Very high value
    else if (value >= 100) priority = 80;  // High value
    else if (value >= 10) priority = 60;   // Medium value
    else priority = 40; // Low value
  }

  // Boost priority for special attributes
  if (cardDetails.special_attributes?.includes('Rookie Card')) priority += 10;
  if (cardDetails.special_attributes?.includes('Autograph')) priority += 15;
  if (cardDetails.is_graded) priority += 10;

  return Math.min(priority, 100);
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