import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AIPersonalizationPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [callName, setCallName] = useState("");
  const [profession, setProfession] = useState("");
  const [about, setAbout] = useState("");
  const [aiTraits, setAiTraits] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("ai_personalization").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setCallName(data.call_name || "");
        setProfession(data.profession || "");
        setAbout(data.about || "");
        setAiTraits(data.ai_traits || "");
        setCustomInstructions(data.custom_instructions || "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload = {
        user_id: user.id,
        call_name: callName.trim() || null,
        profession: profession.trim() || null,
        about: about.trim() || null,
        ai_traits: aiTraits.trim() || null,
        custom_instructions: customInstructions.trim() || null,
        updated_at: new Date().toISOString(),
      };
      const { data: existing } = await supabase.from("ai_personalization").select("id").eq("user_id", user.id).maybeSingle();
      if (existing) {
        await supabase.from("ai_personalization").update(payload).eq("user_id", user.id);
      } else {
        await supabase.from("ai_personalization").insert(payload);
      }
      toast.success("Saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  }, [callName, profession, about, aiTraits, customInstructions]);

  const fieldClass = "w-full bg-accent/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30 transition-all";

  const content = loading ? (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  ) : (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-md mx-auto">
      <div>
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">What should AI call you?</label>
        <input value={callName} onChange={e => setCallName(e.target.value)} placeholder="e.g. Ahmed, Boss, Captain..." className={fieldClass} />
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">What is your profession?</label>
        <input value={profession} onChange={e => setProfession(e.target.value)} placeholder="e.g. Software Engineer, Designer, Student..." className={fieldClass} />
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">Tell us about yourself</label>
        <textarea value={about} onChange={e => setAbout(e.target.value)} placeholder="A short description about you, your interests, goals..." rows={3} className={`${fieldClass} resize-none`} />
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">AI personality traits</label>
        <textarea value={aiTraits} onChange={e => setAiTraits(e.target.value)} placeholder="e.g. Be concise, use humor, speak formally, be creative..." rows={3} className={`${fieldClass} resize-none`} />
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 block">Custom instructions</label>
        <textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} placeholder="Any specific instructions for the AI when responding to you..." rows={4} className={`${fieldClass} resize-none`} />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="AI Personalization" subtitle="Customize how Megsy AI interacts with you">
        {content}
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-12">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">AI Personalization</h1>
        </div>
        <div className="px-4">{content}</div>
      </div>
    </div>
  );
};

export default AIPersonalizationPage;
