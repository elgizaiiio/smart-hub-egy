import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Menu, Plus, X, Globe, ArrowUp, Square, Image as ImageIcon, FileUp, Camera,
  Search, Brain, GitCompare, FileText, CheckCircle2, MoreVertical, Download, Share2, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ChatMessage from "@/components/ChatMessage";
import { streamChat } from "@/lib/streamChat";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimelineStep {
  id: string;
  label: string;
  status: "active" | "done";
  icon: typeof Search;
  detail?: string;
  ts: number;
}

interface ResearchSession {
  query: string;
  steps: TimelineStep[];
  images: string[];
  report: string;
}

const RESEARCH_PROMPT =
  "You are a Deep Research agent. Reply in the user's exact language. " +
  "Produce a thorough, well-structured report with: Executive Summary, Key Findings, Sources, Conclusion. " +
  "Use markdown headings, bullets, and tables where useful.";

const stepFromStatus = (s: string): { label: string; icon: typeof Search } => {
  const l = s.toLowerCase();
  if (/search|gathering|browsing|opening|navigat/i.test(l)) return { label: "Searching the web", icon: Search };
  if (/analyz|reviewing|reading/i.test(l)) return { label: "Analyzing sources", icon: Brain };
  if (/compar/i.test(l)) return { label: "Comparing findings", icon: GitCompare };
  if (/writing|summar|report/i.test(l)) return { label: "Writing the report", icon: FileText };
  return { label: "Working", icon: Brain };
};

const DeepResearchPage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const [previewOpen, setPreviewOpen] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sessions, isLoading]);

  const handleFile = useCallback((files: FileList | null, kind: "image" | "file") => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} > 20MB`); return; }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles((prev) => [...prev, { name: f.name, type: kind === "image" ? "image" : "file", data: reader.result as string }]);
      };
      reader.readAsDataURL(f);
    });
    setPlusOpen(false);
  }, []);

  const updateLastSession = (fn: (s: ResearchSession) => ResearchSession) => {
    setSessions((arr) => {
      const copy = [...arr];
      copy[copy.length - 1] = fn(copy[copy.length - 1]);
      return copy;
    });
  };

  const send = useCallback(async () => {
    if (!input.trim()) return;
    if (isLoading) return;

    const newSession: ResearchSession = { query: input.trim(), steps: [], images: [], report: "" };
    setSessions((s) => [...s, newSession]);
    const sentInput = input;
    setInput("");
    setIsLoading(true);

    const ac = new AbortController();
    abortRef.current = ac;

    const apiMessages = [
      { role: "assistant" as const, content: RESEARCH_PROMPT },
      { role: "user" as const, content: sentInput },
    ];

    let reportBuf = "";

    await streamChat({
      messages: apiMessages as any,
      model: "google/gemini-2.5-flash-lite-preview-09-2025",
      chatMode: "deep-research",
      deepResearch: true,
      searchEnabled: true,
      user_id: userId ?? undefined,
      signal: ac.signal,
      onStatus: (st) => {
        const meta = stepFromStatus(st);
        updateLastSession((s) => {
          const last = s.steps[s.steps.length - 1];
          if (last && last.label === meta.label) return s;
          const updated: TimelineStep[] = s.steps.map((x) => ({ ...x, status: "done" }));
          updated.push({
            id: `${Date.now()}-${updated.length}`,
            label: meta.label,
            icon: meta.icon,
            status: "active",
            detail: st,
            ts: Date.now(),
          });
          return { ...s, steps: updated };
        });
      },
      onImages: (imgs) => {
        updateLastSession((s) => ({ ...s, images: imgs.slice(0, 12) }));
      },
      onDelta: (d) => {
        reportBuf += d;
        updateLastSession((s) => ({ ...s, report: reportBuf }));
      },
      onDone: () => {
        updateLastSession((s) => ({
          ...s,
          steps: s.steps.map((x) => ({ ...x, status: "done" as const })),
        }));
        setIsLoading(false);
        abortRef.current = null;
      },
      onError: (e) => { toast.error(e); setIsLoading(false); },
    });
  }, [input, isLoading, userId]);

  const stop = () => { abortRef.current?.abort(); setIsLoading(false); };

  const downloadPdf = (s: ResearchSession) => {
    const blob = new Blob([`# ${s.query}\n\n${s.report}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  const share = async (s: ResearchSession) => {
    if (navigator.share) {
      try { await navigator.share({ title: s.query, text: s.report.slice(0, 200) }); }
      catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(s.report);
      toast.success("Copied to clipboard");
    }
  };

  const hasResults = sessions.length > 0;

  return (
    <AppLayout>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => navigate("/")} />

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFile(e.target.files, "file")} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFile(e.target.files, "image")} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files, "image")} />

      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-background">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-[120px] animate-pulse" />
          <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/15 blur-[140px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-blue-400/10 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background/40 backdrop-blur-2xl hover:bg-background/60 transition"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        {!hasResults ? (
          <div className="relative z-10 mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-5 py-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/5 px-4 py-1.5 backdrop-blur-xl"
            >
              <Globe className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-violet-300">Deep Research</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-[10vw] uppercase leading-[0.95] tracking-tight md:text-[5rem]"
            >
              RESEARCH <span className="bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">DEEP.</span>
              <br />KNOW MORE.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-5 max-w-md text-sm text-muted-foreground md:text-base"
            >
              Watch your AI agent search, analyze, compare, and write — live in front of you.
            </motion.p>
          </div>
        ) : (
          <div className="relative z-10 mx-auto max-w-3xl px-4 pb-48 pt-20 space-y-6">
            {sessions.map((s, idx) => {
              const isLast = idx === sessions.length - 1;
              const isActive = isLast && isLoading;
              return (
                <div key={idx} className="space-y-3">
                  {/* Query */}
                  <ChatMessage role="user" content={s.query} />

                  {/* Live Timeline */}
                  <div className="rounded-3xl border border-white/10 bg-background/40 p-4 backdrop-blur-xl">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="relative">
                        <div className={`h-2 w-2 rounded-full ${isActive ? "bg-violet-400" : "bg-emerald-400"}`} />
                        {isActive && <div className="absolute inset-0 h-2 w-2 rounded-full bg-violet-400 animate-ping" />}
                      </div>
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {isActive ? "Researching live" : "Research complete"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {s.steps.map((step) => {
                        const Icon = step.icon;
                        const isStepActive = step.status === "active";
                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 text-sm"
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              isStepActive ? "bg-violet-500/20 text-violet-300" : "bg-emerald-500/15 text-emerald-300"
                            }`}>
                              {isStepActive ? <Icon className="h-4 w-4 animate-pulse" /> : <CheckCircle2 className="h-4 w-4" />}
                            </div>
                            <span className={isStepActive ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
                            {isStepActive && (
                              <span className="ml-auto text-[10px] text-violet-400">in progress</span>
                            )}
                          </motion.div>
                        );
                      })}
                      {isActive && s.steps.length === 0 && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <Search className="h-4 w-4 animate-pulse text-violet-300" />
                          </div>
                          <span>Starting research...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Images grid */}
                  {s.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {s.images.map((img, j) => (
                        <a key={j} href={img} target="_blank" rel="noopener noreferrer" className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          <img src={img} alt="" className="h-full w-full object-cover transition hover:scale-110" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Report Preview Card */}
                  {s.report && (
                    <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 backdrop-blur-xl overflow-hidden">
                      <button
                        onClick={() => setPreviewOpen(idx)}
                        className="block w-full p-5 text-left transition hover:bg-white/5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-base font-bold text-foreground">Research Report</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{s.query}</p>
                            <p className="mt-2 line-clamp-3 text-xs text-foreground/70 leading-relaxed">
                              {s.report.slice(0, 240).replace(/[#*`]/g, "")}...
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-[11px] text-violet-300">
                              <Eye className="h-3 w-3" />
                              <span>Open full report</span>
                            </div>
                          </div>
                        </div>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background/90 backdrop-blur-2xl border-white/10">
                          <DropdownMenuItem onClick={() => downloadPdf(s)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => share(s)}>
                            <Share2 className="mr-2 h-4 w-4" /> Share
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Report Preview Dialog */}
        <Dialog open={previewOpen !== null} onOpenChange={(o) => !o && setPreviewOpen(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-white/10">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {previewOpen !== null && sessions[previewOpen]?.query}
              </DialogTitle>
            </DialogHeader>
            <div className="prose prose-invert prose-sm max-w-none">
              {previewOpen !== null && (
                <ChatMessage role="assistant" content={sessions[previewOpen].report} />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Input bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-4 pt-2 pointer-events-none">
          <div className="mx-auto max-w-3xl pointer-events-auto">
            <div className="relative rounded-[28px] border border-white/10 bg-background/50 p-2 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <div className="flex items-end gap-2">
                <div className="relative">
                  <button
                    onClick={() => setPlusOpen((v) => !v)}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10 ${plusOpen ? "rotate-45" : ""}`}
                  >
                    <Plus className="h-5 w-5 text-foreground" />
                  </button>
                  <AnimatePresence>
                    {plusOpen && (
                      <>
                        <div className="fixed inset-0 z-[45]" onClick={() => setPlusOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 12, scale: 0.92 }}
                          className="absolute bottom-full mb-2 left-0 z-[46] w-72 rounded-3xl border border-white/10 bg-background/80 p-3 backdrop-blur-2xl shadow-2xl"
                        >
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { ref: cameraInputRef, icon: Camera, label: "Camera" },
                              { ref: imageInputRef, icon: ImageIcon, label: "Photos" },
                              { ref: fileInputRef, icon: FileUp, label: "Files" },
                            ].map(({ ref, icon: Icon, label }) => (
                              <button
                                key={label}
                                onClick={() => { ref.current?.click(); setPlusOpen(false); }}
                                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/5 transition"
                              >
                                <Icon className="w-5 h-5 text-violet-400" />
                                <span className="text-[11px] text-foreground/80">{label}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="What do you want to research?"
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-2 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60"
                  style={{ maxHeight: "140px" }}
                />

                {isLoading ? (
                  <button onClick={stop} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={send}
                    disabled={!input.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg transition hover:scale-105 disabled:opacity-40"
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

export default DeepResearchPage;
