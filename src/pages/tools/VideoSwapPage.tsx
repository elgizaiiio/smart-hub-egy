import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { VideoUploadBox, ImageUploadBox } from "@/components/ToolPageLayout";

const VideoSwapPage = () => {
  const [video, setVideo] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const cost = resolution === '720p' ? 4 : 5.5;

  const handleGenerate = async () => {
    if (!video || !faceImage) { toast.error("Please upload both video and face image"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: { tool: "swap-characters", video, image: faceImage, resolution },
      });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Swap Characters" cost={cost} costLabel="720p: 4 MC | 1080p: 5.5 MC" toolId="swap-characters" onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl} resultType="video">
      <VideoUploadBox label="Upload video" video={video} onUpload={setVideo} onClear={() => setVideo(null)} />
      <ImageUploadBox label="Upload face image" image={faceImage} onUpload={setFaceImage} onClear={() => setFaceImage(null)} />
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Resolution</p>
        <div className="flex gap-2">
          {(['720p', '1080p'] as const).map(r => (
            <button key={r} onClick={() => setResolution(r)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${resolution === r ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'}`}>{r}</button>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
};
export default VideoSwapPage;
