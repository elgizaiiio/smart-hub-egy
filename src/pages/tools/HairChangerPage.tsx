import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox, TemplateGrid } from "@/components/ToolPageLayout";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import type { ToolTemplate } from "@/components/ToolPageLayout";

const HairChangerPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ToolTemplate | null>(null);
  const { templates } = useToolTemplates("hair-changer");

  const handleGenerate = async () => {
    if (!image) { toast.error("Please upload a photo"); return; }
    setIsGenerating(true);
    try {
      const prompt = selectedTemplate?.prompt || "Change hairstyle";
      const { data, error } = await supabase.functions.invoke("image-tools", { body: { tool: "hair-changer", image, prompt } });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Hair Changer" cost={1} toolId="hair-changer" onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl}>
      {!showTemplates ? (
        <ImageUploadBox label="Upload your photo" image={image} onUpload={(img) => { setImage(img); setShowTemplates(true); }} onClear={() => setImage(null)} />
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-border/30">
            <img src={image!} alt="" className="w-full h-32 object-cover" />
          </div>
          {templates.length > 0 && (
            <TemplateGrid templates={templates} onSelect={(t) => setSelectedTemplate(t)} onCustom={() => {}} customLabel="Custom Hairstyle" />
          )}
        </div>
      )}
    </ToolPageLayout>
  );
};
export default HairChangerPage;
