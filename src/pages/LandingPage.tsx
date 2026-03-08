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
          bigText="CONVERSE"
          title="AI Chat"
          description="Engage in multi-turn conversations powered by Megsy V1 -- our flagship conversational AI with advanced reasoning, web search, memory, and file analysis capabilities."
          features={[
            "5 powerful chat models including Megsy V1 with superior reasoning",
            "Built-in web search for real-time information retrieval",
            "Persistent memory that learns your preferences over time",
            "Upload and analyze images, documents, and code files",
          ]}
          media="/api-showcase/showcase-1.png"
        />

        <FeatureBlock
          bigText="CREATE"
          title="Image Generation"
          description="Generate stunning visuals with 20+ specialized image models. From photorealistic portraits to abstract art, Megsy V1 Image leads the pack with unmatched quality and style diversity."
          features={[
            "20+ image generation models including Megsy V1 Image (flagship)",
            "18+ professional image tools: upscale, relight, restore, and more",
            "Styles from photorealistic to anime, illustration, and abstract",
            "Up to 4K resolution output with professional-grade quality",
          ]}
          media="/api-showcase/showcase-2.jpg"
          reverse
        />

        <FeatureBlock
          bigText="ANIMATE"
          title="Video Generation"
          description="Transform text and images into cinematic video sequences. Megsy Video delivers Hollywood-quality motion, physics simulation, and character consistency."
          features={[
            "10+ video models including Megsy Video (flagship cinematic model)",
            "Text-to-video and image-to-video generation pipelines",
            "First-and-last-frame control for precise scene direction",
            "Avatar animation and professional lip-sync capabilities",
          ]}
          media="/api-showcase/video-1.mp4"
          mediaType="video"
        />

        <FeatureBlock
          bigText="ENHANCE"
          title="Image Tools"
          description="18+ professional-grade tools to perfect your images after generation. Remove objects, swap backgrounds, upscale to 4K, relight scenes, and restore old photos."
          features={[
            "Remove objects, watermarks, and backgrounds instantly",
            "4K upscaling with AI-enhanced detail",
            "AI relighting and style transfer",
            "Product photography and professional headshot generation",
          ]}
          media="/api-showcase/showcase-4.jpg"
          reverse
        />

        <FeatureBlock
          bigText="BUILD"
          title="Code & Deploy"
          description="Build full-stack applications through conversation. Write, preview, and deploy production-ready code with live preview, GitHub sync, and one-click deployment."
          features={[
            "Real-time code generation with live preview in sandbox",
            "Support for React, HTML/CSS/JS, and full-stack frameworks",
            "GitHub repository sync and version control integration",
            "One-click deployment to Vercel with custom domains",
          ]}
          media="/api-showcase/showcase-3.jpg"
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
