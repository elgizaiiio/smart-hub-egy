import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Menu, Plus, X, GraduationCap, Wrench, ArrowUp, Square,
  NotebookPen, ClipboardList, CalendarDays, Timer, Image as ImageIcon, FileUp, Camera,
  Sparkles, BookOpen, Brain, Target,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ChatMessage from "@/components/ChatMessage";
import ThinkingLoader from "@/components/ThinkingLoader";
import { streamChat } from "@/lib/streamChat";

interface Message {
  role: "user" | "assistant";
  content: string;
  attachedImages?: string[];
  attachedFiles?: { name: string; type: string }[];
}

const LEARNING_PROMPT =
  "You are in Learning Mode using the Feynman technique. Break complex topics into simple steps with analogies, examples, and clear structure. Use bullet points, numbered lists, and a teacher-like tone. Adapt difficulty to the user's level. Always end with a quick recap.";

const STUDY_TOOLS = [
  { id: "smart-notes", label: "Smart Notes", icon: NotebookPen, route: "/tools/smart-notes", color: "from-emerald-400 to-teal-500" },
  { id: "exam", label: "Exam Simulator", icon: ClipboardList, route: "/tools/exam-simulator", color: "from-violet-400 to-purple-500" },
  { id: "planner", label: "Study Planner", icon: CalendarDays, route: "/tools/study-planner", color: "from-amber-400 to-orange-500" },
  { id: "focus", label: "Focus Room", icon: Timer, route: "/tools/focus-room", color: "from-rose-400 to-pink-500" },
];

const QUICK_PROMPTS = [
  { icon: Brain, text: "اشرح لي مفهوم صعب بطريقة بسيطة", color: "text-emerald-400" },
  { icon: Target, text: "ساعدني أركز على نقاط ضعفي", color: "text-violet-400" },
  { icon: BookOpen, text: "لخص لي درس أو موضوع", color: "text-amber-400" },
  { icon: Sparkles, text: "اعمل لي خطة مذاكرة لليوم", color: "text-rose-400" },
];

const LearningModePage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleFile = useCallback((files: FileList | null, kind: "image" | "file") => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} > 20MB`); return; }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles((prev) => [...prev, { name: f.name, type: kind === "image" ? "image" : f.type || "file", data: reader.result as string }]);
      };
      reader.readAsDataURL(f);
    });
    setPlusOpen(false);
  }, []);

  const send = useCallback(async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: input.trim() || "(ملفات مرفقة)",
      attachedImages: attachedFiles.filter(f => f.type === "image").map(f => f.data),
      attachedFiles: attachedFiles.filter(f => f.type !== "image").map(f => ({ name: f.name, type: f.type })),
    };
    setMessages((m) => [...m, userMsg]);
    const sentInput = input;
    setInput("");
    const sentFiles = [...attachedFiles];
    setAttachedFiles([]);
    setIsThinking(true);
    setIsLoading(true);

    const ac = new AbortController();
    abortRef.current = ac;

    const apiMessages = [
      { role: "assistant" as const, content: LEARNING_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      {
        role: "user" as const,
        content: sentFiles.filter(f => f.type === "image").length > 0
          ? [
              { type: "text", text: sentInput || "حلل الصورة" },
              ...sentFiles.filter(f => f.type === "image").map(f => ({ type: "image_url", image_url: { url: f.data } })),
            ]
          : sentInput,
      },
    ];

    let assistantBuf = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    await streamChat({
      messages: apiMessages as any,
      model: "google/gemini-2.5-flash-lite-preview-09-2025",
      chatMode: "learning",
      user_id: userId ?? undefined,
      signal: ac.signal,
      onDelta: (d) => {
        if (isThinking) setIsThinking(false);
        assistantBuf += d;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: assistantBuf };
          return copy;
        });
      },
      onDone: () => { setIsLoading(false); setIsThinking(false); abortRef.current = null; },
      onError: (e) => { toast.error(e); setIsLoading(false); setIsThinking(false); },
    });
  }, [input, attachedFiles, isLoading, messages, userId, isThinking]);

  const stop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setIsThinking(false);
  };

  const useQuick = (text: string) => { setInput(text); textareaRef.current?.focus(); };

  return (
    <AppLayout>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => navigate("/")} />

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFile(e.target.files, "file")} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFile(e.target.files, "image")} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files, "image")} />

      <div className="relative min-h-screen overflow-hidden bg-background">
        {/* Animated landing-style background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" />
          <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-violet-500/15 blur-[140px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-amber-400/10 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        {/* iOS 26 floating header */}
        <header className="sticky top-0 z-40 px-3 pt-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between rounded-full border border-white/10 bg-background/40 px-4 py-2.5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <button onClick={() => setSidebarOpen(true)} className="rounded-full p-2 hover:bg-white/5 transition">
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-display text-sm font-bold tracking-tight">Learning</span>
            </div>
            <button onClick={() => navigate("/")} className="rounded-full p-2 hover:bg-white/5 transition">
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </header>

        {/* Empty state — landing-like hero */}
        {messages.length === 0 ? (
          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-220px)] max-w-3xl flex-col items-center justify-center px-5 pt-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-1.5 backdrop-blur-xl"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Learning Mode · Feynman technique</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-[10vw] uppercase leading-[0.95] tracking-tight text-foreground md:text-[5rem]"
            >
              LEARN <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">ANYTHING.</span>
              <br />
              FAST.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-5 max-w-md text-sm text-muted-foreground md:text-base"
            >
              معلمك الشخصي يبسط أصعب المفاهيم — اسأل، ارفع كتاب، أو ابدأ خطة مذاكرة.
            </motion.p>

            {/* Quick prompts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-8 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2"
            >
              {QUICK_PROMPTS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => useQuick(q.text)}
                  className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-right backdrop-blur-xl transition hover:bg-white/[0.06] hover:border-white/20"
                >
                  <q.icon className={`h-4 w-4 shrink-0 ${q.color}`} />
                  <span className="text-sm text-foreground/90">{q.text}</span>
                </button>
              ))}
            </motion.div>
          </div>
        ) : (
          /* Messages */
          <div className="relative z-10 mx-auto max-w-3xl px-4 pb-48 pt-6">
            {messages.map((m, i) => (
              <div key={i}>
                {m.attachedImages && m.attachedImages.length > 0 && (
                  <div className="mb-2 flex flex-wrap justify-end gap-2">
                    {m.attachedImages.map((img, j) => (
                      <img key={j} src={img} alt="" className="h-24 w-24 rounded-2xl border border-white/10 object-cover" />
                    ))}
                  </div>
                )}
                <ChatMessage role={m.role} content={m.content} />
              </div>
            ))}
            {isThinking && <ThinkingLoader />}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Floating tools button (above input) */}
        <div className="fixed bottom-32 right-4 z-50 md:right-1/2 md:translate-x-[calc(50%+260px)]">
          <AnimatePresence>
            {toolsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-16 right-0 flex flex-col items-end gap-2"
              >
                {STUDY_TOOLS.map((t, idx) => {
                  // Pyramid: first largest, decreasing
                  const sizes = ["w-56 py-3.5 text-sm", "w-48 py-3 text-sm", "w-40 py-2.5 text-xs", "w-32 py-2 text-xs"];
                  return (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, x: 20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.9 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => { navigate(t.route); setToolsOpen(false); }}
                      className={`${sizes[idx]} flex items-center justify-end gap-2.5 rounded-full border border-white/15 bg-background/60 px-4 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:scale-[1.02]`}
                    >
                      <span className="font-medium text-foreground">{t.label}</span>
                      <div className={`rounded-full bg-gradient-to-br ${t.color} p-1.5`}>
                        <t.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setToolsOpen((v) => !v)}
            className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_10px_40px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl transition hover:scale-105 ${toolsOpen ? "rotate-45" : ""}`}
          >
            <Wrench className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* iOS 26 floating input */}
        <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-4 pt-2">
          <div className="mx-auto max-w-3xl">
            {/* Attachments preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2 px-2">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="group relative">
                    {f.type === "image" ? (
                      <img src={f.data} alt={f.name} className="h-16 w-16 rounded-xl border border-white/10 object-cover" />
                    ) : (
                      <div className="flex h-16 items-center gap-2 rounded-xl border border-white/10 bg-background/50 px-3 backdrop-blur-xl">
                        <FileUp className="h-4 w-4 text-emerald-400" />
                        <span className="max-w-[120px] truncate text-xs">{f.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative rounded-[28px] border border-white/10 bg-background/50 p-2 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <div className="flex items-end gap-2">
                {/* Plus button */}
                <div className="relative">
                  <button
                    onClick={() => setPlusOpen((v) => !v)}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10 ${plusOpen ? "rotate-45" : ""}`}
                  >
                    <Plus className="h-5 w-5 text-foreground" />
                  </button>

                  <AnimatePresence>
                    {plusOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute bottom-14 left-0 w-48 overflow-hidden rounded-2xl border border-white/10 bg-background/80 backdrop-blur-2xl shadow-2xl"
                      >
                        {[
                          { icon: ImageIcon, label: "صورة", action: () => imageInputRef.current?.click() },
                          { icon: Camera, label: "كاميرا", action: () => cameraInputRef.current?.click() },
                          { icon: FileUp, label: "ملف", action: () => fileInputRef.current?.click() },
                        ].map((it, i) => (
                          <button
                            key={i}
                            onClick={it.action}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/5"
                          >
                            <it.icon className="h-4 w-4 text-emerald-400" />
                            <span>{it.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="اسأل عن أي شيء تتعلمه..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-2 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60"
                  style={{ maxHeight: "140px" }}
                />

                {isLoading ? (
                  <button
                    onClick={stop}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition hover:scale-105"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={send}
                    disabled={!input.trim() && attachedFiles.length === 0}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LearningModePage;
