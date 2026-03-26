import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox } from "@/components/ToolPageLayout";

const InpaintPage = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!sourceImage) { toast.error("Please upload a source image"); return; }
    if (!prompt.trim()) { toast.error("Please describe what to change"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "inpaint", image: sourceImage, mask: maskImage, prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Generation failed");
    } catch (e: any) { toast.error(e.message || "Failed to generate"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Inpaint" cost={1} onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl} previewVideo="https://e.top4top.io/m_37367n7oz1.mp4">
      <ImageUploadBox label="Upload source image" image={sourceImage} onUpload={setSourceImage} onClear={() => setSourceImage(null)} />
      <ImageUploadBox label="Upload mask (optional)" image={maskImage} onUpload={setMaskImage} onClear={() => setMaskImage(null)} />
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what to change in the image..."
        className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </ToolPageLayout>
  );
};
export default InpaintPage;
