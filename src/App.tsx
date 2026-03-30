import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import { lazy, Suspense } from "react";

// Eager-loaded core pages
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import LandingPage from "./pages/LandingPage";

// Lazy-loaded pages
const ImagesPage = lazy(() => import("./pages/ImagesPage"));
const VideosPage = lazy(() => import("./pages/VideosPage"));
const FilesPage = lazy(() => import("./pages/FilesPage"));
const ProgrammingPage = lazy(() => import("./pages/ProgrammingPage"));
const CodeWorkspace = lazy(() => import("./pages/CodeWorkspace"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const CustomizationPage = lazy(() => import("./pages/CustomizationPage"));
const ProfileSettingsPage = lazy(() => import("./pages/ProfileSettingsPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const ReferralsPage = lazy(() => import("./pages/ReferralsPage"));
const LanguagePage = lazy(() => import("./pages/LanguagePage"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ChangeEmailPage = lazy(() => import("./pages/ChangeEmailPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const DeleteAccountPage = lazy(() => import("./pages/DeleteAccountPage"));
const WithdrawPage = lazy(() => import("./pages/WithdrawPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));
const OAuthAuthorizePage = lazy(() => import("./pages/OAuthAuthorizePage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const SharedChatPage = lazy(() => import("./pages/SharedChatPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ServiceImagesPage = lazy(() => import("./pages/services/ServiceImagesPage"));
const ServiceVideosPage = lazy(() => import("./pages/services/ServiceVideosPage"));
const ServiceChatPage = lazy(() => import("./pages/services/ServiceChatPage"));
const ServiceFilesPage = lazy(() => import("./pages/services/ServiceFilesPage"));
const ServiceCodePage = lazy(() => import("./pages/services/ServiceCodePage"));
const ImageStudioPage = lazy(() => import("./pages/ImageStudioPage"));
const VideoStudioPage = lazy(() => import("./pages/VideoStudioPage"));
const ImageAgentPage = lazy(() => import("./pages/ImageAgentPage"));
const VideoAgentPage = lazy(() => import("./pages/VideoAgentPage"));
const CookieConsent = lazy(() => import("./components/CookieConsent"));
import TranslationWrapper from "./components/TranslationWrapper";
const EgyptPage = lazy(() => import("./pages/EgyptPage"));
const ModelsPage = lazy(() => import("./pages/ModelsPage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const ChangelogPage = lazy(() => import("./pages/ChangelogPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const EnterprisePage = lazy(() => import("./pages/EnterprisePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AuthDocsPage = lazy(() => import("./pages/AuthDocsPage"));
const VoicePage = lazy(() => import("./pages/VoicePage"));

// Image tools
const InpaintPage = lazy(() => import("./pages/tools/InpaintPage"));
const ClothesChangerPage = lazy(() => import("./pages/tools/ClothesChangerPage"));
const HeadshotPage = lazy(() => import("./pages/tools/HeadshotPage"));
const BgRemoverPage = lazy(() => import("./pages/tools/BgRemoverPage"));
const FaceSwapPage = lazy(() => import("./pages/tools/FaceSwapPage"));
const RelightPage = lazy(() => import("./pages/tools/RelightPage"));
const ColorizerPage = lazy(() => import("./pages/tools/ColorizerPage"));
const CharacterSwapPage = lazy(() => import("./pages/tools/CharacterSwapPage"));
const StoryboardPage = lazy(() => import("./pages/tools/StoryboardPage"));
const SketchToImagePage = lazy(() => import("./pages/tools/SketchToImagePage"));
const RetouchingPage = lazy(() => import("./pages/tools/RetouchingPage"));
const RemoverPage = lazy(() => import("./pages/tools/RemoverPage"));
const HairChangerPage = lazy(() => import("./pages/tools/HairChangerPage"));
const CartoonPage = lazy(() => import("./pages/tools/CartoonPage"));
const AvatarMakerPage = lazy(() => import("./pages/tools/AvatarMakerPage"));

// Video tools
const VideoSwapPage = lazy(() => import("./pages/tools/VideoSwapPage"));
const VideoUpscalePage = lazy(() => import("./pages/tools/VideoUpscalePage"));
const TalkingPhotoPage = lazy(() => import("./pages/tools/TalkingPhotoPage"));
const VideoExtenderPage = lazy(() => import("./pages/tools/VideoExtenderPage"));
const AutoCaptionPage = lazy(() => import("./pages/tools/AutoCaptionPage"));
const LipSyncPage = lazy(() => import("./pages/tools/LipSyncPage"));
const VideoToTextPage = lazy(() => import("./pages/tools/VideoToTextPage"));

// Agent pages
const MeetingNotesPage = lazy(() => import("./pages/agents/MeetingNotesPage"));
const SlidesAgentPage = lazy(() => import("./pages/agents/SlidesAgentPage"));
const SpreadsheetAgentPage = lazy(() => import("./pages/agents/SpreadsheetAgentPage"));
const ImageGeniusPage = lazy(() => import("./pages/agents/ImageGeniusPage"));
const AdDesignerPage = lazy(() => import("./pages/agents/AdDesignerPage"));
const YoutubeSummaryPage = lazy(() => import("./pages/agents/YoutubeSummaryPage"));
const PodcastAgentPage = lazy(() => import("./pages/agents/PodcastAgentPage"));
const BookCreatorPage = lazy(() => import("./pages/agents/BookCreatorPage"));
const SocialAnalyzerPage = lazy(() => import("./pages/agents/SocialAnalyzerPage"));
const NewsAgentPage = lazy(() => import("./pages/agents/NewsAgentPage"));
const DeepSearchPage = lazy(() => import("./pages/agents/DeepSearchPage"));
const PersonalAssistantPage = lazy(() => import("./pages/agents/PersonalAssistantPage"));
const StoreManagerPage = lazy(() => import("./pages/agents/StoreManagerPage"));
const MarketAnalyzerPage = lazy(() => import("./pages/agents/MarketAnalyzerPage"));

// New pages
const MegsyCloudPage = lazy(() => import("./pages/MegsyCloudPage"));
const AIPersonalizationPage = lazy(() => import("./pages/AIPersonalizationPage"));

const queryClient = new QueryClient();

const PageLoader = () => <div className="h-screen bg-background" />;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthenticated(!!session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <PageLoader />;
  if (!authenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
    else document.documentElement.setAttribute("data-theme", "light");
    const savedAccent = localStorage.getItem("accent");
    if (savedAccent) document.documentElement.style.setProperty("--primary", savedAccent);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id || null;
      const lastUserId = localStorage.getItem("megsy_last_user_id");
      if (userId && lastUserId && userId !== lastUserId) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("megsy_cache_")) keysToRemove.push(key);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        queryClient.clear();
      }
      if (userId) localStorage.setItem("megsy_last_user_id", userId);
      if (event === "SIGNED_OUT") {
        localStorage.removeItem("megsy_last_user_id");
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("megsy_cache_")) keysToRemove.push(key);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        queryClient.clear();
      }
      setCurrentUserId(userId);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const P = ({ children }: { children: React.ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>;

  return (
    <TranslationWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <OfflineBanner />
              <Suspense fallback={null}><CookieConsent /></Suspense>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/share/:shareId" element={<SharedChatPage />} />
                  <Route path="/chat" element={<P><ChatPage key={currentUserId} /></P>} />
                  <Route path="/images" element={<P><ImagesPage key={currentUserId} /></P>} />
                  <Route path="/images/studio" element={<P><ImageStudioPage key={currentUserId} /></P>} />
                  <Route path="/images/agent" element={<P><ImageAgentPage key={currentUserId} /></P>} />
                  <Route path="/videos" element={<P><VideosPage key={currentUserId} /></P>} />
                  <Route path="/videos/studio" element={<P><VideoStudioPage key={currentUserId} /></P>} />
                  <Route path="/videos/agent" element={<P><VideoAgentPage key={currentUserId} /></P>} />
                  <Route path="/files" element={<P><FilesPage key={currentUserId} /></P>} />
                  {/* Image tools */}
                  <Route path="/images/tools/inpaint" element={<P><InpaintPage /></P>} />
                  <Route path="/images/tools/clothes-changer" element={<P><ClothesChangerPage /></P>} />
                  <Route path="/images/tools/headshot" element={<P><HeadshotPage /></P>} />
                  <Route path="/images/tools/bg-remover" element={<P><BgRemoverPage /></P>} />
                  <Route path="/images/tools/face-swap" element={<P><FaceSwapPage /></P>} />
                  <Route path="/images/tools/relight" element={<P><RelightPage /></P>} />
                  <Route path="/images/tools/colorizer" element={<P><ColorizerPage /></P>} />
                  <Route path="/images/tools/character-swap" element={<P><CharacterSwapPage /></P>} />
                  <Route path="/images/tools/storyboard" element={<P><StoryboardPage /></P>} />
                  <Route path="/images/tools/sketch-to-image" element={<P><SketchToImagePage /></P>} />
                  <Route path="/images/tools/retouching" element={<P><RetouchingPage /></P>} />
                  <Route path="/images/tools/remover" element={<P><RemoverPage /></P>} />
                  <Route path="/images/tools/hair-changer" element={<P><HairChangerPage /></P>} />
                  <Route path="/images/tools/cartoon" element={<P><CartoonPage /></P>} />
                  <Route path="/images/tools/avatar-maker" element={<P><AvatarMakerPage /></P>} />
                  {/* Video tools */}
                  <Route path="/videos/tools/swap-characters" element={<P><VideoSwapPage /></P>} />
                  <Route path="/videos/tools/upscale" element={<P><VideoUpscalePage /></P>} />
                  <Route path="/videos/tools/talking-photo" element={<P><TalkingPhotoPage /></P>} />
                  <Route path="/videos/tools/video-extender" element={<P><VideoExtenderPage /></P>} />
                  <Route path="/videos/tools/auto-caption" element={<P><AutoCaptionPage /></P>} />
                  <Route path="/videos/tools/lip-sync" element={<P><LipSyncPage /></P>} />
                  <Route path="/videos/tools/video-to-text" element={<P><VideoToTextPage /></P>} />
                  {/* Agent routes */}
                  <Route path="/agents/meetings" element={<P><MeetingNotesPage /></P>} />
                  <Route path="/agents/slides" element={<P><SlidesAgentPage /></P>} />
                  <Route path="/agents/spreadsheets" element={<P><SpreadsheetAgentPage /></P>} />
                  <Route path="/agents/image-genius" element={<P><ImageGeniusPage /></P>} />
                  <Route path="/agents/ad-designer" element={<P><AdDesignerPage /></P>} />
                  <Route path="/agents/youtube-summary" element={<P><YoutubeSummaryPage /></P>} />
                  <Route path="/agents/podcast" element={<P><PodcastAgentPage /></P>} />
                  <Route path="/agents/book-creator" element={<P><BookCreatorPage /></P>} />
                  <Route path="/agents/social-analyzer" element={<P><SocialAnalyzerPage /></P>} />
                  <Route path="/agents/news" element={<P><NewsAgentPage /></P>} />
                  <Route path="/agents/deep-search" element={<P><DeepSearchPage /></P>} />
                  <Route path="/agents/assistant" element={<P><PersonalAssistantPage /></P>} />
                  <Route path="/agents/store" element={<P><StoreManagerPage /></P>} />
                  <Route path="/agents/market-analyzer" element={<P><MarketAnalyzerPage /></P>} />
                  {/* Cloud & Personalization */}
                  <Route path="/cloud" element={<P><MegsyCloudPage /></P>} />
                  <Route path="/settings/ai-personalization" element={<P><AIPersonalizationPage /></P>} />
                  {/* Core */}
                  <Route path="/voice" element={<P><VoicePage key={currentUserId} /></P>} />
                  <Route path="/code" element={<P><ProgrammingPage key={currentUserId} /></P>} />
                  <Route path="/code/workspace" element={<P><CodeWorkspace key={currentUserId} /></P>} />
                  <Route path="/profile" element={<P><ProfilePage /></P>} />
                  <Route path="/settings" element={<P><SettingsPage /></P>} />
                  <Route path="/settings/customization" element={<P><CustomizationPage /></P>} />
                  <Route path="/settings/profile" element={<P><ProfileSettingsPage /></P>} />
                  <Route path="/settings/billing" element={<P><BillingPage /></P>} />
                  <Route path="/settings/referrals" element={<P><ReferralsPage /></P>} />
                  <Route path="/settings/language" element={<P><LanguagePage /></P>} />
                  <Route path="/settings/integrations" element={<P><IntegrationsPage /></P>} />
                  <Route path="/settings/change-email" element={<P><ChangeEmailPage /></P>} />
                  <Route path="/settings/change-password" element={<P><ChangePasswordPage /></P>} />
                  <Route path="/settings/delete-account" element={<P><DeleteAccountPage /></P>} />
                  <Route path="/settings/withdraw" element={<P><WithdrawPage /></P>} />
                  <Route path="/notifications" element={<P><NotificationsPage /></P>} />
                  <Route path="/settings/notifications" element={<P><NotificationSettingsPage /></P>} />
                  <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/egypt" element={<EgyptPage />} />
                  <Route path="/apis" element={<PricingPage />} />
                  <Route path="/models" element={<ModelsPage />} />
                  <Route path="/cookies" element={<CookiePolicyPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/careers" element={<CareersPage />} />
                  <Route path="/security" element={<SecurityPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/changelog" element={<ChangelogPage />} />
                  <Route path="/services/images" element={<ServiceImagesPage />} />
                  <Route path="/services/videos" element={<ServiceVideosPage />} />
                  <Route path="/services/chat" element={<ServiceChatPage />} />
                  <Route path="/services/files" element={<ServiceFilesPage />} />
                  <Route path="/services/code" element={<ServiceCodePage />} />
                  <Route path="/enterprise" element={<EnterprisePage />} />
                  <Route path="/about" element={<P><AboutPage /></P>} />
                  <Route path="/auth/docs" element={<AuthDocsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </TranslationWrapper>
  );
};

export default App;
