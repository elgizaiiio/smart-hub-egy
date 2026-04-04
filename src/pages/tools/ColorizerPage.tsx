import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox } from "@/components/ToolPageLayout";

const ColorizerPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!image) { toast.error("Please upload an image"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", { body: { tool: "colorizer", image } });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  const handleFileSelected = (dataUrl: string) => {
    setImage(dataUrl);
    // Auto-process after file selected from landing
    setTimeout(() => {
      setIsGenerating(true);
      supabase.functions.invoke("image-tools", { body: { tool: "colorizer", image: dataUrl } })
        .then(({ data, error }) => {
          if (error) { toast.error("Failed"); setIsGenerating(false); return; }
          if (data?.url) setResultUrl(data.url);
          else toast.error(data?.error || "Failed");
          setIsGenerating(false);
        });
    }, 100);
  };

  return (
    <ToolPageLayout title="Image Colorizer" cost={1} toolId="colorizer" onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl} autoProcess onFileSelected={handleFileSelected}>
      <ImageUploadBox label="Upload B&W image to colorize" image={image} onUpload={handleFileSelected} onClear={() => setImage(null)} />
    </ToolPageLayout>
  );
};
export default ColorizerPage;
