import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import AppLayout from "@/layouts/AppLayout";
import ChatMessage from "@/components/ChatMessage";
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
  "FORMAT: Product cards appear automatically — your TEXT must be a brief expert summary in this exact structure: " +
  "1) One sentence saying which product is the best pick and why. " +
  "2) A short comparison (2-3 bullets) of the top 2-3 options on price, quality, value. " +
  "3) One closing line with a buying tip. " +
  "Keep it under 120 words. Never list every product — the cards already do that.";

const QUICK_STARTS = ["iPhone 17 Pro 256GB", "أفضل لابتوب للدراسة", "سماعات عزل ضوضاء", "تكييف 1.5 حصان إنفرتر"];

const ShoppingModePage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [livePreview, setLivePreview] = useState<Product[]>([]);
  const [livePreviewLoading, setLivePreviewLoading] = useState(false);
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

  // Realtime preview: as user types, fetch products with debounce
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed.length < 2) {
      setLivePreview([]);
      setLivePreviewLoading(false);
      return;
    }
    if (liveDebounce.current) clearTimeout(liveDebounce.current);
    setLivePreviewLoading(true);
    liveDebounce.current = setTimeout(async () => {
      try {
        const products = await fetchProducts(trimmed);
        setLivePreview(products.slice(0, 8));
      } catch {
        setLivePreview([]);
      } finally {
        setLivePreviewLoading(false);
      }
    }, 320);

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
      ...messages.map((m) => ({ role: m.role, content: m.content })),
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
        setIsLoading(false);
        abortRef.current = null;
        if (userId && assistantBuffer.trim()) {
          const id = await saveConversation({
            conversationId,
            userId,
            mode: "shopping",
            title: query.slice(0, 60),
            messages: [
              { role: "user", content: query },
              { role: "assistant", content: assistantBuffer.trim() },
            ],
          });
          if (id && !conversationId) setConversationId(id);
        }
      },
      onError: (error) => {
        toast.error(error);
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
      className="group block overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_8px_22px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/5">
        {product.image ? (
          <img src={product.image} alt={product.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-black/40">
            <ShoppingCart className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex min-h-[120px] flex-col gap-1 p-3">
        {product.seller ? <span className="text-[11px] font-semibold text-black/45">{product.seller}</span> : null}
        <h3 className="line-clamp-2 text-sm font-bold leading-5 text-black">{product.title}</h3>
        {product.rating ? (
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{product.rating}</span>
          </div>
        ) : null}
        <div className="mt-auto pt-2 text-base font-bold text-black">{product.price}</div>
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
              <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">اكتب ما تريد شراءه وسأرتب لك أفضل الخيارات فورًا.</h1>

              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {QUICK_STARTS.map((item) => (
                  <button key={item} onClick={() => setInput(item)} className="milk-example-chip">
                    <span>{item}</span>
                  </button>
                ))}
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
                           <ThinkingLoader searchStatus="ميغسي تحلّل أفضل الخيارات الآن…" />
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

        {/* Realtime preview floating panel */}
        {input.trim().length >= 2 && (livePreview.length > 0 || livePreviewLoading) && (
          <div className="pointer-events-none fixed inset-x-0 bottom-[120px] z-30 px-3">
            <div className="pointer-events-auto mx-auto max-w-5xl rounded-[28px] border border-black/5 bg-white/95 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.1)] backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-bold text-black">نتائج لحظية</span>
                <span className="text-xs font-semibold text-black/45">
                  {livePreviewLoading ? "جارٍ البحث…" : "تتجدد مع كل حرف"}
                </span>
              </div>
              {livePreview.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {livePreview.map((product, index) => (
                    <ProductCard key={`${product.title}-${index}`} product={product} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="aspect-square rounded-[24px] bg-black/5 animate-pulse" />
                  ))}
                </div>
              )}
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
