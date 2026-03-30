import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Store, Package, ShoppingBag, MessageSquare, BarChart3, ArrowUp, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

type Tab = "dashboard" | "inventory" | "orders" | "reviews" | "reports";

const SYSTEM = `You are an E-Commerce Store Manager AI. Help merchants manage their online stores:
- Analyze sales data and trends
- Track inventory and alert for low stock
- Draft professional responses to customer reviews
- Generate weekly/monthly reports with insights
- Suggest marketing strategies based on data
- Support Shopify, WooCommerce, Salla, and Zid
Always respond in the user's language.`;

const PLATFORMS = [
  { name: "Shopify", connected: false },
  { name: "WooCommerce", connected: false },
  { name: "Salla", connected: false },
  { name: "Zid", connected: false },
];

const StoreManagerPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [storeConnected, setStoreConnected] = useState(false);
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

  const TABS: { id: Tab; icon: typeof Package; label: string }[] = [
    { id: "dashboard", icon: Store, label: "Dashboard" },
    { id: "inventory", icon: Package, label: "Inventory" },
    { id: "orders", icon: ShoppingBag, label: "Orders" },
    { id: "reviews", icon: MessageSquare, label: "Reviews" },
    { id: "reports", icon: BarChart3, label: "Reports" },
  ];

  if (!storeConnected) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background">
        <div className="flex items-center gap-3 px-4 py-3 shrink-0">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">Store Manager</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm space-y-5">
            <Store className="w-12 h-12 text-primary/30 mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Connect Your Store</h2>
            <p className="text-sm text-muted-foreground">Link your e-commerce platform to get started with AI-powered store management.</p>
            <div className="space-y-2">
              {PLATFORMS.map(p => (
                <button key={p.name} onClick={() => { setStoreConnected(true); toast.success(`${p.name} connected`); }} className="w-full flex items-center justify-between p-3 rounded-2xl bg-card border border-border/30 hover:border-primary/30 transition-colors">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className="text-xs px-3 py-1 rounded-xl bg-primary text-primary-foreground">Connect</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Free trial: 7 days · Then 20 MC/month</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Store Manager</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "dashboard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Sales Today", value: "--", change: "Connect API" },
                { label: "New Orders", value: "0", change: "No data" },
                { label: "Low Stock", value: "0", change: "No alerts" },
                { label: "Reviews", value: "0", change: "No pending" },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-2xl bg-card border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                  <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.change}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-600">Connect your store API key to see live data</p>
            </div>
          </motion.div>
        )}

        {(tab === "inventory" || tab === "orders" || tab === "reviews" || tab === "reports") && (
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Ask me about your {tab}</p>
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
        )}
      </div>

      <div className="shrink-0 px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder={`Ask about ${tab}...`} rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32" style={{ minHeight: "32px" }} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}</button>
        </div>
      </div>

      <div className="shrink-0 border-t border-border/30 bg-background px-1 py-1 flex justify-around overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors shrink-0 ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
            <t.icon className="w-4 h-4" />
            <span className="text-[9px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoreManagerPage;
