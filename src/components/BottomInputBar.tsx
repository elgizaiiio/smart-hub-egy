import { useState, useRef, useEffect } from "react";
import { Paperclip, Sparkles, Loader2, Coins, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ModelOption } from "@/components/ModelSelector";
import type { ImageSettings, ImageStyle, ImageDimensions } from "@/components/ImageSettingsPanel";

const PLACEHOLDERS = [
  "Describe the image you want to create...",
  "A cyberpunk cityscape at sunset...",
  "Oil painting of a serene lake...",
  "Professional product photo...",
  "Anime character with flowing hair...",
];

const STYLES: { value: ImageStyle; label: string; icon: string }[] = [
  { value: "none", label: "None", icon: "🚫" },
  { value: "dynamic", label: "Dynamic", icon: "⚡" },
  { value: "cinematic", label: "Cinematic", icon: "🎬" },
  { value: "creative", label: "Creative", icon: "🎨" },
  { value: "fashion", label: "Fashion", icon: "👗" },
  { value: "portrait", label: "Portrait", icon: "📸" },
  { value: "vibrant", label: "Vibrant", icon: "🌈" },
  { value: "anime", label: "Anime", icon: "✨" },
  { value: "3d-render", label: "3D Render", icon: "🧊" },
];

const ASPECT_RATIOS: ImageDimensions[] = [
  { width: 768, height: 1024, label: "2:3" },
  { width: 1024, height: 1024, label: "1:1" },
  { width: 1024, height: 576, label: "16:9" },
  { width: 1200, height: 900, label: "4:3" },
  { width: 1080, height: 1350, label: "4:5" },
  { width: 1080, height: 1920, label: "9:16" },
];

interface BottomInputBarProps {
  input: string;
  onInputChange: (val: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  selectedModel: ModelOption;
  onOpenModelPicker: () => void;
  settings: ImageSettings;
  onSettingsChange: (s: ImageSettings) => void;
  creditCost: number;
  canAttach: boolean;
  onAttach: () => void;
}

const BottomInputBar = ({
  input,
  onInputChange,
  onGenerate,
  isGenerating,
  selectedModel,
  onOpenModelPicker,
  settings,
  onSettingsChange,
  creditCost,
  canAttach,
  onAttach,
}: BottomInputBarProps) => {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animated placeholder
  useEffect(() => {
    if (input) return;
    const target = PLACEHOLDERS[placeholderIdx];
    let i = 0;
    setDisplayedPlaceholder("");
    const t = setInterval(() => {
      if (i < target.length) {
        setDisplayedPlaceholder(target.slice(0, i + 1));
        i += 1;
      } else {
        clearInterval(t);
        setTimeout(() => setPlaceholderIdx((p) => (p + 1) % PLACEHOLDERS.length), 2500);
      }
    }, 50);
    return () => clearInterval(t);
  }, [placeholderIdx, input]);

  const updateSetting = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const currentAspect = settings.dimensions.label;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Input row */}
          <div className="flex items-center gap-2 px-4 py-3">
            {canAttach && (
              <button
                onClick={onAttach}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onGenerate();
                }
              }}
              placeholder={displayedPlaceholder}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 py-1.5 max-h-20"
              style={{ minHeight: "32px" }}
            />

            <button
              onClick={onGenerate}
              disabled={!input.trim() || isGenerating}
              className="shrink-0 h-9 px-4 flex items-center gap-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-30 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate</span>
              <div className="flex items-center gap-1 pl-2 border-l border-primary-foreground/20">
                <Coins className="w-3 h-3" />
                <span className="text-xs">{creditCost}</span>
              </div>
            </button>
          </div>

          {/* Chips row */}
          <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
            {/* Model chip */}
            <button
              onClick={onOpenModelPicker}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/50 text-foreground hover:border-primary/40 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              {selectedModel.name}
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {/* Aspect ratio chip */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/50 text-foreground hover:border-primary/40 transition-colors">
                  {currentAspect}
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="start">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.label}
                    onClick={() => updateSetting("dimensions", ar)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                      settings.dimensions.label === ar.label
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    {ar.label} ({ar.width}×{ar.height})
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Style chip */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/50 text-foreground hover:border-primary/40 transition-colors">
                  {STYLES.find((s) => s.value === settings.style)?.icon || "⚡"}{" "}
                  {STYLES.find((s) => s.value === settings.style)?.label || "Dynamic"}
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="start">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateSetting("style", s.value)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      settings.style === s.value
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Number of images chip */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-secondary/50 text-foreground hover:border-primary/40 transition-colors">
                  {settings.numImages} image{settings.numImages > 1 ? "s" : ""}
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-2" align="start">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateSetting("numImages", n)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                      settings.numImages === n
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    {n} image{n > 1 ? "s" : ""}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomInputBar;
