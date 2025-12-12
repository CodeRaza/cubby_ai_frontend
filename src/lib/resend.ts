/**
 * Resend email service - sends emails directly from frontend
 */

import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend("re_Pep1n8JG_F4WXche9zZTb9xVCLo5qiah4");

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function POST(req: Request) {
  try {
    const { to, subject, html, from }: SendEmailParams = await req.json();

    if (!to || !subject || !html) {
      return Response.json(
        { success: false, error: 'Missing email fields' },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: from ?? 'Cubby Sports Cards <cards@getcubby.ai>',
      to: [to],
      subject,
      html,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return Response.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}


// Welcome email HTML template
export function getWelcomeEmailHtml(name?: string): string {
  return `
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
          <tr>
            <td align="center" style="padding: 48px 48px 32px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); width: 80px; height: 80px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                <span style="font-size: 48px;">⚾</span>
              </div>
            </td>
          </tr>
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
          <tr>
            <td style="padding: 0 48px;">
              <p style="color: #cbd5e1; font-size: 16px; line-height: 26px; margin: 0 0 16px;">
                Hi${name ? ` ${name}` : ''},
              </p>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 26px; margin: 0 0 24px;">
                You just joined thousands of collectors using AI to manage their sports card portfolios. Let's get you started tracking your collection's value! 📈
              </p>
            </td>
          </tr>
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
          <tr>
            <td align="center" style="padding: 0 48px 32px;">
              <a href="https://getcubby.ai/dashboard" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 8px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; text-decoration: none; padding: 16px 48px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                Start Building Your Portfolio
              </a>
            </td>
          </tr>
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
}

// First save email HTML template
export function getFirstSaveEmailHtml(userName: string, itemCount: number): string {
  return `
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
}

// Send welcome email
export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  await resend.emails.send({
    to: email,
    subject: '⚾ Welcome to Your Sports Card Portfolio!',
    html: getWelcomeEmailHtml(name),
  });
}

// Send first save email
export async function sendFirstSaveEmail(email: string, name: string, itemCount: number): Promise<void> {
  await resend.emails.send({
    to: email,
    subject: `🎉 You added your first ${itemCount} card${itemCount > 1 ? 's' : ''}!`,
    html: getFirstSaveEmailHtml(name, itemCount),
  });
}

