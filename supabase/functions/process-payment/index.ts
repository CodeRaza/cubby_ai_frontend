import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    console.log(`Processing payment for user ${user.id}, session ${sessionId}`);

    // Add 100 bonus credits to the user's current period
    const { data: currentUsage, error: usageError } = await supabaseClient
      .from('scan_usage')
      .select('*')
      .eq('user_id', user.id)
      .gte('period_end', new Date().toISOString())
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      throw new Error(`Error fetching usage: ${usageError.message}`);
    }

    if (currentUsage) {
      // Update existing usage
      const { error: updateError } = await supabaseClient
        .from('scan_usage')
        .update({
          bonus_credits: currentUsage.bonus_credits + 100
        })
        .eq('id', currentUsage.id);

      if (updateError) {
        throw new Error(`Error updating usage: ${updateError.message}`);
      }
    } else {
      // Create new usage record with bonus credits
      const periodStart = new Date();
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: insertError } = await supabaseClient
        .from('scan_usage')
        .insert({
          user_id: user.id,
          scans_used: 0,
          bonus_credits: 100,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString()
        });

      if (insertError) {
        throw new Error(`Error creating usage: ${insertError.message}`);
      }
    }

    console.log(`Successfully added 100 bonus credits for user ${user.id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
