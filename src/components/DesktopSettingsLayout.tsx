import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  User, CreditCard, Gift, Globe, Paintbrush, Activity, Info, LogOut, ChevronRight, Code, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/layouts/AppLayout";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  external?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Preferences",
    items: [
      { id: "customization", label: "Customization", icon: Paintbrush, path: "/settings/customization" },
    ],
  },
  {
    title: "Agent & Integrations",
    items: [
      { id: "integrations", label: "Integrations", icon: Zap, path: "/settings/integrations" },
    ],
  },
  {
    title: "Account & Billing",
    items: [
      { id: "account", label: "Account", icon: User, path: "/settings/profile" },
      { id: "billing", label: "Billing", icon: CreditCard, path: "/settings/billing" },
      { id: "referrals", label: "Referrals", icon: Gift, path: "/settings/referrals" },
      { id: "apis", label: "APIs", icon: Code, path: "/settings/apis" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "status", label: "Status Page", icon: Activity, path: "/status" },
      { id: "about", label: "About", icon: Info, path: "/about" },
    ],
  },
];

interface DesktopSettingsLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function DesktopSettingsLayout({ children, title, subtitle }: DesktopSettingsLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppLayout>
    <div className="h-full bg-background flex">
      {/* Sidebar */}
      <div className="w-[280px] border-r border-border flex flex-col overflow-y-auto shrink-0">
        <div className="px-5 py-5">
          <h1 className="font-display text-xl font-bold text-foreground">Settings</h1>
        </div>

        <div className="flex-1 px-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        item.external
                          ? window.open(item.path, "_blank", "noopener,noreferrer")
                          : navigate(item.path)
                      }
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {(hoveredItem === item.id || active) && (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="px-3 pb-5 pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {title && (
          <div className="px-8 pt-8 pb-2">
            <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        )}
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
    </AppLayout>
  );
}

export default DesktopSettingsLayout;
