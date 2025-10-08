import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getWelcomeEmailHtml = (userName?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Cubby</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h1 style="color: #333333; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">
                🎉 Welcome to Cubby${userName ? `, ${userName}` : ''}!
              </h1>
              
              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Thank you for signing up! We're excited to help you organize your inventory and never lose track of your items again.
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #333333; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                  🚀 Getting Started
                </h2>
                <ol style="color: #666666; font-size: 15px; line-height: 22px; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 10px;"><strong>Create your first location</strong> - Set up rooms or storage areas</li>
                  <li style="margin-bottom: 10px;"><strong>Scan items</strong> - Take photos and let AI identify everything</li>
                  <li style="margin-bottom: 10px;"><strong>Stay organized</strong> - Search, filter, and never lose anything again</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/onboarding"
                   style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Get Started Now
                </a>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0;">
                  💡 <strong>Pro tip:</strong> You can scan multiple items at once - just take a photo and AI will detect them all!
                </p>
              </div>
              
              <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 30px 0 0 0; text-align: center;">
                Need help? Just reply to this email - we're here for you!
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

const getDay1EmailHtml = () => `
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
                👋 Hey there!
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

const getDay3EmailHtml = () => `
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
                📸 Ready to scan?
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const testEmail = "scott@bugattimarketing.com";
    const results = [];

    // Send Welcome Email
    console.log("Sending welcome email...");
    const welcomeResponse = await resend.emails.send({
      from: "Cubby <onboarding@resend.dev>",
      to: [testEmail],
      subject: "🎉 Welcome to Cubby!",
      html: getWelcomeEmailHtml("Scott"),
    });
    results.push({ type: "welcome", result: welcomeResponse });

    // Wait 2 seconds to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send Day 1 Reminder
    console.log("Sending day 1 reminder...");
    const day1Response = await resend.emails.send({
      from: "Cubby <onboarding@resend.dev>",
      to: [testEmail],
      subject: "🏠 Create your first location in Cubby",
      html: getDay1EmailHtml(),
    });
    results.push({ type: "day1_reminder", result: day1Response });

    // Wait 2 seconds to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send Day 3 Reminder
    console.log("Sending day 3 reminder...");
    const day3Response = await resend.emails.send({
      from: "Cubby <onboarding@resend.dev>",
      to: [testEmail],
      subject: "📸 Start scanning items in Cubby",
      html: getDay3EmailHtml(),
    });
    results.push({ type: "day3_reminder", result: day3Response });

    console.log("All test emails sent successfully:", results);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Sent 3 test emails to ${testEmail}`,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error sending test emails:", error);
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
