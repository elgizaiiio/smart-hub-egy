import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Camera, Image as ImageIcon, FileUp, NotebookPen, ClipboardList, CalendarDays, Timer } from "lucide-react";
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

interface Message {
  role: "user" | "assistant";
  content: string;
  attachedImages?: string[];
  attachedFiles?: { name: string; type: string }[];
}

const LEARNING_PROMPT =
  "You are a smart, adaptive learning tutor using the Feynman technique. " +
  "CRITICAL: ALWAYS reply in the EXACT same language AND dialect the user wrote in. " +
  "ABSOLUTE RULES — VIOLATING THESE BREAKS THE PRODUCT: " +
  "1) NEVER introduce yourself. NEVER say 'I am Megsy', 'I am an AI', 'I'm here to help', 'مرحبا أنا ميغسي', or any greeting/intro. Just answer directly. " +
  "2) NEVER end messages with offers like 'let me know if', 'feel free to ask', 'do you want me to'. " +
  "3) ONLY mention who you are if the user EXPLICITLY asks 'who are you' or 'what's your name'. " +
  "RESPONSE LENGTH — match length to question complexity: " +
  "• Greetings / yes-no → 1 short sentence. " +
  "• Simple factual → 1-2 sentences. " +
  "• 'Explain' → 1 paragraph + 3-4 bullets max. " +
  "• 'Teach me' / complex → structured breakdown with headings, bullets, examples. " +
  "When the user attaches images or files, READ THEM CAREFULLY and answer based on the actual content — never say 'I can't see the image'.";

const STUDY_TOOLS = [
  { id: "smart-notes", label: "Smart Notes", icon: NotebookPen, route: "/tools/smart-notes" },
  { id: "exam", label: "Exam Simulator", icon: ClipboardList, route: "/tools/exam-simulator" },
  { id: "planner", label: "Study Planner", icon: CalendarDays, route: "/tools/study-planner" },
  { id: "focus", label: "Focus Room", icon: Timer, route: "/tools/focus-room" },
];

const LearningModePage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
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
  }, [messages, isThinking]);

  const handleNewChat = useCallback(() => {
    setInput("");
    setMessages([]);
    setAttachedFiles([]);
    setIsLoading(false);
    setIsThinking(false);
    abortRef.current?.abort();
    abortRef.current = null;
    setConversationId(null);
    navigate("/learning");
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

  const send = useCallback(async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: input.trim() || "(attached files)",
      attachedImages: attachedFiles.filter((file) => file.type === "image").map((file) => file.data),
      attachedFiles: attachedFiles.filter((file) => file.type !== "image").map((file) => ({ name: file.name, type: file.type })),
    };

    setMessages((prev) => [...prev, userMsg]);
    const sentInput = input;
    const sentFiles = [...attachedFiles];
    setInput("");
    setAttachedFiles([]);
    setIsThinking(true);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages = [
      { role: "assistant" as const, content: LEARNING_PROMPT },
      ...messages.map((message) => ({ role: message.role, content: message.content })),
      {
        role: "user" as const,
        content:
          sentFiles.filter((file) => file.type === "image").length > 0
            ? [
                { type: "text", text: sentInput || "Analyze the image" },
                ...sentFiles
                  .filter((file) => file.type === "image")
                  .map((file) => ({ type: "image_url", image_url: { url: file.data } })),
              ]
            : sentInput,
      },
    ];

    let assistantBuffer = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat({
      messages: apiMessages as any,
      model: "google/gemini-2.5-flash-lite-preview-09-2025",
      chatMode: "learning",
      user_id: userId ?? undefined,
      signal: controller.signal,
      onDelta: (delta) => {
        setIsThinking(false);
        assistantBuffer += delta;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistantBuffer };
          return copy;
        });
      },
      onDone: async () => {
        setIsLoading(false);
        setIsThinking(false);
        abortRef.current = null;
        if (userId && assistantBuffer) {
          const newId = await saveConversation({
            conversationId,
            userId,
            mode: "learning",
            title: sentInput || "Learning chat",
            messages: [
              { role: "user", content: sentInput || "(attached files)", images: userMsg.attachedImages },
              { role: "assistant", content: assistantBuffer },
            ],
          });
          if (newId && !conversationId) setConversationId(newId);
        }
      },
      onError: (error) => {
        toast.error(error);
        setIsLoading(false);
        setIsThinking(false);
      },
    });
  }, [attachedFiles, conversationId, input, isLoading, messages, userId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setIsThinking(false);
  }, []);

  return (
    <AppLayout>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={handleNewChat} currentMode="learning" />

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFile(e.target.files, "file")} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFile(e.target.files, "image")} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files, "image")} />

      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden milk-page-canvas">
        <div className="mx-auto min-h-full max-w-3xl px-4 pb-44 pt-4">
          <button onClick={() => setSidebarOpen(true)} className="milk-top-button fixed left-4 top-4 z-40">
            <Menu className="h-5 w-5" />
          </button>

          {messages.length === 0 ? (
            <div className="flex min-h-[calc(100dvh-220px)] flex-col items-center justify-center text-center">
              <span className="milk-lite-pill">Learning</span>
              <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">تعلّم بهدوء وتركيز.</h1>

              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {STUDY_TOOLS.map(({ id, label, icon: Icon, route }) => (
                  <button key={id} onClick={() => navigate(route)} className="milk-example-chip">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-16">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`}>
                  {message.attachedImages && message.attachedImages.length > 0 && (
                    <div className="mb-2 flex flex-wrap justify-end gap-2">
                      {message.attachedImages.map((image, imageIndex) => (
                        <img key={imageIndex} src={image} alt="attachment" className="h-24 w-24 rounded-[22px] object-cover shadow-sm" />
                      ))}
                    </div>
                  )}
                  <ChatMessage role={message.role} content={message.content} />
                </div>
              ))}
              {isThinking && <ThinkingLoader searchStatus="ميغسي ترتّب الشرح الآن…" />}
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
              placeholder="اسأل عن أي درس أو ارفع صورة أو ملف…"
              showPlus
              plusOpen={plusOpen}
              onTogglePlus={() => setPlusOpen((prev) => !prev)}
              attachedFiles={attachedFiles}
              onRemoveAttachment={(index) => setAttachedFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
              sendDisabled={!input.trim() && attachedFiles.length === 0}
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

export default LearningModePage;
