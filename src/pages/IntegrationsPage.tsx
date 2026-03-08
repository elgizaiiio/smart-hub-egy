import { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

// Brand SVG Icons
const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
    <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
    <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
    <path d="M15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" fill="#ECB22E"/>
  </svg>
);

const OutlookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M24 7.8v8.4c0 .99-.81 1.8-1.8 1.8H14V6h8.2c.99 0 1.8.81 1.8 1.8z" fill="#0364B8"/>
    <path d="M14 6v12H3.8c-.99 0-1.8-.81-1.8-1.8V7.8C2 6.81 2.81 6 3.8 6H14z" fill="#0078D4"/>
    <path d="M14 6v12l10-6V6H14z" fill="#28A8EA"/>
    <ellipse cx="8" cy="12" rx="3.5" ry="4" fill="#0078D4"/>
    <ellipse cx="8" cy="12" rx="2.2" ry="2.8" fill="white"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M7.71 3.5L1.15 15l3.44 5.96L11.15 9.46 7.71 3.5z" fill="#0066DA"/>
    <path d="M16.29 3.5H7.71l6.56 11.46h8.58L16.29 3.5z" fill="#00AC47"/>
    <path d="M1.15 15l3.44 5.96h14.82l3.44-5.96H1.15z" fill="#EA4335"/>
  </svg>
);

const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="white"/>
    <path d="M18.316 24L24 18.316V5.684L18.316 0H5.684L0 5.684v12.632L5.684 24h12.632z" fill="#4285F4"/>
    <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" fill="white"/>
    <path d="M12 7v5l3.5 2" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HubSpotIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF7A59">
    <path d="M17.002 8.283V5.53a1.97 1.97 0 0 0 1.143-1.783V3.7a1.97 1.97 0 0 0-1.97-1.97h-.048a1.97 1.97 0 0 0-1.97 1.97v.048c0 .776.457 1.447 1.117 1.76v2.775a5.537 5.537 0 0 0-2.794 1.27l-7.384-5.746a2.353 2.353 0 0 0 .076-.585A2.363 2.363 0 1 0 2.81 5.583l7.197 5.602a5.574 5.574 0 0 0 .378 6.415l-2.03 2.03a1.735 1.735 0 0 0-.506-.082 1.768 1.768 0 1 0 1.768 1.768c0-.18-.032-.352-.082-.513l1.997-1.997a5.565 5.565 0 1 0 5.47-10.523z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
  </svg>
);

const NotionIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.29 2.16c-.42-.326-.98-.7-2.055-.607L3.572 2.573c-.467.047-.56.28-.374.466l1.261 1.17zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.747 0-.933-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933l3.222-.186zM2.332 1.2L16.744.02c1.775-.14 2.24.14 2.988.7l4.11 2.895c.56.42.747.933.747 1.54v16.452c0 .98-.374 1.54-1.681 1.633L6.834 24c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.84.374-1.54 1.382-1.54v.073z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FigmaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" fill="#F24E1E"/>
    <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" fill="#FF7262"/>
    <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" fill="#1ABCFE"/>
    <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" fill="#0ACF83"/>
    <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" fill="#A259FF"/>
  </svg>
);

const TeamsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M20.625 8.25h-5.25v7.5c0 1.657 1.343 3 3 3h.75c1.657 0 3-1.343 3-3v-5.25a2.25 2.25 0 0 0-2.25-2.25z" fill="#5059C9"/>
    <path d="M19.5 6.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5z" fill="#5059C9"/>
    <path d="M13.5 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#7B83EB"/>
    <path d="M17.25 8.25H8.625A2.625 2.625 0 0 0 6 10.875V17.25a5.25 5.25 0 0 0 10.5 0v-8.25a.75.75 0 0 0-.75-.75z" fill="#7B83EB"/>
  </svg>
);

const ZoomIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#2D8CFF">
    <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-5.2-2.4l-3.6 2.4V9.6a1.2 1.2 0 0 0-1.2-1.2H6a1.2 1.2 0 0 0-1.2 1.2v4.8a1.2 1.2 0 0 0 1.2 1.2h8a1.2 1.2 0 0 0 1.2-1.2V12l3.6 2.4V9.6z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <defs>
      <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#E1306C"/>
        <stop offset="75%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" fill="url(#ig)"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const integrations = [
  { id: "github", name: "GitHub", description: "Connect repositories & create issues", icon: GitHubIcon, category: "Development", app: "github", isSvg: true },
  { id: "gmail", name: "Gmail", description: "Send and manage emails", icon: GmailIcon, category: "Communication", app: "gmail", isSvg: true },
  { id: "gdrive", name: "Google Drive", description: "Upload and manage files", icon: GoogleDriveIcon, category: "Storage", app: "googledrive", isSvg: true },
  { id: "gcalendar", name: "Google Calendar", description: "Create events & manage schedule", icon: GoogleCalendarIcon, category: "Productivity", app: "googlecalendar", isSvg: true },
  { id: "notion", name: "Notion", description: "Create pages & manage workspace", icon: NotionIcon, category: "Productivity", app: "notion", isSvg: true },
  { id: "slack", name: "Slack", description: "Send messages to channels", icon: SlackIcon, category: "Communication", app: "slack", isSvg: true },
  { id: "supabase", name: "Supabase", description: "Backend & database management", icon: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M13.73 21.766c-.28.354-.857.157-.857-.29V13.5h8.464c.736 0 1.137.852.673 1.432l-8.28 6.834z" fill="#3ECF8E"/>
      <path d="M13.73 21.766c-.28.354-.857.157-.857-.29V13.5h8.464c.736 0 1.137.852.673 1.432l-8.28 6.834z" fill="url(#sb1)" fillOpacity=".2"/>
      <path d="M10.27 2.234c.28-.354.857-.157.857.29V10.5H2.663c-.736 0-1.137-.852-.673-1.432l8.28-6.834z" fill="#3ECF8E"/>
      <defs><linearGradient id="sb1" x1="12.87" y1="15.3" x2="18.17" y2="19.07" gradientUnits="userSpaceOnUse"><stop stopColor="#249361"/><stop offset="1" stopColor="#3ECF8E"/></linearGradient></defs>
    </svg>
  ), category: "Development", app: "supabase", isSvg: true },
  { id: "hubspot", name: "HubSpot", description: "CRM & marketing automation", icon: HubSpotIcon, category: "Business", app: "hubspot", isSvg: true },
  { id: "youtube", name: "YouTube", description: "Search & manage video content", icon: YouTubeIcon, category: "Social", app: "youtube", isSvg: true },
  { id: "outlook", name: "Outlook", description: "Email & calendar management", icon: OutlookIcon, category: "Communication", app: "outlook", isSvg: true },
  { id: "figma", name: "Figma", description: "Design collaboration & assets", icon: FigmaIcon, category: "Development", app: "figma", isSvg: true },
  { id: "teams", name: "Microsoft Teams", description: "Team communication & meetings", icon: TeamsIcon, category: "Communication", app: "microsoftteams", isSvg: true },
  { id: "zoom", name: "Zoom", description: "Video meetings & webinars", icon: ZoomIcon, category: "Communication", app: "zoom", isSvg: true },
  { id: "instagram", name: "Instagram", description: "Share images and stories", icon: InstagramIcon, category: "Social", app: "instagram", isSvg: true },
  { id: "facebook", name: "Facebook", description: "Publish content to Facebook", icon: FacebookIcon, category: "Social", app: "facebook", isSvg: true },
  { id: "linkedin", name: "LinkedIn", description: "Share professional content", icon: LinkedInIcon, category: "Social", app: "linkedin", isSvg: true },
  { id: "discord", name: "Discord", description: "Send messages & manage servers", icon: DiscordIcon, category: "Communication", app: "discord", isSvg: true },
];

const IntegrationsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [connectedApps, setConnectedApps] = useState<Record<string, string>>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  useEffect(() => { loadConnections(); }, []);

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("composio", {
        body: { action: "list-connections", userId: "default" },
      });
      if (error) throw error;
      const items = data?.items || data || [];
      const connected: Record<string, string> = {};
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const appName = (item.appName || item.appUniqueId || "").toLowerCase();
          if (appName && item.status === "ACTIVE") connected[appName] = item.id;
        });
      }
      setConnectedApps(connected);
    } catch (e) {
      console.error("Failed to load connections:", e);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleConnect = async (integration: typeof integrations[0]) => {
    setLoadingApp(integration.id);
    try {
      const { data, error } = await supabase.functions.invoke("composio", {
        body: { action: "connect", app: integration.app, userId: "default" },
      });
      if (error) throw error;
      if (data?.redirectUrl) {
        const authWindow = window.open(data.redirectUrl, "_blank", "width=600,height=700");
        if (!authWindow) {
          toast.error("Please allow popups to connect.");
          return;
        }
        toast.success(`Opening ${integration.name} authorization...`);
        // Poll for connection status after auth window opens
        const pollInterval = setInterval(async () => {
          try {
            const { data: checkData } = await supabase.functions.invoke("composio", {
              body: { action: "list-connections", userId: "default" },
            });
            const items = checkData?.items || checkData || [];
            if (Array.isArray(items)) {
              const found = items.find((item: any) => {
                const appName = (item.appName || item.appUniqueId || "").toLowerCase();
                return appName === integration.app && item.status === "ACTIVE";
              });
              if (found) {
                clearInterval(pollInterval);
                setConnectedApps(prev => ({ ...prev, [integration.app]: found.id }));
                toast.success(`${integration.name} connected!`);
                setLoadingApp(null);
              }
            }
          } catch {}
        }, 3000);
        // Stop polling after 60s
        setTimeout(() => { clearInterval(pollInterval); setLoadingApp(null); }, 60000);
        return;
      } else if (data?.connectionStatus === "ACTIVE") {
        toast.success(`${integration.name} connected!`);
        setConnectedApps(prev => ({ ...prev, [integration.app]: data.id }));
      } else {
        toast.info(`${integration.name} connection initiated.`);
      }
    } catch (e: any) {
      toast.error(`Failed to connect ${integration.name}: ${e.message || "Unknown error"}`);
    } finally {
      setLoadingApp(null);
    }
  };

  const handleDisconnect = async (integration: typeof integrations[0]) => {
    const connectionId = connectedApps[integration.app];
    if (!connectionId) return;
    setLoadingApp(integration.id);
    try {
      const { error } = await supabase.functions.invoke("composio", {
        body: { action: "disconnect", connectionId, userId: "default" },
      });
      if (error) throw error;
      setConnectedApps(prev => {
        const next = { ...prev };
        delete next[integration.app];
        return next;
      });
      toast.success(`${integration.name} disconnected.`);
    } catch (e: any) {
      toast.error(`Failed to disconnect: ${e.message || "Unknown error"}`);
    } finally {
      setLoadingApp(null);
    }
  };

  const isConnected = (app: string) => !!connectedApps[app];
  const categories = [...new Set(integrations.map(i => i.category))];

  const IntegrationsContent = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-8 max-w-2xl">
      <p className="text-sm text-muted-foreground">Connect your favorite apps to use them directly from Megsy chat.</p>

      {isLoadingConnections ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        categories.map(cat => (
          <div key={cat}>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">{cat}</p>
            <div className="space-y-2">
              {integrations.filter(i => i.category === cat).map(integration => {
                const Icon = integration.icon;
                return (
                  <div key={integration.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                      <Icon />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">{integration.description}</p>
                    </div>
                    {isConnected(integration.app) ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-600">
                          <Check className="w-3 h-3" /> Connected
                        </span>
                        <button
                          onClick={() => handleDisconnect(integration)}
                          disabled={loadingApp === integration.id}
                          className="px-2 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {loadingApp === integration.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Disconnect"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(integration)}
                        disabled={loadingApp === integration.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {loadingApp === integration.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="Integrations" subtitle="Connect your favorite apps">
        <IntegrationsContent />
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Integrations</h1>
        </div>
        <div className="px-4">
          <IntegrationsContent />
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
