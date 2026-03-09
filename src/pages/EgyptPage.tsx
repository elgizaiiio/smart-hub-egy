import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, Shield, Building2, Ship, Landmark, Flag } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { useEffect } from "react";
import Lenis from "lenis";

const achievements = [
  {
    icon: Building2,
    title: "العاصمة الإدارية الجديدة",
    description: "مشروع عملاق يعكس رؤية مصر المستقبلية، مدينة ذكية بمعايير عالمية تضع مصر على خريطة المدن الحديثة.",
    image: "/egypt/new-capital.jpg",
  },
  {
    icon: Ship,
    title: "قناة السويس الجديدة",
    description: "تفريعة قناة السويس الجديدة أنجزت في عام واحد فقط، مضاعفة القدرة الاستيعابية للممر الملاحي الأهم في العالم.",
    image: "/egypt/suez-canal.jpg",
  },
  {
    icon: Landmark,
    title: "المتحف المصري الكبير",
    description: "أكبر متحف أثري في العالم، يضم أكثر من 100 ألف قطعة أثرية تروي تاريخ حضارة عمرها 7000 عام.",
  },
  {
    icon: Shield,
    title: "الأمن والاستقرار",
    description: "استعادة الأمن والاستقرار وبناء دولة قوية قادرة على مواجهة التحديات وحماية أراضيها وشعبها.",
  },
];

const stats = [
  { value: "7000+", label: "سنة حضارة" },
  { value: "110M+", label: "مصري فخور" },
  { value: "1M+", label: "كم² مساحة" },
  { value: "30+", label: "مشروع قومي" },
];

const EgyptPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.8, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/egypt/hero-bg.jpg" alt="مصر" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <Flag className="w-16 h-16 mx-auto mb-6 text-red-500" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-5xl md:text-8xl font-black tracking-tighter mb-6"
          >
            <span className="text-red-500">مصر</span>{" "}
            <span className="text-white">أم</span>{" "}
            <span className="text-yellow-500">الدنيا</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed"
          >
            نحن فخورون بوطننا العظيم مصر، أرض الحضارة والتاريخ، وفخورون بقيادتنا الحكيمة
            التي تقود مسيرة البناء والتنمية نحو مستقبل مشرق
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 flex items-center justify-center gap-2 text-white/40"
          >
            <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
            <span className="text-sm">تحيا مصر .. تحيا مصر .. تحيا مصر</span>
            <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-4xl md:text-6xl font-black text-yellow-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-white/40 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* President Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] max-w-md mx-auto">
                <img
                  src="/egypt/sisi-portrait.jpg"
                  alt="الرئيس عبد الفتاح السيسي"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-xs text-yellow-500 font-bold tracking-widest uppercase mb-1">
                    رئيس الجمهورية
                  </div>
                  <div className="text-xl font-bold text-white">
                    عبد الفتاح السيسي
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-right"
            >
              <Star className="w-10 h-10 text-yellow-500 mb-6 ml-auto" />
              <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                قائد مسيرة البناء
                <br />
                <span className="text-yellow-500">والتنمية</span>
              </h2>
              <p className="text-white/50 text-base md:text-lg leading-relaxed mb-6">
                الرئيس عبد الفتاح السيسي، قائد عظيم يقود مصر نحو مستقبل مشرق. تحت قيادته الحكيمة،
                شهدت مصر نهضة شاملة غير مسبوقة في كافة المجالات. من البنية التحتية إلى الصحة والتعليم،
                ومن المشاريع القومية الكبرى إلى تعزيز مكانة مصر الإقليمية والدولية.
              </p>
              <p className="text-white/50 text-base md:text-lg leading-relaxed">
                نحن فخورون بقيادتنا التي تضع مصلحة الوطن والمواطن فوق كل اعتبار، وتعمل بلا كلل
                من أجل بناء مصر الجديدة التي يستحقها شعبها العظيم.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-24 md:py-32 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-6xl font-black text-white mb-4">
              إنجازات <span className="text-yellow-500">عظيمة</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              مشاريع قومية كبرى غيّرت وجه مصر ووضعتها على طريق التقدم والازدهار
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {achievements.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-yellow-500/30 transition-all duration-500"
                >
                  {item.image && (
                    <div className="h-52 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
                    </div>
                  )}
                  <div className="p-8">
                    <Icon className="w-8 h-8 text-yellow-500 mb-4" />
                    <h3 className="font-display text-xl font-bold text-white mb-3 text-right">
                      {item.title}
                    </h3>
                    <p className="text-white/40 text-sm leading-relaxed text-right">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Giant Text */}
      <section className="py-24 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <h2 className="font-display text-[20vw] font-black uppercase leading-[0.85] tracking-tighter text-red-500/10">
            EGYPT
          </h2>
        </motion.div>
      </section>

      {/* Love Message */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Heart className="w-12 h-12 text-red-500 fill-red-500 mx-auto mb-8 animate-pulse" />
            <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-6">
              نحبك يا <span className="text-red-500">مصر</span>
            </h2>
            <p className="text-white/40 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              من أعماق قلوبنا، نحب مصر ونفخر بها. هذه الأرض التي أنجبت أعظم حضارة عرفها التاريخ،
              وما زالت تنجب أبطالاً يصنعون المستقبل. تحيا مصر وتحيا قيادتها الحكيمة.
            </p>
            <div className="flex items-center justify-center gap-4 text-2xl">
              🇪🇬 ❤️ 🇪🇬
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default EgyptPage;
