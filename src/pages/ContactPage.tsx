import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const companySizes = [
  "1-10", "11-50", "51-200", "201-1000", "1000+",
];

const ContactPage = () => {
  const [activeTab, setActiveTab] = useState<"support" | "enterprise">("support");

  const supportForm = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: { username: "", email: "", issue: "" },
  });

  const enterpriseForm = useForm<EnterpriseFormValues>({
    resolver: zodResolver(enterpriseSchema),
    defaultValues: { firstName: "", lastName: "", workEmail: "", companyName: "", country: "", companySize: "", needs: "" },
  });

  const onSupportSubmit = (_data: SupportFormValues) => {
    toast({ title: "Request submitted!", description: "We'll get back to you as soon as possible." });
    supportForm.reset();
  };

  const onEnterpriseSubmit = (_data: EnterpriseFormValues) => {
    toast({ title: "Inquiry submitted!", description: "Our enterprise team will contact you shortly." });
    enterpriseForm.reset();
  };

  const inputClass = "h-14 rounded-xl border-white/15 bg-transparent text-white placeholder:text-white/30 focus-visible:ring-purple-500/40 focus-visible:border-purple-500/50 text-base";
  const selectTriggerClass = "h-14 rounded-xl border-white/15 bg-transparent text-white focus:ring-purple-500/40 [&>span]:text-white/30 [&>span]:data-[value]:text-white text-base";

  return (
    <div className="min-h-screen bg-black text-white">
      <LandingNavbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-24 md:pt-28">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Giant Typography Graphic */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-purple-600 p-10">
              <div className="relative z-10 flex h-full flex-col justify-between">
                <h2 className="font-display text-[5.5vw] font-black uppercase leading-[0.85] tracking-tighter text-black">
                  NEED
                  <br />
                  TO
                  <br />
                  CONTACT
                  <br />
                  US?
                </h2>
                {/* Mail icon */}
                <div className="absolute bottom-4 right-4">
                  <svg viewBox="0 0 120 80" fill="none" className="h-28 w-40 text-black">
                    <rect x="2" y="2" width="116" height="76" rx="8" stroke="currentColor" strokeWidth="5" />
                    <path d="M2 10 L60 50 L118 10" stroke="currentColor" strokeWidth="5" fill="none" />
                    <path d="M2 78 L45 45" stroke="currentColor" strokeWidth="5" />
                    <path d="M118 78 L75 45" stroke="currentColor" strokeWidth="5" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex flex-col"
          >
            <h1 className="mb-8 text-center font-display text-4xl font-black uppercase tracking-tight md:text-5xl">
              REACH OUT TO OUR TEAM
            </h1>

            {/* Tab Switcher */}
            <div className="mx-auto mb-10 flex w-fit rounded-full bg-white/[0.08] p-1.5">
              <button
                onClick={() => setActiveTab("support")}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "support"
                    ? "bg-[#39e75f] text-black shadow-lg shadow-green-500/20"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Support and billing
              </button>
              <button
                onClick={() => setActiveTab("enterprise")}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "enterprise"
                    ? "bg-[#39e75f] text-black shadow-lg shadow-green-500/20"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Enterprise sales
              </button>
            </div>

            {/* Support Form */}
            {activeTab === "support" && (
              <motion.div
                key="support"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Form {...supportForm}>
                  <form onSubmit={supportForm.handleSubmit(onSupportSubmit)} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
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
                    </div>
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
                    <button
                      type="submit"
                      className="mx-auto flex rounded-full border border-white/20 bg-white px-10 py-3.5 text-sm font-bold text-black transition-all hover:bg-white/90 hover:shadow-lg"
                    >
                      Submit Request
                    </button>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Enterprise Form */}
            {activeTab === "enterprise" && (
              <motion.div
                key="enterprise"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Form {...enterpriseForm}>
                  <form onSubmit={enterpriseForm.handleSubmit(onEnterpriseSubmit)} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
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
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
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
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
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
                    </div>
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
                    <button
                      type="submit"
                      className="mx-auto flex rounded-full border border-white/20 bg-white px-10 py-3.5 text-sm font-bold text-black transition-all hover:bg-white/90 hover:shadow-lg"
                    >
                      Submit Inquiry
                    </button>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Privacy note */}
            <p className="mt-6 text-center text-xs text-white/25">
              By submitting this form, I agree to receive updates and marketing communications from Megsy, as outlined in the{" "}
              <a href="https://privacy.megsyai.com" target="_blank" rel="noopener noreferrer" className="text-white/50 underline underline-offset-2 hover:text-white/70">
                Privacy & Cookie Policy
              </a>.
            </p>
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default ContactPage;
