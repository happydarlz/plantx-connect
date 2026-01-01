import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const OfflineWarning = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6">
      <WifiOff className="w-16 h-16 text-muted-foreground mb-6" />
      <h2 className="text-xl font-semibold text-foreground mb-2">No Internet Connection</h2>
      <p className="text-muted-foreground text-center mb-6">
        Please check your network connection and try again.
      </p>
      <Button onClick={handleRefresh} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Refresh
      </Button>
      <p className="text-sm text-destructive mt-4">
        Your network is broken. Connect to the internet.
      </p>
    </div>
  );
};

export default OfflineWarning;
