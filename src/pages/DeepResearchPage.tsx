import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Camera, Image as ImageIcon, FileUp, ChevronDown, MoreHorizontal, Download, Share2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import MilkInputBar from "@/components/chat/MilkInputBar";
import ThinkingLoader from "@/components/ThinkingLoader";
import { streamChat } from "@/lib/streamChat";
import { saveConversation } from "@/lib/conversationPersistence";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TimelineStep {
  id: string;
  label: string;
  detail: string;
  status: "active" | "done" | "pending";
  ts: number;
}

interface ResearchSession {
  id: string;
  query: string;
  steps: TimelineStep[];
  images: string[];
  report: string;
  expandedStep: string | null;
}

const RESEARCH_PROMPT =
  "You are a Deep Research agent. CRITICAL: Reply in the user's EXACT language and dialect. " +
  "Produce a clean, well-structured FINAL REPORT only — no greetings, no preamble, no AI-self-references. " +
  "STRUCTURE (use proper markdown — headings, bold, bullets, tables): " +
  "# {Bold Title}\n\n" +
  "## نظرة عامة (Overview)\n2-3 sentence intro.\n\n" +
  "## المعلومات الأساسية (Key Facts)\nUse bullet points with **bold labels**: e.g., - **الاسم:** ...\n\n" +
  "## التفاصيل (Details)\nUse ### sub-headings, numbered lists, and bullets (-, •).\n\n" +
  "## مقارنة / جدول (Comparison)\nWhen comparing options, USE markdown tables with | and ---.\n\n" +
  "## الخلاصة (Conclusion)\nFinal takeaway.\n\n" +
  "ABSOLUTELY NEVER expose internal thinking, tool calls, plans, or search queries — only the polished report.";

const EXAMPLES = ["أم كلثوم", "اقتصاد مصر 2026", "أفضل جامعات الذكاء الاصطناعي", "تاريخ قناة السويس الجديدة"];

const buildStatusFromQuery = (query: string, phase: number): { label: string; detail: string } => {
  const shortQuery = query.length > 30 ? `${query.slice(0, 30)}…` : query;
  const phases = [
    { label: `البحث المتوازي الشامل عن ${shortQuery}`, detail: `أفتح الآن أهم المصادر المتعلقة بـ "${shortQuery}" وأجمع المحاور الأساسية للبحث.` },
    { label: "جمع المحاور الرئيسية", detail: `لقد وجدت معلومات قيمة. أرتب الآن السيرة، الخلفية، والأجزاء الأهم قبل بناء التقرير.` },
    { label: "تحليل المصادر", detail: `أقارن بين النتائج وأتحقق من الدقة وألتقط النقاط المتكررة والحقائق الأقوى.` },
    { label: "جمع الصور والوسائط", detail: `أجمع صورًا مناسبة وأختار ما يدعم التقرير بدون تشتيت.` },
    { label: "كتابة التقرير النهائي", detail: `أحوّل النتائج إلى تقرير منظم بعناوين واضحة ونقاط وجداول عند الحاجة.` },
  ];
  return phases[Math.min(phase, phases.length - 1)];
};

const labelFromStatus = (status: string): string => {
  const lower = status.toLowerCase();
  if (/search|gathering|browsing|opening|navigat|بحث/i.test(lower)) return "جمع المحاور الرئيسية";
  if (/analyz|reviewing|reading|تحليل/i.test(lower)) return "تحليل المصادر";
  if (/image|صور/i.test(lower)) return "جمع الصور والوسائط";
  if (/writing|summar|report|composing|كتابة/i.test(lower)) return "كتابة التقرير النهائي";
  return "جاري العمل";
};

const buildResearchIntro = (query: string) => `مفهوم، سأقوم بإجراء بحث شامل ومتوازي حول "${query}" لجمع معلومات دقيقة ومرتبة. دعني أضع خطة واضحة للبدء.`;
const buildResearchOutro = (query: string) => `لقد أنهيت بحثًا شاملًا حول "${query}" وجمعت أهم النتائج في تقرير مرتب وجاهز للمراجعة.`;

const DeepResearchPage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

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

  useEffect(() => {
    if (sessions.length > 0) {
      sessionStorage.setItem("dr_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setInput("");
    setSessions([]);
    setAttachedFiles([]);
    setIsLoading(false);
    setConversationId(null);
    navigate("/research");
  }, [navigate]);

  const handleFile = useCallback((files: FileList | null, kind: "image" | "file") => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} أكبر من 20MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles((prev) => [...prev, { name: file.name, type: kind === "image" ? "image" : "file", data: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    setPlusOpen(false);
  }, []);

  const updateLastSession = useCallback((fn: (session: ResearchSession) => ResearchSession) => {
    setSessions((previous) => {
      const copy = [...previous];
      copy[copy.length - 1] = fn(copy[copy.length - 1]);
      return copy;
    });
  }, []);

  const send = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const sessionId = `dr-${Date.now()}`;
    const newSession: ResearchSession = { id: sessionId, query: input.trim(), steps: [], images: [], report: "", expandedStep: null };
    setSessions((prev) => [...prev, newSession]);
    const sentInput = input;
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages = [
      { role: "assistant" as const, content: RESEARCH_PROMPT },
      { role: "user" as const, content: sentInput },
    ];

    let reportBuffer = "";
    let phase = 0;
    let phaseTimer: ReturnType<typeof setInterval> | null = null;

    const pushPhase = () => {
      const { label, detail } = buildStatusFromQuery(sentInput, phase);
      updateLastSession((session) => {
        const updatedSteps = session.steps.map((step) => ({ ...step, status: "done" as const }));
        updatedSteps.push({ id: `${Date.now()}-${updatedSteps.length}`, label, detail, status: "active", ts: Date.now() });
        return { ...session, steps: updatedSteps, expandedStep: updatedSteps[updatedSteps.length - 1].id };
      });
      phase += 1;
    };

    pushPhase();
    phaseTimer = setInterval(() => {
      if (phase < 4) pushPhase();
    }, 2200);

    await streamChat({
      messages: apiMessages as any,
      model: "moonshotai/kimi-k2.5:nitro",
      chatMode: "deep-research",
      deepResearch: true,
      searchEnabled: true,
      user_id: userId ?? undefined,
      signal: controller.signal,
      onStatus: (status) => {
        const label = labelFromStatus(status);
        updateLastSession((session) => {
          const last = session.steps[session.steps.length - 1];
          if (last && last.label === label) {
            const steps = [...session.steps];
            steps[steps.length - 1] = { ...last, detail: (last.detail ? `${last.detail}
` : "") + status };
            return { ...session, steps };
          }
          return session;
        });
      },
      onImages: (images) => {
        updateLastSession((session) => ({ ...session, images: images.slice(0, 12) }));
      },
      onDelta: (delta) => {
        if (phaseTimer) {
          clearInterval(phaseTimer);
          phaseTimer = null;
        }
        if (!reportBuffer) {
          updateLastSession((session) => {
            const updatedSteps = session.steps.map((step) => ({ ...step, status: "done" as const }));
            updatedSteps.push({
              id: `${Date.now()}-writing`,
              label: "كتابة التقرير النهائي",
              detail: "أنظم الآن النتائج الأخيرة داخل تقرير أنيق ومرتب…",
              status: "active",
              ts: Date.now(),
            });
            return { ...session, steps: updatedSteps, expandedStep: updatedSteps[updatedSteps.length - 1].id };
          });
        }
        reportBuffer += delta;
        updateLastSession((session) => ({ ...session, report: reportBuffer }));
      },
      onDone: async () => {
        if (phaseTimer) {
          clearInterval(phaseTimer);
          phaseTimer = null;
        }
        updateLastSession((session) => ({
          ...session,
          steps: session.steps.map((step) => ({ ...step, status: "done" as const })),
          expandedStep: null,
        }));
        setIsLoading(false);
        abortRef.current = null;

        if (userId && reportBuffer) {
          const id = await saveConversation({
            conversationId,
            userId,
            mode: "research",
            title: sentInput.slice(0, 60),
            messages: [
              { role: "user", content: sentInput },
              { role: "assistant", content: reportBuffer },
            ],
          });
          if (id && !conversationId) setConversationId(id);
        }
      },
      onError: (error) => {
        if (phaseTimer) {
          clearInterval(phaseTimer);
          phaseTimer = null;
        }
        toast.error(error);
        setIsLoading(false);
      },
    });
  }, [conversationId, input, isLoading, navigate, updateLastSession, userId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const downloadReport = useCallback((session: ResearchSession) => {
    const blob = new Blob([`# ${session.query}

${session.report}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${session.query.slice(0, 40).replace(/[^a-z0-9]/gi, "-")}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل التقرير");
  }, []);

  const share = useCallback(async (session: ResearchSession) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: session.query, text: session.report.slice(0, 220) });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(session.report);
    toast.success("تم نسخ التقرير");
  }, []);

  const openPreview = useCallback((session: ResearchSession) => {
    sessionStorage.setItem(`dr_report_${session.id}`, JSON.stringify({ query: session.query, report: session.report, images: session.images }));
    navigate(`/research/preview/${session.id}`);
  }, [navigate]);

  const toggleStep = useCallback((sessionIndex: number, stepId: string) => {
    setSessions((previous) => {
      const copy = [...previous];
      copy[sessionIndex] = {
        ...copy[sessionIndex],
        expandedStep: copy[sessionIndex].expandedStep === stepId ? null : stepId,
      };
      return copy;
    });
  }, []);

  return (
    <AppLayout>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={handleNewChat} currentMode="research" />

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFile(e.target.files, "file")} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFile(e.target.files, "image")} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files, "image")} />

      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden milk-page-canvas">
        <div className="mx-auto min-h-full max-w-4xl px-4 pb-44 pt-4">
          <button onClick={() => setSidebarOpen(true)} className="milk-top-button fixed left-4 top-4 z-40">
            <Menu className="h-5 w-5" />
          </button>

          {sessions.length === 0 ? (
            <div className="flex min-h-[calc(100dvh-220px)] flex-col items-center justify-center text-center">
              <span className="milk-lite-pill">Deep Research</span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-6xl">بحث عميق. مرتب. واضح.</h1>
              <p className="mt-3 max-w-lg text-sm font-medium leading-7 text-muted-foreground">
                اكتب الموضوع فقط، وسيبدأ ميغسي جمع المحاور، تحليل المصادر، ترتيب الصور، ثم تسليم تقرير أنيق سهل القراءة.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((item) => (
                  <button key={item} onClick={() => setInput(item)} className="milk-example-chip">
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 pt-16">
              {sessions.map((session, sessionIndex) => {
                const isLast = sessionIndex === sessions.length - 1;
                const isActive = isLast && isLoading;
                const isFinished = !!session.report && !isActive;

                return (
                  <section key={session.id} className="space-y-4">
                    <div className="flex justify-end">
                      <div className="milk-query-bubble">{session.query}</div>
                    </div>

                    <div className="milk-report-card space-y-5 p-5 md:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="milk-lite-pill">Lite</span>
                          <span className="text-2xl font-bold tracking-tight text-foreground">Megsy</span>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                          <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-primary animate-pulse" : "bg-foreground/30"}`} />
                          {isActive ? "تفكير" : "مكتمل"}
                        </div>
                      </div>

                      <p className="text-xl font-bold leading-relaxed text-foreground">{buildResearchIntro(session.query)}</p>

                      <div className="space-y-2">
                        {session.steps.map((step) => {
                          const expanded = session.expandedStep === step.id;
                          return (
                            <div key={step.id}>
                              <button onClick={() => toggleStep(sessionIndex, step.id)} className="milk-step-chip w-full text-right">
                                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : "rotate-0"}`} />
                                <span className="flex-1 truncate text-sm font-bold text-foreground">{step.label}</span>
                              </button>
                              <AnimatePresence initial={false}>
                                {expanded && step.detail ? (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="milk-step-detail">{step.detail}</div>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>

                      {isActive && !session.report ? <ThinkingLoader searchStatus="أجمع المعلومات وأبني التقرير الآن…" /> : null}

                      {session.images.length > 0 ? (
                        <div className="-mx-1 overflow-x-auto px-1 pb-1">
                          <div className="flex gap-3" style={{ width: "max-content" }}>
                            {session.images.map((image, index) => (
                              <div key={index} className="h-28 w-40 shrink-0 overflow-hidden rounded-[22px] border border-border/60 bg-secondary/60">
                                <img src={image} alt="research" className="h-full w-full object-cover" loading="lazy" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {isFinished ? (
                        <>
                          <p className="text-base font-medium leading-7 text-foreground">{buildResearchOutro(session.query)} ستجد التقرير الكامل داخل البطاقة التالية.</p>

                          <div className="relative overflow-hidden rounded-[30px] border border-border/60 bg-card/95 shadow-[0_16px_50px_hsl(0_0%_0%_/_.05)]">
                            <button onClick={() => openPreview(session)} className="block w-full p-4 text-right transition hover:bg-secondary/40">
                              <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-secondary text-primary">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="truncate text-base font-bold text-foreground">تقرير شامل عن {session.query}</h3>
                                  <p className="mt-1 text-xs font-semibold text-muted-foreground">Markdown · {(session.report.length / 1024).toFixed(1)} KB</p>
                                  <p className="mt-3 line-clamp-4 text-sm font-medium leading-6 text-muted-foreground">
                                    {session.report.replace(/[#*`>]/g, "").slice(0, 260).trim()}
                                  </p>
                                </div>
                              </div>
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-muted-foreground transition hover:text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="rounded-2xl liquid-glass p-1.5">
                                <DropdownMenuItem onClick={() => downloadReport(session)} className="rounded-xl">
                                  <Download className="mr-2 h-4 w-4" /> تنزيل التقرير
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => share(session)} className="rounded-xl">
                                  <Share2 className="mr-2 h-4 w-4" /> مشاركة
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </section>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-4 pt-2 pointer-events-none">
          <div className="mx-auto max-w-3xl pointer-events-auto">
            <MilkInputBar
              value={input}
              onChange={setInput}
              onSend={send}
              onStop={stop}
              isLoading={isLoading}
              placeholder="اكتب الموضوع الذي تريد البحث عنه بعمق…"
              showPlus
              plusOpen={plusOpen}
              onTogglePlus={() => setPlusOpen((prev) => !prev)}
              attachedFiles={attachedFiles}
              onRemoveAttachment={(index) => setAttachedFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
              sendDisabled={!input.trim()}
              menuActions={[
                { key: "photos", label: "الصور", icon: ImageIcon, onClick: () => { imageInputRef.current?.click(); setPlusOpen(false); } },
                { key: "camera", label: "الكاميرا", icon: Camera, onClick: () => { cameraInputRef.current?.click(); setPlusOpen(false); } },
                { key: "files", label: "إضافة ملفات", icon: FileUp, onClick: () => { fileInputRef.current?.click(); setPlusOpen(false); } },
              ]}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DeepResearchPage;
