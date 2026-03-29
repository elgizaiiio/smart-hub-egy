import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Sparkles, Upload, Wand2, Eraser, Paintbrush, ArrowUp, Loader2, ImagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; images?: string[]; }

const SYSTEM = `You are Image Genius, a personal image AI agent. Help users with photos:
- Apply creative templates
- Enhance photo quality using AI
- Remove backgrounds
- Apply artistic styles
- Generate creative variations
Ask users to upload their photo first then offer options.
Always respond in the user's language.`;

const TOOLS = [
  { icon: Paintbrush, label: "Templates", desc: "Apply creative templates", action: "Apply a creative template to my photo" },
  { icon: Wand2, label: "Enhance", desc: "Improve quality", action: "Enhance and improve the quality of my photo" },
  { icon: Eraser, label: "Remove BG", desc: "Remove background", action: "Remove the background from my photo" },
  { icon: Sparkles, label: "AI Style", desc: "Transform to art", action: "Transform my photo into an artistic style" },
];

const ImageGeniusPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true); setIsThinking(true);
    let content = "";
    const allMsgs: any[] = [{ role: "user", content: `[System]: ${SYSTEM}` }];
    if (uploadedImage) {
      allMsgs.push({ role: "user", content: [{ type: "image_url", image_url: { url: uploadedImage } }, { type: "text", text: "This is my uploaded photo." }] });
    }
    messages.forEach(m => allMsgs.push({ role: m.role, content: m.content }));
    allMsgs.push({ role: "user", content: text });

    await streamChat({
      messages: allMsgs, model: "google/gemini-3-flash-preview", searchEnabled: false,
      onDelta: (chunk) => { setIsThinking(false); content += chunk; setMessages(prev => { const l = prev[prev.length-1]; if (l?.role === "assistant") return prev.map((m,i) => i===prev.length-1 ? {...m,content} : m); return [...prev, {role:"assistant",content}]; }); },
      onDone: () => { setIsLoading(false); setIsThinking(false); },
      onError: () => { setIsLoading(false); setIsThinking(false); toast.error("Failed"); },
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setUploadedImage(reader.result as string); toast.success("Photo uploaded"); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Image Genius</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm space-y-5 w-full">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"><Sparkles className="w-8 h-8 text-primary" /></div>
              <h2 className="text-lg font-bold text-foreground">Image Genius</h2>

              {/* Upload Area */}
              {!uploadedImage ? (
                <button onClick={() => fileRef.current?.click()} className="w-full py-10 rounded-2xl border-2 border-dashed border-border/50 bg-card/50 hover:border-primary/30 transition-colors flex flex-col items-center gap-3">
                  <ImagePlus className="w-8 h-8 text-muted-foreground/50" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload your photo</p>
                    <p className="text-xs text-muted-foreground">Drag & drop or tap to select</p>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img src={uploadedImage} alt="" className="w-full max-h-48 object-contain rounded-2xl" />
                  <button onClick={() => setUploadedImage(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs">X</button>
                </div>
              )}

              {/* Tools */}
              {uploadedImage && (
                <div className="grid grid-cols-2 gap-2">
                  {TOOLS.map(t => (
                    <button key={t.label} onClick={() => sendMessage(t.action)} className="flex items-center gap-2 py-3 px-3 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors text-left">
                      <t.icon className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {uploadedImage && (
                <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Custom request..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5" style={{ minHeight: "32px" }} />
                  <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                </div>
              )}
            </motion.div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">{msg.content}</div> : <div className="prose-chat text-foreground text-sm" dir="auto"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
          </div>
        ))}
        {isThinking && <ThinkingLoader />}
        <div ref={endRef} />
      </div>
      {hasMessages && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <button onClick={() => fileRef.current?.click()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><Upload className="w-4 h-4" /></button>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="What else?" rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleUpload} />
    </div>
  );
};

export default ImageGeniusPage;
