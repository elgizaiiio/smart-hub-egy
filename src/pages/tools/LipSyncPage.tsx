import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { VideoUploadBox } from "@/components/ToolPageLayout";
import { Upload, X } from "lucide-react";

const LipSyncPage = () => {
  const [video, setVideo] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioName, setAudioName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioName(file.name);
    const reader = new FileReader();
    reader.onload = () => setAudioData(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!video || !audioData) { toast.error("Please upload both video and audio"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: { tool: "lip-sync", video, audio: audioData },
      });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Lip Sync" cost={6} costLabel="6 MC per minute" onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl} resultType="video" previewVideo="https://d.top4top.io/m_373603i1h1.mp4">
      <VideoUploadBox label="Upload video" video={video} onUpload={setVideo} onClear={() => setVideo(null)} />
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Audio</p>
        {audioData ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent">
            <span className="text-sm text-foreground flex-1 truncate">{audioName}</span>
            <button onClick={() => { setAudioData(null); setAudioName(""); }}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        ) : (
          <button onClick={() => audioRef.current?.click()} className="w-full py-3 rounded-xl border-2 border-dashed border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50">
            <Upload className="w-4 h-4" /> Upload audio
          </button>
        )}
        <input ref={audioRef} type="file" className="hidden" accept="audio/*" onChange={handleAudioUpload} />
      </div>
    </ToolPageLayout>
  );
};
export default LipSyncPage;
