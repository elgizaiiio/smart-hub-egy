import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CalendarDays, BookOpen, Check, Circle, Target, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AppLayout from "@/layouts/AppLayout";

const spring = { type: "spring" as const, damping: 22, stiffness: 350 };

interface StudyTask {
  day: number;
  tasks: { title: string; type: "lesson" | "quiz" | "review"; duration: string; done: boolean }[];
}

const StudyPlannerPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [weakAreas, setWeakAreas] = useState("");
  const [plan, setPlan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generatePlan = useCallback(async () => {
    if (!subjects.trim()) { toast.error("Please enter your subjects"); return; }
    setIsGenerating(true);

    const daysUntilExam = examDate ? Math.max(1, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)) : 30;

    const systemPrompt = `You are an expert study planner. Create a detailed, personalized study plan.

Student info:
- Subjects: ${subjects}
- Days until exam: ${daysUntilExam}
- Hours per day: ${hoursPerDay}
- Level: ${level}
${weakAreas ? `- Weak areas: ${weakAreas}` : ""}

Create a structured plan with:
1. Overview of the strategy
2. Day-by-day schedule (at least first 7 days in detail)
3. Each day should have: Lessons (new content), Quizzes (practice), Reviews (revision)
4. Balance between new learning, practice, and revision
5. Extra focus on weak areas
6. Tips for effective studying

Use markdown formatting with headers, bullet points, and bold text.
Respond in the same language as the subjects.`;

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Create my study plan for ${subjects}` }],
          model: "google/gemini-2.5-flash-lite-preview-09-2025",
          mode: "chat",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) { result += delta; setPlan(result); }
          } catch {}
        }
      }

      setGenerated(true);
    } catch {
      toast.error("Failed to generate plan. Try again.");
    }

    setIsGenerating(false);
  }, [subjects, examDate, hoursPerDay, level, weakAreas]);

  return (
    <AppLayout>
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3">
          <motion.button whileTap={{ scale: 0.9 }} transition={spring} onClick={() => navigate("/chat")} className="w-9 h-9 rounded-full liquid-glass-button flex items-center justify-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <h1 className="text-base font-semibold text-foreground">Study Planner</h1>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-8">
          {!generated ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mx-auto py-6 space-y-6">
              <div className="text-center mb-6">
                <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight mb-2">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Your Study Plan</span>
                </h2>
                <p className="text-muted-foreground/60 text-sm">AI creates a personalized plan based on your goals</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subjects *</label>
                  <input value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="e.g. Math, Physics, Chemistry" className="w-full h-12 rounded-2xl liquid-glass px-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Exam Date</label>
                    <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full h-12 rounded-2xl liquid-glass px-4 text-sm text-foreground outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Hours per Day</label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 6].map(h => (
                        <motion.button key={h} whileTap={{ scale: 0.95 }} onClick={() => setHoursPerDay(h)} className={`flex-1 min-w-[44px] py-2.5 rounded-xl text-xs font-medium transition-all ${hoursPerDay === h ? "bg-primary text-primary-foreground" : "liquid-glass-button text-foreground/70"}`}>{h}h</motion.button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["beginner", "intermediate", "advanced"] as const).map(l => (
                      <motion.button key={l} whileTap={{ scale: 0.95 }} onClick={() => setLevel(l)} className={`w-full py-2.5 rounded-xl text-xs font-medium capitalize transition-all truncate ${level === l ? "bg-primary text-primary-foreground" : "liquid-glass-button text-foreground/70"}`}>{l}</motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Weak Areas (optional)</label>
                  <input value={weakAreas} onChange={e => setWeakAreas(e.target.value)} placeholder="e.g. Calculus, Organic Chemistry" className="w-full h-12 rounded-2xl liquid-glass px-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none" />
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.95 }} transition={spring} onClick={generatePlan} disabled={isGenerating || !subjects.trim()} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30 shadow-lg shadow-primary/20">
                {isGenerating ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating...</span> : "Generate Plan"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto py-4 space-y-4">
              <div className="prose-chat text-foreground text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
                {isGenerating && <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5" />}
              </div>
              {!isGenerating && (
                <div className="flex gap-3 pt-4">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setGenerated(false); setPlan(""); }} className="flex-1 py-3 rounded-2xl liquid-glass-button text-sm font-medium text-foreground/70">
                    New Plan
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={async () => { await navigator.clipboard.writeText(plan); toast.success("Plan copied"); }} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
                    Copy Plan
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default StudyPlannerPage;
