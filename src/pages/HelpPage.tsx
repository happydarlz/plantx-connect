import { ArrowLeft, HelpCircle, MessageCircle, Mail, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const HelpPage = () => {
  const navigate = useNavigate();

  const helpItems = [
    { icon: HelpCircle, title: "FAQs", description: "Frequently asked questions" },
    { icon: MessageCircle, title: "Contact Support", description: "Get help from our team" },
    { icon: FileText, title: "Terms of Service", description: "Read our terms" },
    { icon: FileText, title: "Privacy Policy", description: "How we handle your data", action: () => navigate("/privacy") },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Help</h1>
      </header>

      <div className="p-4 space-y-3">
        {helpItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full p-4 bg-card rounded-xl border border-border flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </button>
        ))}

        <div className="pt-4">
          <p className="text-center text-muted-foreground text-sm">
            Need more help? Email us at
          </p>
          <a href="mailto:support@plantx.app" className="block text-center text-primary font-medium mt-1">
            support@plantx.app
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default HelpPage;