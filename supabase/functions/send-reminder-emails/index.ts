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

interface UserReminder {
  user_id: string;
  email: string;
  days_since_signup: number;
  has_location: boolean;
  has_items: boolean;
  last_email_type: string | null;
}

const getDay1EmailHtml = (userName?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create Your First Location</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h1 style="color: #333333; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">
                👋 ${userName ? `Hey ${userName}!` : 'Hey there!'}
              </h1>
              
              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                We noticed you haven't created your first location yet. Let's get you started!
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #333333; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                  🏠 Why create a location?
                </h2>
                <ul style="color: #666666; font-size: 15px; line-height: 22px; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Organize your items by room, storage area, or property</li>
                  <li style="margin-bottom: 10px;">Quickly find what you're looking for</li>
                  <li style="margin-bottom: 10px;">Share specific locations with family or friends</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/dashboard"
                   style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Create Your First Location
                </a>
              </div>
              
              <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 30px 0 0 0; text-align: center;">
                Need help? Just reply to this email!
              </p>
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

const getDay3EmailHtml = (userName?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Start Scanning Your Items</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h1 style="color: #333333; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">
                📸 ${userName ? `${userName}, ready to scan?` : 'Ready to scan?'}
              </h1>
              
              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Your locations are set up - now it's time to start adding items! Scanning is quick and easy.
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #333333; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                  ✨ What you can do:
                </h2>
                <ul style="color: #666666; font-size: 15px; line-height: 22px; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Scan multiple items at once with AI detection</li>
                  <li style="margin-bottom: 10px;">Add expiry dates and reminders</li>
                  <li style="margin-bottom: 10px;">Search and filter your inventory instantly</li>
                  <li style="margin-bottom: 10px;">Share access with family members</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/scan"
                   style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Start Scanning Items
                </a>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0;">
                  💡 <strong>Pro tip:</strong> Take a photo of a shelf or box and let AI detect all items at once!
                </p>
              </div>
              
              <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 30px 0 0 0; text-align: center;">
                Questions? Just reply to this email!
              </p>
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
    console.log("Starting reminder email job...");
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get users needing reminders
    const { data: users, error: usersError } = await supabase
      .rpc('get_users_needing_reminders') as { data: UserReminder[] | null, error: any };
    
    if (usersError) {
      console.error("Error fetching users needing reminders:", usersError);
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log("No users need reminder emails at this time");
      return new Response(
        JSON.stringify({ message: "No reminders to send" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log(`Found ${users.length} users needing reminders`);
    
    const results = {
      day1_sent: 0,
      day3_sent: 0,
      errors: 0
    };
    
    // Send emails
    for (const user of users) {
      try {
        let emailType: string;
        let subject: string;
        let html: string;
        
        // Determine which email to send
        if (user.days_since_signup >= 1 && user.days_since_signup < 2 && !user.has_location) {
          emailType = 'day1_reminder';
          subject = '🏠 Create your first location in Cubby';
          html = getDay1EmailHtml();
        } else if (user.days_since_signup >= 3 && user.days_since_signup < 4 && !user.has_items) {
          emailType = 'day3_reminder';
          subject = '📸 Start scanning items in Cubby';
          html = getDay3EmailHtml();
        } else {
          continue; // Skip if doesn't match criteria
        }
        
        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: "Cubby <onboarding@resend.dev>", // User will update this to their verified domain
          to: [user.email],
          subject: subject,
          html: html,
        });
        
        console.log(`Sent ${emailType} to ${user.email}:`, emailResponse);
        
        // Track the email
        const { error: trackingError } = await supabase
          .from('email_tracking')
          .insert({
            user_id: user.user_id,
            email_type: emailType,
            sent_at: new Date().toISOString()
          });
        
        if (trackingError) {
          console.error("Error tracking email:", trackingError);
        }
        
        if (emailType === 'day1_reminder') {
          results.day1_sent++;
        } else {
          results.day3_sent++;
        }
        
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
        results.errors++;
      }
    }
    
    console.log("Reminder job complete:", results);
    
    return new Response(
      JSON.stringify({ 
        message: "Reminder emails processed",
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
    
  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
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
