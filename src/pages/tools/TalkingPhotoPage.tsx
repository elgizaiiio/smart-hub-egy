import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ToolPageLayout, { ImageUploadBox } from "@/components/ToolPageLayout";
import { Upload, X } from "lucide-react";

const TalkingPhotoPage = () => {
  const [image, setImage] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioName, setAudioName] = useState("");
  const [script, setScript] = useState("");
  const [duration, setDuration] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const cost = duration * 1.5;

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
    if (!image) { toast.error("Please upload a photo"); return; }
    if (!script.trim() && !audioData) { toast.error("Please add a script or audio"); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-tools", {
        body: { tool: "talking-photo", image, audio: audioData, script: script.trim(), duration },
      });
      if (error) throw error;
      if (data?.url) setResultUrl(data.url);
      else throw new Error(data?.error || "Failed");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setIsGenerating(false); }
  };

  return (
    <ToolPageLayout title="Talking Photo" cost={cost} costLabel={`1.5 MC per second · ${cost} MC total`} onGenerate={handleGenerate} isGenerating={isGenerating} resultUrl={resultUrl} resultType="video" previewVideo="https://d.top4top.io/m_373603i1h1.mp4">
      <ImageUploadBox label="Upload photo (required)" image={image} onUpload={setImage} onClear={() => setImage(null)} />
      
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Audio (optional)</p>
        {audioData ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent">
            <span className="text-sm text-foreground flex-1 truncate">{audioName}</span>
            <button onClick={() => { setAudioData(null); setAudioName(""); }} className="text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => audioRef.current?.click()} className="w-full py-3 rounded-xl border-2 border-dashed border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 transition-colors">
            <Upload className="w-4 h-4" /> Upload audio file
          </button>
        )}
        <input ref={audioRef} type="file" className="hidden" accept="audio/*" onChange={handleAudioUpload} />
      </div>

      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Or type a script for the talking photo..."
        className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Duration: {duration}s</p>
        <input type="range" min={3} max={30} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" />
      </div>
    </ToolPageLayout>
  );
};
export default TalkingPhotoPage;
