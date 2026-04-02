import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ToolItem {
  id: string;
  name: string;
  desc: string;
  route: string;
}

interface ToolCardGridProps {
  tools: ToolItem[];
  gradients: string[];
  type: "image" | "video";
}

const ToolCardGrid = ({ tools, gradients, type }: ToolCardGridProps) => {
  const navigate = useNavigate();
  const [toolImages, setToolImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadImages = async () => {
      const { data } = await supabase
        .from("tool_landing_images")
        .select("tool_id, image_url")
        .in("tool_id", tools.map(t => t.id));
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(d => { if (d.image_url) map[d.tool_id] = d.image_url; });
        setToolImages(map);
      }
    };
    loadImages();
  }, [tools]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {tools.map((tool, i) => {
        const img = toolImages[tool.id];
        const gradient = gradients[i % gradients.length];
        return (
          <motion.button
            key={tool.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(tool.route)}
            className="relative h-40 rounded-2xl overflow-hidden"
          >
            {img ? (
              type === "video" && (img.includes(".mp4") || img.includes("video")) ? (
                <video src={img} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <img src={img} alt={tool.name} className="absolute inset-0 w-full h-full object-cover" />
              )
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">{tool.desc}</p>
              <p className="text-sm font-bold text-white mt-0.5">{tool.name}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ToolCardGrid;
