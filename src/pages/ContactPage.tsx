import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";

const supportSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  issue: z.string().trim().min(1, "Please describe your issue").max(2000),
});

const enterpriseSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  workEmail: z.string().trim().email("Invalid email address").max(255),
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  country: z.string().min(1, "Please select a country"),
  companySize: z.string().min(1, "Please select company size"),
  needs: z.string().trim().min(1, "Please tell us about your needs").max(2000),
});

type SupportFormValues = z.infer<typeof supportSchema>;
type EnterpriseFormValues = z.infer<typeof enterpriseSchema>;

const countries = [
  "United States", "United Kingdom", "Germany", "France", "Canada",
  "Australia", "Japan", "South Korea", "India", "Brazil",
  "Saudi Arabia", "UAE", "Egypt", "Turkey", "Other",
];

const companySizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const ContactPage = () => {
  const [activeTab, setActiveTab] = useState<"support" | "enterprise">("support");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supportForm = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: { username: "", email: "", issue: "" },
  });

  const enterpriseForm = useForm<EnterpriseFormValues>({
    resolver: zodResolver(enterpriseSchema),
    defaultValues: { firstName: "", lastName: "", workEmail: "", companyName: "", country: "", companySize: "", needs: "" },
  });

  const submitToBackend = async (formType: string, name: string, email: string, message: string, extraFields?: Record<string, string>) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("contact-form", {
        body: { formType, name, email, message, extraFields },
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Message sent successfully!",
        description: "Check your email for our auto-reply.",
      });
    } catch (err) {
      console.error("Contact form error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or email us at support@megsyai.com",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSupportSubmit = (data: SupportFormValues) => {
    submitToBackend("support", data.username, data.email, data.issue);
  };

  const onEnterpriseSubmit = (data: EnterpriseFormValues) => {
    submitToBackend("enterprise", `${data.firstName} ${data.lastName}`, data.workEmail, data.needs, {
      companyName: data.companyName,
      country: data.country,
      companySize: data.companySize,
    });
  };

  const resetForm = () => {
    setSubmitted(false);
    supportForm.reset();
    enterpriseForm.reset();
  };

  const inputClass = "h-14 rounded-xl border-white/15 bg-transparent text-white placeholder:text-white/30 focus-visible:ring-purple-500/40 focus-visible:border-purple-500/50 text-base";
  const selectTriggerClass = "h-14 rounded-xl border-white/15 bg-transparent text-white focus:ring-purple-500/40 [&>span]:text-white/30 [&>span]:data-[value]:text-white text-base";

  const formFieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <LandingNavbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-24 md:pt-28">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Giant Typography Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-purple-600 p-10">
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative z-10 flex h-full flex-col justify-between"
              >
                <h2 className="font-display text-[5.5vw] font-black uppercase leading-[0.85] tracking-tighter text-black">
                  NEED
                  <br />
                  TO
                  <br />
                  CONTACT
                  <br />
                  US?
                </h2>
                <motion.div
                  className="absolute bottom-4 right-4"
                  initial={{ scale: 0, rotate: -45 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.7, type: "spring" }}
                >
                  <svg viewBox="0 0 120 80" fill="none" className="h-28 w-40 text-black">
                    <rect x="2" y="2" width="116" height="76" rx="8" stroke="currentColor" strokeWidth="5" />
                    <path d="M2 10 L60 50 L118 10" stroke="currentColor" strokeWidth="5" fill="none" />
                    <path d="M2 78 L45 45" stroke="currentColor" strokeWidth="5" />
                    <path d="M118 78 L75 45" stroke="currentColor" strokeWidth="5" />
                  </svg>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex flex-col"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 text-center font-display text-4xl font-black uppercase tracking-tight md:text-5xl"
            >
              REACH OUT TO OUR TEAM
            </motion.h1>

            <AnimatePresence mode="wait">
              {submitted ? (
                /* Success State */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="flex flex-col items-center gap-6 py-16"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 className="h-20 w-20 text-green-400" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-2xl font-bold"
                  >
                    Message Sent Successfully!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="max-w-sm text-center text-white/40"
                  >
                    We've sent you a personalized auto-reply to your email. Our team will follow up if needed within 24-48 hours.
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={resetForm}
                    className="mt-4 rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
                  >
                    Send Another Message
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="form" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  {/* Tab Switcher */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="mx-auto mb-10 flex w-fit rounded-full bg-white/[0.08] p-1.5"
                  >
                    <button
                      onClick={() => setActiveTab("support")}
                      className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                        activeTab === "support"
                          ? "bg-[#39e75f] text-black shadow-lg shadow-green-500/20"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Support and billing
                    </button>
                    <button
                      onClick={() => setActiveTab("enterprise")}
                      className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                        activeTab === "enterprise"
                          ? "bg-[#39e75f] text-black shadow-lg shadow-green-500/20"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Enterprise sales
                    </button>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {/* Support Form */}
                    {activeTab === "support" && (
                      <motion.div
                        key="support"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.35 }}
                      >
                        <Form {...supportForm}>
                          <form onSubmit={supportForm.handleSubmit(onSupportSubmit)} className="space-y-5">
                            <motion.div
                              className="grid gap-5 sm:grid-cols-2"
                              variants={formFieldVariants}
                              initial="hidden"
                              animate="visible"
                              custom={0}
                            >
                              <FormField
                                control={supportForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="Your Megsy username *" className={inputClass} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={supportForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input type="email" placeholder="Email address *" className={inputClass} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                            <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={1}>
                              <FormField
                                control={supportForm.control}
                                name="issue"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Describe your issue *"
                                        rows={7}
                                        className="resize-none rounded-xl border-white/15 bg-transparent text-white placeholder:text-white/30 focus-visible:ring-purple-500/40 focus-visible:border-purple-500/50 text-base"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                            <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={2}>
                              <button
                                type="submit"
                                disabled={submitting}
                                className="mx-auto flex items-center gap-2 rounded-full border border-white/20 bg-white px-10 py-3.5 text-sm font-bold text-black transition-all hover:bg-white/90 hover:shadow-lg disabled:opacity-50"
                              >
                                {submitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  "Submit Request"
                                )}
                              </button>
                            </motion.div>
                          </form>
                        </Form>
                      </motion.div>
                    )}

                    {/* Enterprise Form */}
                    {activeTab === "enterprise" && (
                      <motion.div
                        key="enterprise"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.35 }}
                      >
                        <Form {...enterpriseForm}>
                          <form onSubmit={enterpriseForm.handleSubmit(onEnterpriseSubmit)} className="space-y-5">
                            <motion.div className="grid gap-5 sm:grid-cols-2" variants={formFieldVariants} initial="hidden" animate="visible" custom={0}>
                              <FormField
                                control={enterpriseForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="First Name *" className={inputClass} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={enterpriseForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="Last Name *" className={inputClass} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                            <motion.div className="grid gap-5 sm:grid-cols-2" variants={formFieldVariants} initial="hidden" animate="visible" custom={1}>
                              <FormField
                                control={enterpriseForm.control}
                                name="workEmail"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input type="email" placeholder="Work Email *" className={inputClass} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={enterpriseForm.control}
                                name="companyName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="Company Name *" className={inputClass} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                            <motion.div className="grid gap-5 sm:grid-cols-2" variants={formFieldVariants} initial="hidden" animate="visible" custom={2}>
                              <FormField
                                control={enterpriseForm.control}
                                name="country"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger className={selectTriggerClass}>
                                          <SelectValue placeholder="Country *" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="border-white/10 bg-zinc-900">
                                        {countries.map((c) => (
                                          <SelectItem key={c} value={c} className="text-white/80 focus:bg-white/10 focus:text-white">
                                            {c}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={enterpriseForm.control}
                                name="companySize"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger className={selectTriggerClass}>
                                          <SelectValue placeholder="Company size *" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="border-white/10 bg-zinc-900">
                                        {companySizes.map((s) => (
                                          <SelectItem key={s} value={s} className="text-white/80 focus:bg-white/10 focus:text-white">
                                            {s}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                            <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={3}>
                              <FormField
                                control={enterpriseForm.control}
                                name="needs"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Tell us about your needs *"
                                        rows={7}
                                        className="resize-none rounded-xl border-white/15 bg-transparent text-white placeholder:text-white/30 focus-visible:ring-purple-500/40 focus-visible:border-purple-500/50 text-base"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                            <motion.div variants={formFieldVariants} initial="hidden" animate="visible" custom={4}>
                              <button
                                type="submit"
                                disabled={submitting}
                                className="mx-auto flex items-center gap-2 rounded-full border border-white/20 bg-white px-10 py-3.5 text-sm font-bold text-black transition-all hover:bg-white/90 hover:shadow-lg disabled:opacity-50"
                              >
                                {submitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  "Submit Inquiry"
                                )}
                              </button>
                            </motion.div>
                          </form>
                        </Form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 text-center text-xs text-white/25"
                  >
                    By submitting this form, I agree to receive updates and marketing communications from Megsy, as outlined in the{" "}
                    <a href="https://privacy.megsyai.com" target="_blank" rel="noopener noreferrer" className="text-white/50 underline underline-offset-2 hover:text-white/70">
                      Privacy & Cookie Policy
                    </a>.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default ContactPage;
