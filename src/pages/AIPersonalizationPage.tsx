import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const AIPersonalizationPage = () => {
  const navigate = useNavigate();
  const [callName, setCallName] = useState("");
  const [profession, setProfession] = useState("");
  const [about, setAbout] = useState("");
  const [aiTraits, setAiTraits] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("ai_personalization" as any).select("*").eq("user_id", user.id).single();
      if (data) {
        setCallName((data as any).call_name || "");
        setProfession((data as any).profession || "");
        setAbout((data as any).about || "");
        setAiTraits((data as any).ai_traits || "");
        setCustomInstructions((data as any).custom_instructions || "");
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = { user_id: user.id, call_name: callName, profession, about, ai_traits: aiTraits, custom_instructions: customInstructions, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("ai_personalization" as any).upsert(payload as any, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error("Failed to save");
    else toast.success("Saved!");
  };

  const fields = [
    { label: "What should the AI call you?", value: callName, onChange: setCallName, placeholder: "e.g., Ahmed, Boss, Friend", type: "input" },
    { label: "What is your profession?", value: profession, onChange: setProfession, placeholder: "e.g., Software Engineer, Designer", type: "input" },
    { label: "Tell us about yourself", value: about, onChange: setAbout, placeholder: "A brief description about you...", type: "textarea" },
    { label: "What traits should the AI have?", value: aiTraits, onChange: setAiTraits, placeholder: "e.g., Friendly, Professional, Creative", type: "input" },
    { label: "Custom instructions for the AI", value: customInstructions, onChange: setCustomInstructions, placeholder: "Any specific instructions...", type: "textarea" },
  ];

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto pb-12">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-base font-bold text-foreground">AI Personalization</h1>
          <div className="w-9" />
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-5 mt-4">
          {fields.map((field, i) => (
            <div key={i} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{field.label}</label>
              {field.type === "input" ? (
                <Input value={field.value} onChange={e => field.onChange(e.target.value)} placeholder={field.placeholder} className="h-12 rounded-xl" />
              ) : (
                <Textarea value={field.value} onChange={e => field.onChange(e.target.value)} placeholder={field.placeholder} className="rounded-xl min-h-[100px]" />
              )}
            </div>
          ))}

          <button onClick={handleSave} disabled={saving} className="fancy-btn w-full mt-6">
            <span className="fold" />
            <div className="points_wrapper">
              {Array.from({ length: 8 }).map((_, i) => <span key={i} className="point" />)}
            </div>
            <span className="inner flex items-center justify-center gap-2 w-full text-sm font-medium">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AIPersonalizationPage;
