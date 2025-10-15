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

interface UserReminder {
  user_id: string;
  email: string;
  days_since_signup: number;
  has_location: boolean;
  has_items: boolean;
  last_email_type: string | null;
  item_count: number;
}

const getDay1EmailHtml = () => `
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
              <div style="text-align: center; font-size: 64px; margin-bottom: 16px;">⚾</div>
              <h1 style="color: #f8fafc; font-size: 28px; font-weight: bold; margin: 0 0 16px; text-align: center;">
                Create Your First Collection
              </h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
                Ready to start tracking your sports cards? Let's set up your first collection!
              </p>
              <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(59, 130, 246, 0.2);">
                <h2 style="color: #f8fafc; font-size: 18px; font-weight: 600; margin: 0 0 16px;">
                  Why create a collection?
                </h2>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 22px; margin: 0 0 12px;">
                  📦 Organize by player, team, or era<br/>
                  💰 Track total portfolio value<br/>
                  📈 See which collections are gaining value<br/>
                  🔍 Find any card in seconds
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Create Your Collection
                </a>
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

const getDay3EmailHtml = () => `
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
              <div style="text-align: center; font-size: 64px; margin-bottom: 16px;">📸</div>
              <h1 style="color: #f8fafc; font-size: 28px; font-weight: bold; margin: 0 0 16px; text-align: center;">
                Start Tracking Card Values
              </h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
                Your collection is ready! Now let's add some cards and see what they're worth.
              </p>
              <div style="background: rgba(139, 92, 246, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(139, 92, 246, 0.2);">
                <h2 style="color: #f8fafc; font-size: 18px; font-weight: 600; margin: 0 0 16px;">
                  How It Works:
                </h2>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 22px; margin: 0;">
                  1️⃣ Snap a photo of your card<br/>
                  2️⃣ AI identifies player, year, brand<br/>
                  3️⃣ Get instant market value from eBay<br/>
                  4️⃣ Watch your portfolio grow 📈
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/scan" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Scan Your First Card
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 20px 0 0;">
                💡 Most users scan 10+ cards in their first session!
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

const getDay5EmailHtml = () => `
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
              <div style="text-align: center; font-size: 64px; margin-bottom: 16px;">💰</div>
              <h1 style="color: #f8fafc; font-size: 28px; font-weight: bold; margin: 0 0 16px; text-align: center;">
                5 Tips for Accurate Pricing
              </h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
                Get the most accurate valuations for your cards
              </p>
              <div style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(16, 185, 129, 0.2);">
                <p style="color: #cbd5e1; font-size: 15px; line-height: 26px; margin: 0;">
                  <strong style="color: #10b981;">1. Clear Photos:</strong> Make sure card details are visible<br/><br/>
                  <strong style="color: #10b981;">2. Update Conditions:</strong> Raw vs. graded makes a huge difference<br/><br/>
                  <strong style="color: #10b981;">3. Check Serial Numbers:</strong> Numbered cards are worth more<br/><br/>
                  <strong style="color: #10b981;">4. Rookie Cards:</strong> Always note if it's a rookie<br/><br/>
                  <strong style="color: #10b981;">5. Watch Trends:</strong> Prices update daily based on sales
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  View Your Portfolio
                </a>
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

const getDay7EmailHtml = () => `
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
              <div style="text-align: center; font-size: 64px; margin-bottom: 16px;">📊</div>
              <h1 style="color: #f8fafc; font-size: 28px; font-weight: bold; margin: 0 0 16px; text-align: center;">
                Your Portfolio Insights
              </h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
                See which cards are gaining value and market trends
              </p>
              <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(59, 130, 246, 0.2);">
                <h2 style="color: #f8fafc; font-size: 18px; font-weight: 600; margin: 0 0 16px;">
                  Portfolio Features:
                </h2>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 26px; margin: 0;">
                  📈 <strong style="color: #3b82f6;">Price Trends:</strong> See 7-day and 30-day changes<br/><br/>
                  🏆 <strong style="color: #3b82f6;">Top Movers:</strong> Which cards are hot right now<br/><br/>
                  💎 <strong style="color: #3b82f6;">Top Values:</strong> Your most valuable cards<br/><br/>
                  🔔 <strong style="color: #3b82f6;">Price Alerts:</strong> Get notified of big changes
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Check Your Dashboard
                </a>
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

const getDay10EmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #334155;">
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; font-size: 64px; margin-bottom: 16px;">🤝</div>
              <h1 style="color: #f8fafc; font-size: 28px; font-weight: bold; margin: 0 0 16px; text-align: center;">
                Share Your Collection
              </h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
                Show off your cards or collaborate with other collectors
              </p>
              <div style="background: rgba(139, 92, 246, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(139, 92, 246, 0.2);">
                <h2 style="color: #f8fafc; font-size: 18px; font-weight: 600; margin: 0 0 16px;">
                  Sharing Options:
                </h2>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 26px; margin: 0;">
                  🔗 <strong style="color: #8b5cf6;">Share Links:</strong> Generate secure links to any collection<br/><br/>
                  👥 <strong style="color: #8b5cf6;">Family Access:</strong> Let family help catalog cards<br/><br/>
                  🏪 <strong style="color: #8b5cf6;">Show Buyers:</strong> Share specific cards with potential buyers<br/><br/>
                  📱 <strong style="color: #8b5cf6;">QR Codes:</strong> Print codes for storage boxes
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Generate Share Link
                </a>
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

const getDay14EmailHtml = () => `
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
              <div style="text-align: center; font-size: 64px; margin-bottom: 16px;">🚀</div>
              <h1 style="color: #f8fafc; font-size: 28px; font-weight: bold; margin: 0 0 16px; text-align: center;">
                Master Your Collection
              </h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
                Unlock advanced features to maximize your portfolio's value
              </p>
              <div style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(16, 185, 129, 0.2);">
                <h2 style="color: #f8fafc; font-size: 18px; font-weight: 600; margin: 0 0 16px;">
                  Advanced Features:
                </h2>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 26px; margin: 0;">
                  ⚡ <strong style="color: #10b981;">Price Alerts:</strong> Get notified when cards spike or dip<br/><br/>
                  📊 <strong style="color: #10b981;">Grading Info:</strong> Track PSA, BGS grades and premiums<br/><br/>
                  🎯 <strong style="color: #10b981;">Market Watch:</strong> Monitor trending players and sets<br/><br/>
                  💼 <strong style="color: #10b981;">Cost Basis:</strong> Track profit/loss on each card<br/><br/>
                  📈 <strong style="color: #10b981;">Export Data:</strong> Download portfolio reports
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai/subscription" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Upgrade for More Features
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 20px 0 0;">
                Thanks for being part of our community! 🙏
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
    console.log("Starting reminder email job...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if emails are enabled
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('emails_enabled')
      .limit(1)
      .single();
    
    if (emailSettings && !emailSettings.emails_enabled) {
      console.log("Emails are disabled, skipping reminder job");
      return new Response(
        JSON.stringify({ message: "Emails are currently disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Get users needing reminders
    const { data: users, error: usersError } = await supabase
      .rpc('get_users_needing_reminders') as { data: UserReminder[] | null, error: any };
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log("No users need reminders");
      return new Response(
        JSON.stringify({ message: "No reminders to send" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log(`Found ${users.length} users needing reminders`);
    
    const results = {
      day1: 0,
      day3: 0,
      day5: 0,
      day7: 0,
      day10: 0,
      day14: 0,
      errors: 0
    };
    
    for (const user of users) {
      try {
        let emailType: string;
        let subject: string;
        let html: string;
        
        // Determine which email to send based on user state
        if (user.days_since_signup >= 1 && user.days_since_signup < 2 && !user.has_location) {
          emailType = 'day1_reminder';
          subject = '⚾ Create Your First Sports Card Collection';
          html = getDay1EmailHtml();
          results.day1++;
        } else if (user.days_since_signup >= 3 && user.days_since_signup < 4 && !user.has_items) {
          emailType = 'day3_reminder';
          subject = '📸 Start Tracking Your Card Values';
          html = getDay3EmailHtml();
          results.day3++;
        } else if (user.days_since_signup >= 5 && user.days_since_signup < 6 && user.has_items) {
          emailType = 'day5_tips';
          subject = '💰 5 Tips for Accurate Card Pricing';
          html = getDay5EmailHtml();
          results.day5++;
        } else if (user.days_since_signup >= 7 && user.days_since_signup < 8 && user.item_count >= 5) {
          emailType = 'day7_insights';
          subject = '📊 Your Sports Card Portfolio Insights';
          html = getDay7EmailHtml();
          results.day7++;
        } else if (user.days_since_signup >= 10 && user.days_since_signup < 11 && user.has_items) {
          emailType = 'day10_sharing';
          subject = '🤝 Share Your Card Collection';
          html = getDay10EmailHtml();
          results.day10++;
        } else if (user.days_since_signup >= 14 && user.days_since_signup < 15 && user.has_items) {
          emailType = 'day14_advanced';
          subject = '🚀 Master Your Card Portfolio';
          html = getDay14EmailHtml();
          results.day14++;
        } else {
          continue;
        }
        
        // Send email
        await resend.emails.send({
          from: "Cubby Sports Cards <cards@getcubby.ai>",
          to: [user.email],
          subject: subject,
          html: html,
        });
        
        console.log(`Sent ${emailType} to ${user.email}`);
        
        // Track the email
        await supabase
          .from('email_tracking')
          .insert({
            user_id: user.user_id,
            email_type: emailType,
            sent_at: new Date().toISOString()
          });
        
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
        results.errors++;
      }
    }
    
    console.log("Reminder job complete:", results);
    
    return new Response(
      JSON.stringify({ message: "Reminders processed", results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
    
  } catch (error: any) {
    console.error("Error in reminder function:", error);
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
