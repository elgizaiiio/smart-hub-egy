import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import FancyButton from "@/components/FancyButton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send } from "lucide-react";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const subjects = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Support" },
  { value: "partnership", label: "Partnership" },
  { value: "enterprise", label: "Enterprise" },
  { value: "bug", label: "Bug Report" },
];

const socialLinks = [
  {
    label: "X (Twitter)",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

const ContactPage = () => {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = (data: ContactFormValues) => {
    console.log("Contact form submitted:", { name: data.name, subject: data.subject });
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
    });
    form.reset();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <LandingNavbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <h1 className="font-display text-5xl font-black uppercase tracking-tight md:text-7xl">
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Get in Touch
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-white/40">
            Have a question, suggestion, or want to collaborate? We'd love to hear from you.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-3"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-lg md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-white/60">Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your name"
                              className="border-white/10 bg-white/[0.06] text-white placeholder:text-white/20 focus-visible:ring-purple-500/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-white/60">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="border-white/10 bg-white/[0.06] text-white placeholder:text-white/20 focus-visible:ring-purple-500/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white/60">Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-white/10 bg-white/[0.06] text-white focus:ring-purple-500/50 [&>span]:text-white/20 [&>span]:data-[value]:text-white">
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-white/10 bg-zinc-900">
                            {subjects.map((s) => (
                              <SelectItem key={s.value} value={s.value} className="text-white/80 focus:bg-white/10 focus:text-white">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white/60">Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us what's on your mind..."
                            rows={6}
                            className="resize-none border-white/10 bg-white/[0.06] text-white placeholder:text-white/20 focus-visible:ring-purple-500/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FancyButton type="submit" className="w-full gap-2 text-base">
                    <Send className="h-4 w-4" />
                    Send Message
                  </FancyButton>
                </form>
              </Form>
            </div>
          </motion.div>

          {/* Sidebar Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="space-y-8 lg:col-span-2"
          >
            {/* Email Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <Mail className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Email Us</h3>
              <p className="mb-4 text-sm text-white/30">We typically respond within 24 hours.</p>
              <a
                href="mailto:support@megsyai.com"
                className="text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
              >
                support@megsyai.com
              </a>
            </div>

            {/* Social Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-lg">
              <h3 className="mb-4 text-lg font-bold text-white">Follow Us</h3>
              <div className="flex gap-4">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/40 transition-all hover:border-purple-500/30 hover:text-white"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* FAQ hint */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-lg">
              <h3 className="mb-2 text-lg font-bold text-white">Quick Answers</h3>
              <p className="text-sm text-white/30">
                Check our{" "}
                <a href="/#faq" className="text-purple-400 underline underline-offset-2 transition-colors hover:text-purple-300">
                  FAQ section
                </a>{" "}
                for common questions about pricing, features, and more.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default ContactPage;
