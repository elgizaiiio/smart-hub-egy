import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { VideoUploadBox } from "@/components/ToolPageLayout";

const AutoCaptionPage = () => {
  const [video, setVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!video) { toast.error("Please upload a video"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", { body: { tool: "auto-caption", video } });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Auto Caption" cost={2} onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl} resultType="video" previewVideo="https://i.top4top.io/m_3736uqhii1.mp4">
      <VideoUploadBox label="Upload video" video={video} onUpload={setVideo} onClear={() => setVideo(null)} />
    </ToolPageLayout>
  );
};
export default AutoCaptionPage;
