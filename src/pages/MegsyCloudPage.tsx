import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Image, Video, FileText, Code, Mic, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/layouts/AppLayout";

type CloudTab = "all" | "images" | "videos" | "files" | "code" | "voice";

const MegsyCloudPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CloudTab>("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadItems(); }, [tab]);

  const loadItems = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const results: any[] = [];

    if (tab === "all" || tab === "images") {
      const { data: imgConvs } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("mode", "images");
      if (imgConvs?.length) {
        const ids = imgConvs.map(c => c.id);
        const { data } = await supabase.from("messages").select("content, images, created_at").eq("role", "assistant").not("images", "is", null).in("conversation_id", ids).order("created_at", { ascending: false }).limit(100);
        data?.forEach(m => (m.images || []).filter((u: string) => !u.includes(".mp4")).forEach((url: string) => results.push({ type: "image", url, prompt: m.content?.slice(0, 100), date: m.created_at })));
      }
    }

    if (tab === "all" || tab === "videos") {
      const { data: vidConvs } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("mode", "videos");
      if (vidConvs?.length) {
        const ids = vidConvs.map(c => c.id);
        const { data } = await supabase.from("messages").select("content, images, created_at").eq("role", "assistant").not("images", "is", null).in("conversation_id", ids).order("created_at", { ascending: false }).limit(50);
        data?.forEach(m => (m.images || []).filter((u: string) => u.includes(".mp4") || u.includes("video")).forEach((url: string) => results.push({ type: "video", url, prompt: m.content?.slice(0, 100), date: m.created_at })));
      }
    }

    if (tab === "all" || tab === "code") {
      const { data: projects } = await supabase.from("projects").select("id, name, preview_url, created_at, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      projects?.forEach(p => results.push({ type: "code", name: p.name, url: p.preview_url, date: p.created_at, id: p.id }));
    }

    if (tab === "all" || tab === "files") {
      const { data: fileConvs } = await supabase.from("conversations").select("id, title, created_at").eq("user_id", user.id).eq("mode", "files").order("created_at", { ascending: false }).limit(20);
      fileConvs?.forEach(c => results.push({ type: "file", name: c.title, date: c.created_at, id: c.id }));
    }

    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setItems(results);
    setLoading(false);
  };

  const tabs: { id: CloudTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "images", label: "Images" },
    { id: "videos", label: "Videos" },
    { id: "files", label: "Files" },
    { id: "code", label: "Code" },
    { id: "voice", label: "Voice" },
  ];

  return (
    <AppLayout>
      <div className="h-[100dvh] flex flex-col bg-background">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Megsy Cloud</h1>
        </div>

        <div className="flex gap-1 px-4 py-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm">No items yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Start creating to see your content here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl overflow-hidden border border-border/30 bg-secondary/50 group cursor-pointer hover:border-primary/30 transition-colors">
                  {item.type === "image" && (
                    <div className="aspect-square">
                      <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  {item.type === "video" && (
                    <div className="aspect-video">
                      <video src={item.url} className="w-full h-full object-cover" muted />
                    </div>
                  )}
                  {(item.type === "code" || item.type === "file") && (
                    <div className="aspect-square flex items-center justify-center bg-secondary">
                      {item.type === "code" ? <Code className="w-8 h-8 text-muted-foreground/30" /> : <FileText className="w-8 h-8 text-muted-foreground/30" />}
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-foreground truncate">{item.name || item.prompt || "Untitled"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default MegsyCloudPage;
