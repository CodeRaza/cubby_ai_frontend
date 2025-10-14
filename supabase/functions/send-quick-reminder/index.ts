import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const get2HourReminderHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your location is ready!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h1 style="color: #333333; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">
                📦 Your location is ready!
              </h1>
              
              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Great job creating your location! Now let's add your first item in just 30 seconds.
              </p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <p style="color: #065f46; font-size: 15px; line-height: 22px; margin: 0;">
                  💡 <strong>Quick tip:</strong> Take a photo of a shelf and let our AI detect all items at once. It's like magic! 🪄
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/scan"
                   style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 18px; font-weight: 600;">
                  Scan Your First Item
                </a>
              </div>
              
              <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0;">
                  ⚡ Most users scan 10+ items in their first session
                </p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #999999; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} Cubby. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting 2-hour quick reminder job...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get users who created location within last 2-3 hours but have no items yet
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('user_id, created_at')
      .gte('created_at', threeHoursAgo)
      .lte('created_at', twoHoursAgo);
    
    if (locError) throw locError;
    
    if (!locations || locations.length === 0) {
      console.log("No users need quick reminder");
      return new Response(
        JSON.stringify({ message: "No quick reminders to send" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const results = { sent: 0, errors: 0 };
    const processedUsers = new Set();
    
    for (const location of locations) {
      // Skip if already processed this user
      if (processedUsers.has(location.user_id)) continue;
      processedUsers.add(location.user_id);
      
      try {
        // Check if user has any items
        const { count: itemCount } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', location.user_id);
        
        if (itemCount && itemCount > 0) continue; // Skip if user already has items
        
        // Check if we already sent this reminder type
        const { data: existingEmail } = await supabase
          .from('email_tracking')
          .select('*')
          .eq('user_id', location.user_id)
          .eq('email_type', '2hour_reminder')
          .maybeSingle();
        
        if (existingEmail) continue; // Already sent
        
        // Get user email
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(location.user_id);
        if (userError || !user?.email) continue;
        
        // Send email
        const emailResponse = await resend.emails.send({
          from: "Cubby <hello@getcubby.ai>",
          to: [user.email],
          subject: "⚡ Your location is ready - scan your first item!",
          html: get2HourReminderHtml(),
        });
        
        console.log(`Sent 2-hour reminder to ${user.email}:`, emailResponse);
        
        // Track the email
        await supabase
          .from('email_tracking')
          .insert({
            user_id: location.user_id,
            email_type: '2hour_reminder',
            sent_at: new Date().toISOString()
          });
        
        results.sent++;
        
      } catch (error) {
        console.error(`Error processing user ${location.user_id}:`, error);
        results.errors++;
      }
    }
    
    console.log("Quick reminder job complete:", results);
    
    return new Response(
      JSON.stringify({ 
        message: "Quick reminder emails processed",
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
    
  } catch (error: any) {
    console.error("Error in send-quick-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
