import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect } from "react";
import OfflineWarning from "@/components/OfflineWarning";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Reels from "./pages/Reels";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import PlantDetail from "./pages/PlantDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsPage from "./pages/TermsPage";
import LicensesPage from "./pages/LicensesPage";
import FAQPage from "./pages/FAQPage";
import SavedPosts from "./pages/SavedPosts";
import LikedPosts from "./pages/LikedPosts";
import ActivityPage from "./pages/ActivityPage";
import HelpPage from "./pages/HelpPage";
import AboutPage from "./pages/AboutPage";
import AccountSettings from "./pages/AccountSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      const nonHomePaths = ["/search", "/reels", "/profile", "/saved", "/liked", "/activity", "/help", "/about", "/account", "/faq", "/terms", "/licenses", "/privacy"];
      
      if (nonHomePaths.some(path => location.pathname.startsWith(path)) || location.pathname.startsWith("/user/") || location.pathname.startsWith("/plant/")) {
        e.preventDefault();
        navigate("/home", { replace: true });
        window.history.pushState(null, "", "/home");
      }
    };

    window.history.pushState(null, "", location.pathname);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [navigate, location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <OfflineWarning />
        <BrowserRouter>
          <BackButtonHandler />
          <div className="max-w-md mx-auto bg-background min-h-screen shadow-2xl">
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/home" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/reels" element={<Reels />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:username" element={<UserProfile />} />
              <Route path="/plant/:plantId" element={<PlantDetail />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/licenses" element={<LicensesPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/saved" element={<SavedPosts />} />
              <Route path="/liked" element={<LikedPosts />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/account" element={<AccountSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
