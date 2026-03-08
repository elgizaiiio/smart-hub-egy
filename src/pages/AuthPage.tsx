import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

type Step = "email" | "password" | "otp-signup" | "set-password" | "otp-2fa" | "forgot-password";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<Step>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userExists, setUserExists] = useState(false);
  const [has2FA, setHas2FA] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get("redirect");

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCheckEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-email", {
        body: { email: normalizedEmail },
      });
      if (error) throw new Error(error.message);

      if (data.exists) {
        setUserExists(true);
        setHas2FA(data.two_factor_enabled);
        setStep("password");
      } else {
        // New user → send OTP
        setUserExists(false);
        await sendOTP(normalizedEmail);
        setStep("otp-signup");
      }
    } catch (e: any) {
      toast.error(e.message || "Could not check email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendOTP = async (targetEmail?: string) => {
    const normalizedEmail = (targetEmail || email).trim().toLowerCase();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("otp", {
        body: { action: "send", email: normalizedEmail },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to send code");
      toast.success("Verification code sent to your email");
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (e: any) {
      toast.error(e.message || "Could not send code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;

      if (has2FA) {
        // Need 2FA verification
        await sendOTP();
        setStep("otp-2fa");
      } else {
      toast.success("Welcome back!");
        if (redirectUrl) window.location.href = redirectUrl;
        else navigate("/chat");
      }
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValues.every(v => v !== "") && newValues.join("").length === 6) {
      handleVerifyOTP(newValues.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpValues(pasted.split(""));
      handleVerifyOTP(pasted);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setIsSubmitting(true);
    try {
      if (step === "otp-2fa") {
        // Just verify the OTP code, user is already logged in
        const { data, error } = await supabase.functions.invoke("otp", {
          body: { action: "verify-2fa", email: email.trim().toLowerCase(), code },
        });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Invalid code");

        toast.success("Welcome back!");
        if (redirectUrl) window.location.href = redirectUrl;
        else navigate("/chat");
      } else {
        // Signup: verify OTP then go to set password
        const { data, error } = await supabase.functions.invoke("otp", {
          body: { action: "verify-only", email: email.trim().toLowerCase(), code },
        });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Invalid code");

        setStep("set-password");
      }
    } catch (e: any) {
      toast.error(e.message || "Verification failed");
      setOtpValues(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: newPassword,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;

      toast.success("Account created!");
      if (redirectUrl) window.location.href = redirectUrl;
      else navigate("/chat");
    } catch (e: any) {
      toast.error(e.message || "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl || window.location.origin },
    });
  };

  const resetFlow = () => {
    setStep("email");
    setPassword("");
    setNewPassword("");
    setOtpValues(["", "", "", "", "", ""]);
  };

  const stepTitle = {
    email: "Enter your email to continue",
    password: "Enter your password",
    "otp-signup": "Enter the 6-digit code sent to your email",
    "set-password": "Create a password for your account",
    "otp-2fa": "Enter the 2FA code sent to your email",
  };

  const OtpInputs = () => (
    <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
      {otpValues.map((val, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleOtpChange(i, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(i, e)}
          className="w-12 h-14 text-center text-xl font-bold text-white bg-white/10 backdrop-blur-md border border-white/15 rounded-xl outline-none focus:border-primary/60 transition-colors"
        />
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/videos/auth-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm mx-4 text-center"
      >
        <h1 className="font-display text-4xl font-bold text-white mb-2">Megsy</h1>
        <p className="text-sm text-white/60 mb-10">{stepTitle[step]}</p>

        <AnimatePresence mode="wait">
          {/* Step: Email */}
          {step === "email" && (
            <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors mb-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-xs text-white/40">OR</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckEmail()}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 transition-colors"
                />
                <button
                  onClick={handleCheckEmail}
                  disabled={isSubmitting || !email.trim()}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Checking..." : "Continue with Email"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step: Password (existing user) */}
          {step === "password" && (
            <motion.div key="password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <p className="text-xs text-white/50">{email}</p>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                  autoFocus
                  className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handlePasswordLogin}
                disabled={isSubmitting || !password}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
              <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white/60">Back</button>
            </motion.div>
          )}

          {/* Step: OTP for signup */}
          {(step === "otp-signup" || step === "otp-2fa") && (
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
              <p className="text-xs text-white/50">{email}</p>
              <OtpInputs />
              {isSubmitting && <p className="text-xs text-white/50 animate-pulse">Verifying...</p>}
              <div className="pt-2">
                {countdown > 0 ? (
                  <p className="text-xs text-white/40">Resend code in {countdown}s</p>
                ) : (
                  <button onClick={() => sendOTP()} disabled={isSubmitting} className="text-xs text-primary hover:underline disabled:opacity-50">
                    Resend code
                  </button>
                )}
              </div>
              <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white/60">Back</button>
            </motion.div>
          )}

          {/* Step: Set Password (new user) */}
          {step === "set-password" && (
            <motion.div key="set-password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <p className="text-xs text-white/50">{email}</p>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Create a password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}
                  autoFocus
                  className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleCreateAccount}
                disabled={isSubmitting || newPassword.length < 8}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
              <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white/60">Back</button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[11px] text-white/30 mt-6">
          By continuing, you agree to our{" "}
          <span className="underline cursor-pointer" onClick={() => navigate("/terms")}>Terms</span> and{" "}
          <span className="underline cursor-pointer" onClick={() => navigate("/privacy")}>Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
