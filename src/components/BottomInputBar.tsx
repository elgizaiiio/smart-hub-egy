import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Coins, Image as ImageIcon, Expand } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ModelOption } from "@/components/ModelSelector";
import type { ImageSettings, ImageStyle, ImageDimensions } from "@/components/ImageSettingsPanel";
import InlineModelPicker from "./InlineModelPicker";

const PLACEHOLDERS = [
  "Describe the image you want to create...",
  "A cyberpunk cityscape at sunset...",
  "Oil painting of a serene lake...",
  "Professional product photo...",
  "Anime character with flowing hair...",
];

const ASPECT_RATIOS: ImageDimensions[] = [
  { width: 768, height: 1024, label: "2:3" },
  { width: 1024, height: 1024, label: "1:1" },
  { width: 1024, height: 576, label: "16:9" },
  { width: 1200, height: 900, label: "4:3" },
  { width: 1080, height: 1350, label: "4:5" },
  { width: 1080, height: 1920, label: "9:16" },
];

const QUALITIES = ["1K", "2K", "4K"];

// Model icon info
const MODEL_ICONS: Record<string, { letter: string; gradient: string }> = {
  "nano-banana-2": { letter: "G", gradient: "from-yellow-400 to-orange-500" },
  "nano-banana-pro": { letter: "G", gradient: "from-yellow-400 to-orange-500" },
  "seedream-4": { letter: "Iu", gradient: "from-blue-400 to-purple-500" },
  "seedream-5-lite": { letter: "Iu", gradient: "from-blue-400 to-purple-500" },
  "gpt-image": { letter: "G", gradient: "from-green-400 to-emerald-500" },
  "ideogram-3": { letter: "△", gradient: "from-pink-400 to-rose-500" },
  "flux-kontext": { letter: "△", gradient: "from-cyan-400 to-blue-500" },
  "flux-2-pro": { letter: "△", gradient: "from-cyan-400 to-blue-500" },
  "grok-imagine": { letter: "◇", gradient: "from-purple-400 to-violet-500" },
  "recraft-v4": { letter: "R", gradient: "from-orange-400 to-red-500" },
  "megsy-v1-img": { letter: "M", gradient: "from-primary to-primary/70" },
};

interface BottomInputBarProps {
  input: string;
  onInputChange: (val: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  selectedModel: ModelOption;
  onModelSelect: (model: ModelOption) => void;
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
  onModelSelect,
  onOpenModelPicker,
  settings,
  onSettingsChange,
  creditCost,
  canAttach,
  onAttach,
}: BottomInputBarProps) => {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
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
  const iconInfo = MODEL_ICONS[selectedModel.id] || { letter: "AI", gradient: "from-gray-400 to-gray-500" };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
      <div className="max-w-4xl mx-auto relative">
        {/* Inline Model Picker */}
        <InlineModelPicker
          open={modelPickerOpen}
          onClose={() => setModelPickerOpen(false)}
          onSelect={(model) => {
            onModelSelect(model);
            setModelPickerOpen(false);
          }}
          selectedModelId={selectedModel.id}
        />

        <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Top row: Input + Expand */}
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            {/* Input area */}
            <div className="flex-1 min-w-0">
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
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-white/30 py-2 max-h-24"
                style={{ minHeight: "40px" }}
              />
            </div>

            {/* Right icons */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                <Expand className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom row: Chips + Generate button */}
          <div className="flex items-center justify-between gap-3 px-4 pb-4">
            {/* Chips */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Model chip */}
              <button
                onClick={() => setModelPickerOpen(!modelPickerOpen)}
                className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                <div className={`w-4 h-4 rounded-md bg-gradient-to-br ${iconInfo.gradient} flex items-center justify-center`}>
                  <span className="text-[8px] font-bold text-black">{iconInfo.letter}</span>
                </div>
                {selectedModel.name}
              </button>

              {/* Aspect ratio chip */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                    <div className="w-3.5 h-2.5 border border-current rounded-sm" />
                    {currentAspect}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-36 p-3 bg-[#1a1a1a] border-white/10" align="start">
                  <p className="text-xs text-white/50 mb-2 font-medium">Aspect Ratio</p>
                  <div className="space-y-1">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar.label}
                        onClick={() => updateSetting("dimensions", ar)}
                        className="w-full flex items-center gap-2.5 text-xs px-2 py-1.5 rounded-md transition-colors text-white/80 hover:bg-white/5"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          settings.dimensions.label === ar.label
                            ? "border-white/40 bg-white/10"
                            : "border-white/20"
                        }`}>
                          {settings.dimensions.label === ar.label && (
                            <div className="w-2 h-2 rounded-sm bg-white" />
                          )}
                        </div>
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Quality chip */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                    <Sparkles className="w-3 h-3" />
                    2K
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-2 bg-[#252525] border-white/10" align="start">
                  {QUALITIES.map((q) => (
                    <button
                      key={q}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              {/* Number of images chip */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                    <ImageIcon className="w-3 h-3" />
                    {settings.numImages} Image{settings.numImages > 1 ? "s" : ""}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-36 p-2 bg-[#252525] border-white/10" align="start">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => updateSetting("numImages", n)}
                      className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                        settings.numImages === n
                          ? "bg-white/10 text-white font-semibold"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {n} Image{n > 1 ? "s" : ""}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* Generate button */}
            <button
              onClick={onGenerate}
              disabled={!input.trim() || isGenerating}
              className="shrink-0 h-9 px-5 flex items-center gap-2 rounded-full font-semibold text-sm transition-all disabled:opacity-30 bg-[#f5d90a] text-black hover:bg-[#e5c900] shadow-lg"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Generate</span>
                  <div className="flex items-center gap-1 pl-2 border-l border-black/20">
                    <Coins className="w-3 h-3" />
                    <span className="text-xs">{creditCost}</span>
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomInputBar;
