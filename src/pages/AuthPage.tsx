import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, Shield } from "lucide-react";

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
        if (redirectUrl) window.location.href = redirectUrl; else navigate("/chat");
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
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
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
        if (redirectUrl) window.location.href = redirectUrl; else navigate("/chat");
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
      if (redirectUrl) window.location.href = redirectUrl; else navigate("/chat");
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

  const stepIcon: Record<Step, React.ReactNode> = {
    email: <Mail className="w-5 h-5" />,
    password: <Lock className="w-5 h-5" />,
    "otp-signup": <Shield className="w-5 h-5" />,
    "set-password": <Lock className="w-5 h-5" />,
    "otp-2fa": <Shield className="w-5 h-5" />,
    "forgot-password": <Mail className="w-5 h-5" />,
    "otp-reset": <Shield className="w-5 h-5" />,
    "reset-password": <Lock className="w-5 h-5" />,
  };

  const stepTitle: Record<Step, string> = {
    email: "Welcome To Megsy",
    password: "Welcome Back",
    "otp-signup": "Verify Your Email",
    "set-password": "Create Your Password",
    "otp-2fa": "Two-Factor Authentication",
    "forgot-password": "Reset Password",
    "otp-reset": "Verify Reset Code",
    "reset-password": "Set New Password"
  };

  const stepSubtitle: Record<Step, string> = {
    email: "Enter your email to sign in or create a new account",
    password: "Enter your password to continue",
    "otp-signup": `We sent a 6-digit code to ${email}`,
    "set-password": "Choose a strong password for your account",
    "otp-2fa": `Enter the 2FA code sent to ${email}`,
    "forgot-password": "We'll send a reset code to your email",
    "otp-reset": `Enter the 6-digit code sent to ${email}`,
    "reset-password": "Choose your new password"
  };

  const isOtpStep = step === "otp-signup" || step === "otp-2fa" || step === "otp-reset";
  const showBack = step !== "email";

  const inputClass = "w-full bg-white/[0.07] border border-white/[0.12] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/60 focus:bg-white/[0.1] transition-all duration-200";
  const inputClassDesktop = "lg:bg-muted/40 lg:border-border/60 lg:text-foreground lg:placeholder:text-muted-foreground lg:focus:border-primary/50";
  const btnPrimary = "w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none";
  const btnSocial = "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/[0.1] text-white text-sm font-medium hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-200 lg:border-border/60 lg:text-foreground lg:hover:bg-muted/60";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — video (desktop only) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/auth-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <img src="/pwa-192.png" alt="Megsy" className="w-8 h-8 rounded-lg" />
            <span className="text-white/80 text-sm font-semibold tracking-wide">Megsy</span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-4">AI Platform</p>
            <h2 className="font-display text-[3.8vw] font-black text-white leading-[0.92] tracking-tight">
              Create.<br />Generate.<br />Build.
            </h2>
            <p className="mt-6 text-sm text-white/40 max-w-xs leading-relaxed">
              One platform for AI chat, image generation, video creation, and code — powered by the best models.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 relative">
        {/* Mobile bg */}
        <div className="absolute inset-0 lg:hidden">
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="/videos/auth-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
        </div>

        <div className="relative z-10 w-full max-w-[380px]">
          {/* Back button */}
          <AnimatePresence>
            {showBack && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={resetFlow}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 lg:text-muted-foreground lg:hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </motion.button>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="mb-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <img src="/pwa-192.png" alt="Megsy" className="w-8 h-8 rounded-lg" />
              <span className="text-white/80 text-sm font-semibold">Megsy</span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {stepIcon[step]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white lg:text-foreground">{stepTitle[step]}</h1>
              </div>
            </div>
            <p className="text-[13px] text-white/40 lg:text-muted-foreground leading-relaxed pl-[52px]">
              {stepSubtitle[step]}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* Step: Email */}
            {step === "email" && (
              <motion.div key="email" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-white/50 lg:text-muted-foreground mb-1.5 block uppercase tracking-wider">Email address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCheckEmail()}
                      autoFocus
                      className={`${inputClass} ${inputClassDesktop}`}
                    />
                  </div>

                  <button
                    onClick={handleCheckEmail}
                    disabled={isSubmitting || !email.trim()}
                    className={btnPrimary}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Checking...
                      </span>
                    ) : "Continue"}
                  </button>
                </div>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/[0.08] lg:bg-border/50" />
                  <span className="text-[11px] text-white/30 lg:text-muted-foreground uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-white/[0.08] lg:bg-border/50" />
                </div>

                <div className="space-y-2.5">
                  <button onClick={handleGoogleLogin} className={btnSocial}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>

                  <button onClick={handleGitHubLogin} className={btnSocial}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    Continue with GitHub
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step: Password (existing user) */}
            {step === "password" && (
              <motion.div key="password" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-3.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] lg:bg-muted/30 border border-white/[0.06] lg:border-border/40">
                  <Mail className="w-3.5 h-3.5 text-white/30 lg:text-muted-foreground" />
                  <span className="text-xs text-white/50 lg:text-muted-foreground truncate">{email}</span>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 lg:text-muted-foreground mb-1.5 block uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                      autoFocus
                      className={`${inputClass} ${inputClassDesktop} pr-12`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-white/35 lg:text-muted-foreground cursor-pointer select-none">
                    <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="rounded border-white/20 w-3.5 h-3.5" />
                    Remember me
                  </label>
                  <button onClick={() => setStep("forgot-password")} className="text-xs text-primary/80 hover:text-primary transition-colors">Forgot?</button>
                </div>
                <button onClick={handlePasswordLogin} disabled={isSubmitting || !password} className={btnPrimary}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </button>
              </motion.div>
            )}

            {/* OTP Steps */}
            {isOtpStep && (
              <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] lg:bg-muted/30 border border-white/[0.06] lg:border-border/40 mx-auto w-fit">
                  <Mail className="w-3.5 h-3.5 text-white/30 lg:text-muted-foreground" />
                  <span className="text-xs text-white/50 lg:text-muted-foreground">{email}</span>
                </div>
                <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                  {otpValues.map((val, i) => (
                    <input
                      key={`otp-${step}-${i}`}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className="w-12 h-14 text-center text-xl font-bold text-white lg:text-foreground bg-white/[0.07] lg:bg-muted/40 border border-white/[0.12] lg:border-border/60 rounded-xl outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                    />
                  ))}
                </div>
                {isSubmitting && <p className="text-xs text-white/40 animate-pulse text-center">Verifying...</p>}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-white/30 lg:text-muted-foreground">Resend in {countdown}s</p>
                  ) : (
                    <button onClick={() => sendOTP()} disabled={isSubmitting} className="text-xs text-primary/80 hover:text-primary transition-colors disabled:opacity-40">
                      Resend code
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step: Set Password (new user) */}
            {step === "set-password" && (
              <motion.div key="set-password" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-3.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] lg:bg-muted/30 border border-white/[0.06] lg:border-border/40 mx-auto w-fit">
                  <Mail className="w-3.5 h-3.5 text-white/30 lg:text-muted-foreground" />
                  <span className="text-xs text-white/50 lg:text-muted-foreground">{email}</span>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 lg:text-muted-foreground mb-1.5 block uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}
                      autoFocus
                      className={`${inputClass} ${inputClassDesktop} pr-12`}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button onClick={handleCreateAccount} disabled={isSubmitting || newPassword.length < 8} className={btnPrimary}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : "Create Account"}
                </button>
              </motion.div>
            )}

            {/* Step: Reset Password */}
            {step === "reset-password" && (
              <motion.div key="reset-password" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-3.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] lg:bg-muted/30 border border-white/[0.06] lg:border-border/40 mx-auto w-fit">
                  <Mail className="w-3.5 h-3.5 text-white/30 lg:text-muted-foreground" />
                  <span className="text-xs text-white/50 lg:text-muted-foreground">{email}</span>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-white/50 lg:text-muted-foreground mb-1.5 block uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      autoFocus
                      className={`${inputClass} ${inputClassDesktop} pr-12`}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button onClick={handleResetPassword} disabled={isSubmitting || newPassword.length < 8} className={btnPrimary}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : "Update Password"}
                </button>
              </motion.div>
            )}

            {/* Step: Forgot Password */}
            {step === "forgot-password" && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-3.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] lg:bg-muted/30 border border-white/[0.06] lg:border-border/40 mx-auto w-fit">
                  <Mail className="w-3.5 h-3.5 text-white/30 lg:text-muted-foreground" />
                  <span className="text-xs text-white/50 lg:text-muted-foreground">{email}</span>
                </div>
                <button onClick={handleForgotPassword} disabled={isSubmitting} className={btnPrimary}>
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : "Send Reset Code"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-white/20 lg:text-muted-foreground/40 mt-8 text-center leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="https://terms.megsyai.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/40 lg:hover:text-muted-foreground transition-colors">Terms</a> and{" "}
            <a href="https://privacy.megsyai.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/40 lg:hover:text-muted-foreground transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
