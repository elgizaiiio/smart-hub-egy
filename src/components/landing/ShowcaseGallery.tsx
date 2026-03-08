import { motion } from "framer-motion";
import ModelBrandIcon from "@/components/landing/ModelBrandIcon";

const tools = [
  {
    title: "AI Image Studio",
    description:
      "توليد، تحسين، تعديل، وإخراج صور عالية الدقة من نفس الواجهة مع قوالب جاهزة للمنتجات والإعلانات.",
    image: "/api-showcase/showcase-1.png",
    models: [
      { id: "megsy-v1-img", name: "Megsy V1 Image" },
      { id: "flux-2-pro", name: "FLUX 2 Pro" },
      { id: "gpt-image", name: "GPT Image 1.5" },
    ],
  },
  {
    title: "AI Video Studio",
    description:
      "من نص أو صورة إلى فيديو سينمائي مع تحكم بالحركة والزوايا والفريمات، ثم تصدير مباشر للمحتوى النهائي.",
    image: "/api-showcase/video-1.mp4",
    mediaType: "video",
    models: [
      { id: "megsy-video", name: "Megsy Video" },
      { id: "veo-3.1", name: "Veo 3.1" },
      { id: "openai-sora", name: "Sora" },
    ],
  },
  {
    title: "AI Build & Code",
    description:
      "حوّل الفكرة إلى مشروع كامل: توليد كود، معاينة لحظية، ربط GitHub، ونشر بنقرة واحدة.",
    image: "/api-showcase/showcase-3.jpg",
    models: [
      { id: "megsy-v1", name: "Megsy V1" },
      { id: "openai/gpt-5", name: "GPT-5" },
      { id: "x-ai/grok-3", name: "Grok 3" },
    ],
  },
  {
    title: "AI Creative Workflow",
    description:
      "ابدأ بالدردشة، ثم تصميم، ثم فيديو، ثم نشر؛ كل خطوة متصلة بالخطوة التالية بدون تغيير أدوات.",
    image: "/api-showcase/showcase-4.jpg",
    models: [
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
      { id: "recraft-v4", name: "Recraft V4" },
      { id: "kling-3-pro", name: "Kling 3.0 Pro" },
    ],
  },
];

const ShowcaseGallery = () => {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-14"
        >
          <h2 className="font-display text-6xl font-black uppercase leading-[0.9] tracking-tight text-foreground md:text-8xl">
            FULL PLATFORM
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            هذه الأقسام تعرض المنصة كاملة: الفكرة، الإنتاج، التحسين، والنشر، مع نماذج حقيقية لكل مسار عمل.
          </p>
        </motion.div>

        <div className="scrollbar-hide -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-8">
          {tools.map((tool, index) => (
            <motion.article
              key={tool.title}
              initial={{ opacity: 0, x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, delay: index * 0.08 }}
              className="group w-[340px] flex-shrink-0 snap-center md:w-[420px]"
            >
              <div className="overflow-hidden rounded-3xl border border-border bg-card/70">
                <div className="relative h-60 overflow-hidden">
                  {tool.mediaType === "video" ? (
                    <video src={tool.image} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" autoPlay loop muted playsInline />
                  ) : (
                    <img src={tool.image} alt={tool.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                </div>

                <div className="space-y-4 p-6">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">{tool.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{tool.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {tool.models.map((model) => (
                      <span
                        key={model.id}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground"
                      >
                        <ModelBrandIcon modelId={model.id} className="h-3.5 w-3.5" />
                        {model.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShowcaseGallery;
