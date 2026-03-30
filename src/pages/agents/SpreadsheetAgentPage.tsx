import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Table2, ArrowUp, Loader2, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

const SYSTEM = `You are an AI Spreadsheet Agent. Create and analyze spreadsheets:
- Generate data tables from descriptions with proper columns and formulas
- Output as markdown tables that can be copied
- Support: budgets, trackers, inventories, sales reports, financial models
- Analyze uploaded CSV/Excel data with insights
- Suggest formulas (SUM, AVERAGE, IF, VLOOKUP)
- Support conditional formatting descriptions
- Add charts recommendations
Format as clean markdown tables. Always respond in the user's language.
Cost: 1 MC per generation.`;

const EXAMPLES = [
  { label: "Monthly Budget", prompt: "Create a monthly budget spreadsheet with income categories, expense categories, totals, and savings calculation" },
  { label: "Project Tracker", prompt: "Create a project task tracker with columns: Task, Assignee, Status, Priority, Due Date, Progress %" },
  { label: "Inventory", prompt: "Create an inventory management spreadsheet with Product, SKU, Quantity, Reorder Level, Unit Price, Total Value" },
  { label: "Sales Report", prompt: "Create a quarterly sales report with Product, Q1, Q2, Q3, Q4, Total, Growth %" },
];

const SpreadsheetAgentPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
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
    await streamChat({
      messages: [{ role: "user" as const, content: `[System]: ${SYSTEM}` }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user" as const, content: text }],
      model: "google/gemini-3-flash-preview", searchEnabled: false,
      onDelta: (chunk) => { setIsThinking(false); content += chunk; setMessages(prev => { const l = prev[prev.length-1]; if (l?.role === "assistant") return prev.map((m,i) => i===prev.length-1 ? {...m,content} : m); return [...prev, {role:"assistant",content}]; }); },
      onDone: () => { setIsLoading(false); setIsThinking(false); },
      onError: () => { setIsLoading(false); setIsThinking(false); toast.error("Failed"); },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string).slice(0, 8000);
      sendMessage(`[Uploaded file: ${file.name}]\n\nData:\n${text}\n\nAnalyze this data, find insights, and suggest improvements.`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">AI Spreadsheets</h1>
          </div>
          <p className="text-[10px] text-muted-foreground">1 MC per generation</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full space-y-5">
              <div className="text-center">
                <Table2 className="w-10 h-10 text-primary/30 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">AI Spreadsheets</h2>
                <p className="text-xs text-muted-foreground">Describe what you need or upload a file to analyze</p>
              </div>

              {/* Upload button */}
              <button onClick={() => fileRef.current?.click()} className="w-full py-3 rounded-2xl border border-dashed border-border/50 bg-card/50 hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Upload Excel / CSV</span>
              </button>

              {/* Examples */}
              <div className="grid grid-cols-2 gap-2">
                {EXAMPLES.map(e => (
                  <button key={e.label} onClick={() => sendMessage(e.prompt)} className="py-3 px-3 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors text-left">
                    <p className="text-xs font-medium text-foreground">{e.label}</p>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Describe your spreadsheet..." rows={2} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5" style={{ minHeight: "48px" }} />
                <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">{msg.content}</div> : <div className="prose-chat text-foreground text-sm overflow-x-auto" dir="auto"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
          </div>
        ))}
        {isThinking && <ThinkingLoader />}
        <div ref={endRef} />
      </div>
      {hasMessages && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <button onClick={() => fileRef.current?.click()} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><Upload className="w-4 h-4" /></button>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Modify or ask more..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.tsv" onChange={handleFileUpload} />
    </div>
  );
};

export default SpreadsheetAgentPage;
