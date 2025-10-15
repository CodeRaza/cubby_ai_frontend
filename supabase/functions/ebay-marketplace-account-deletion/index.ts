/**
 * eBay Marketplace Account Deletion Webhook Endpoint
 * 
 * SETUP INSTRUCTIONS:
 * 1. This endpoint uses a VERIFICATION_TOKEN that you must configure in eBay Developer Portal
 * 2. Use this token: ebay_webhook_verify_2025_secure_token_x9k2m5p8
 * 3. Go to: https://developer.ebay.com/my/subscriptions
 * 4. Configure this verification token in your webhook subscription settings
 * 5. Set the endpoint URL to: https://ehqdxlqaqmcqnwtlovhw.supabase.co/functions/v1/ebay-marketplace-account-deletion
 * 
 * This endpoint handles:
 * - GET: Challenge verification (eBay tests your endpoint)
 * - POST: Account deletion notifications (user data deletion requests)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ebay-signature',
};

// Configuration
const VERIFICATION_TOKEN = "ebay_webhook_verify_2025_secure_token_x9k2m5p8";
const ENDPOINT_URL = "https://ehqdxlqaqmcqnwtlovhw.supabase.co/functions/v1/ebay-marketplace-account-deletion";

// Helper function to compute SHA-256 hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  try {
    // GET: Handle challenge verification
    if (req.method === 'GET') {
      console.log('📥 Received GET challenge verification request');
      
      const challengeCode = url.searchParams.get('challenge_code');
      
      if (!challengeCode) {
        console.error('❌ Missing challenge_code parameter');
        return new Response(
          JSON.stringify({ error: 'Missing challenge_code parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Compute challenge response: SHA-256(challenge_code + verification_token + endpoint_url)
      const concatenated = challengeCode + VERIFICATION_TOKEN + ENDPOINT_URL;
      const challengeResponse = await sha256(concatenated);
      
      console.log('✅ Challenge verification successful');
      console.log('   Challenge Code:', challengeCode);
      console.log('   Challenge Response:', challengeResponse);
      
      return new Response(
        JSON.stringify({ challengeResponse }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // POST: Handle account deletion notification
    if (req.method === 'POST') {
      console.log('📬 Received POST account deletion notification');
      
      // TODO: Verify eBay signature for security
      // const ebaySignature = req.headers.get('X-EBAY-SIGNATURE');
      // if (ebaySignature) {
      //   // Implement signature verification here
      //   // 1. Extract signature components from X-EBAY-SIGNATURE header
      //   // 2. Reconstruct the signed payload
      //   // 3. Verify using eBay's public key
      //   // See: https://developer.ebay.com/api-docs/commerce/notification/overview.html
      // }
      
      const body = await req.text();
      let notification;
      
      try {
        notification = JSON.parse(body);
      } catch (e) {
        console.error('❌ Invalid JSON in request body:', e);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Immediately respond with 200 (eBay requires response within 3 seconds)
      console.log('✅ Account deletion notification received');
      console.log('   Notification:', JSON.stringify(notification, null, 2));
      
      // TODO: Process user data deletion
      // 1. Extract user identifier from notification
      // 2. Queue deletion job or trigger deletion process
      // 3. Delete user data from database
      // Example:
      // const userId = notification.metadata?.userId;
      // await deleteUserData(userId);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Notification received' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Unsupported method
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
