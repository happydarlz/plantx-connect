import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Phone, Eye, EyeOff, ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlantXLogo from "@/components/PlantXLogo";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Simulate auth - in real app, use Firebase/Supabase
    setTimeout(() => {
      setIsLoading(false);
      if (mode === "signup") {
        navigate("/onboarding");
      } else {
        navigate("/home");
      }
      toast({
        title: mode === "login" ? "Welcome back!" : "Account created!",
        description: "Let's grow together 🌱",
      });
    }, 1500);
  };

  const handlePhoneAuth = async () => {
    if (!phone) {
      toast({
        title: "Missing phone number",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!otpSent) {
      setIsLoading(true);
      // Simulate sending OTP
      setTimeout(() => {
        setIsLoading(false);
        setOtpSent(true);
        toast({
          title: "OTP Sent!",
          description: "Check your phone for the verification code",
        });
      }, 1500);
    } else {
      if (!otp) {
        toast({
          title: "Missing OTP",
          description: "Please enter the verification code",
          variant: "destructive",
        });
        return;
      }
      setIsLoading(true);
      // Simulate OTP verification
      setTimeout(() => {
        setIsLoading(false);
        if (mode === "signup") {
          navigate("/onboarding");
        } else {
          navigate("/home");
        }
        toast({
          title: "Verified!",
          description: "Welcome to PlantX 🌱",
        });
      }, 1500);
    }
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    // Simulate Google auth
    setTimeout(() => {
      setIsLoading(false);
      if (mode === "signup") {
        navigate("/onboarding");
      } else {
        navigate("/home");
      }
      toast({
        title: "Google sign-in successful!",
        description: "Welcome to PlantX 🌱",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with decorative elements */}
      <div className="relative h-48 flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-plantx-soft/30 blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
          className="absolute -top-5 -right-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        />
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PlantXLogo size="lg" />
        </motion.div>
      </div>

      {/* Main content */}
      <motion.div
        className="flex-1 px-6 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Mode toggle */}
        <div className="flex bg-secondary rounded-xl p-1 mb-6">
          {(["login", "signup"] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {m === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Method toggle */}
        <div className="flex gap-3 mb-6">
          {(["email", "phone"] as AuthMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMethod(m);
                setOtpSent(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                method === m
                  ? "border-primary bg-plantx-light text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {m === "email" ? "Email" : "Phone"}
            </button>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={method}
            initial={{ opacity: 0, x: method === "email" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: method === "email" ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {method === "email" ? (
              <>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-border bg-secondary/50"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 rounded-xl border-border bg-secondary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <Button
                  onClick={handleEmailAuth}
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      {mode === "login" ? "Login" : "Create Account"}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-border bg-secondary/50"
                    disabled={otpSent}
                  />
                </div>
                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="relative"
                  >
                    <Input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="h-12 rounded-xl border-border bg-secondary/50 text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </motion.div>
                )}
                <Button
                  onClick={handlePhoneAuth}
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : otpSent ? (
                    <>
                      Verify OTP
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Sign In */}
        <Button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          variant="outline"
          className="w-full h-12 rounded-xl border-border bg-background hover:bg-secondary"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Toggle mode text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-medium"
          >
            {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </p>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="pb-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
          <Leaf className="w-4 h-4" />
          <span className="font-light">From Finitix</span>
        </div>
      </motion.footer>
    </div>
  );
};

export default Auth;
