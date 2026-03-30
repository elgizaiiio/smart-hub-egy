import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Presentation, ArrowUp, Loader2, ChevronLeft, ChevronRight, Download, Plus, X, Check, Image, FileUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SlideData {
  title: string;
  content: string[];
  imageUrl?: string;
  speakerNotes?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  tags: string[];
  style: string;
  color: string;
}

const TEMPLATES: Template[] = [
  { id: "modern-business", name: "Modern Business", description: "Clean professional layout for corporate presentations", thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=225&fit=crop", tags: ["Business", "Professional"], style: "Professional", color: "#1a365d" },
  { id: "tech-startup", name: "Tech Startup", description: "Bold gradients for technology and startup pitches", thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=225&fit=crop", tags: ["Technology", "Startup"], style: "Creative", color: "#6b46c1" },
  { id: "education", name: "Educational", description: "Engaging layouts for lessons and courses", thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop", tags: ["Education", "Learning"], style: "Educational", color: "#2f855a" },
  { id: "marketing", name: "Marketing Strategy", description: "Eye-catching design for marketing campaigns", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop", tags: ["Marketing", "Strategy"], style: "Marketing", color: "#c53030" },
  { id: "minimal", name: "Minimal White", description: "Ultra-clean minimalist design", thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop", tags: ["Minimal", "Clean"], style: "Professional", color: "#1a202c" },
  { id: "creative-portfolio", name: "Creative Portfolio", description: "Showcase your work with style", thumbnail: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=225&fit=crop", tags: ["Creative", "Portfolio"], style: "Creative", color: "#dd6b20" },
  { id: "science", name: "Science & Research", description: "Data-driven layouts for research presentations", thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=225&fit=crop", tags: ["Science", "Research"], style: "Educational", color: "#2b6cb0" },
  { id: "sales-pitch", name: "Sales Pitch", description: "Convert prospects with compelling slides", thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop", tags: ["Sales", "Business"], style: "Marketing", color: "#38a169" },
  { id: "dark-modern", name: "Dark Modern", description: "Sleek dark theme for impactful presentations", thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop", tags: ["Dark", "Modern"], style: "Creative", color: "#171923" },
  { id: "project-report", name: "Project Report", description: "Structured layout for project status reports", thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=225&fit=crop", tags: ["Report", "Business"], style: "Professional", color: "#2d3748" },
];

const SLIDE_COUNTS = [5, 8, 10, 15, 20];
const PLACEHOLDERS = [
  "AI revolution in healthcare...",
  "Q4 Sales Report for stakeholders...",
  "Introduction to Machine Learning...",
  "Marketing strategy for 2026...",
  "Startup pitch deck for investors...",
];

const SlidesAgentPage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [slideCount, setSlideCount] = useState(10);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSlideCountMenu, setShowSlideCountMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{name: string; type: string; data: string}[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [tab, setTab] = useState("explore");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isGenerating) { setProgress(0); setProgressText(""); return; }
    const steps = [
      { text: "Analyzing topic...", pct: 10 },
      { text: "Generating content...", pct: 30 },
      { text: "Creating slide layouts...", pct: 50 },
      { text: "Generating images...", pct: 70 },
      { text: "Assembling presentation...", pct: 90 },
    ];
    let i = 0;
    setProgressText(steps[0].text);
    setProgress(steps[0].pct);
    const interval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      setProgressText(steps[i].text);
      setProgress(steps[i].pct);
    }, 3000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setAttachedFiles(prev => [...prev, { name: file.name, type: "image", data: reader.result as string }]);
        reader.readAsDataURL(file);
      } else {
        file.text().then(text => {
          setAttachedFiles(prev => [...prev, { name: file.name, type: "file", data: text.slice(0, 8000) }]);
        });
      }
    });
    e.target.value = "";
    setShowAttachMenu(false);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setSlides([]);
    setCurrentSlide(0);

    try {
      const body: any = { topic: input, style: "Professional", slideCount, templateId: selectedTemplate?.id };
      if (attachedFiles.length > 0) {
        body.attachments = attachedFiles.map(f => ({ name: f.name, type: f.type, data: f.data.slice(0, 4000) }));
      }
      const { data, error } = await supabase.functions.invoke("generate-slides", { body });

      if (error) {
        if ((error as any).status === 429) { toast.error("Rate limit exceeded. Please try again later."); return; }
        if ((error as any).status === 402) { toast.error("Insufficient credits. Please add funds."); return; }
        throw error;
      }
      if (data?.slides) {
        setSlides(data.slides);
        setProgress(100);
        setProgressText("Done!");
        setAttachedFiles([]);
        toast.success(`${data.slides.length} slides created!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate slides");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPPTX = async () => {
    if (slides.length === 0) return;
    toast.info("Preparing download...");
    try {
      const pptxgenjs = (await import("pptxgenjs")).default;
      const pres = new pptxgenjs();
      pres.layout = "LAYOUT_WIDE";
      for (const slide of slides) {
        const s = pres.addSlide();
        s.addText(slide.title, { x: 0.5, y: 0.3, w: "90%", fontSize: 28, bold: true, color: "1a202c" });
        const bullets = slide.content.map(c => ({ text: c, options: { fontSize: 16, color: "4a5568", bullet: true } }));
        s.addText(bullets, { x: 0.5, y: 1.5, w: "55%", h: 4 });
        if (slide.imageUrl) { try { s.addImage({ path: slide.imageUrl, x: 6.5, y: 1.2, w: 5.5, h: 4 }); } catch {} }
        if (slide.speakerNotes) s.addNotes(slide.speakerNotes);
      }
      await pres.writeFile({ fileName: `${input.slice(0, 30).replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, "")}_slides.pptx` });
      toast.success("Downloaded!");
    } catch { toast.error("Download failed."); }
  };

  // ─── SLIDES PREVIEW VIEW ───
  if (slides.length > 0) {
    const slide = slides[currentSlide];
    return (
      <div className="h-[100dvh] flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-border/20">
          <button onClick={() => setSlides([])} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{input.slice(0, 25)}...</span>
          </div>
          <button onClick={handleDownloadPPTX} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            <Download className="w-3.5 h-3.5" />
            PPTX
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={currentSlide} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-2xl aspect-[16/9] bg-card rounded-2xl border border-border/30 shadow-xl overflow-hidden flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">{slide.title}</h2>
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 space-y-2">
                    {slide.content.map((point, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <p className="text-sm text-muted-foreground">{point}</p>
                      </div>
                    ))}
                  </div>
                  {slide.imageUrl && (
                    <div className="w-2/5 rounded-xl overflow-hidden bg-muted">
                      <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-3 border-t border-border/20 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{currentSlide + 1} / {slides.length}</span>
                <span className="text-[10px] text-muted-foreground/40">Powered by Lovable AI</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-4 px-4 py-4 shrink-0">
          <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center disabled:opacity-30">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? "bg-primary" : "bg-muted-foreground/30"}`} />
            ))}
          </div>
          <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center disabled:opacity-30">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {slide.speakerNotes && (
          <div className="px-4 pb-4">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/20">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Speaker Notes</p>
              <p className="text-xs text-muted-foreground">{slide.speakerNotes}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── GENERATION LOADING VIEW ───
  if (isGenerating) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">Creating Your Slides</h3>
            <p className="text-sm text-muted-foreground">{progressText}</p>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{slideCount} slides</p>
          <p className="text-[10px] text-muted-foreground/40">Powered by Lovable AI</p>
        </motion.div>
      </div>
    );
  }

  // ─── MAIN CREATE VIEW ───
  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header - back button only */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">AI Slides</h1>
        </div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">1 MC / 10 slides</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Title */}
        <div className="text-center mb-4 mt-2">
          <h2 className="text-lg font-bold text-foreground">Ready to create your slides?</h2>
        </div>

        {/* Slide count selector */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="relative">
            <button onClick={() => setShowSlideCountMenu(!showSlideCountMenu)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/30 text-xs text-muted-foreground">
              {slideCount} slides
              <ChevronLeft className={`w-3 h-3 transition-transform ${showSlideCountMenu ? "rotate-90" : "-rotate-90"}`} />
            </button>
            <AnimatePresence>
              {showSlideCountMenu && (
                <>
                  <div className="fixed inset-0 z-[45]" onClick={() => setShowSlideCountMenu(false)} />
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full mt-1 left-0 z-[46] rounded-xl border border-border/30 bg-black/80 backdrop-blur-2xl p-1.5 shadow-xl">
                    {SLIDE_COUNTS.map(n => (
                      <button key={n} onClick={() => { setSlideCount(n); setShowSlideCountMenu(false); }} className={`w-full px-4 py-2 rounded-lg text-xs text-left transition-colors ${slideCount === n ? "bg-primary/15 text-primary" : "text-white/70 hover:bg-white/5"}`}>{n} slides</button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input */}
        <div className="mb-5">
          {/* Attached files */}
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground border border-border shrink-0">
                  {f.type === "image" ? <img src={f.data} alt="" className="w-8 h-8 rounded object-cover" /> : <FileUp className="w-3 h-3" />}
                  <span className="truncate max-w-[100px]">{f.name}</span>
                  <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl bg-secondary/40 border border-border/30 p-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="relative">
                <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showAttachMenu && (
                    <>
                      <div className="fixed inset-0 z-[45]" onClick={() => setShowAttachMenu(false)} />
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-full mb-2 left-0 z-[46] rounded-xl border border-border/30 bg-black/80 backdrop-blur-2xl p-2 shadow-xl w-40">
                        <button onClick={() => imageInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/80 hover:bg-white/5 transition-colors">
                          <Image className="w-4 h-4 text-white/50" />
                          Images
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/80 hover:bg-white/5 transition-colors">
                          <FileUp className="w-4 h-4 text-white/50" />
                          Files
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={handleGenerate} disabled={!input.trim()} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity">
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected template badge */}
        {selectedTemplate && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
            <Check className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-medium">{selectedTemplate.name}</span>
            <button onClick={() => setSelectedTemplate(null)} className="ml-auto"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
          </div>
        )}

        {/* Templates Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full bg-secondary/30 rounded-xl p-0.5">
            <TabsTrigger value="explore" className="flex-1 rounded-lg text-xs data-[state=active]:bg-background">Explore</TabsTrigger>
            <TabsTrigger value="my" className="flex-1 rounded-lg text-xs data-[state=active]:bg-background">My Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="mt-3">
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`relative aspect-[16/10] rounded-2xl overflow-hidden border-2 transition-colors group ${selectedTemplate?.id === t.id ? "border-primary" : "border-border/20 hover:border-border/50"}`}
                >
                  <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-[11px] font-semibold text-white">{t.name}</p>
                    <div className="flex gap-1 mt-1">
                      {t.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/80">{tag}</span>
                      ))}
                    </div>
                  </div>
                  {selectedTemplate?.id === t.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my" className="mt-3">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Presentation className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No saved templates yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Your generated presentations will appear here</p>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-center text-[10px] text-muted-foreground/40 mt-6">Powered by Lovable AI</p>
      </div>

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.md,.csv,.json,.doc,.docx,.pptx,.xlsx" multiple />
      <input ref={imageInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*" multiple />
    </div>
  );
};

export default SlidesAgentPage;
