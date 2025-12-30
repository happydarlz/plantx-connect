import { ArrowLeft, HelpCircle, MessageCircle, Phone, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const HelpPage = () => {
  const navigate = useNavigate();

  const helpItems = [
    { icon: HelpCircle, title: "FAQs", description: "Frequently asked questions", action: () => navigate("/faq") },
    { icon: Phone, title: "Contact Support", description: "Call: 9515271439", action: () => window.location.href = "tel:9515271439" },
    { icon: MessageCircle, title: "WhatsApp Support", description: "Chat: 7815879588", action: () => window.open("https://wa.me/917815879588", "_blank") },
    { icon: FileText, title: "Terms of Service", description: "Read our terms", action: () => navigate("/terms") },
    { icon: FileText, title: "Privacy Policy", description: "How we handle your data", action: () => navigate("/privacy") },
    { icon: FileText, title: "Licenses", description: "Open source licenses", action: () => navigate("/licenses") },
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
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground truncate">{item.description}</p>
            </div>
          </button>
        ))}

        <div className="pt-4 p-4 bg-card rounded-xl border border-border text-center">
          <p className="text-muted-foreground text-sm">
            Need more help? Contact us at
          </p>
          <a href="tel:9515271439" className="block text-primary font-medium mt-1">
            9515271439
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default HelpPage;