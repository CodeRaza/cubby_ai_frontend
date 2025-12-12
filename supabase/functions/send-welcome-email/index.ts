import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

// @ts-ignore - Deno is available in Supabase Edge Functions runtime
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required");
}
const resend = new Resend(RESEND_API_KEY);

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
  <title>Welcome to Your Sports Card Portfolio</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #334155;">
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding: 48px 48px 32px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); width: 80px; height: 80px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                <span style="font-size: 48px;">⚾</span>
              </div>
            </td>
          </tr>
          
          <!-- Heading -->
          <tr>
            <td style="padding: 0 48px;">
              <h1 style="color: #f8fafc; font-size: 32px; font-weight: bold; margin: 0 0 16px; text-align: center; line-height: 1.3;">
                Welcome to Your Card Portfolio! 🎉
              </h1>
              <p style="color: #94a3b8; font-size: 18px; text-align: center; margin: 0 0 24px;">
                Track, price, and profit from your sports cards
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 48px;">
              <p style="color: #cbd5e1; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Hi${userName ? ` ${userName}` : ''},
              </p>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 26px; margin: 0 0 24px;">
                You just joined thousands of collectors using AI to manage their sports card portfolios. Let's get you started tracking your collection's value! 📈
              </p>
            </td>
          </tr>
          
          <!-- Features -->
          <tr>
            <td style="padding: 0 48px 32px;">
              <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 24px; border: 1px solid rgba(59, 130, 246, 0.2);">
                <p style="color: #f8fafc; font-size: 18px; font-weight: bold; margin: 0 0 20px;">
                  What You Can Do:
                </p>
                <div style="margin-bottom: 16px;">
                  <p style="color: #cbd5e1; font-size: 15px; line-height: 24px; margin: 0;">
                    📸 <strong style="color: #f8fafc;">AI Card Scanner</strong><br/>
                    <span style="color: #94a3b8;">Snap a photo and instantly identify player, year, brand, and more</span>
                  </p>
                </div>
                <div style="margin-bottom: 16px;">
                  <p style="color: #cbd5e1; font-size: 15px; line-height: 24px; margin: 0;">
                    💰 <strong style="color: #f8fafc;">Live Market Pricing</strong><br/>
                    <span style="color: #94a3b8;">Get real-time valuations from eBay sales data</span>
                  </p>
                </div>
                <div style="margin-bottom: 16px;">
                  <p style="color: #cbd5e1; font-size: 15px; line-height: 24px; margin: 0;">
                    📊 <strong style="color: #f8fafc;">Portfolio Tracking</strong><br/>
                    <span style="color: #94a3b8;">Watch your collection's value over time</span>
                  </p>
                </div>
                <div>
                  <p style="color: #cbd5e1; font-size: 15px; line-height: 24px; margin: 0;">
                    🏆 <strong style="color: #f8fafc;">Organize Collections</strong><br/>
                    <span style="color: #94a3b8;">Group cards by player, team, or storage location</span>
                  </p>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 48px 32px;">
              <a href="https://getcubby.ai/dashboard" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 8px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; text-decoration: none; padding: 16px 48px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                Start Building Your Portfolio
              </a>
            </td>
          </tr>
          
          <!-- Tip -->
          <tr>
            <td style="padding: 0 48px 32px;">
              <div style="background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 20px;">
                <p style="color: #cbd5e1; font-size: 14px; line-height: 22px; margin: 0;">
                  💡 <strong style="color: #f8fafc;">Pro Tip:</strong> Start by scanning 5-10 cards to see how powerful the AI detection is. Most collectors are amazed by the accuracy!
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 48px 48px;">
              <p style="color: #64748b; font-size: 14px; line-height: 24px; margin: 8px 0; text-align: center;">
                Your free tier includes 10 cards. Need more? <a href="https://getcubby.ai/subscription" style="color: #3b82f6; text-decoration: underline;">Upgrade anytime</a>
              </p>
              <p style="color: #64748b; font-size: 14px; line-height: 24px; margin: 16px 0 0; text-align: center;">
                Questions? Just reply to this email!<br/>
                Happy collecting! 🏆
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
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [email],
      subject: "⚾ Welcome to Your Sports Card Portfolio!",
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Welcome email sent successfully to:", email);

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
