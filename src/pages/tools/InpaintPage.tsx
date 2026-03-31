import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Paintbrush, Eraser, Upload, ImagePlus, Download, RotateCcw, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "upload" | "edit" | "result";
type Tool = "brush" | "eraser";

const InpaintPage = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("upload");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
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

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    setSourceFile(file);
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
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
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

    ctx.beginPath();
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
      ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPos.current = { x, y };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = null;
    const coords = getCanvasCoords(e);
    if (coords) draw(coords.x, coords.y);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (coords) draw(coords.x, coords.y);
  };

  const endDraw = () => {
    isDrawing.current = false;
    lastPos.current = null;
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
        maskData.data[i] = 255;
        maskData.data[i + 1] = 255;
        maskData.data[i + 2] = 255;
        maskData.data[i + 3] = 255;
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
        body: {
          tool: "inpaint",
          image: sourceImage,
          mask: maskDataUrl,
          referenceImage: refImage,
          prompt: prompt.trim(),
        },
      });
      if (error) throw error;
      if (data?.url) {
        setResultUrl(data.url);
        setStage("result");
      } else throw new Error(data?.error || "Generation failed");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setStage("upload");
    setSourceImage(null);
    setSourceFile(null);
    setRefImage(null);
    setPrompt("");
    setResultUrl(null);
  };

  const handleEditAgain = () => {
    setStage("edit");
    setResultUrl(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/10">
        <button onClick={() => navigate("/images")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground">Inpaint</h1>
        <span className="text-xs text-muted-foreground bg-accent/40 px-2.5 py-1 rounded-full">1 MC</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* UPLOAD STAGE */}
          {stage === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center justify-center px-6 py-16">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
                className={`w-full max-w-sm aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-primary/30 hover:border-primary/60 hover:bg-primary/5"
                }`}
                style={{
                  animation: "inpaint-border-dash 12s linear infinite",
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">Upload Your Photo</p>
                  <p className="text-xs text-muted-foreground mt-1">Drag & drop or tap to select</p>
                </div>
              </div>
              <style>{`
                @keyframes inpaint-border-dash {
                  0% { border-color: hsl(var(--primary) / 0.3); }
                  50% { border-color: hsl(var(--primary) / 0.7); }
                  100% { border-color: hsl(var(--primary) / 0.3); }
                }
              `}</style>
            </motion.div>
          )}

          {/* EDIT STAGE */}
          {stage === "edit" && sourceImage && (
            <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-4 py-4 space-y-4">
              {/* Tools bar */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTool("brush")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTool === "brush" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Paintbrush className="w-4 h-4" /> Brush
                  </button>
                  <button
                    onClick={() => setActiveTool("eraser")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTool === "eraser" ? "bg-primary text-primary-foreground" : "bg-accent/40 text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Eraser className="w-4 h-4" /> Eraser
                  </button>
                </div>
                <button onClick={handleStartOver} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              {/* Brush size */}
              <div className="flex items-center gap-3 px-1">
                <span className="text-xs text-muted-foreground">Size</span>
                <input type="range" min={5} max={80} value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="flex-1 accent-primary" />
                <span className="text-xs text-muted-foreground w-6 text-right">{brushSize}</span>
              </div>

              {/* Canvas area */}
              <div ref={containerRef} className="relative rounded-2xl overflow-hidden bg-accent/20 border border-border/20">
                <img
                  ref={imgRef}
                  src={sourceImage}
                  alt=""
                  className="w-full block"
                  onLoad={setupCanvas}
                  draggable={false}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full touch-none"
                  style={{ cursor: activeTool === "brush" ? "crosshair" : "cell" }}
                  onMouseDown={startDraw}
                  onMouseMove={moveDraw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={moveDraw}
                  onTouchEnd={endDraw}
                />
              </div>

              {/* Reference image */}
              <div>
                <input ref={refInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleRefUpload(e.target.files[0]); }} />
                {refImage ? (
                  <div className="flex items-center gap-3">
                    <img src={refImage} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Reference image attached</p>
                    </div>
                    <button onClick={() => setRefImage(null)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                ) : (
                  <button onClick={() => refInputRef.current?.click()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ImagePlus className="w-4 h-4" />
                    Add reference image (optional)
                  </button>
                )}
              </div>

              {/* Prompt + Generate */}
              <div className="space-y-3">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe what to change... e.g. 'Remove this person' or 'Replace with a tree'"
                  className="w-full rounded-2xl border border-border/30 bg-card/50 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
              </div>
            </motion.div>
          )}

          {/* RESULT STAGE */}
          {stage === "result" && resultUrl && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-4 py-4 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-border/20">
                <img src={resultUrl} alt="Result" className="w-full block" />
              </div>
              <a
                href={resultUrl}
                download="inpaint-result.png"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
              >
                <Download className="w-4 h-4" /> Download
              </a>
              <div className="flex gap-2">
                <button onClick={handleEditAgain} className="flex-1 py-3 rounded-xl bg-accent/50 text-foreground text-sm font-medium hover:bg-accent transition-colors">
                  Edit Again
                </button>
                <button onClick={handleStartOver} className="flex-1 py-3 rounded-xl bg-accent/50 text-foreground text-sm font-medium hover:bg-accent transition-colors">
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InpaintPage;
