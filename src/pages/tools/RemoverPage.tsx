import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Paintbrush, Eraser, Upload, Download, RotateCcw, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "upload" | "edit" | "result";
type Tool = "brush" | "eraser";

const RemoverPage = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("upload");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(30);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImage(e.target?.result as string);
      setStage("edit");
      setResultUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      if (e.touches.length > 1) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const draw = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scaledBrush = brushSize * (canvas.width / (containerRef.current?.offsetWidth || canvas.width));
    if (activeTool === "brush") {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
    }
    if (lastPos.current) {
      const dist = Math.sqrt((x - lastPos.current.x) ** 2 + (y - lastPos.current.y) ** 2);
      const steps = Math.max(Math.ceil(dist / (scaledBrush / 4)), 1);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const ix = lastPos.current.x + (x - lastPos.current.x) * t;
        const iy = lastPos.current.y + (y - lastPos.current.y) * t;
        ctx.beginPath();
        ctx.arc(ix, iy, scaledBrush / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPos.current = { x, y };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e && e.touches.length > 1) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = null;
    const coords = getCanvasCoords(e);
    if (coords) draw(coords.x, coords.y);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    if ("touches" in e && e.touches.length > 1) { endDraw(); return; }
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (coords) draw(coords.x, coords.y);
  };

  const endDraw = () => { isDrawing.current = false; lastPos.current = null; };

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getMaskDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    const srcCtx = canvas.getContext("2d");
    if (!srcCtx) return null;
    const imageData = srcCtx.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] > 10) {
        maskData.data[i] = maskData.data[i + 1] = maskData.data[i + 2] = maskData.data[i + 3] = 255;
      }
    }
    ctx.putImageData(maskData, 0, 0);
    return maskCanvas.toDataURL("image/png");
  };

  const handleGenerate = async () => {
    if (!sourceImage) { toast.error("Please upload an image"); return; }
    if (!prompt.trim()) { toast.error("Describe what to remove"); return; }
    setIsGenerating(true);
    try {
      const maskDataUrl = getMaskDataUrl();
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "remover", image: sourceImage, mask: maskDataUrl, prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.url) { setResultUrl(data.url); setStage("result"); }
      else throw new Error(data?.error || "Generation failed");
    } catch (e: any) { toast.error(e.message || "Failed to generate"); }
    finally { setIsGenerating(false); }
  };

  const handleStartOver = () => {
    setStage("upload");
    setSourceImage(null);
    setPrompt("");
    setResultUrl(null);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/10">
        <button onClick={() => navigate("/images")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground">Object Remover</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {stage === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center px-6">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
                className={`w-full max-w-md rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-500 py-20 ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-primary/30 hover:border-primary/60 hover:bg-primary/5"}`}
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Upload className="w-9 h-9 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">UPLOAD YOUR <span className="text-primary">PHOTO</span></h2>
                  <p className="text-sm text-muted-foreground">Mark objects you want to remove</p>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "edit" && sourceImage && (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-4 py-2">
                <div className="flex gap-1.5">
                  <button onClick={() => setActiveTool("brush")} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTool === "brush" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>
                    <Paintbrush className="w-3.5 h-3.5" /> Brush
                  </button>
                  <button onClick={() => setActiveTool("eraser")} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTool === "eraser" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground"}`}>
                    <Eraser className="w-3.5 h-3.5" /> Eraser
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min={5} max={80} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-20 accent-primary" />
                  <button onClick={clearMask} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-accent/40 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-3 pb-2" style={{ touchAction: "pinch-zoom" }}>
                <div ref={containerRef} className="relative rounded-2xl overflow-hidden bg-accent/10 border border-border/10">
                  <img ref={imgRef} src={sourceImage} alt="" className="w-full block" onLoad={setupCanvas} draggable={false} />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ cursor: activeTool === "brush" ? "crosshair" : "cell", touchAction: "none" }}
                    onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {stage === "result" && resultUrl && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
              <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-3">
                <div className="rounded-2xl overflow-hidden border border-border/20">
                  <img src={resultUrl} alt="Result" className="w-full block" />
                </div>
                <a href={resultUrl} download="remover-result.png" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm">
                  <Download className="w-4 h-4" /> Download
                </a>
                <div className="flex gap-2">
                  <button onClick={() => { setStage("edit"); setResultUrl(null); }} className="flex-1 py-3 rounded-xl bg-accent/50 text-foreground text-sm font-medium">Edit Again</button>
                  <button onClick={handleStartOver} className="flex-1 py-3 rounded-xl bg-accent/50 text-foreground text-sm font-medium">Start Over</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {stage === "edit" && (
        <div className="shrink-0 border-t border-border/10 bg-background/90 backdrop-blur-xl px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <p className="text-xs text-center text-muted-foreground mb-2">or</p>
          <div className="rounded-2xl bg-gradient-to-r from-rose-400/15 via-purple-400/15 to-blue-400/15 border border-border/20 p-3">
            <div className="flex items-center gap-2">
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder="Describe what to remove..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50 py-2"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold disabled:opacity-30 transition-all"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  "Generate"
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoverPage;
