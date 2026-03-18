import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

type Step = "email" | "password" | "otp-signup" | "set-password" | "otp-2fa" | "forgot-password" | "otp-reset" | "reset-password";

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
  const [rememberMe, setRememberMe] = useState(false);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {clearInterval(interval);return 0;}
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
        body: { email: normalizedEmail }
      });
      if (error) throw new Error(error.message);
      if (data.exists) {
        setUserExists(true);
        setHas2FA(data.two_factor_enabled);
        setStep("password");
      } else {
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
        body: { action: "send", email: normalizedEmail }
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
        password
      });
      if (error) throw error;
      if (has2FA) {
        await sendOTP();
        setStep("otp-2fa");
      } else {
        toast.success("Welcome back!");
        if (redirectUrl) window.location.href = redirectUrl;else
        navigate("/chat");
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
    if (newValues.every((v) => v !== "") && newValues.join("").length === 6) {
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
      const newValues = pasted.split("");
      setOtpValues(newValues);
      handleVerifyOTP(pasted);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setIsSubmitting(true);
    try {
      if (step === "otp-2fa") {
        const { data, error } = await supabase.functions.invoke("otp", {
          body: { action: "verify-2fa", email: email.trim().toLowerCase(), code }
        });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Invalid code");
        toast.success("Welcome back!");
        if (redirectUrl) window.location.href = redirectUrl;else
        navigate("/chat");
      } else if (step === "otp-reset") {
        const { data, error } = await supabase.functions.invoke("otp", {
          body: { action: "verify-reset", email: email.trim().toLowerCase(), code }
        });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Invalid code");
        setStep("reset-password");
      } else {
        const { data, error } = await supabase.functions.invoke("otp", {
          body: { action: "verify-only", email: email.trim().toLowerCase(), code }
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
      const { data, error } = await supabase.functions.invoke("signup", {
        body: { email: email.trim().toLowerCase(), password: newPassword }
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Could not create account");

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink"
      });
      if (verifyError) throw verifyError;

      toast.success("Account created!");
      if (redirectUrl) window.location.href = redirectUrl;else
      navigate("/chat");
    } catch (e: any) {
      toast.error(e.message || "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-password", {
        body: { email: email.trim().toLowerCase(), password: newPassword }
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to update password");

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink"
      });
      if (verifyError) throw verifyError;

      toast.success("Password updated!");
      navigate("/chat");
    } catch (e: any) {
      toast.error(e.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    await sendOTP();
    setStep("otp-reset");
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl || window.location.origin + "/chat" }
    });
  };

  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: redirectUrl || window.location.origin + "/chat" }
    });
  };

  const resetFlow = () => {
    setStep("email");
    setPassword("");
    setNewPassword("");
    setOtpValues(["", "", "", "", "", ""]);
  };

  const stepTitle: Record<Step, string> = {
    email: "Welcome Back",
    password: "Welcome Back",
    "otp-signup": "Verify Your Email",
    "set-password": "Create Your Password",
    "otp-2fa": "Two-Factor Authentication",
    "forgot-password": "Reset Password",
    "otp-reset": "Verify Reset Code",
    "reset-password": "Set New Password"
  };

  const stepSubtitle: Record<Step, string> = {
    email: "Enter your email and password to access your account",
    password: "Enter your password to sign in",
    "otp-signup": "Enter the 6-digit code sent to your email",
    "set-password": "Create a password for your account",
    "otp-2fa": "Enter the 2FA code sent to your email",
    "forgot-password": "We'll send a reset code to your email",
    "otp-reset": "Enter the 6-digit code to reset your password",
    "reset-password": "Set your new password"
  };

  const isOtpStep = step === "otp-signup" || step === "otp-2fa" || step === "otp-reset";

  // Desktop: split-screen layout matching reference image
  // Mobile: centered card layout
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — abstract art (desktop only) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/auth-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">A wise quote</p>
          <div>
            <h2 className="font-display text-[4.5vw] font-black text-white leading-[0.95] tracking-tight">
              Get<br />Everything<br />You Want
            </h2>
            <p className="mt-6 text-sm text-white/50 max-w-sm leading-relaxed">
              You can get everything you want if you work hard, trust the process, and stick to the plan.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 relative">
        {/* Mobile bg video */}
        <div className="absolute inset-0 lg:hidden">
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="/videos/auth-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-8 lg:mb-10">
            


            
            <h1 className="font-display text-2xl font-bold text-white lg:text-foreground">{stepTitle[step]}</h1>
            <p className="text-sm text-white/50 lg:text-muted-foreground mt-1">{stepSubtitle[step]}</p>
          </div>

          <AnimatePresence mode="wait">
            {/* Step: Email */}
            {step === "email" &&
            <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-white/60 lg:text-muted-foreground mb-1.5 block">Email</label>
                    <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckEmail()}
                    className="w-full bg-white/10 lg:bg-muted/50 backdrop-blur-md border border-white/10 lg:border-border rounded-xl px-4 py-3 text-sm text-white lg:text-foreground placeholder:text-white/40 lg:placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors" />
                  
                  </div>

                  <button
                  onClick={handleCheckEmail}
                  disabled={isSubmitting || !email.trim()}
                  className="w-full py-3 rounded-xl bg-foreground text-background lg:bg-primary lg:text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                  
                    {isSubmitting ? "Checking..." : "Sign In"}
                  </button>
                </div>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/10 lg:bg-border" />
                  <span className="text-xs text-white/40 lg:text-muted-foreground">OR</span>
                  <div className="flex-1 h-px bg-white/10 lg:bg-border" />
                </div>

                <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 lg:border-border text-white lg:text-foreground text-sm font-medium hover:bg-white/5 lg:hover:bg-muted transition-colors mb-3">
                
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>

                <button
                onClick={handleGitHubLogin}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 lg:border-border text-white lg:text-foreground text-sm font-medium hover:bg-white/5 lg:hover:bg-muted transition-colors">
                
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Sign in with GitHub
                </button>

                <p className="text-center text-xs text-white/30 lg:text-muted-foreground mt-6">
                  Don't have an account?{" "}
                  <span className="text-primary font-medium cursor-pointer hover:underline">Sign Up</span>
                </p>
              </motion.div>
            }

            {/* Step: Password (existing user) */}
            {step === "password" &&
            <motion.div key="password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <p className="text-xs text-white/50 lg:text-muted-foreground">{email}</p>
                <div>
                  <label className="text-xs font-medium text-white/60 lg:text-muted-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                    autoFocus
                    className="w-full bg-white/10 lg:bg-muted/50 backdrop-blur-md border border-white/10 lg:border-border rounded-xl px-4 py-3 pr-12 text-sm text-white lg:text-foreground placeholder:text-white/40 lg:placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors" />
                  
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-white/40 lg:text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="rounded border-white/20" />
                    Remember me
                  </label>
                  <button onClick={() => setStep("forgot-password")} className="text-xs text-primary hover:underline">Forgot Password?</button>
                </div>
                <button onClick={handlePasswordLogin} disabled={isSubmitting || !password} className="w-full py-3 rounded-xl bg-foreground text-background lg:bg-primary lg:text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
                <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white/60 lg:text-muted-foreground block mx-auto">Back</button>
              </motion.div>
            }

            {/* OTP Steps */}
            {isOtpStep &&
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                <p className="text-xs text-white/50 lg:text-muted-foreground text-center">{email}</p>
                <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                  {otpValues.map((val, i) =>
                <input
                  key={`otp-${step}-${i}`}
                  ref={(el) => {inputRefs.current[i] = el;}}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  className="w-12 h-14 text-center text-xl font-bold text-white lg:text-foreground bg-white/10 lg:bg-muted/50 backdrop-blur-md border border-white/15 lg:border-border rounded-xl outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors" />

                )}
                </div>
                {isSubmitting && <p className="text-xs text-white/50 animate-pulse text-center">Verifying...</p>}
                <div className="pt-2 text-center">
                  {countdown > 0 ?
                <p className="text-xs text-white/40 lg:text-muted-foreground">Resend code in {countdown}s</p> :

                <button onClick={() => sendOTP()} disabled={isSubmitting} className="text-xs text-primary hover:underline disabled:opacity-50">
                      Resend code
                    </button>
                }
                </div>
                <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white/60 lg:text-muted-foreground block mx-auto">Back</button>
              </motion.div>
            }

            {/* Step: Set Password (new user) */}
            {step === "set-password" &&
            <motion.div key="set-password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <p className="text-xs text-white/50 lg:text-muted-foreground text-center">{email}</p>
                <div className="relative">
                  <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Create a password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}
                  autoFocus
                  className="w-full bg-white/10 lg:bg-muted/50 backdrop-blur-md border border-white/10 lg:border-border rounded-xl px-4 py-3.5 pr-12 text-sm text-white lg:text-foreground placeholder:text-white/40 lg:placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors" />
                
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={handleCreateAccount} disabled={isSubmitting || newPassword.length < 8} className="w-full py-3.5 rounded-xl bg-foreground text-background lg:bg-primary lg:text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </button>
                <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white/60 lg:text-muted-foreground block mx-auto">Back</button>
              </motion.div>
            }

            {/* Step: Reset Password */}
            {step === "reset-password" &&
            <motion.div key="reset-password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <p className="text-xs text-white/50 lg:text-muted-foreground text-center">{email}</p>
                <div className="relative">
                  <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  autoFocus
                  className="w-full bg-white/10 lg:bg-muted/50 backdrop-blur-md border border-white/10 lg:border-border rounded-xl px-4 py-3.5 pr-12 text-sm text-white lg:text-foreground placeholder:text-white/40 lg:placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors" />
                
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button onClick={handleResetPassword} disabled={isSubmitting || newPassword.length < 8} className="w-full py-3.5 rounded-xl bg-foreground text-background lg:bg-primary lg:text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
                <button onClick={resetFlow} className="text-xs text-white/40 hover:text-white/60 lg:text-muted-foreground block mx-auto">Back to login</button>
              </motion.div>
            }

            {/* Step: Forgot Password */}
            {step === "forgot-password" &&
            <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <p className="text-xs text-white/50 lg:text-muted-foreground text-center">{email}</p>
                <button onClick={handleForgotPassword} disabled={isSubmitting} className="w-full py-3.5 rounded-xl bg-foreground text-background lg:bg-primary lg:text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                  {isSubmitting ? "Sending..." : "Send Reset Code"}
                </button>
                <button onClick={() => setStep("password")} className="text-xs text-white/40 hover:text-white/60 lg:text-muted-foreground block mx-auto">Back to login</button>
              </motion.div>
            }
          </AnimatePresence>

          <p className="text-[11px] text-white/30 lg:text-muted-foreground/50 mt-6 text-center">
            By continuing, you agree to our{" "}
            <a href="https://terms.megsyai.com" target="_blank" rel="noopener noreferrer" className="underline">Terms</a> and{" "}
            <a href="https://privacy.megsyai.com" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>);

};

export default AuthPage;