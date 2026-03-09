import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export interface ShowcaseItem {
  id: string;
  media_url: string;
  media_type: string;
  prompt: string;
  model_id: string;
  model_name: string;
  aspect_ratio: string;
  quality: string;
  duration: string | null;
  style: string | null;
  display_order: number;
  created_at: string;
}

interface ShowcaseGridProps {
  onItemClick: (item: ShowcaseItem) => void;
}

const ShowcaseGrid = ({ onItemClick }: ShowcaseGridProps) => {
  const [items, setItems] = useState<ShowcaseItem[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("showcase_items" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (data) setItems(data as unknown as ShowcaseItem[]);
    };
    fetch();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 p-4">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
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
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-end p-3">
            <div className="text-white">
              <p className="text-xs line-clamp-2 font-medium">{item.prompt}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm">{item.model_name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm">{item.aspect_ratio}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ShowcaseGrid;
