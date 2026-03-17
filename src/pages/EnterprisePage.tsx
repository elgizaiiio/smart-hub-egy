import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Shield, Zap, Users, Server, Headphones, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

const companySizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
const needs = [
  "Image generation at scale",
  "Video generation at scale",
  "Custom AI models",
  "API access & webhooks",
  "Dedicated infrastructure",
  "SLA guarantees",
  "Priority support",
  "Custom integrations",
  "White-label solution",
  "Data privacy & compliance",
];

const highlights = [
  { icon: Server, title: "Dedicated Infrastructure", desc: "Isolated compute resources with guaranteed uptime and performance." },
  { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliance, data encryption, and custom data retention policies." },
  { icon: Zap, title: "Priority Processing", desc: "Skip the queue with dedicated GPU allocation for faster generation." },
  { icon: Users, title: "Team Management", desc: "Centralized billing, role-based access, and usage analytics." },
  { icon: Lock, title: "Data Privacy", desc: "Your data never trains our models. Full GDPR compliance." },
  { icon: Headphones, title: "Dedicated Support", desc: "Personal account manager with guaranteed response times." },
];

const EnterprisePage = () => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleNeed = (need: string) => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleSubmit = async () => {
    if (!companyName || !contactName || !email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from("contact_submissions").insert({
        name: contactName,
        email,
        message: `Company: ${companyName}\nSize: ${companySize}\nNeeds: ${selectedNeeds.join(", ")}\n\n${message}`,
        form_type: "enterprise",
        subject: `Enterprise Inquiry - ${companyName}`,
      });

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-bot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "notify_admin",
            message: `Enterprise Inquiry\n\nCompany: ${companyName}\nContact: ${contactName}\nEmail: ${email}\nSize: ${companySize}\nNeeds: ${selectedNeeds.join(", ")}\n\nMessage: ${message || "N/A"}`,
          }),
        });
      } catch { /* silent */ }

      toast.success("Your inquiry has been submitted. We'll get back to you soon.");
      navigate("/pricing");
    } catch {
      toast.error("Failed to submit. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div data-theme="dark" className="min-h-screen bg-background text-foreground">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.06),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4">
              <Shield className="w-3.5 h-3.5" /> Enterprise
            </span>
            <h1 className="font-display text-[12vw] md:text-[5vw] font-black uppercase leading-[0.9] tracking-tighter">
              AI AT{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">ENTERPRISE</span>{" "}
              SCALE
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/40 leading-relaxed">
              Dedicated infrastructure, priority processing, and enterprise-grade security.
              Starting at <span className="text-white font-semibold">$149/mo</span> or <span className="text-white font-semibold">$1,299/yr</span>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-cyan-500/20 transition-colors"
              >
                <h.icon className="w-6 h-6 text-cyan-400 mb-4" />
                <h3 className="text-base font-semibold text-white mb-2">{h.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 md:py-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl font-bold text-white mb-8 text-center">Get in Touch</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Company Name *</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white outline-none focus:border-cyan-500/30 transition-colors placeholder:text-white/20"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Contact Name *</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white outline-none focus:border-cyan-500/30 transition-colors placeholder:text-white/20"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Business Email *</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white outline-none focus:border-cyan-500/30 transition-colors placeholder:text-white/20"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Company Size</label>
                <div className="flex flex-wrap gap-2">
                  {companySizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setCompanySize(size)}
                      className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                        companySize === size
                          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                          : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/60"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">What do you need?</label>
                <div className="flex flex-wrap gap-2">
                  {needs.map((need) => (
                    <button
                      key={need}
                      onClick={() => toggleNeed(need)}
                      className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                        selectedNeeds.includes(need)
                          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                          : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/60"
                      }`}
                    >
                      {need}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Additional Details</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white outline-none focus:border-cyan-500/30 transition-colors resize-none placeholder:text-white/20"
                  placeholder="Tell us about your use case..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !companyName || !contactName || !email}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default EnterprisePage;
