import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Upload, User, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import OrbLoader from "@/components/OrbLoader";

interface HeadshotTemplate {
  id: string;
  name: string;
  gender: string;
  prompt: string;
  preview_url: string | null;
}

// Default templates (used when DB is empty)
const DEFAULT_TEMPLATES: HeadshotTemplate[] = [
  { id: "business", name: "Business", gender: "both", prompt: "Professional business headshot portrait, wearing a sharp navy suit, clean studio background, soft directional lighting, high-end corporate photography, 8K resolution", preview_url: null },
  { id: "bw", name: "Black & White", gender: "both", prompt: "Dramatic black and white portrait headshot, high contrast, artistic studio lighting, deep shadows, editorial style photography, 8K resolution", preview_url: null },
  { id: "wedding", name: "Wedding", gender: "both", prompt: "Elegant wedding portrait, romantic soft lighting, beautiful bouquet nearby, dreamy bokeh background, professional wedding photography, 8K", preview_url: null },
  { id: "studio", name: "Studio", gender: "both", prompt: "Clean professional studio portrait, solid color background, perfect three-point lighting, high-end beauty photography, natural skin, 8K", preview_url: null },
  { id: "casual", name: "Casual", gender: "both", prompt: "Casual lifestyle portrait, warm natural golden hour light, outdoor urban setting, relaxed confident expression, editorial fashion photography, 8K", preview_url: null },
  { id: "vintage", name: "Vintage", gender: "both", prompt: "Vintage retro portrait style, warm film grain aesthetic, muted warm tones, classic 1970s photography look, soft analog feeling, 8K", preview_url: null },
];

const HeadshotPage = () => {
  const navigate = useNavigate();
  const [gender, setGender] = useState<"female" | "male">("female");
  const [templates, setTemplates] = useState<HeadshotTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<HeadshotTemplate | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data } = await supabase.from("headshot_templates").select("*").eq("is_active", true).order("display_order");
    if (data && data.length > 0) {
      setTemplates(data as HeadshotTemplate[]);
    }
  };

  const filteredTemplates = templates.filter(t => t.gender === "both" || t.gender === gender);

  const handleTemplateSelect = (template: HeadshotTemplate) => {
    setSelectedTemplate(template);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTemplate) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setUploadedImage(base64);
      await generateHeadshot(base64, selectedTemplate);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const generateHeadshot = async (imageBase64: string, template: HeadshotTemplate) => {
    setIsGenerating(true);
    try {
      const genderPrefix = gender === "male" ? "A handsome man" : "A beautiful woman";
      const fullPrompt = `${genderPrefix}, ${template.prompt}. Keep the exact facial features from the uploaded photo.`;

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: fullPrompt,
          image: imageBase64,
          model: "nano-banana",
          aspectRatio: "2:3",
        },
      });
      if (error) throw error;

      const url = data?.images?.[0] || data?.url;
      if (!url) throw new Error("No image generated");

      // Save to conversations
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: conv } = await supabase.from("conversations").insert({ user_id: user.id, title: `Headshot - ${template.name}`, mode: "images" }).select().single();
        if (conv) {
          await supabase.from("messages").insert([
            { conversation_id: conv.id, role: "user", content: `Headshot: ${template.name}`, images: [imageBase64] },
            { conversation_id: conv.id, role: "assistant", content: template.name, images: [url] },
          ]);
        }
      }

      toast.success("Headshot generated!");
      navigate("/images", { state: { tab: "studio" } });
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setIsGenerating(false);
  };

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <OrbLoader visible={isGenerating} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-foreground flex-1">AI Headshot</h1>
          <button onClick={() => navigate("/images", { state: { tab: "studio" } })} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/50">
            <Clock className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {/* Hero Text */}
          <div className="pt-4 pb-6 text-center">
            <h2 className="text-2xl font-bold text-foreground">Generate your perfect</h2>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">headshots</h2>
            <p className="text-sm text-muted-foreground mt-2">Choose a style and upload your photo</p>
          </div>

          {/* Gender Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setGender("female")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${gender === "female" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}
            >
              <UserRound className="w-4 h-4" /> Female
            </button>
            <button
              onClick={() => setGender("male")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${gender === "male" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}
            >
              <User className="w-4 h-4" /> Male
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredTemplates.map(template => (
              <motion.button
                key={template.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleTemplateSelect(template)}
                className="rounded-2xl overflow-hidden border border-border/20 bg-card text-left"
              >
                {template.preview_url ? (
                  <img src={template.preview_url} alt={template.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-primary/15 to-accent/20 flex items-center justify-center">
                    <UserRound className="w-12 h-12 text-muted-foreground/20" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground">{template.name}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HeadshotPage;
