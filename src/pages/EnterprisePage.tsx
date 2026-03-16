import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Users, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
      // Save to contact_submissions
      await supabase.from("contact_submissions").insert({
        name: contactName,
        email,
        message: `Company: ${companyName}\nSize: ${companySize}\nNeeds: ${selectedNeeds.join(", ")}\n\n${message}`,
        form_type: "enterprise",
        subject: `Enterprise Inquiry - ${companyName}`,
      });

      // Send to Telegram admin
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
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/pricing")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">Enterprise Plan</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Company Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Company Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Company Name *</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Contact Name *</label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Business Email *</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                placeholder="john@company.com"
              />
            </div>
          </div>

          {/* Company Size */}
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Company Size</h2>
            <div className="flex flex-wrap gap-2">
              {companySizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setCompanySize(size)}
                  className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                    companySize === size
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {size} employees
                </button>
              ))}
            </div>
          </div>

          {/* Needs */}
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">What do you need?</h2>
            <div className="flex flex-wrap gap-2">
              {needs.map((need) => (
                <button
                  key={need}
                  onClick={() => toggleNeed(need)}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                    selectedNeeds.includes(need)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {need}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Additional Details</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Tell us about your use case, requirements, or any questions..."
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !companyName || !contactName || !email}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Submitting..." : "Submit Inquiry"}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default EnterprisePage;
