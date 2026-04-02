import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, User, UserRound, Sparkles, Download, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import { useCredits } from "@/hooks/useCredits";
import { ImageUploadBox } from "@/components/ToolPageLayout";

interface HeadshotTemplate {
  id: string;
  name: string;
  gender: string;
  prompt: string;
  preview_url: string | null;
}

const DEFAULT_TEMPLATES: HeadshotTemplate[] = [
  { id: "business", name: "Business", gender: "both", prompt: "Professional business headshot portrait, wearing a sharp navy suit, clean studio background, soft directional lighting, high-end corporate photography, 8K resolution", preview_url: null },
  { id: "bw", name: "Black & White", gender: "both", prompt: "Dramatic black and white portrait headshot, high contrast, artistic studio lighting, deep shadows, editorial style photography, 8K resolution", preview_url: null },
  { id: "wedding", name: "Wedding", gender: "both", prompt: "Elegant wedding portrait, romantic soft lighting, beautiful bouquet nearby, dreamy bokeh background, professional wedding photography, 8K", preview_url: null },
  { id: "studio", name: "Studio", gender: "both", prompt: "Clean professional studio portrait, solid color background, perfect three-point lighting, high-end beauty photography, natural skin, 8K", preview_url: null },
  { id: "casual", name: "Casual", gender: "both", prompt: "Casual lifestyle portrait, warm natural golden hour light, outdoor urban setting, relaxed confident expression, editorial fashion photography, 8K", preview_url: null },
  { id: "vintage", name: "Vintage", gender: "both", prompt: "Vintage retro portrait style, warm film grain aesthetic, muted warm tones, classic 1970s photography look, soft analog feeling, 8K", preview_url: null },
];

type Step = "browse" | "upload" | "generating" | "result";

const HeadshotPage = () => {
  const navigate = useNavigate();
  const { hasEnoughCredits } = useCredits();
  const [gender, setGender] = useState<"female" | "male">("female");
  const [templates, setTemplates] = useState<HeadshotTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<HeadshotTemplate | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("browse");
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    const { data } = await supabase.from("headshot_templates").select("*").eq("is_active", true).order("display_order");
    if (data && data.length > 0) setTemplates(data as HeadshotTemplate[]);
  };

  const filteredTemplates = templates.filter(t => t.gender === "both" || t.gender === gender);

  const handleTemplateSelect = (template: HeadshotTemplate) => {
    setSelectedTemplate(template);
    setStep("upload");
  };

  const handleImageUpload = (img: string) => {
    setUploadedImage(img);
  };

  const generateHeadshot = async () => {
    if (!uploadedImage || !selectedTemplate) return;
    if (!hasEnoughCredits(1)) { toast.error("Insufficient MC"); navigate("/pricing"); return; }
    setStep("generating");
    try {
      const genderPrefix = gender === "male" ? "A handsome man" : "A beautiful woman";
      const fullPrompt = `${genderPrefix}, ${selectedTemplate.prompt}. Keep the exact facial features from the uploaded photo.`;
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: fullPrompt, image: uploadedImage, model: "nano-banana", aspectRatio: "2:3" },
      });
      if (error) throw error;
      const url = data?.images?.[0] || data?.url;
      if (!url) throw new Error("No image generated");

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: conv } = await supabase.from("conversations").insert({ user_id: user.id, title: `Headshot - ${selectedTemplate.name}`, mode: "images" }).select().single();
        if (conv) {
          await supabase.from("messages").insert([
            { conversation_id: conv.id, role: "user", content: `Headshot: ${selectedTemplate.name}`, images: [uploadedImage] },
            { conversation_id: conv.id, role: "assistant", content: selectedTemplate.name, images: [url] },
          ]);
        }
      }

      setResultUrl(url);
      setStep("result");
      toast.success("Headshot generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStep("upload");
    }
  };

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
          <button onClick={() => step === "browse" ? navigate(-1) : setStep("browse")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-foreground flex-1">AI Headshot</h1>
          <button onClick={() => navigate("/images", { state: { tab: "studio" } })} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/50">
            <Clock className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-32">
          {step === "browse" && (
            <>
              <div className="pt-4 pb-6 text-center">
                <h2 className="text-2xl font-bold text-foreground">Generate your perfect</h2>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">headshots</h2>
                <p className="text-sm text-muted-foreground mt-2">Choose a style and upload your photo</p>
              </div>

              <div className="flex gap-2 mb-6">
                <button onClick={() => setGender("female")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${gender === "female" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>
                  <UserRound className="w-4 h-4" /> Female
                </button>
                <button onClick={() => setGender("male")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${gender === "male" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>
                  <User className="w-4 h-4" /> Male
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map(template => (
                  <motion.button key={template.id} whileTap={{ scale: 0.97 }} onClick={() => handleTemplateSelect(template)} className="rounded-2xl overflow-hidden border border-border/20 bg-card text-left">
                    {template.preview_url ? (
                      <img src={template.preview_url} alt={template.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-primary/15 to-accent/20 flex items-center justify-center">
                        <UserRound className="w-12 h-12 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="p-3"><p className="text-sm font-semibold text-foreground">{template.name}</p></div>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {step === "upload" && (
            <div className="pt-4 space-y-4">
              <div className="rounded-xl bg-accent/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Style: <span className="text-foreground font-medium">{selectedTemplate?.name}</span></p>
              </div>
              <ImageUploadBox label="Upload your photo" image={uploadedImage} onUpload={handleImageUpload} onClear={() => setUploadedImage(null)} />
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
              <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }} className="relative">
                <Sparkles className="w-12 h-12 text-yellow-400" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 blur-xl bg-yellow-400/30 rounded-full" />
              </motion.div>
              <p className="text-sm text-muted-foreground animate-pulse">Generating your headshot...</p>
            </div>
          )}

          {step === "result" && resultUrl && (
            <div className="pt-4 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-border/20">
                <img src={resultUrl} alt="Result" className="w-full" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { const a = document.createElement("a"); a.href = resultUrl; a.download = "headshot.png"; a.target = "_blank"; a.click(); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button onClick={() => { navigator.share?.({ url: resultUrl }).catch(() => { navigator.clipboard.writeText(resultUrl); toast.success("Link copied!"); }); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-foreground font-medium text-sm">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
              <button onClick={() => { setStep("browse"); setResultUrl(null); setUploadedImage(null); setSelectedTemplate(null); }} className="w-full py-3 rounded-2xl bg-accent/50 text-foreground text-sm font-medium">Try Again</button>
            </div>
          )}
        </div>

        {/* Yellow Generate Button - only in upload step with image */}
        {step === "upload" && uploadedImage && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <motion.button whileTap={{ scale: 0.97 }} onClick={generateHeadshot} className="w-full py-3.5 rounded-2xl bg-yellow-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20">
              Generate · 1 MC
            </motion.button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default HeadshotPage;
