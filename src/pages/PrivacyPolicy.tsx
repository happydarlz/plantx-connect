import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
      </header>

      <div className="px-6 py-6 space-y-6 max-w-2xl mx-auto">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to PlantX. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy explains how we collect, use, and safeguard your information when you use our application.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Information We Collect</h2>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside">
            <li>Account information (email, phone number, name)</li>
            <li>Profile information (bio, profile picture, address)</li>
            <li>Content you create (posts, reels, plants listings)</li>
            <li>Usage data and interactions within the app</li>
            <li>Device information for security purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside">
            <li>To provide and maintain our service</li>
            <li>To allow you to connect with other users</li>
            <li>To send notifications about activity on your account</li>
            <li>To improve and personalize your experience</li>
            <li>To ensure the security of our platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Data Storage & Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your data is stored securely using industry-standard encryption. We use secure servers and 
            implement appropriate technical measures to protect your personal information from unauthorized 
            access, alteration, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Your Rights</h2>
          <ul className="text-muted-foreground space-y-2 list-disc list-inside">
            <li>Access and download your personal data</li>
            <li>Update or correct your information</li>
            <li>Delete your account and associated data</li>
            <li>Control your privacy settings</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may use third-party services for analytics and functionality. These services have their own 
            privacy policies and we encourage you to review them. We do not sell your personal data to 
            third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our service is not intended for children under 13 years of age. We do not knowingly collect 
            personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this privacy policy from time to time. We will notify you of any changes by 
            posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this privacy policy or our practices, please contact us through 
            the app's Help section or email us at support@plantx.app
          </p>
        </section>

        <p className="text-sm text-muted-foreground pt-6 border-t border-border">
          Last updated: December 2024
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;