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
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-black text-white">
      <LandingNavbar />

      <HeroSection />

      <StatsMarquee />

      <div id="features">
        <FeatureBlock
          bigText="CREATE"
          title="CREATE IMAGES WITHOUT LIMITS"
          description="Generate high-quality visuals from simple prompts or custom models, tailored to your aesthetic and built to scale across concepts, styles, and use cases."
          media="/api-showcase/showcase-1.png"
          accentColor="text-sky-500"
        />

        <FeatureBlock
          bigText="ANIMATE"
          title="BRING VISUALS INTO MOTION"
          description="Turn static ideas into dynamic video content with AI-driven animation and motion tools designed for storytelling, social, and product experiences."
          media="/api-showcase/video-1.mp4"
          mediaType="video"
          accentColor="text-emerald-500"
          reverse
        />

        <FeatureBlock
          bigText="EDIT"
          title="EDIT WITH PRECISION"
          description="Edit images and video while preserving the elements that matter. Refine, adjust, and perfect your work without starting over."
          media="/api-showcase/showcase-4.jpg"
          accentColor="text-amber-500"
        />

        <FeatureBlock
          bigText="BUILD"
          title="BUILD & DEPLOY CODE"
          description="Build full-stack applications through conversation. Write, preview, and deploy production-ready code with live preview and one-click deployment."
          media="/api-showcase/showcase-3.jpg"
          accentColor="text-fuchsia-500"
          reverse
        />
      </div>

      <ShowcaseGallery />

      <ModelsMarquee />

      <HowItWorks />

      <PricingPreview />

      <FAQSection />

      <CTASection />

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
