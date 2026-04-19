import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, ShoppingCart, Sparkles, ShieldCheck, TrendingUp, Star } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ChatMessage from "@/components/ChatMessage";
import ThinkingLoader from "@/components/ThinkingLoader";
import MilkInputBar from "@/components/chat/MilkInputBar";
import { streamChat } from "@/lib/streamChat";
import { saveConversation } from "@/lib/conversationPersistence";

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
}

const SHOPPING_PROMPT =
  "You are a smart shopping assistant. " +
  "CRITICAL: ALWAYS reply in the user's EXACT language and dialect. " +
  "FORMAT: Product cards appear automatically — your TEXT response must be a brief expert summary in this exact structure: " +
  "1) One sentence saying which product is the best pick and why. " +
  "2) A short comparison (2-3 bullets) of the top 2-3 options on price, quality, value. " +
  "3) One closing line with a buying tip. " +
  "Keep it under 120 words. Never write long essays. Never list every product — the cards already do that.";

const QUICK_STARTS = ["iPhone 17 Pro 256GB", "أفضل لابتوب للدراسة", "سماعات عزل ضوضاء", "تكييف 1.5 حصان إنفرتر"];

const fallbackSummary = (query: string, products: Product[]) => {
  if (!products.length) return `وجدت نتائج أولية حول ${query}، لكن أحتاج إعادة المحاولة لالتقاط أفضل العروض بدقة.`;
  const [first, second, third] = products;
  const bullets = [second, third]
    .filter(Boolean)
    .map((product) => `- ${product?.title} — ${product?.price}${product?.seller ? ` • ${product.seller}` : ""}`)
    .join("\n");
  return [`أفضل ترشيح الآن هو ${first.title} لأنه يبدو الأكثر توازنًا من حيث السعر والقيمة المتاحة.`, bullets, "نصيحة شراء: افتح أكثر من متجر وتحقق من الضمان وسياسة الاسترجاع قبل الدفع."].filter(Boolean).join("\n");
};

const ShoppingModePage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [livePreview, setLivePreview] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const liveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setInput("");
    setMessages([]);
    setLivePreview([]);
    setIsLoading(false);
    setConversationId(null);
    navigate("/shopping");
  }, [navigate]);

  const fetchProducts = useCallback(async (query: string) => {
    const { data } = await supabase.functions.invoke("search", {
      body: { query, type: "shopping", limit: 8 },
    });
    return (data?.products || []) as Product[];
  }, []);

  useEffect(() => {
    if (!input.trim() || input.trim().length < 2) {
      setLivePreview([]);
      return;
    }

    if (liveDebounce.current) clearTimeout(liveDebounce.current);
    liveDebounce.current = setTimeout(async () => {
      try {
        const products = await fetchProducts(input);
        setLivePreview(products.slice(0, 8));
      } catch {
        setLivePreview([]);
      }
    }, 300);

    return () => {
      if (liveDebounce.current) clearTimeout(liveDebounce.current);
    };
  }, [fetchProducts, input]);

  const send = useCallback(async () => {
    const query = input.trim();
    if (!query || isLoading) return;

    const seededProducts = livePreview.length > 0 ? livePreview.slice(0, 8) : await fetchProducts(query);
    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "", products: seededProducts }]);
    setInput("");
    setLivePreview([]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages = [
      { role: "assistant" as const, content: SHOPPING_PROMPT },
      ...messages.map((message) => ({ role: message.role, content: message.content })),
      { role: "user" as const, content: query },
    ];

    let assistantBuffer = "";
    let productsBuffer = seededProducts;

    const updateAssistant = (content: string, products: Product[]) => {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content, products };
        return copy;
      });
    };

    await streamChat({
      messages: apiMessages as any,
      model: "google/gemini-2.5-flash-lite-preview-09-2025",
      chatMode: "shopping",
      user_id: userId ?? undefined,
      signal: controller.signal,
      onDelta: (delta) => {
        assistantBuffer += delta;
        updateAssistant(assistantBuffer, productsBuffer);
      },
      onProducts: (products) => {
        productsBuffer = products;
        updateAssistant(assistantBuffer, productsBuffer);
      },
      onDone: async () => {
        const finalText = assistantBuffer.trim() || fallbackSummary(query, productsBuffer);
        updateAssistant(finalText, productsBuffer);
        setIsLoading(false);
        abortRef.current = null;
        if (userId) {
          const id = await saveConversation({
            conversationId,
            userId,
            mode: "shopping",
            title: query.slice(0, 60),
            messages: [
              { role: "user", content: query },
              { role: "assistant", content: finalText },
            ],
          });
          if (id && !conversationId) setConversationId(id);
        }
      },
      onError: async (error) => {
        const finalText = productsBuffer.length ? fallbackSummary(query, productsBuffer) : "";
        if (finalText) {
          updateAssistant(finalText, productsBuffer);
        } else {
          toast.error(error);
          setMessages((prev) => prev.slice(0, -1));
        }
        setIsLoading(false);
      },
    });
  }, [conversationId, fetchProducts, input, isLoading, livePreview, messages, userId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const ProductCard = ({ product }: { product: Product }) => (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-[26px] border border-border/60 bg-card/95 shadow-[0_14px_40px_hsl(0_0%_0%_/_.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_hsl(0_0%_0%_/_.08)]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-secondary/60">
        {product.image ? (
          <img src={product.image} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex min-h-[128px] flex-col gap-1 p-3">
        {product.seller ? <span className="text-[11px] font-semibold text-muted-foreground">{product.seller}</span> : null}
        <h3 className="line-clamp-2 text-sm font-bold leading-5 text-foreground">{product.title}</h3>
        {product.rating ? (
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{product.rating}</span>
          </div>
        ) : null}
        <div className="mt-auto pt-2 text-base font-bold text-foreground">{product.price}</div>
      </div>
    </a>
  );

  return (
    <AppLayout>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={handleNewChat} currentMode="shopping" />

      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden milk-page-canvas">
        <div className="mx-auto min-h-full max-w-5xl px-4 pb-44 pt-4">
          <button onClick={() => setSidebarOpen(true)} className="milk-top-button fixed left-4 top-4 z-40">
            <Menu className="h-5 w-5" />
          </button>

          {messages.length === 0 ? (
            <div className="flex min-h-[calc(100dvh-220px)] flex-col items-center justify-center text-center">
              <span className="milk-lite-pill">Shopping</span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-6xl">تسوّق بفهم.</h1>
              <p className="mt-3 max-w-lg text-sm font-medium text-muted-foreground">
                اكتب اسم المنتج أو المواصفات، شاهد النتائج تتجدد فورًا، ثم أرسل ليختار لك ميغسي أفضل ترشيح مع مقارنة قصيرة وواضحة.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {QUICK_STARTS.map((item) => (
                  <button key={item} onClick={() => setInput(item)} className="milk-example-chip">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 grid w-full max-w-2xl gap-3 md:grid-cols-3">
                <div className="milk-report-card p-4 text-right">
                  <div className="mb-3 flex items-center justify-between">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-foreground">بحث فوري</span>
                  </div>
                  <p className="text-sm font-medium leading-6 text-muted-foreground">النتائج تتجدد تلقائيًا مع كل حرف بعد 300ms.</p>
                </div>
                <div className="milk-report-card p-4 text-right">
                  <div className="mb-3 flex items-center justify-between">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-foreground">أفضل اختيار</span>
                  </div>
                  <p className="text-sm font-medium leading-6 text-muted-foreground">بعد الإرسال تحصل على ترشيح واحد واضح ثم مقارنة قصيرة بين الخيارات.</p>
                </div>
                <div className="milk-report-card p-4 text-right">
                  <div className="mb-3 flex items-center justify-between">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-foreground">روابط مباشرة</span>
                  </div>
                  <p className="text-sm font-medium leading-6 text-muted-foreground">افتح المتاجر مباشرة من البطاقات بدون خطوات معقدة.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-16">
              {messages.map((message, index) => {
                const isLastAssistant = message.role === "assistant" && index === messages.length - 1;
                return (
                  <div key={`${message.role}-${index}`} className="space-y-3">
                    {message.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="milk-query-bubble">{message.content}</div>
                      </div>
                    ) : (
                      <>
                        {message.products && message.products.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {message.products.map((product, productIndex) => (
                              <ProductCard key={`${product.title}-${productIndex}`} product={product} />
                            ))}
                          </div>
                        ) : null}

                        {message.content ? (
                          <div className="milk-report-card p-4">
                            <ChatMessage role="assistant" content={message.content} />
                          </div>
                        ) : isLoading && isLastAssistant ? (
                          <ThinkingLoader searchStatus="أراجع أفضل العروض الآن…" />
                        ) : null}
                      </>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {input.trim().length >= 2 && livePreview.length > 0 && (
          <div className="pointer-events-none fixed inset-x-0 bottom-[116px] z-30 px-3">
            <div className="pointer-events-auto mx-auto max-w-5xl rounded-[30px] border border-border/60 bg-card/95 p-3 shadow-[0_20px_60px_hsl(0_0%_0%_/_.08)] backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-bold text-foreground">نتائج لحظية</span>
                <span className="text-xs font-semibold text-muted-foreground">تتجدد مع كل حرف</span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {livePreview.map((product, index) => (
                  <ProductCard key={`${product.title}-${index}`} product={product} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-4 pt-2 pointer-events-none">
          <div className="mx-auto max-w-3xl pointer-events-auto">
            <MilkInputBar
              value={input}
              onChange={setInput}
              onSend={send}
              onStop={stop}
              isLoading={isLoading}
              placeholder="اكتب المنتج الذي تبحث عنه…"
              showPlus={false}
              sendDisabled={!input.trim()}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ShoppingModePage;
