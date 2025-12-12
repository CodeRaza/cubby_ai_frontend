import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

// @ts-ignore - Deno is available in Supabase Edge Functions runtime
const RESEND_API_KEY = "re_Pep1n8JG_F4WXche9zZTb9xVCLo5qiah4"
if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required");
}
const resend = new Resend(RESEND_API_KEY);

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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #334155;">
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; font-size: 64px; margin-bottom: 16px;">⚡</div>
              <h1 style="color: #f8fafc; font-size: 28px; font-weight: bold; margin: 0 0 16px; text-align: center;">
                Your Collection is Ready!
              </h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
                Great job creating your collection! Now let's add your first card and see what it's worth.
              </p>
              <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #cbd5e1; font-size: 15px; line-height: 22px; margin: 0;">
                  💡 <strong style="color: #10b981;">Quick tip:</strong> Take a clear photo of your card and our AI will automatically identify the player, year, brand, and current market value!
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/scan" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                  Scan Your First Card
                </a>
              </div>
              <div style="background: rgba(59, 130, 246, 0.1); border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                  ⚡ Most users scan 10+ cards in their first 5 minutes
                </p>
              </div>
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
    console.log("Received quick reminder email request");

    const { email, name } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Sending quick reminder email to: ${email}`);

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [email],
      subject: "⚡ Collection ready - scan your first card!",
      html: get2HourReminderHtml(),
    });

    if (emailError) {
      console.error(`Error sending quick reminder to ${email}:`, emailError);
      throw emailError;
    }

    console.log(`Quick reminder sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
    
  } catch (error: any) {
    console.error("Error in quick reminder function:", error);
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
