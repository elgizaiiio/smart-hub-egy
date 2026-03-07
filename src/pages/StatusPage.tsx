import { ArrowLeft, CheckCircle, Database, Shield, HardDrive, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/DesktopSettingsLayout";

const services = [
  { name: "Database", subtitle: "No issues", icon: Database, status: "operational" },
  { name: "Authentication", subtitle: "No issues", icon: Shield, status: "operational" },
  { name: "File Storage", subtitle: "No issues", icon: HardDrive, status: "operational" },
  { name: "AI Services", subtitle: "No issues", icon: Bot, status: "operational" },
];

const StatusContent = () => {
  const statusColor = (s: string) =>
    s === "operational" ? "bg-emerald-500" : s === "degraded" ? "bg-amber-500" : "bg-red-500";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-md mx-auto">
      {/* Hero */}
      <div className="flex flex-col items-center py-6">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mb-4">
          <CheckCircle className="w-7 h-7 text-emerald-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Megsy is up and running</h2>
        <p className="text-sm text-muted-foreground">
          Having trouble? <span className="text-primary cursor-pointer hover:underline">Contact us</span>
        </p>
      </div>

      {/* Services */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">SERVICES</p>
        <div className="space-y-1">
          {services.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.name} className="flex items-center gap-3 py-3.5 px-1">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${statusColor(s.status)}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">No Issues</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-muted-foreground">Degraded</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-muted-foreground">Outage</span>
        </div>
      </div>
    </motion.div>
  );
};

const StatusPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <DesktopSettingsLayout title="System Status" subtitle="Service health and uptime">
        <StatusContent />
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
          <h1 className="font-display text-lg font-bold text-foreground">System Status</h1>
        </div>
        <div className="px-4">
          <StatusContent />
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
