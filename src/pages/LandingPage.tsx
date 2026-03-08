import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsMarquee from "@/components/landing/StatsMarquee";
import FeatureBlock from "@/components/landing/FeatureBlock";
import ModelsMarquee from "@/components/landing/ModelsMarquee";
import ShowcaseGallery from "@/components/landing/ShowcaseGallery";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingPreview from "@/components/landing/PricingPreview";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

const LandingPage = () => {
  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingNavbar />

      <HeroSection />

      <StatsMarquee />

      <div id="features">
        <FeatureBlock
          bigText="CONVERSE"
          bigTextTone="text-primary/15"
          title="AI Chat"
          description="منصة المحادثة في Megsy مخصصة لتخطيط المشاريع، كتابة المحتوى، تحليل الملفات، وتنفيذ الأفكار المعقدة بسياق طويل ودقة عالية."
          features={[
            "محادثات متعددة الجولات بسياق ثابت وسريع",
            "تحليل ملفات وصور داخل نفس نافذة الشات",
            "استخراج خطط تنفيذ واضحة من أي فكرة",
            "دعم نماذج reasoning لأسئلة عميقة ومعقدة",
          ]}
          media="/api-showcase/showcase-1.png"
          models={[
            { id: "megsy-v1", name: "Megsy V1" },
            { id: "openai/gpt-5", name: "GPT-5" },
            { id: "x-ai/grok-3", name: "Grok 3" },
          ]}
        />

        <FeatureBlock
          bigText="CREATE"
          bigTextTone="text-primary/18"
          title="Image Generation"
          description="قسم الصور مصمم للمخرجات التجارية والابداعية: من مفهوم سريع إلى نتائج جاهزة للإعلانات، الهوية، والسوشيال."
          features={[
            "20+ نماذج صور بأساليب متعددة",
            "تبديل سريع بين النماذج أثناء نفس الجلسة",
            "تحكم أفضل في التركيب، الستايل، وجودة التفاصيل",
            "دعم سير عمل كامل من Prompt إلى Export",
          ]}
          media="/api-showcase/showcase-2.jpg"
          reverse
          models={[
            { id: "megsy-v1-img", name: "Megsy V1 Image" },
            { id: "flux-2-pro", name: "FLUX 2 Pro" },
            { id: "gpt-image", name: "GPT Image 1.5" },
          ]}
        />

        <FeatureBlock
          bigText="ANIMATE"
          bigTextTone="text-primary/14"
          title="Video Generation"
          description="حوّل النص أو الصور إلى فيديو واقعي بمسارات حركة دقيقة ومخرجات مناسبة للتسويق، المحتوى، والعروض التقديمية."
          features={[
            "Text-to-video و Image-to-video في نفس المنصة",
            "نماذج سينمائية متعددة الجودة والسرعة",
            "دعم أول/آخر فريم للتحكم في المشهد",
            "مسار تصدير بسيط للفيديو النهائي",
          ]}
          media="/api-showcase/video-1.mp4"
          mediaType="video"
          models={[
            { id: "megsy-video", name: "Megsy Video" },
            { id: "veo-3.1", name: "Veo 3.1" },
            { id: "openai-sora", name: "Sora" },
          ]}
        />

        <FeatureBlock
          bigText="ENHANCE"
          bigTextTone="text-primary/16"
          title="Image Tools"
          description="أدوات احترافية لتحسين الصور بعد التوليد: ترميم، إزالة عناصر، تكبير جودة، تغيير الخلفية، وإخراج جاهز للنشر."
          features={[
            "18+ أدوات تعديل فعلية داخل نفس الواجهة",
            "دعم سير قبل/بعد مع نتائج أسرع",
            "أدوات ترميم وصقل للمنتجات والبورتريه",
            "مناسبة لفرق التصميم والإعلانات",
          ]}
          media="/api-showcase/showcase-4.jpg"
          reverse
          models={[
            { id: "nano-banana-2", name: "Nano Banana 2" },
            { id: "recraft-v4", name: "Recraft V4" },
            { id: "fal-omnigen2", name: "OmniGen2" },
          ]}
        />

        <FeatureBlock
          bigText="BUILD"
          bigTextTone="text-primary/14"
          title="Code & Deploy"
          description="اكتب واجهات ومشاريع كاملة عبر الحوار، عاين مباشرة، وعدّل بسرعة، ثم انشر المنتج في دقائق بدل ساعات."
          features={[
            "توليد واجهات ومكونات React بسرعة",
            "معاينة فورية للتعديلات لحظة بلحظة",
            "تنظيم أفضل لرحلة التطوير من نفس المحادثة",
            "سير عمل متكامل من الفكرة للنشر",
          ]}
          media="/api-showcase/showcase-3.jpg"
          models={[
            { id: "megsy-v1", name: "Megsy V1" },
            { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
            { id: "openai/gpt-5", name: "GPT-5" },
          ]}
        />
      </div>

      <ModelsMarquee />

      <ShowcaseGallery />

      <HowItWorks />

      <PricingPreview />

      <FAQSection />

      <CTASection />

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
