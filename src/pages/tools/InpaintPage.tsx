import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Paintbrush, Eraser, Upload, ImagePlus, Download, RotateCcw, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "upload" | "edit" | "result";
type Tool = "brush" | "eraser";

const InpaintPage = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("upload");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
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
  const refInputRef = useRef<HTMLInputElement>(null);
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

  const handleRefUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setRefImage(e.target?.result as string);
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
      if (e.touches.length > 1) return null; // allow pinch zoom
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
      ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
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
    if ("touches" in e && e.touches.length > 1) return; // pinch = no draw
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
    if (!prompt.trim()) { toast.error("Describe what to change"); return; }
    setIsGenerating(true);
    try {
      const maskDataUrl = getMaskDataUrl();
      const { data, error } = await supabase.functions.invoke("image-tools", {
        body: { tool: "inpaint", image: sourceImage, mask: maskDataUrl, referenceImage: refImage, prompt: prompt.trim() },
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
    setRefImage(null);
    setPrompt("");
    setResultUrl(null);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/10">
        <button onClick={() => navigate("/images")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground">Inpaint</h1>
        <div className="w-9" />
      </div>

      {/* Main content - fills between header and input */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* UPLOAD STAGE */}
          {stage === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center px-6">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
                className={`w-full max-w-md rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-500 py-20 ${
                  isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-primary/30 hover:border-primary/60 hover:bg-primary/5"
                }`}
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Upload className="w-9 h-9 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    UPLOAD YOUR <span className="text-primary">PHOTO</span>
                  </h2>
                  <p className="text-sm text-muted-foreground">Drag & drop or tap to select</p>
                  <p className="text-xs text-muted-foreground/60">Paint over areas you want to edit</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* EDIT STAGE */}
          {stage === "edit" && sourceImage && (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
              {/* Tools bar */}
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

              {/* Image + Canvas - fills remaining space, pinch zoom allowed */}
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

                {/* Ref image row */}
                {refImage && (
                  <div className="flex items-center gap-3 mt-2 px-1">
                    <img src={refImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <p className="text-xs text-muted-foreground flex-1">Reference attached</p>
                    <button onClick={() => setRefImage(null)} className="text-xs text-destructive">Remove</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* RESULT STAGE */}
          {stage === "result" && resultUrl && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
              <div className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-3">
                <div className="rounded-2xl overflow-hidden border border-border/20">
                  <img src={resultUrl} alt="Result" className="w-full block" />
                </div>
                <a href={resultUrl} download="inpaint-result.png" target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all">
                  <Download className="w-4 h-4" /> Download
                </a>
                <div className="flex gap-2">
                  <button onClick={() => { setStage("edit"); setResultUrl(null); }} className="flex-1 py-3 rounded-xl bg-accent/50 text-foreground text-sm font-medium hover:bg-accent transition-colors">Edit Again</button>
                  <button onClick={handleStartOver} className="flex-1 py-3 rounded-xl bg-accent/50 text-foreground text-sm font-medium hover:bg-accent transition-colors">Start Over</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom input bar - chat style */}
      {stage === "edit" && (
        <div className="shrink-0 border-t border-border/10 bg-background/90 backdrop-blur-xl px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex items-end gap-2 rounded-2xl border border-border/30 bg-card/50 px-3 py-2.5">
            {/* Attach ref image */}
            <input ref={refInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleRefUpload(e.target.files[0]); }} />
            <button onClick={() => refInputRef.current?.click()} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors" title="Attach reference image">
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleTextareaChange}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder="Describe what to change..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 py-2 max-h-[120px]"
              style={{ minHeight: "40px" }}
            />

            {/* Credits badge */}
            <span className="shrink-0 text-[10px] text-muted-foreground/60 self-center mr-1">1 MC</span>

            {/* Send button - no icon, just arrow via CSS or minimal */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-all"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InpaintPage;
