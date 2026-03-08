import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import HorizontalGallery from "@/components/landing/HorizontalGallery";
import StatsMarquee from "@/components/landing/StatsMarquee";
import StickyFeatureTabs from "@/components/landing/StickyFeatureTabs";
import ParallaxShowcase from "@/components/landing/ParallaxShowcase";

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

      <HorizontalGallery />

      <StickyFeatureTabs />

      <ParallaxShowcase />

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
