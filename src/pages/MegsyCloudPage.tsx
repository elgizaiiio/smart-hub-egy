import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Image, Video, FileText, Code, X, Download, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/layouts/AppLayout";

type CloudTab = "all" | "images" | "videos" | "files" | "code";

const MegsyCloudPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CloudTab>("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ type: string; url?: string; name?: string } | null>(null);

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

  const handleItemClick = (item: any) => {
    if (item.type === "image") setPreview({ type: "image", url: item.url });
    else if (item.type === "video") setPreview({ type: "video", url: item.url });
    else if (item.type === "code" && item.url) window.open(item.url, "_blank");
    else if (item.type === "code") navigate(`/code?project=${item.id}`);
    else if (item.type === "file") navigate(`/files?conversation=${item.id}`);
  };

  const tabs: { id: CloudTab; label: string; icon: any }[] = [
    { id: "all", label: "All", icon: null },
    { id: "images", label: "Images", icon: Image },
    { id: "videos", label: "Videos", icon: Video },
    { id: "files", label: "Files", icon: FileText },
    { id: "code", label: "Code", icon: Code },
  ];

  return (
    <AppLayout>
      <div className="h-[100dvh] flex flex-col bg-background">
        <div className="flex items-center gap-3 px-4 py-3">
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
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => handleItemClick(item)} className="rounded-xl overflow-hidden border border-border/30 bg-secondary/50 group cursor-pointer hover:border-primary/30 transition-colors">
                  {item.type === "image" && (
                    <div className="aspect-square">
                      <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  {item.type === "video" && (
                    <div className="aspect-video relative">
                      <video src={item.url} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="w-8 h-8 text-white/80" />
                      </div>
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

        {/* Preview Modal */}
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4" onClick={() => setPreview(null)}>
              <button onClick={() => setPreview(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
                {preview.type === "image" && <img src={preview.url} alt="" className="w-full rounded-2xl object-contain max-h-[70vh]" />}
                {preview.type === "video" && <video src={preview.url} controls autoPlay className="w-full rounded-2xl max-h-[70vh]" />}
                <div className="flex justify-center mt-3">
                  <a href={preview.url} download className="fancy-btn">
                    <span className="fold" />
                    <div className="points_wrapper">{Array.from({ length: 8 }).map((_, i) => <span key={i} className="point" />)}</div>
                    <span className="inner flex items-center gap-2 text-sm"><Download className="w-4 h-4" /> Download</span>
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default MegsyCloudPage;
