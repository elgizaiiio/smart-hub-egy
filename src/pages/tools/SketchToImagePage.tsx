import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox } from "@/components/ToolPageLayout";

const SketchToImagePage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!image) { toast.error("Please upload a sketch"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", { body: { tool: "sketch-to-image", image } });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Sketch to Image" cost={1} onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl}>
      <ImageUploadBox label="Upload your sketch" image={image} onUpload={setImage} onClear={() => setImage(null)} />
    </ToolPageLayout>
  );
};
export default SketchToImagePage;
