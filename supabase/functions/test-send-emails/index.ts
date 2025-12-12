import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

// Use provided API key or environment variable
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required");
}
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getWelcomeEmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Cubby Sports Cards</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⚾ Welcome to Cubby Sports Cards!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hey there! 👋
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Welcome to Cubby Sports Cards - your new home for tracking and managing your sports card collection!
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                We're excited to help you organize your collection, track values, and discover new cards.
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
                <h2 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">🚀 Quick Start Guide</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li>Add your first card by taking a photo or searching our database</li>
                  <li>Create collections to organize your cards by player, team, or year</li>
                  <li>Track real-time values and market trends</li>
                  <li>Share your collection with friends and fellow collectors</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Get Started Now</a>
              </div>
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Questions? Just reply to this email - we're here to help!
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                Happy collecting! 🎉<br>
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

const get2HourEmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick Reminder - Add Your First Card</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⚡ Ready to Add Your First Card?</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hey! 👋
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Just a quick reminder - you signed up for Cubby Sports Cards a couple hours ago, but haven't added your first card yet.
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                It only takes 30 seconds to get started! 🚀
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 6px; border-left: 4px solid #f5576c;">
                <h2 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">📸 Two Easy Ways to Add Cards</h2>
                <ol style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li><strong>Take a Photo:</strong> Snap a pic of your card and we'll identify it automatically</li>
                  <li><strong>Search:</strong> Look up any card by player name, year, or set</li>
                </ol>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Add Your First Card</a>
              </div>
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Once you add your first card, you'll unlock features like value tracking, collection organization, and more!
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                Let's get your collection started! 🎯<br>
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

const getDay1EmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 1 - Create Your First Collection</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⚾ Day 1: Create Your First Collection</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hey collector! 👋
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Now that you've joined Cubby, let's organize your cards into collections!
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #e3f2fd; border-radius: 6px; border-left: 4px solid #4facfe;">
                <h2 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">📚 Why Create Collections?</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li>Organize by player, team, year, or any way you like</li>
                  <li>Track the total value of each collection</li>
                  <li>Share specific collections with friends</li>
                  <li>Set goals and track your progress</li>
                </ul>
              </div>
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                <h3 style="margin: 0 0 15px; color: #333333; font-size: 16px; font-weight: 600;">💡 Collection Ideas</h3>
                <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                  • Rookie Cards<br>
                  • Favorite Team<br>
                  • Hall of Famers<br>
                  • Vintage Cards<br>
                  • Investment Portfolio
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Create a Collection</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                Happy organizing! 📦<br>
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

const getDay3EmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 3 - Start Tracking Your Cards</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">📸 Day 3: Start Tracking Your Cards</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hey! 👋
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Ready to take your collection to the next level? Let's start tracking your cards!
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #e8f5e9; border-radius: 6px; border-left: 4px solid #43e97b;">
                <h2 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">📊 What You Can Track</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li><strong>Real-time Values:</strong> See current market prices for your cards</li>
                  <li><strong>Price History:</strong> Track how values change over time</li>
                  <li><strong>Portfolio Performance:</strong> Monitor your collection's total value</li>
                  <li><strong>Condition Tracking:</strong> Record card grades and conditions</li>
                </ul>
              </div>
              <div style="margin: 30px 0; padding: 20px; background-color: #fff9c4; border-radius: 6px;">
                <h3 style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: 600;">💡 Pro Tip</h3>
                <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                  Add photos of your cards to track their condition over time and have a visual record of your collection!
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Start Tracking</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                Keep tracking! 📈<br>
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

const getDay5EmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 5 - Pricing and Value Tips</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">💰 Day 5: Pricing and Value Tips</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hey collector! 👋
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Understanding card values is key to building a great collection. Here are some tips!
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #fff3e0; border-radius: 6px; border-left: 4px solid #fa709a;">
                <h2 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">📈 Value Factors</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li><strong>Condition:</strong> Mint cards are worth significantly more</li>
                  <li><strong>Rarity:</strong> Limited editions and short prints command premiums</li>
                  <li><strong>Player Performance:</strong> Values fluctuate with player success</li>
                  <li><strong>Market Trends:</strong> Stay informed about hobby trends</li>
                </ul>
              </div>
              <div style="margin: 30px 0; padding: 20px; background-color: #e8f5e9; border-radius: 6px;">
                <h3 style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: 600;">💡 Smart Collecting Tips</h3>
                <p style="margin: 0 0 10px; color: #555555; font-size: 15px; line-height: 1.6;">
                  • Buy cards you love, not just for investment<br>
                  • Protect your cards with proper storage<br>
                  • Consider grading valuable cards<br>
                  • Track sales data to understand true market value
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Your Collection Value</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                Smart collecting! 🧠<br>
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

const getDay7EmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 7 - Portfolio Insights</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">📊 Day 7: Portfolio Insights</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hey! 👋
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                You've been with Cubby for a week! Let's dive into your portfolio insights.
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #ede7f6; border-radius: 6px; border-left: 4px solid #667eea;">
                <h2 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">📈 Insights You Can Track</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li><strong>Total Portfolio Value:</strong> See your collection's worth at a glance</li>
                  <li><strong>Top Cards:</strong> Identify your most valuable cards</li>
                  <li><strong>Growth Trends:</strong> Track how your collection value changes</li>
                  <li><strong>Collection Stats:</strong> Cards by player, team, year, and more</li>
                </ul>
              </div>
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                <h3 style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: 600;">💡 Pro Tip</h3>
                <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                  Check your portfolio regularly to spot trends and make informed decisions about buying, selling, or holding cards.
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Portfolio Insights</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                Keep growing! 🌱<br>
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

const getDay10EmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 10 - Share Your Collection</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🤝 Day 10: Share Your Collection</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hey collector! 👋
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Your collection is looking great! Ready to share it with fellow collectors?
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #fce4ec; border-radius: 6px; border-left: 4px solid #f5576c;">
                <h2 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">🌟 Why Share?</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li>Connect with other collectors who share your interests</li>
                  <li>Get feedback and advice on your collection</li>
                  <li>Discover trading opportunities</li>
                  <li>Show off your best cards and rare finds</li>
                </ul>
              </div>
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                <h3 style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: 600;">🔒 Privacy Controls</h3>
                <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                  You control what you share! Make collections public or private, and choose exactly what information to display.
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Share Your Collection</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                Happy sharing! 🎉<br>
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

const getDay14EmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day 14 - Master Your Portfolio</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: 700;">🚀 Day 14: Master Your Portfolio</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hey champion! 👋
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                You've been with Cubby for two weeks! Let's make sure you're getting the most out of your portfolio.
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #fff8e1; border-radius: 6px; border-left: 4px solid #fcb69f;">
                <h2 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">🎯 Advanced Features</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li><strong>Custom Tags:</strong> Create your own organization system</li>
                  <li><strong>Bulk Actions:</strong> Update multiple cards at once</li>
                  <li><strong>Export Data:</strong> Download your collection data</li>
                  <li><strong>Price Alerts:</strong> Get notified of significant value changes</li>
                </ul>
              </div>
              <div style="margin: 30px 0; padding: 20px; background-color: #e8f5e9; border-radius: 6px;">
                <h3 style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: 600;">💡 Next Steps</h3>
                <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                  • Set collection goals<br>
                  • Join the Cubby community<br>
                  • Explore advanced analytics<br>
                  • Share your success story
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333333; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Explore Advanced Features</a>
              </div>
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Thanks for being part of the Cubby community! We're here if you need anything.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                Keep collecting! 🏆<br>
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

const getFirstSaveEmailHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>First Card Added!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 You Added Your First Card!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Awesome! 🎊
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                You just added your first card to Cubby! This is the beginning of something great.
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #f0f4ff; border-radius: 6px; border-left: 4px solid #667eea;">
                <h2 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">🚀 What's Next?</h2>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                  <li>Add more cards to build your collection</li>
                  <li>Create collections to organize your cards</li>
                  <li>Track values and watch your portfolio grow</li>
                  <li>Share your collection with friends</li>
                </ul>
              </div>
              <div style="margin: 30px 0; padding: 20px; background-color: #fff9c4; border-radius: 6px;">
                <h3 style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: 600;">💡 Quick Tip</h3>
                <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                  The more cards you add, the better insights you'll get about your collection's value and trends!
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://getcubby.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Add More Cards</a>
              </div>
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Keep it up! Every card you add makes your collection more valuable and organized.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                Happy collecting! 🎯<br>
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const testEmail = "scottjs12+sports@gmail.com";
    const results = [];

    // Day 0: Welcome
    console.log("Sending welcome email...");
    await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [testEmail],
      subject: "⚾ TEST DAY 0: Welcome to Your Card Portfolio",
      html: getWelcomeEmailHtml(),
    });
    results.push("welcome");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2-Hour reminder
    console.log("Sending 2-hour reminder...");
    await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [testEmail],
      subject: "⚡ TEST: 2-Hour Reminder - Scan Your First Card",
      html: get2HourEmailHtml(),
    });
    results.push("2hour");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Day 1
    console.log("Sending day 1...");
    await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [testEmail],
      subject: "⚾ TEST DAY 1: Create Your First Collection",
      html: getDay1EmailHtml(),
    });
    results.push("day1");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Day 3
    console.log("Sending day 3...");
    await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [testEmail],
      subject: "📸 TEST DAY 3: Start Tracking Card Values",
      html: getDay3EmailHtml(),
    });
    results.push("day3");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Day 5
    console.log("Sending day 5...");
    await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [testEmail],
      subject: "💰 TEST DAY 5: 5 Tips for Accurate Pricing",
      html: getDay5EmailHtml(),
    });
    results.push("day5");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Day 7
    console.log("Sending day 7...");
    await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [testEmail],
      subject: "📊 TEST DAY 7: Your Portfolio Insights",
      html: getDay7EmailHtml(),
    });
    results.push("day7");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Day 10
    console.log("Sending day 10...");
    await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [testEmail],
      subject: "🤝 TEST DAY 10: Share Your Collection",
      html: getDay10EmailHtml(),
    });
    results.push("day10");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Day 14
    console.log("Sending day 14...");
    await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [testEmail],
      subject: "🚀 TEST DAY 14: Master Your Portfolio",
      html: getDay14EmailHtml(),
    });
    results.push("day14");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // First Save
    console.log("Sending first save...");
    await resend.emails.send({
      from: "Cubby Sports Cards <cards@getcubby.ai>",
      to: [testEmail],
      subject: "🎉 TEST: First Card Added!",
      html: getFirstSaveEmailHtml(),
    });
    results.push("first_save");

    console.log("All test emails sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Sent 9 test emails to ${testEmail}`,
        sequence: results
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
