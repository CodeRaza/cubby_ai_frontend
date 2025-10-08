import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const getWelcomeEmailHtml = (userName?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Cubby</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; margin: 0 auto;">
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding: 48px 48px 32px;">
              <img src="https://61a424e3-3a9c-4a1d-afbe-52e032775a21.lovableproject.com/cubby-logo.png" alt="Cubby" width="80" height="80" style="display: block;">
            </td>
          </tr>
          
          <!-- Heading -->
          <tr>
            <td style="padding: 0 48px;">
              <h1 style="color: #1a1a1a; font-size: 32px; font-weight: bold; margin: 0 0 24px; text-align: center; line-height: 1.3;">
                Welcome to Cubby! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 48px;">
              <p style="color: #404040; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Hi${userName ? ` ${userName}` : ''},
              </p>
              <p style="color: #404040; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Thanks for signing up! We're excited to help you organize and find your belongings in seconds.
              </p>
            </td>
          </tr>
          
          <!-- Features -->
          <tr>
            <td style="padding: 32px 48px;">
              <p style="color: #1a1a1a; font-size: 18px; font-weight: bold; margin: 0 0 16px;">
                Here's what you can do with Cubby:
              </p>
              <p style="color: #404040; font-size: 15px; line-height: 24px; margin: 0 0 12px;">
                📸 <strong>AI-Powered Scanning</strong> - Take a photo and let AI automatically detect and catalog all your items
              </p>
              <p style="color: #404040; font-size: 15px; line-height: 24px; margin: 0 0 12px;">
                📍 <strong>Organize by Location</strong> - Create locations like "Garage", "Kitchen", or "Storage Unit"
              </p>
              <p style="color: #404040; font-size: 15px; line-height: 24px; margin: 0 0 12px;">
                🔍 <strong>Instant Search</strong> - Find any item in seconds across all your locations
              </p>
              <p style="color: #404040; font-size: 15px; line-height: 24px; margin: 0;">
                🏷️ <strong>QR Code Labels</strong> - Generate printable QR codes for quick mobile access
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 32px 48px;">
              <a href="https://getcubby.ai/dashboard" style="background-color: #0EA5E9; border-radius: 8px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 32px;">
                Get Started with Cubby
              </a>
            </td>
          </tr>
          
          <!-- Tip -->
          <tr>
            <td style="padding: 0 48px;">
              <div style="background-color: #f0f9ff; border-left: 4px solid #0EA5E9; border-radius: 4px; padding: 16px; margin: 24px 0;">
                <p style="color: #404040; font-size: 14px; line-height: 22px; margin: 0;">
                  💡 <strong>Pro Tip:</strong> Start by creating your first location and scanning a shelf, pantry, or drawer. You'll be amazed at how quickly Cubby catalogs everything!
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 48px 48px;">
              <p style="color: #8898aa; font-size: 14px; line-height: 24px; margin: 8px 0;">
                Your free tier includes 50 items per month. Need more? <a href="https://getcubby.ai/subscription" style="color: #0EA5E9; text-decoration: underline;">Upgrade anytime</a>
              </p>
              <p style="color: #8898aa; font-size: 14px; line-height: 24px; margin: 8px 0;">
                Questions? Just reply to this email - we'd love to hear from you!
              </p>
              <p style="color: #8898aa; font-size: 14px; line-height: 24px; margin: 8px 0;">
                Happy organizing,<br>
                The Cubby Team
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
    console.log("Received welcome email request");

    const { email, name, userId } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log("Sending welcome email to:", email);

    const html = getWelcomeEmailHtml(name);

    const { error } = await resend.emails.send({
      from: "Cubby <hello@getcubby.ai>",
      to: [email],
      subject: "Welcome to Cubby - Your Smart Home Inventory! 🎉",
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Welcome email sent successfully to:", email);

    // Track the email in the database if userId is provided
    if (userId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error: trackingError } = await supabase
        .from('email_tracking')
        .insert({
          user_id: userId,
          email_type: 'welcome',
          sent_at: new Date().toISOString()
        });
      
      if (trackingError) {
        console.error("Error tracking email:", trackingError);
        // Don't throw - email was sent successfully
      } else {
        console.log("Email tracked in database");
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
