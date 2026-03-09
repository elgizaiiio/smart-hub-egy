import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LazyVideo from "@/components/landing/LazyVideo";
import type { ShowcaseItem } from "@/components/ShowcaseGrid";

interface AppShowcaseGalleryProps {
  mode: "images" | "videos";
  onItemClick: (item: ShowcaseItem) => void;
}

const staticImages = [
  { src: "/showcase/img-1.jpg", model: "Megsy V1" },
  { src: "/showcase/img-2.jpg", model: "FLUX Kontext Max" },
  { src: "/showcase/img-3.jpg", model: "Nano Banana 2" },
  { src: "/showcase/img-4.jpg", model: "Recraft V4" },
  { src: "/showcase/img-5.jpg", model: "Ideogram 3" },
  { src: "/showcase/img-6.jpg", model: "HiDream I1" },
];

const staticVideos = [
  { src: "/showcase/vid-1.mp4", model: "Megsy Video" },
  { src: "/showcase/vid-2.mp4", model: "Veo 3.1" },
  { src: "/showcase/vid-3.mp4", model: "Kling 3.0 Pro" },
  { src: "/showcase/vid-4.mp4", model: "Runway Gen-4" },
  { src: "/showcase/vid-5.mp4", model: "Sora" },
  { src: "/showcase/vid-6.mp4", model: "Pika 2.2" },
];

const featuredModels = [
  { src: "/showcase/model-1.jpg", label: "MEGSY V1", desc: "Hyper-realistic portraits with cinematic depth", badge: "Megsy Model" },
  { src: "/showcase/model-6.jpg", label: "NANO BANANA 2", desc: "Classical painting style with atmospheric lighting" },
  { src: "/showcase/model-2.jpg", label: "FLUX KONTEXT MAX", desc: "The world's leading AI image editing & generation model" },
];

const featuredVideoModels = [
  { src: "/showcase/vid-1.mp4", label: "MEGSY VIDEO", desc: "Cinematic AI video generation by Megsy", badge: "Megsy Model" },
  { src: "/showcase/vid-2.mp4", label: "VEO 3.1", desc: "Google's state-of-the-art video model" },
  { src: "/showcase/vid-3.mp4", label: "KLING 3.0 PRO", desc: "Professional-grade AI video with natural motion" },
];

const AppShowcaseGallery = ({ mode, onItemClick }: AppShowcaseGalleryProps) => {
  const [dbItems, setDbItems] = useState<ShowcaseItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("showcase_items" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (data) setDbItems(data as unknown as ShowcaseItem[]);
    };
    load();
  }, []);

  const isImage = mode === "images";
  const staticItems = isImage ? staticImages : staticVideos;
  const featured = isImage ? featuredModels : featuredVideoModels;

  return (
    <div className="pb-8">
      {/* Hero title */}
      <section className="px-6 pt-8 pb-6 md:px-12 md:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {isImage ? "AI Image" : "AI Video"}{" "}
            <span className="text-primary">{isImage ? "Studio" : "Studio"}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            {isImage
              ? "Create stunning visuals with the world's most powerful AI image models. Just describe what you see."
              : "Generate cinematic video clips from text or images with cutting-edge AI models."}
          </p>
        </motion.div>
      </section>

      {/* Featured models — horizontal cards */}
      <section className="px-6 pb-10 md:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-lg font-black uppercase tracking-tight text-foreground mb-5 md:text-2xl"
        >
          Featured <span className="text-primary">Models</span>
        </motion.h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {featured.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border/30 aspect-[3/4] cursor-pointer"
            >
              {isImage ? (
                <img
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <LazyVideo src={item.src} className="h-full w-full" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

              {item.badge && (
                <div className="absolute top-3 left-3 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm md:text-xs">
                  {item.badge}
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <h3 className="font-display text-sm font-black uppercase tracking-tight text-foreground md:text-lg">
                  {item.label}
                </h3>
                <p className="mt-1 hidden text-sm text-muted-foreground/70 md:block">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Showcase grid — landing page style */}
      <section className="px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6 flex items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-black uppercase tracking-tight text-foreground md:text-2xl">
            Community <span className="text-primary">Showcase</span>
          </h2>
        </motion.div>

        {/* DB items */}
        {dbItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4 mb-6">
            {dbItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-border/30 cursor-pointer aspect-[4/5]"
                onClick={() => onItemClick(item)}
              >
                {item.media_type === "video" ? (
                  <video
                    src={item.media_url}
                    muted
                    loop
                    playsInline
                    autoPlay
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.prompt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
                  <div className="flex justify-end">
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white/80" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs line-clamp-2 font-medium text-white/90 mb-1.5">{item.prompt}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-xl text-white/80">{item.model_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-xl text-white/80">{item.aspect_ratio}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Static gallery items */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
          {staticItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-border/30 aspect-[4/5]"
            >
              {isImage ? (
                <img
                  src={item.src}
                  alt={item.model}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <LazyVideo src={item.src} className="h-full w-full" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/85 to-transparent p-4 pt-16 md:p-5 md:pt-20">
                <p className="text-xs font-bold text-foreground md:text-sm">{item.model}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AppShowcaseGallery;
