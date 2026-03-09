import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, RotateCcw, Settings2, X, Lock, Unlock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ModelSelector, { type ModelOption } from "@/components/ModelSelector";

export type ImageStyle = "none" | "cinematic" | "creative" | "dynamic" | "fashion" | "portrait" | "stock-photo" | "vibrant" | "anime" | "3d-render";

export interface ImageDimensions {
  width: number;
  height: number;
  label: string;
}

export interface ImageSettings {
  style: ImageStyle;
  dimensions: ImageDimensions;
  numImages: number;
  privateMode: boolean;
}

const STYLES: { value: ImageStyle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "cinematic", label: "Cinematic" },
  { value: "creative", label: "Creative" },
  { value: "dynamic", label: "Dynamic" },
  { value: "fashion", label: "Fashion" },
  { value: "portrait", label: "Portrait" },
  { value: "stock-photo", label: "Stock Photo" },
  { value: "vibrant", label: "Vibrant" },
  { value: "anime", label: "Anime" },
  { value: "3d-render", label: "3D Render" },
];

const PRESET_DIMENSIONS: ImageDimensions[] = [
  { width: 768, height: 1024, label: "2:3" },
  { width: 1024, height: 1024, label: "1:1" },
  { width: 1024, height: 576, label: "16:9" },
];

const SOCIAL_PRESETS: ImageDimensions[] = [
  { width: 1200, height: 900, label: "Twitter/X (4:3)" },
  { width: 1080, height: 1350, label: "Instagram (4:5)" },
  { width: 1080, height: 1920, label: "TikTok (9:16)" },
];

const DEVICE_PRESETS: ImageDimensions[] = [
  { width: 1920, height: 1080, label: "Desktop (16:9)" },
  { width: 1024, height: 1024, label: "Square (1:1)" },
];

export const DEFAULT_SETTINGS: ImageSettings = {
  style: "none",
  dimensions: PRESET_DIMENSIONS[1], // 1:1
  numImages: 1,
  privateMode: false,
};

interface ImageSettingsPanelProps {
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  settings: ImageSettings;
  onSettingsChange: (settings: ImageSettings) => void;
  className?: string;
}

const ImageSettingsPanel = ({
  selectedModel,
  onModelChange,
  settings,
  onSettingsChange,
  className = "",
}: ImageSettingsPanelProps) => {
  const [styleOpen, setStyleOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const updateSetting = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleReset = () => onSettingsChange({ ...DEFAULT_SETTINGS });

  const dimRatio = settings.dimensions.width / settings.dimensions.height;

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {/* Model */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model</label>
        <ModelSelector
          mode="images"
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          colorClass="w-full justify-between bg-secondary text-foreground hover:bg-accent border border-border"
        />
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style</label>
        <div className="relative">
          <button
            onClick={() => setStyleOpen(!styleOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground hover:bg-accent transition-colors"
          >
            <span>{STYLES.find(s => s.value === settings.style)?.label || "None"}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {styleOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-60 overflow-y-auto"
              >
                {STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => { updateSetting("style", s.value); setStyleOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      settings.style === s.value ? "bg-accent text-accent-foreground" : "text-popover-foreground hover:bg-accent/50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image Dimensions</label>
        <div className="flex gap-2">
          {PRESET_DIMENSIONS.map(d => (
            <button
              key={d.label}
              onClick={() => updateSetting("dimensions", d)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                settings.dimensions.label === d.label
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-foreground border-border hover:bg-accent"
              }`}
            >
              {d.label}
            </button>
          ))}
          <Popover open={customOpen} onOpenChange={setCustomOpen}>
            <PopoverTrigger asChild>
              <button
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  !PRESET_DIMENSIONS.find(d => d.label === settings.dimensions.label)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-foreground border-border hover:bg-accent"
                }`}
              >
                Custom
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 space-y-4" side="right" align="start">
              {/* Aspect ratio preview */}
              <div className="flex justify-center">
                <div
                  className="border-2 border-primary rounded-lg bg-primary/10 transition-all"
                  style={{
                    width: dimRatio >= 1 ? 80 : 80 * dimRatio,
                    height: dimRatio >= 1 ? 80 / dimRatio : 80,
                  }}
                />
              </div>
              <div className="text-center text-xs text-muted-foreground">
                {settings.dimensions.width} × {settings.dimensions.height}
              </div>

              {/* Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Wide</span>
                  <span>Tall</span>
                </div>
                <Slider
                  value={[dimRatio]}
                  min={0.5}
                  max={2}
                  step={0.05}
                  onValueChange={([v]) => {
                    const w = Math.round(1024 * Math.min(v, 1) + (v > 1 ? (v - 1) * 512 : 0));
                    const h = Math.round(1024 / Math.max(v, 1) + (v < 1 ? (1 - v) * 512 : 0));
                    updateSetting("dimensions", {
                      width: Math.round(w / 32) * 32,
                      height: Math.round(h / 32) * 32,
                      label: `${Math.round(w / 32) * 32}×${Math.round(h / 32) * 32}`,
                    });
                  }}
                />
              </div>

              {/* Social presets */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Socials</p>
                <div className="grid grid-cols-1 gap-1">
                  {SOCIAL_PRESETS.map(d => (
                    <button
                      key={d.label}
                      onClick={() => { updateSetting("dimensions", d); setCustomOpen(false); }}
                      className="text-left text-xs px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-foreground"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Device presets */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Devices</p>
                <div className="grid grid-cols-1 gap-1">
                  {DEVICE_PRESETS.map(d => (
                    <button
                      key={d.label}
                      onClick={() => { updateSetting("dimensions", d); setCustomOpen(false); }}
                      className="text-left text-xs px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-foreground"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Number of Images */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Number of Images</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => updateSetting("numImages", n)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                settings.numImages === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-foreground border-border hover:bg-accent"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Private Mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {settings.privateMode ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
          <span className="text-sm text-foreground">Private Mode</span>
        </div>
        <Switch
          checked={settings.privateMode}
          onCheckedChange={(v) => updateSetting("privateMode", v)}
        />
      </div>

      {/* Reset */}
      <Button
        variant="ghost"
        onClick={handleReset}
        className="w-full gap-2 text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="w-4 h-4" />
        Reset to Defaults
      </Button>
    </div>
  );
};

// Mobile drawer wrapper
export const MobileSettingsDrawer = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r border-border p-4 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Settings
            </h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent">
              <X className="w-4 h-4" />
            </button>
          </div>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default ImageSettingsPanel;
