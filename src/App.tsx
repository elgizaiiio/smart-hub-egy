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
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
    else document.documentElement.setAttribute("data-theme", "light");
    const savedAccent = localStorage.getItem("accent");
    if (savedAccent) document.documentElement.style.setProperty("--primary", savedAccent);
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
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/images" element={<ProtectedRoute><ImagesPage /></ProtectedRoute>} />
                <Route path="/images/studio" element={<ProtectedRoute><ImageStudioPage /></ProtectedRoute>} />
                <Route path="/images/agent" element={<ProtectedRoute><ImageAgentPage /></ProtectedRoute>} />
                <Route path="/videos" element={<ProtectedRoute><VideosPage /></ProtectedRoute>} />
                <Route path="/videos/studio" element={<ProtectedRoute><VideoStudioPage /></ProtectedRoute>} />
                <Route path="/videos/agent" element={<ProtectedRoute><VideoAgentPage /></ProtectedRoute>} />
                <Route path="/files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
                <Route path="/code" element={<ProtectedRoute><ProgrammingPage /></ProtectedRoute>} />
                <Route path="/code/workspace" element={<ProtectedRoute><CodeWorkspace /></ProtectedRoute>} />
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
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/changelog" element={<ChangelogPage />} />
                <Route path="/services/images" element={<ServiceImagesPage />} />
                <Route path="/services/videos" element={<ServiceVideosPage />} />
                <Route path="/services/chat" element={<ServiceChatPage />} />
                <Route path="/services/files" element={<ServiceFilesPage />} />
                <Route path="/services/code" element={<ServiceCodePage />} />
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
