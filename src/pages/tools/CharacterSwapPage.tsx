import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox } from "@/components/ToolPageLayout";

const CharacterSwapPage = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

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
    <ToolPageLayout title="Character Swap" cost={0.5} onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl}>
      <div className="grid grid-cols-2 gap-3">
        <ImageUploadBox label="Your photo" image={sourceImage} onUpload={setSourceImage} onClear={() => setSourceImage(null)} />
        <ImageUploadBox label="Target character" image={targetImage} onUpload={setTargetImage} onClear={() => setTargetImage(null)} />
      </div>
    </ToolPageLayout>
  );
};
export default CharacterSwapPage;
