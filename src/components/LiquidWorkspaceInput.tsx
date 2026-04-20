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
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="pointer-events-auto">
        {attachments.length > 0 && (
          <div className="mx-auto mb-2 flex max-w-3xl flex-wrap gap-2 px-4">
            {attachments.map((file, index) => (
              <div key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-2xl border border-border bg-background px-2.5 py-2">
                {file.type === "image" ? (
                  <img src={file.data} alt={file.name} className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-14 items-center gap-2 pr-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
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

        <div className="relative">
          <AnimatePresence>
            {plusOpen && plusMenu && (
              <div className="absolute bottom-full left-0 right-0 mx-auto max-w-3xl px-4 pb-2">
                {plusMenu}
              </div>
            )}
          </AnimatePresence>

          <motion.div layout transition={spring} className="ios26-input-shell">
            <div className="mx-auto flex max-w-3xl items-end gap-2 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              {!hidePlus && (
                <button
                  onClick={onPlusToggle}
                  className={`ios26-circle-button flex h-10 w-10 shrink-0 items-center justify-center text-foreground/70 transition duration-200 ${plusOpen ? "rotate-45" : "rotate-0"}`}
                >
                  <Plus className="h-5 w-5" strokeWidth={1.75} />
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
                className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] font-normal text-foreground outline-none placeholder:text-foreground/40"
              />

              {isLoading ? (
                <button onClick={onStop} className="ios26-send-button flex h-10 w-10 shrink-0 items-center justify-center">
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : canSend ? (
                <button
                  onClick={onSend}
                  className="ios26-send-button flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 hover:scale-[1.03]"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiquidWorkspaceInput;