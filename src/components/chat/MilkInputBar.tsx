import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowUp, FileUp, Plus, Square, X } from "lucide-react";

export interface MilkAttachmentItem {
  name: string;
  type: string;
  data: string;
}

export interface MilkMenuAction {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface MilkInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isLoading: boolean;
  placeholder: string;
  showPlus?: boolean;
  plusOpen?: boolean;
  onTogglePlus?: () => void;
  menuActions?: MilkMenuAction[];
  menuFooter?: ReactNode;
  attachedFiles?: MilkAttachmentItem[];
  onRemoveAttachment?: (index: number) => void;
  sendDisabled?: boolean;
}

const iosSpring = { type: "spring" as const, damping: 24, stiffness: 360 };

const MilkInputBar = ({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  placeholder,
  showPlus = true,
  plusOpen = false,
  onTogglePlus,
  menuActions = [],
  menuFooter,
  attachedFiles = [],
  onRemoveAttachment,
  sendDisabled,
}: MilkInputBarProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tileActions = useMemo(() => menuActions.slice(0, 2), [menuActions]);
  const listActions = useMemo(() => menuActions.slice(2), [menuActions]);
  const canSend = !isLoading && !sendDisabled && value.trim().length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [value]);

  return (
    <div className="space-y-2">
      {attachedFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-1 pb-1">
          {attachedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="milk-attachment-chip shrink-0">
              {file.type === "image" ? (
                <img src={file.data} alt={file.name} className="h-10 w-10 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <FileUp className="h-4 w-4" />
                </div>
              )}
              <span className="max-w-[110px] truncate text-xs font-medium text-foreground">{file.name}</span>
              {onRemoveAttachment && (
                <button
                  onClick={() => onRemoveAttachment(index)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground"
                  aria-label="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="relative mx-auto w-full max-w-3xl">
        <AnimatePresence>
          {showPlus && plusOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[55]"
                onClick={onTogglePlus}
              />
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                transition={iosSpring}
                className="milk-plus-sheet absolute bottom-full left-0 z-[56] mb-3 w-[min(100%,22rem)] overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 pt-5 text-sm font-bold text-foreground">
                  <span>المكتبة</span>
                  <button className="text-primary transition hover:opacity-80">السماح بالوصول إلى الصور</button>
                </div>

                <div className="mt-4 flex gap-3 overflow-x-auto px-5 pb-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`placeholder-${index}`} className="milk-plus-placeholder" />
                  ))}
                  {tileActions.map(({ key, label, icon: Icon, onClick }) => (
                    <button key={key} onClick={onClick} className="milk-plus-tile shrink-0">
                      <Icon className="h-7 w-7 text-foreground" />
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                    </button>
                  ))}
                </div>

                {(listActions.length > 0 || menuFooter) && (
                  <div className="border-t border-border/60 px-5 py-4">
                    <div className="space-y-2">
                      {listActions.map(({ key, label, icon: Icon, onClick }) => (
                        <button key={key} onClick={onClick} className="milk-plus-list-button">
                          <span className="text-base font-semibold text-foreground">{label}</span>
                          <Icon className="h-6 w-6 text-foreground" />
                        </button>
                      ))}
                    </div>
                    {menuFooter ? <div className="mt-3">{menuFooter}</div> : null}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="milk-input-shell">
          <div className="flex items-end gap-3 px-3 py-3">
            {showPlus && (
              <button onClick={onTogglePlus} className="milk-circle-button shrink-0" aria-label="Open attachments">
                <Plus className={`h-6 w-6 transition-transform ${plusOpen ? "rotate-45" : "rotate-0"}`} />
              </button>
            )}

            <div className="min-w-0 flex-1">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (canSend) onSend();
                  }
                }}
                rows={1}
                placeholder={placeholder}
                className="min-h-[52px] w-full resize-none bg-transparent px-1 py-3 text-[1.02rem] font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
              />
            </div>

            {isLoading ? (
              <button onClick={onStop} className="milk-send-button shrink-0" aria-label="Stop generation">
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={!canSend}
                className="milk-send-button shrink-0 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Send message"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilkInputBar;
