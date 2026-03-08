import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface FeatureBlockProps {
  bigText: string;
  bigTextColor: string;
  title: string;
  description: string;
  features: string[];
  media: string;
  mediaType?: "image" | "video";
  reverse?: boolean;
  icon: LucideIcon;
}

const FeatureBlock = ({
  bigText,
  bigTextColor,
  title,
  description,
  features,
  media,
  mediaType = "image",
  reverse = false,
  icon: Icon,
}: FeatureBlockProps) => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Giant background text */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? 200 : -200 }}
        whileInView={{ opacity: 0.04, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className={`absolute top-1/2 -translate-y-1/2 ${reverse ? "right-0" : "left-0"} pointer-events-none select-none`}
      >
        <span
          className={`text-[20vw] md:text-[15vw] font-black uppercase leading-none tracking-tighter ${bigTextColor}`}
        >
          {bigText}
        </span>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div
          className={`flex flex-col ${
            reverse ? "lg:flex-row-reverse" : "lg:flex-row"
          } items-center gap-12 lg:gap-20`}
        >
          {/* Media */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 100 : -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="flex-1 w-full"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/5">
              {mediaType === "video" ? (
                <video
                  src={media}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                />
              ) : (
                <img
                  src={media}
                  alt={title}
                  className="w-full h-auto object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? -80 : 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="flex-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/20">
                <Icon size={22} className="text-purple-400" />
              </div>
              <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">
                {title}
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none mb-6">
              {bigText}
            </h2>

            <p className="text-white/50 text-lg leading-relaxed mb-8">
              {description}
            </p>

            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-1 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">
                    {i + 1}
                  </span>
                  <span className="text-white/60 text-sm">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureBlock;
