import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatMessage from "@/components/ChatMessage";
import logo from "@/assets/logo.png";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

const SharedChatPage = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    (async () => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id, title, is_shared")
        .eq("share_id", shareId)
        .eq("is_shared", true)
        .single();

      if (!conv) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setTitle(conv.title);

      const { data: msgs } = await supabase
        .from("messages")
        .select("role, content, images")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });

      if (msgs) {
        setMessages(msgs.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          images: m.images || undefined,
        })));
      }
      setLoading(false);
    })();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-foreground">Chat not found</h2>
          <p className="text-sm text-muted-foreground">This shared chat doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/")} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Go to Megsy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Megsy" className="w-6 h-6" />
          <span className="font-bold text-foreground">Megsy</span>
          <span className="text-muted-foreground text-sm mx-2">·</span>
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">{title}</span>
        </div>
        <button onClick={() => navigate("/")} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          Try Megsy
        </button>
      </header>
      <div className="max-w-3xl mx-auto py-6 px-4 md:px-6 space-y-2">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} images={msg.images} />
        ))}
      </div>
    </div>
  );
};

export default SharedChatPage;
