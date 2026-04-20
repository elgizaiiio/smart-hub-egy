import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ChatMessage from "@/components/ChatMessage";
import { streamChat } from "@/lib/streamChat";
import { saveConversation } from "@/lib/conversationPersistence";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LiquidWorkspaceInput from "@/components/LiquidWorkspaceInput";

interface Product {
  title: string;
  price: string;
  image?: string;
  link?: string;
  seller?: string;
  rating?: string | null;
  delivery?: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  attachedImages?: string[];
}

const SHOPPING_PROMPT =
  "You are a smart shopping assistant. " +
  "CRITICAL: ALWAYS reply in the user's EXACT language and dialect. " +
  "FORMAT: Product cards appear automatically — your TEXT response must be a brief expert summary in this exact structure: " +
  "1) One sentence saying which product is the best pick and why. " +
  "2) A short comparison (2-3 bullets) of the top 2-3 options on price, quality, value. " +
  "3) One closing line with a buying tip. " +
  "Keep it under 120 words. Never write long essays. Never list every product — the cards already do that.";

const ShoppingModePage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const [livePreview, setLivePreview] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const liveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const hasResults = messages.length > 0;

  // Live preview as user types — 300ms debounce, fires on every keystroke
  useEffect(() => {
    if (!input.trim() || input.trim().length < 2 || hasResults) {
      setLivePreview([]);
      return;
    }
    if (liveDebounce.current) clearTimeout(liveDebounce.current);
    liveDebounce.current = setTimeout(async () => {
      try {
        const { data } = await supabase.functions.invoke("search", {
          body: { query: input, type: "shopping", limit: 8 },
        });
        if (data?.products) setLivePreview(data.products.slice(0, 8));
      } catch { /* silent */ }
    }, 300);
    return () => { if (liveDebounce.current) clearTimeout(liveDebounce.current); };
  }, [input, hasResults]);

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
  }, []);

  const send = useCallback(async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    setLivePreview([]);
    const userMsg: Message = {
      role: "user",
      content: input.trim() || "(attached)",
      attachedImages: attachedFiles.filter(f => f.type === "image").map(f => f.data),
    };
    setMessages((m) => [...m, userMsg]);
    const sentInput = input;
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);

    const ac = new AbortController();
    abortRef.current = ac;

    const apiMessages = [
      { role: "assistant" as const, content: SHOPPING_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      {
        role: "user" as const,
        content: attachedFiles.filter(f => f.type === "image").length > 0
          ? [
              { type: "text", text: sentInput || "Analyze these shopping files" },
              ...attachedFiles.filter(f => f.type === "image").map(f => ({ type: "image_url", image_url: { url: f.data } })),
            ]
          : sentInput,
      },
    ];

    let buf = "";
    let prods: Product[] = [];
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    await streamChat({
      messages: apiMessages as any,
      model: "google/gemini-2.5-flash-lite-preview-09-2025",
      chatMode: "shopping",
      user_id: userId ?? undefined,
      signal: ac.signal,
      onDelta: (d) => {
        buf += d;
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: buf, products: prods };
          return c;
        });
      },
      onProducts: (p) => {
        prods = p;
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { ...c[c.length - 1], products: p };
          return c;
        });
      },
      onDone: async () => {
        setIsLoading(false);
        abortRef.current = null;
        if (userId) {
          const cid = await saveConversation({
            conversationId, userId, mode: "shopping",
            title: sentInput.slice(0, 60),
            messages: [
              { role: "user", content: sentInput },
              { role: "assistant", content: buf },
            ],
          });
          if (cid && !conversationId) setConversationId(cid);
        }
      },
      onError: (e) => { toast.error(e); setIsLoading(false); },
    });
  }, [input, attachedFiles, isLoading, messages, userId, conversationId]);

  const stop = () => { abortRef.current?.abort(); setIsLoading(false); };

  const ProductCard = ({ p }: { p: Product }) => (
    <a
      href={p.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/40 backdrop-blur-xl transition hover:border-amber-400/40 hover:shadow-[0_8px_30px_rgba(245,158,11,0.2)]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white/5">
        {p.image ? (
          <img src={p.image} alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center"><ShoppingCart className="h-8 w-8 text-muted-foreground" /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {p.seller && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.seller}</span>}
        <h3 className="line-clamp-2 text-xs font-medium text-foreground">{p.title}</h3>
        {p.rating && (
          <div className="flex items-center gap-1 text-[11px] text-amber-400">
            <Star className="h-3 w-3 fill-current" /> {p.rating}
          </div>
        )}
        <div className="mt-auto pt-1.5 text-sm font-bold text-foreground">{p.price}</div>
      </div>
    </a>
  );

  return (
    <AppLayout>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => navigate("/")} currentMode="shopping" />

      <div className="ios26-page-shell relative h-full w-full overflow-y-auto overflow-x-hidden bg-background">

        {/* Floating sidebar btn */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-background/40 backdrop-blur-2xl hover:bg-background/60 transition"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        {!hasResults ? (
          <div className="relative z-10 mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-5 py-24 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-[11vw] leading-[0.95] tracking-tight text-foreground md:text-[4.4rem]"
            >
              تسوق بذكاء.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="ios26-clean-copy mt-4 max-w-sm text-sm font-medium md:text-base"
            >
              اكتب اسم المنتج فقط، وسأعرض أفضل الخيارات فورًا مع مقارنة مختصرة.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
            >
              {[
                "iPhone 17 Pro",
                "AirPods Pro 3",
                "PlayStation 5",
                "Dyson V15",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => setInput(item)}
                  className="rounded-full ios26-surface-card px-4 py-2 text-sm font-semibold text-foreground/78"
                >
                  {item}
                </button>
              ))}
            </motion.div>

            {/* Live preview as user types */}
            {livePreview.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {livePreview.map((p, i) => <ProductCard key={i} p={p} />)}
              </motion.div>
            )}
          </div>
        ) : (
          <div className="relative z-10 mx-auto max-w-5xl px-4 pb-48 pt-20">
            {messages.map((m, i) => (
              <div key={i} className="mb-4">
                {m.attachedImages && m.attachedImages.length > 0 && (
                  <div className="mb-2 flex flex-wrap justify-end gap-2">
                    {m.attachedImages.map((img, j) => (
                      <img key={j} src={img} alt="" className="h-24 w-24 rounded-2xl object-cover" />
                    ))}
                  </div>
                )}
                {m.products && m.products.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {m.products.map((p, j) => <ProductCard key={j} p={p} />)}
                  </div>
                )}
                {m.content && <ChatMessage role={m.role} content={m.content} />}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {isLoading && !hasResults && (
          <div className="pointer-events-none fixed inset-x-0 bottom-40 z-20 flex justify-center">
            <div className="flex items-center gap-2 rounded-full ios26-surface-card px-4 py-2 text-sm font-semibold text-foreground/75">
              <Sparkles className="h-4 w-4 animate-pulse" />
              جاري تجهيز أفضل النتائج
            </div>
          </div>
        )}

        <LiquidWorkspaceInput
          value={input}
          onChange={setInput}
          onSend={send}
          onStop={stop}
          isLoading={isLoading}
          placeholder="اكتب اسم المنتج أو ما الذي تريد شراءه"
          canSend={Boolean(input.trim() || attachedFiles.length > 0)}
          hidePlus
          attachments={attachedFiles}
          onRemoveAttachment={(index) => setAttachedFiles((prev) => prev.filter((_, i) => i !== index))}
          textareaRef={textareaRef}
        />
      </div>
    </AppLayout>
  );
};

export default ShoppingModePage;
