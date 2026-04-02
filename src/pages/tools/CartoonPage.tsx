import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox, TemplateGrid } from "@/components/ToolPageLayout";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import type { ToolTemplate } from "@/components/ToolPageLayout";

const CartoonPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ToolTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const { templates } = useToolTemplates("cartoon");

  const handleGenerate = async () => {
    if (!image) { toast.error("Please upload a photo"); return; }
    setIsGenerating(true);
    try {
      const prompt = selectedTemplate?.prompt || customPrompt || "Cartoonify this photo";
      const { data, error } = await supabase.functions.invoke("image-tools", { body: { tool: "cartoon", image, prompt } });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Cartoon" cost={1} toolId="cartoon" onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl}>
      {!showTemplates ? (
        <ImageUploadBox label="Upload photo to cartoonify" image={image} onUpload={(img) => { setImage(img); setShowTemplates(true); }} onClear={() => setImage(null)} />
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-border/30">
            <img src={image!} alt="" className="w-full h-32 object-cover" />
          </div>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe the cartoon style you want..."
            className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {templates.length > 0 && (
            <TemplateGrid templates={templates} onSelect={(t) => setSelectedTemplate(t)} />
          )}
        </div>
      )}
    </ToolPageLayout>
  );
};
export default CartoonPage;
