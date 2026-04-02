import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox } from "@/components/ToolPageLayout";

const BgRemoverPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!image) { toast.error("Please upload an image"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", { body: { tool: "bg-remover", image } });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Background Remover" cost={0.5} toolId="bg-remover" onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl} autoProcess>
      <ImageUploadBox label="Upload image" image={image} onUpload={(img) => { setImage(img); setTimeout(() => handleGenerate(), 100); }} onClear={() => setImage(null)} />
    </ToolPageLayout>
  );
};
export default BgRemoverPage;
