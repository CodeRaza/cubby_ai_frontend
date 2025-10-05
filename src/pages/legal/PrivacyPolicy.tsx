import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to Cubby. We respect your privacy and are committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, store, and protect your information when you 
              use our home inventory management service.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Email address</li>
              <li>Password (encrypted)</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3>2.2 User Content</h3>
            <p>When you use the Service, you may provide:</p>
            <ul>
              <li>Photos of your items</li>
              <li>Item descriptions and notes</li>
              <li>Location names and organization data</li>
              <li>QR code associations</li>
            </ul>

            <h3>2.3 Usage Data</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>Device information (browser type, operating system)</li>
              <li>Log data (IP address, access times)</li>
              <li>Feature usage patterns</li>
              <li>Error reports and performance data</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and maintain the Service</li>
              <li>Process AI-powered item detection on your uploaded photos</li>
              <li>Send reminder notifications you've configured</li>
              <li>Improve and optimize the Service</li>
              <li>Communicate with you about updates and support</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>4. AI Processing</h2>
            <p>
              When you upload photos for item detection, we use artificial intelligence to analyze the images 
              and generate descriptions. This processing:
            </p>
            <ul>
              <li>Occurs securely on our servers</li>
              <li>Is used only for providing the Service to you</li>
              <li>Does not involve sharing your photos with third parties for training purposes</li>
              <li>Can be disabled by not using the AI detection feature</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Storage and Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your data, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication mechanisms</li>
              <li>Regular security audits</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p>
              Your photos and personal data are stored securely and are only accessible to you through your 
              authenticated account.
            </p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide 
              the Service. You can delete your account at any time, which will result in the deletion of your 
              personal data within a reasonable timeframe, except where we are required to retain it by law.
            </p>
          </section>

          <section>
            <h2>7. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share your information only in these limited circumstances:
            </p>
            <ul>
              <li><strong>Service Providers:</strong> With trusted third-party service providers who help us operate the Service (e.g., cloud hosting, AI processing)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p>All service providers are contractually obligated to protect your data.</p>
          </section>

          <section>
            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Object to certain processing</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>You can exercise these rights through your account settings or by contacting us.</p>
          </section>

          <section>
            <h2>9. Cookies and Tracking</h2>
            <p>
              We use essential cookies and similar technologies to maintain your session and provide the Service. 
              We do not use tracking cookies for advertising purposes. You can control cookies through your 
              browser settings.
            </p>
          </section>

          <section>
            <h2>10. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites or services. We are not responsible for the 
              privacy practices of these third parties. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2>11. Children's Privacy</h2>
            <p>
              The Service is not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a child, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2>12. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your own. We ensure 
              appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2>13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes 
              via email or through the Service. Continued use after changes constitutes acceptance of the 
              updated policy.
            </p>
          </section>

          <section>
            <h2>14. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your data, please contact us 
              through the support channels provided in the application or review our <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
