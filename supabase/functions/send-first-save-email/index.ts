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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getFirstSaveEmailHtml = (userName: string, itemCount: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #334155;">
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; font-size: 80px; margin-bottom: 20px;">🎉</div>
              
              <h1 style="color: #f8fafc; font-size: 32px; font-weight: bold; margin: 0 0 16px; text-align: center;">
                First Card${itemCount > 1 ? 's' : ''} Added!
              </h1>
              
              <p style="color: #cbd5e1; font-size: 18px; line-height: 26px; margin: 0 0 24px; text-align: center;">
                Hey ${userName}, you just added ${itemCount} card${itemCount > 1 ? 's' : ''} to your portfolio! 🙌
              </p>
              
              <div style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(16, 185, 129, 0.2);">
                <h2 style="color: #10b981; font-size: 20px; font-weight: 600; margin: 0 0 16px;">
                  What's next?
                </h2>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 26px; margin: 0;">
                  ✨ Keep scanning to build your portfolio<br/>
                  💰 Watch your cards' values update daily<br/>
                  📊 Check your dashboard for insights<br/>
                  🔔 Set price alerts on valuable cards<br/>
                  📈 Track which cards are gaining value
                </p>
              </div>
              
              <div style="background: rgba(139, 92, 246, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #8b5cf6; font-size: 18px; font-weight: 600; margin: 0 0 16px;">
                  💡 Pro Tips:
                </h2>
                <p style="color: #cbd5e1; font-size: 14px; line-height: 22px; margin: 0;">
                  • Scan multiple cards at once - just line them up!<br/>
                  • Add grading info (PSA, BGS) for accurate values<br/>
                  • Create separate collections by player or team<br/>
                  • Update card conditions for precise pricing
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/scan" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; margin-right: 10px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                  Scan More Cards
                </a>
                <a href="https://getcubby.ai/dashboard" style="display: inline-block; background: rgba(59, 130, 246, 0.1); color: #3b82f6; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; border: 2px solid #3b82f6;">
                  View Portfolio
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 30px 0 0;">
                Have questions? Just reply to this email!
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received first save email request");

    const { email, name, userId, itemCount } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Sending first save email to: ${email}`);

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [email],
      subject: `🎉 You added your first ${itemCount} card${itemCount > 1 ? 's' : ''}!`,
      html: getFirstSaveEmailHtml(name || email.split('@')[0], itemCount),
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("First save email sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in first save email function:", error);
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
