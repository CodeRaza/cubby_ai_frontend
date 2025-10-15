import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getFirstSaveEmailHtml = (userName: string, itemCount: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations on Your First Save!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <div style="text-align: center; font-size: 60px; margin-bottom: 20px;">
                🎉
              </div>
              
              <h1 style="color: #333333; font-size: 28px; font-weight: bold; margin: 0 0 20px 0; text-align: center;">
                Awesome! You saved your first ${itemCount} item${itemCount > 1 ? 's' : ''}!
              </h1>
              
              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hey ${userName}, you're on your way to never losing track of your stuff again! 🙌
              </p>
              
              <div style="background-color: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h2 style="color: #065f46; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
                  What's next?
                </h2>
                <ul style="color: #047857; font-size: 15px; line-height: 22px; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Keep scanning items to build your inventory</li>
                  <li style="margin-bottom: 10px;">Add expiry dates to get reminders before things go bad</li>
                  <li style="margin-bottom: 10px;">Use the search to instantly find anything</li>
                  <li style="margin-bottom: 10px;">Share locations with family members</li>
                </ul>
              </div>
              
              <div style="background-color: #fef3c7; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #92400e; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
                  💡 Pro Tips:
                </h2>
                <ul style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Scan multiple items at once - just take a photo of a shelf!</li>
                  <li style="margin-bottom: 8px;">Create separate locations for different rooms or storage areas</li>
                  <li style="margin-bottom: 8px;">Set reminders for items that expire or need checking</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/scan"
                   style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; margin-right: 10px;">
                  Scan More Items
                </a>
                <a href="https://getcubby.ai/dashboard"
                   style="display: inline-block; background-color: #ffffff; color: #6366f1; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; border: 2px solid #6366f1;">
                  View Dashboard
                </a>
              </div>
              
              <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 30px 0 0 0; text-align: center;">
                Have questions or feedback? Just reply to this email!
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
    console.log("Received first save email request");

    const { email, name, userId, itemCount } = await req.json();

    if (!email || !userId) {
      throw new Error("Email and userId are required");
    }

    console.log(`Sending first save email to: ${email}`);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Cubby <hello@getcubby.ai>",
      to: [email],
      subject: `🎉 You saved your first ${itemCount} item${itemCount > 1 ? 's' : ''} in Cubby!`,
      html: getFirstSaveEmailHtml(name || email.split('@')[0], itemCount),
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log("First save email sent successfully to:", email);

    // Track the email in the database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: trackingError } = await supabase
      .from('email_tracking')
      .insert({
        user_id: userId,
        email_type: 'first_save',
        sent_at: new Date().toISOString()
      });
    
    if (trackingError) {
      console.error("Error tracking email:", trackingError);
      // Don't throw - email was sent successfully
    } else {
      console.log("Email tracked in database");
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-first-save-email function:", error);
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
