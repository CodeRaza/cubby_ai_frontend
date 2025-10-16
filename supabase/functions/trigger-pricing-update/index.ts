import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PricingRequest {
  cardDetailsId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { cardDetailsId } = await req.json() as PricingRequest;

    if (!cardDetailsId) {
      throw new Error('cardDetailsId is required');
    }

    console.log(`[TRIGGER-PRICING] Fetching card details for ${cardDetailsId}`);

    // Get card details
    const { data: cardData, error: cardError } = await supabaseClient
      .from('card_details')
      .select(`
        *,
        items!inner(user_id)
      `)
      .eq('id', cardDetailsId)
      .single();

    if (cardError) throw cardError;
    if (!cardData) throw new Error('Card not found');

    console.log(`[TRIGGER-PRICING] Found card: ${cardData.player_name} ${cardData.card_year} ${cardData.brand}`);

    // Generate card key
    const cardKey = [
      cardData.card_year || 'unknown',
      (cardData.brand || 'unknown').toLowerCase().trim(),
      (cardData.player_name || 'unknown').toLowerCase().trim(),
      (cardData.card_number || 'unknown').replace('#', ''),
      (cardData.sport || 'unknown').toLowerCase().trim()
    ].join('-');

    console.log(`[TRIGGER-PRICING] Card key: ${cardKey}`);

    // Delete any existing pending jobs for this card to avoid duplicates
    await supabaseClient
      .from('pricing_queue')
      .delete()
      .eq('card_details_id', cardDetailsId)
      .eq('status', 'pending');

    // Add to pricing queue with high priority
    const { data: queueData, error: queueError } = await supabaseClient
      .from('pricing_queue')
      .insert({
        card_key: cardKey,
        card_details_id: cardDetailsId,
        user_id: cardData.items.user_id,
        status: 'pending',
        priority: 100 // High priority for manual triggers
      })
      .select()
      .single();

    if (queueError) throw queueError;

    console.log(`[TRIGGER-PRICING] Added to queue: ${queueData.id}`);

    // Immediately invoke the pricing processor
    console.log(`[TRIGGER-PRICING] Invoking pricing processor...`);
    
    const { data: processorData, error: processorError } = await supabaseClient.functions.invoke(
      'process-pricing-queue',
      { body: { force: true } }
    );

    if (processorError) {
      console.error(`[TRIGGER-PRICING] Processor error:`, processorError);
    } else {
      console.log(`[TRIGGER-PRICING] Processor result:`, processorData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pricing update triggered',
        queueId: queueData.id,
        cardKey: cardKey,
        processorResult: processorData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[TRIGGER-PRICING] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
