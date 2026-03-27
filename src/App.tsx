import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import LandingPage from "./pages/LandingPage";
import ImagesPage from "./pages/ImagesPage";
import VideosPage from "./pages/VideosPage";
import FilesPage from "./pages/FilesPage";
import ProgrammingPage from "./pages/ProgrammingPage";
import CodeWorkspace from "./pages/CodeWorkspace";
import ProfilePage from "./pages/ProfilePage";
import PricingPage from "./pages/PricingPage";
import SettingsPage from "./pages/SettingsPage";
import CustomizationPage from "./pages/CustomizationPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import BillingPage from "./pages/BillingPage";
import ReferralsPage from "./pages/ReferralsPage";

import LanguagePage from "./pages/LanguagePage";
import IntegrationsPage from "./pages/IntegrationsPage";
import NotFound from "./pages/NotFound";
import ChangeEmailPage from "./pages/ChangeEmailPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import DeleteAccountPage from "./pages/DeleteAccountPage";
import WithdrawPage from "./pages/WithdrawPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import OAuthAuthorizePage from "./pages/OAuthAuthorizePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SharedChatPage from "./pages/SharedChatPage";
import ContactPage from "./pages/ContactPage";
import ServiceImagesPage from "./pages/services/ServiceImagesPage";
import ServiceVideosPage from "./pages/services/ServiceVideosPage";
import ServiceChatPage from "./pages/services/ServiceChatPage";
import ServiceFilesPage from "./pages/services/ServiceFilesPage";
import ServiceCodePage from "./pages/services/ServiceCodePage";
import ImageStudioPage from "./pages/ImageStudioPage";
import VideoStudioPage from "./pages/VideoStudioPage";
import ImageAgentPage from "./pages/ImageAgentPage";
import VideoAgentPage from "./pages/VideoAgentPage";
import CookieConsent from "./components/CookieConsent";
import TranslationWrapper from "./components/TranslationWrapper";
import EgyptPage from "./pages/EgyptPage";
import ModelsPage from "./pages/ModelsPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import CareersPage from "./pages/CareersPage";
import SecurityPage from "./pages/SecurityPage";
import BlogPage from "./pages/BlogPage";
import ChangelogPage from "./pages/ChangelogPage";
import SupportPage from "./pages/SupportPage";
import EnterprisePage from "./pages/EnterprisePage";
import AboutPage from "./pages/AboutPage";
import AuthDocsPage from "./pages/AuthDocsPage";
import VoicePage from "./pages/VoicePage";
import VideoToTextPage from "./pages/tools/VideoToTextPage";

// Image tool pages
import InpaintPage from "./pages/tools/InpaintPage";
import ClothesChangerPage from "./pages/tools/ClothesChangerPage";
import HeadshotPage from "./pages/tools/HeadshotPage";
import BgRemoverPage from "./pages/tools/BgRemoverPage";
import FaceSwapPage from "./pages/tools/FaceSwapPage";
import RelightPage from "./pages/tools/RelightPage";
import ColorizerPage from "./pages/tools/ColorizerPage";
import CharacterSwapPage from "./pages/tools/CharacterSwapPage";
import StoryboardPage from "./pages/tools/StoryboardPage";
import SketchToImagePage from "./pages/tools/SketchToImagePage";
import RetouchingPage from "./pages/tools/RetouchingPage";
import RemoverPage from "./pages/tools/RemoverPage";
import HairChangerPage from "./pages/tools/HairChangerPage";
import CartoonPage from "./pages/tools/CartoonPage";
import AvatarMakerPage from "./pages/tools/AvatarMakerPage";

// Video tool pages
import VideoSwapPage from "./pages/tools/VideoSwapPage";
import VideoUpscalePage from "./pages/tools/VideoUpscalePage";
import TalkingPhotoPage from "./pages/tools/TalkingPhotoPage";
import VideoExtenderPage from "./pages/tools/VideoExtenderPage";
import AutoCaptionPage from "./pages/tools/AutoCaptionPage";
import LipSyncPage from "./pages/tools/LipSyncPage";
const queryClient = new QueryClient();

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

  if (loading) return <div className="h-screen bg-background" />;
  if (!authenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => {
  // Track current user ID to force remount of protected pages on account switch
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

      // Clear caches when user changes
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

      // Update currentUserId to force remount of all protected components
      setCurrentUserId(userId);
    });

    // Initialize
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <TranslationWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <OfflineBanner />
              <CookieConsent />
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/" element={<LandingPage />} />
                <Route path="/share/:shareId" element={<SharedChatPage />} />
                {/* key={currentUserId} forces complete remount when user switches accounts */}
                <Route path="/chat" element={<ProtectedRoute><ChatPage key={currentUserId} /></ProtectedRoute>} />
                <Route path="/images" element={<ProtectedRoute><ImagesPage key={currentUserId} /></ProtectedRoute>} />
                <Route path="/images/studio" element={<ProtectedRoute><ImageStudioPage key={currentUserId} /></ProtectedRoute>} />
                <Route path="/images/agent" element={<ProtectedRoute><ImageAgentPage key={currentUserId} /></ProtectedRoute>} />
                <Route path="/videos" element={<ProtectedRoute><VideosPage key={currentUserId} /></ProtectedRoute>} />
                <Route path="/videos/studio" element={<ProtectedRoute><VideoStudioPage key={currentUserId} /></ProtectedRoute>} />
                <Route path="/videos/agent" element={<ProtectedRoute><VideoAgentPage key={currentUserId} /></ProtectedRoute>} />
                <Route path="/files" element={<ProtectedRoute><FilesPage key={currentUserId} /></ProtectedRoute>} />
                {/* Image tool routes */}
                <Route path="/images/tools/inpaint" element={<ProtectedRoute><InpaintPage /></ProtectedRoute>} />
                <Route path="/images/tools/clothes-changer" element={<ProtectedRoute><ClothesChangerPage /></ProtectedRoute>} />
                <Route path="/images/tools/headshot" element={<ProtectedRoute><HeadshotPage /></ProtectedRoute>} />
                <Route path="/images/tools/bg-remover" element={<ProtectedRoute><BgRemoverPage /></ProtectedRoute>} />
                <Route path="/images/tools/face-swap" element={<ProtectedRoute><FaceSwapPage /></ProtectedRoute>} />
                <Route path="/images/tools/relight" element={<ProtectedRoute><RelightPage /></ProtectedRoute>} />
                <Route path="/images/tools/colorizer" element={<ProtectedRoute><ColorizerPage /></ProtectedRoute>} />
                <Route path="/images/tools/character-swap" element={<ProtectedRoute><CharacterSwapPage /></ProtectedRoute>} />
                <Route path="/images/tools/storyboard" element={<ProtectedRoute><StoryboardPage /></ProtectedRoute>} />
                <Route path="/images/tools/sketch-to-image" element={<ProtectedRoute><SketchToImagePage /></ProtectedRoute>} />
                <Route path="/images/tools/retouching" element={<ProtectedRoute><RetouchingPage /></ProtectedRoute>} />
                <Route path="/images/tools/remover" element={<ProtectedRoute><RemoverPage /></ProtectedRoute>} />
                <Route path="/images/tools/hair-changer" element={<ProtectedRoute><HairChangerPage /></ProtectedRoute>} />
                <Route path="/images/tools/cartoon" element={<ProtectedRoute><CartoonPage /></ProtectedRoute>} />
                <Route path="/images/tools/avatar-maker" element={<ProtectedRoute><AvatarMakerPage /></ProtectedRoute>} />
                {/* Video tool routes */}
                <Route path="/videos/tools/swap-characters" element={<ProtectedRoute><VideoSwapPage /></ProtectedRoute>} />
                <Route path="/videos/tools/upscale" element={<ProtectedRoute><VideoUpscalePage /></ProtectedRoute>} />
                <Route path="/videos/tools/talking-photo" element={<ProtectedRoute><TalkingPhotoPage /></ProtectedRoute>} />
                <Route path="/videos/tools/video-extender" element={<ProtectedRoute><VideoExtenderPage /></ProtectedRoute>} />
                <Route path="/videos/tools/auto-caption" element={<ProtectedRoute><AutoCaptionPage /></ProtectedRoute>} />
                <Route path="/videos/tools/lip-sync" element={<ProtectedRoute><LipSyncPage /></ProtectedRoute>} />
                <Route path="/code" element={<ProtectedRoute><ProgrammingPage key={currentUserId} /></ProtectedRoute>} />
                <Route path="/code/workspace" element={<ProtectedRoute><CodeWorkspace key={currentUserId} /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/settings/customization" element={<ProtectedRoute><CustomizationPage /></ProtectedRoute>} />
                <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
                <Route path="/settings/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                <Route path="/settings/referrals" element={<ProtectedRoute><ReferralsPage /></ProtectedRoute>} />
                <Route path="/settings/language" element={<ProtectedRoute><LanguagePage /></ProtectedRoute>} />
                <Route path="/settings/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
                <Route path="/settings/change-email" element={<ProtectedRoute><ChangeEmailPage /></ProtectedRoute>} />
                <Route path="/settings/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
                <Route path="/settings/delete-account" element={<ProtectedRoute><DeleteAccountPage /></ProtectedRoute>} />
                <Route path="/settings/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
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
                <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
                <Route path="/auth/docs" element={<AuthDocsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </TranslationWrapper>
  );
};

export default App;
