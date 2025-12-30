import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is PlantX?",
    answer: "PlantX is a social platform for plant enthusiasts and nurseries. You can share photos, reels, and connect with other plant lovers. Nurseries can list their plants for sale."
  },
  {
    question: "How do I create an account?",
    answer: "Download the app and sign up using your email address. You can choose between a Normal user account or a Nursery account. Nursery accounts can list plants for sale."
  },
  {
    question: "What's the difference between Normal and Nursery accounts?",
    answer: "Normal users can browse, like, comment, and save content. Nursery accounts have all these features plus the ability to list and sell plants."
  },
  {
    question: "How do I contact a seller?",
    answer: "On any plant listing or nursery profile, tap the 'Call' button to directly call the seller using their registered phone number."
  },
  {
    question: "How do I delete my content?",
    answer: "Go to your profile, tap on any post, reel, or plant you want to delete, and use the delete option. Note that deleted content cannot be recovered."
  },
  {
    question: "How do I edit my profile?",
    answer: "Go to your profile page and tap 'Edit Profile'. You can update your name, bio, profile picture, phone number, and location."
  },
  {
    question: "Is my data safe?",
    answer: "Yes, we take data security seriously. Please refer to our Privacy Policy for detailed information about how we handle your data."
  },
  {
    question: "How do I report inappropriate content?",
    answer: "Contact our support team at 9515271439 or via WhatsApp at 7815879588 with details about the content you want to report."
  },
  {
    question: "Can I change my username?",
    answer: "Yes, you can change your username from the Edit Profile section. However, usernames must be unique and not already taken by another user."
  },
  {
    question: "How do I delete my account?",
    answer: "Go to Settings > Account > Delete Account. Please note that this action is permanent and cannot be undone."
  },
];

const FAQPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">FAQs</h1>
      </header>

      <div className="p-4">
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card rounded-xl border border-border px-4"
            >
              <AccordionTrigger className="text-left text-foreground hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6 p-4 bg-card rounded-xl border border-border text-center">
          <p className="text-sm text-muted-foreground mb-2">Still have questions?</p>
          <p className="text-foreground font-medium">Contact us at 9515271439</p>
          <p className="text-sm text-muted-foreground mt-1">
            WhatsApp: 7815879588
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default FAQPage;
