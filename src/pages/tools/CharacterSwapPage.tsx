import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox, TemplateGrid } from "@/components/ToolPageLayout";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import type { ToolTemplate } from "@/components/ToolPageLayout";

const CharacterSwapPage = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const { templates } = useToolTemplates("character-swap");

  const handleGenerate = async () => {
    if (!sourceImage || !targetImage) { toast.error("Please upload both images"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "character-swap", image: sourceImage, target: targetImage },
      });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Character Swap" cost={0.5} toolId="character-swap" onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl}>
      {!showTemplates ? (
        <ImageUploadBox label="Upload your photo" image={sourceImage} onUpload={(img) => { setSourceImage(img); setShowTemplates(true); }} onClear={() => setSourceImage(null)} />
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-border/30">
            <img src={sourceImage!} alt="" className="w-full h-32 object-cover" />
          </div>
          {templates.length > 0 && (
            <TemplateGrid templates={templates} onSelect={(t) => { if (t.preview_url) setTargetImage(t.preview_url); }} onCustom={() => {}} customLabel="Upload Target" />
          )}
          <ImageUploadBox label="Upload target character" image={targetImage} onUpload={setTargetImage} onClear={() => setTargetImage(null)} />
        </div>
      )}
    </ToolPageLayout>
  );
};
export default CharacterSwapPage;
