import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox } from "@/components/ToolPageLayout";

const RetouchingPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!image) { toast.error("Please upload an image"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", { body: { tool: "retouching", image } });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  const handleUpload = (img: string) => {
    setImage(img);
    setTimeout(() => {
      setIsGenerating(true);
      supabase.functions.invoke("image-tools", { body: { tool: "retouching", image: img } })
        .then(({ data, error }) => {
          if (error) { toast.error("Failed"); setIsGenerating(false); return; }
          if (data?.url) setResultUrl(data.url);
          else toast.error(data?.error || "Failed");
          setIsGenerating(false);
        });
    }, 100);
  };

  return (
    <ToolPageLayout title="Retouching" cost={1} toolId="retouching" onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl} autoProcess>
      <ImageUploadBox label="Upload photo to retouch" image={image} onUpload={handleUpload} onClear={() => setImage(null)} />
    </ToolPageLayout>
  );
};
export default RetouchingPage;
