import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Coins, Image as ImageIcon, Expand, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const QUALITIES = ["512px", "1K", "2K", "4K"];

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

// Dropdown component for chips
const ChipDropdown = ({
  open,
  onToggle,
  onClose,
  label,
  icon,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  label: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    // Delay to avoid the click that opened it from immediately closing it
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium 
          bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] text-white/80 
          hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-white
          transition-all duration-300 ease-out"
      >
        {icon}
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 min-w-[140px] 
              bg-black/60 backdrop-blur-3xl border border-white/[0.1] 
              rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden p-1.5 z-50"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
  const [selectedQuality, setSelectedQuality] = useState("2K");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const toggleDropdown = (id: string) => {
    setActiveDropdown(prev => prev === id ? null : id);
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

        {/* Main glass container */}
        <div className="bg-black/20 backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-visible">
          {/* Input area */}
          <div className="flex items-start gap-3 px-5 pt-4 pb-3">
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
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-white/25 py-2 max-h-24"
                style={{ minHeight: "40px" }}
              />
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors mt-1">
              <Expand className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom controls row */}
          <div className="flex items-center justify-between gap-3 px-4 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {/* Model chip */}
              <button
                onClick={() => setModelPickerOpen(!modelPickerOpen)}
                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium 
                  bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] text-white/80 
                  hover:bg-white/[0.1] hover:border-white/[0.15] hover:text-white
                  transition-all duration-300 ease-out"
              >
                <div className={`w-4 h-4 rounded-md bg-gradient-to-br ${iconInfo.gradient} flex items-center justify-center`}>
                  <span className="text-[8px] font-bold text-black">{iconInfo.letter}</span>
                </div>
                {selectedModel.name}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${modelPickerOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Aspect Ratio chip */}
              <ChipDropdown
                open={activeDropdown === "aspect"}
                onToggle={() => toggleDropdown("aspect")}
                onClose={() => setActiveDropdown(null)}
                icon={<div className="w-3 h-2.5 border border-current rounded-[2px]" />}
                label={currentAspect}
              >
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.label}
                    onClick={() => { updateSetting("dimensions", ar); setActiveDropdown(null); }}
                    className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-all duration-200
                      ${settings.dimensions.label === ar.label
                        ? "bg-white/[0.1] text-white"
                        : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                      }`}
                  >
                    {ar.label}
                    {settings.dimensions.label === ar.label && <Check className="w-3.5 h-3.5 text-white/80" />}
                  </button>
                ))}
              </ChipDropdown>

              {/* Quality chip */}
              <ChipDropdown
                open={activeDropdown === "quality"}
                onToggle={() => toggleDropdown("quality")}
                onClose={() => setActiveDropdown(null)}
                icon={<Sparkles className="w-3 h-3" />}
                label={selectedQuality}
              >
                {QUALITIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setSelectedQuality(q); setActiveDropdown(null); }}
                    className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-all duration-200
                      ${selectedQuality === q
                        ? "bg-white/[0.1] text-white"
                        : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                      }`}
                  >
                    {q}
                    {selectedQuality === q && <Check className="w-3.5 h-3.5 text-white/80" />}
                  </button>
                ))}
              </ChipDropdown>

              {/* Image count chip */}
              <ChipDropdown
                open={activeDropdown === "count"}
                onToggle={() => toggleDropdown("count")}
                onClose={() => setActiveDropdown(null)}
                icon={<ImageIcon className="w-3 h-3" />}
                label={`${settings.numImages} Image${settings.numImages > 1 ? "s" : ""}`}
              >
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => { updateSetting("numImages", n); setActiveDropdown(null); }}
                    className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-all duration-200
                      ${settings.numImages === n
                        ? "bg-white/[0.1] text-white"
                        : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                      }`}
                  >
                    {n} Image{n > 1 ? "s" : ""}
                    {settings.numImages === n && <Check className="w-3.5 h-3.5 text-white/80" />}
                  </button>
                ))}
              </ChipDropdown>
            </div>

            {/* Generate button */}
            <button
              onClick={onGenerate}
              disabled={!input.trim() || isGenerating}
              className={`shrink-0 h-10 px-6 flex items-center justify-center rounded-xl font-semibold text-sm 
                transition-all duration-300 disabled:opacity-30 active:scale-[0.97]
                ${input.trim()
                  ? "bg-[#f5d90a] text-black hover:bg-[#e5c900] hover:shadow-[0_0_20px_rgba(245,217,10,0.3)]"
                  : "bg-white text-black hover:bg-white/90"
                }`}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Generate</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomInputBar;
