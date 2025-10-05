import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
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
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Cubby ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              Cubby is a home inventory management application that allows users to catalog, organize, and track 
              their belongings using QR codes and AI-powered item detection. The Service includes features such as 
              location management, item categorization, and reminder notifications.
            </p>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <p>
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Providing accurate and complete information during registration</li>
            </ul>
          </section>

          <section>
            <h2>4. User Content</h2>
            <p>
              You retain ownership of any content you upload to the Service, including photos and item descriptions. 
              By uploading content, you grant us a license to store, process, and display this content solely for 
              the purpose of providing the Service to you.
            </p>
            <p>
              You are responsible for ensuring that your content does not violate any laws or third-party rights.
            </p>
          </section>

          <section>
            <h2>5. AI-Powered Features</h2>
            <p>
              The Service uses artificial intelligence to detect and categorize items from photos. While we strive 
              for accuracy, AI-generated descriptions and categorizations may not always be perfect. You are 
              responsible for reviewing and correcting any AI-generated content.
            </p>
          </section>

          <section>
            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use the Service to harass, abuse, or harm others</li>
            </ul>
          </section>

          <section>
            <h2>7. Subscription and Payment</h2>
            <p>
              Certain features may require a paid subscription. Subscription fees are charged in advance and are 
              non-refundable except as required by law. You may cancel your subscription at any time, but you will 
              not receive a refund for the current billing period.
            </p>
          </section>

          <section>
            <h2>8. Data Privacy</h2>
            <p>
              Your privacy is important to us. Please review our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> to 
              understand how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We are not liable for any damages 
              arising from your use of the Service, including but not limited to data loss, service interruptions, 
              or inaccurate AI-generated content.
            </p>
          </section>

          <section>
            <h2>10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violation of these Terms. 
              You may delete your account at any time through the Settings page.
            </p>
          </section>

          <section>
            <h2>11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes constitutes 
              acceptance of the new Terms. We will notify you of significant changes via email or through the Service.
            </p>
          </section>

          <section>
            <h2>12. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us through the support channels provided 
              in the application.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default TermsOfService;
