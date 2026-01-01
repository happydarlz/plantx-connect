import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Terms of Service</h1>
      </header>

      <div className="p-4 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accessing and using PlantX, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this application.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. User Accounts</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must provide accurate and complete information when creating an account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. User Content</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Users retain ownership of content they post. By posting content, you grant PlantX a non-exclusive license to use, display, and distribute your content within the application. You agree not to post content that is illegal, harmful, or violates the rights of others.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Prohibited Activities</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You may not use PlantX to: post false or misleading information, harass or harm others, violate intellectual property rights, distribute malware or spam, or engage in any illegal activities.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Nursery Listings</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nursery accounts may list plants for sale. All transactions occur directly between buyers and sellers. PlantX is not responsible for the quality, safety, or legality of listed plants or the accuracy of listings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PlantX shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Termination</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Changes to Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update these terms from time to time. Continued use of the application after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">9. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions about these Terms, contact us at 9515271439.
          </p>
        </section>

        <p className="text-xs text-muted-foreground text-center pt-4">
          Last updated: December 2024
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default TermsPage;
