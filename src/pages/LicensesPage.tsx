import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const licenses = [
  { name: "React", version: "18.3.1", license: "MIT" },
  { name: "Tailwind CSS", version: "3.x", license: "MIT" },
  { name: "Framer Motion", version: "12.x", license: "MIT" },
  { name: "Lucide React", version: "0.462.0", license: "ISC" },
  { name: "Radix UI", version: "1.x", license: "MIT" },
  { name: "React Router", version: "6.x", license: "MIT" },
  { name: "React Query", version: "5.x", license: "MIT" },
  { name: "Zod", version: "3.x", license: "MIT" },
  { name: "date-fns", version: "3.x", license: "MIT" },
  { name: "Sonner", version: "1.x", license: "MIT" },
];

const LicensesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background z-40 px-4 py-3 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Open Source Licenses</h1>
      </header>

      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          PlantX is built with the help of these amazing open source libraries:
        </p>

        {licenses.map((lib, index) => (
          <div
            key={index}
            className="p-4 bg-card rounded-xl border border-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{lib.name}</p>
                <p className="text-xs text-muted-foreground">v{lib.version}</p>
              </div>
              <span className="px-2 py-1 bg-secondary rounded-full text-xs text-muted-foreground">
                {lib.license}
              </span>
            </div>
          </div>
        ))}

        <p className="text-xs text-muted-foreground text-center pt-4">
          We are grateful to the open source community for their contributions.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default LicensesPage;
