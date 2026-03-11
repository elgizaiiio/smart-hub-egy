import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

interface AppShowcaseGalleryProps {
  mode: "images" | "videos";
  onItemClick: (item: ShowcaseItem) => void;
}

const AppShowcaseGallery = ({ mode, onItemClick }: AppShowcaseGalleryProps) => {
  const [dbItems, setDbItems] = useState<ShowcaseItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const mediaType = mode === "images" ? "image" : "video";
      const { data } = await supabase
        .from("showcase_items" as any)
        .select("*")
        .eq("media_type", mediaType)
        .order("display_order", { ascending: true });
      if (data) setDbItems(data as unknown as ShowcaseItem[]);
    };
    load();
  }, [mode]);

  if (dbItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-center px-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {mode === "images" ? "No images in showcase yet" : "No videos in showcase yet"}
          </p>
        </div>
      </div>
    );
  }

  const handleCopyPrompt = (e: React.MouseEvent, prompt: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied!");
  };

  const handleReuse = (e: React.MouseEvent, item: ShowcaseItem) => {
    e.stopPropagation();
    onItemClick(item);
  };

  return (
    <div className="p-3 md:p-4">
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3">
        {dbItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="break-inside-avoid mb-3 cursor-pointer group relative rounded-2xl overflow-hidden"
            onClick={() => onItemClick(item)}
          >
            {item.media_type === "video" ? (
              <video
                src={item.media_url}
                muted
                loop
                playsInline
                autoPlay
                className="w-full rounded-2xl object-cover pointer-events-auto"
                onMouseEnter={(e) => e.currentTarget.play()}
              />
            ) : (
              <img
                src={item.media_url}
                alt={item.prompt}
                className="w-full rounded-2xl object-cover pointer-events-auto"
                loading="lazy"
              />
            )}
            {/* Hover overlay - clean, no text outside */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex flex-col justify-end p-3">
              {/* Quick action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopyPrompt(e, item.prompt)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 backdrop-blur-xl text-white/90 text-[11px] font-medium hover:bg-white/25 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  onClick={(e) => handleReuse(e, item)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 backdrop-blur-xl text-white/90 text-[11px] font-medium hover:bg-white/25 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reuse
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AppShowcaseGallery;
