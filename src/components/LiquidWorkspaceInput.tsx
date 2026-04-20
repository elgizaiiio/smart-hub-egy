import { useEffect, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, FileUp, Plus, Square, X } from "lucide-react";

type AttachmentItem = {
  name: string;
  type: string;
  data: string;
};

interface LiquidWorkspaceInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;
  placeholder: string;
  canSend: boolean;
  hidePlus?: boolean;
  plusOpen?: boolean;
  onPlusToggle?: () => void;
  plusMenu?: ReactNode;
  attachments?: AttachmentItem[];
  onRemoveAttachment?: (index: number) => void;
  textareaRef?: RefObject<HTMLTextAreaElement>;
}

const spring = { type: "spring" as const, damping: 24, stiffness: 340 };

const LiquidWorkspaceInput = ({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  placeholder,
  canSend,
  hidePlus = false,
  plusOpen = false,
  onPlusToggle,
  plusMenu,
  attachments = [],
  onRemoveAttachment,
  textareaRef,
}: LiquidWorkspaceInputProps) => {
  useEffect(() => {
    const textarea = textareaRef?.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [value, textareaRef]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 pointer-events-none">
      <div className="mx-auto max-w-3xl pointer-events-auto">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 px-2">
            {attachments.map((file, index) => (
              <div key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-[1.35rem] ios26-surface-card px-2.5 py-2">
                {file.type === "image" ? (
                  <img src={file.data} alt={file.name} className="h-14 w-14 rounded-[1rem] object-cover" />
                ) : (
                  <div className="flex h-14 items-center gap-2 pr-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full ios26-circle-button">
                      <FileUp className="h-4 w-4 text-foreground/70" />
                    </div>
                    <span className="max-w-[138px] truncate text-xs font-medium text-foreground/72">{file.name}</span>
                  </div>
                )}
                {onRemoveAttachment && (
                  <button
                    onClick={() => onRemoveAttachment(index)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="relative mx-auto w-full max-w-3xl">
          <AnimatePresence>{plusOpen && plusMenu}</AnimatePresence>

          <motion.div layout transition={spring} className="ios26-input-shell px-3 py-3">
            <div className="relative z-[1] flex items-end gap-2">
              {!hidePlus && (
                <button
                  onClick={onPlusToggle}
                  className={`ios26-circle-button flex h-11 w-11 shrink-0 items-center justify-center text-foreground/80 transition duration-200 ${plusOpen ? "rotate-45" : "rotate-0"}`}
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}

              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && canSend) onSend();
                  }
                }}
                placeholder={placeholder}
                rows={1}
                dir="auto"
                className="max-h-[140px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] font-medium text-foreground outline-none placeholder:text-foreground/45"
              />

              {isLoading ? (
                <button onClick={onStop} className="ios26-send-button flex h-11 w-11 shrink-0 items-center justify-center">
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={onSend}
                  disabled={!canSend}
                  className="ios26-send-button flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-200 hover:scale-[1.03] disabled:opacity-35 disabled:hover:scale-100"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiquidWorkspaceInput;