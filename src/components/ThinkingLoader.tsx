import { Sparkles } from "lucide-react";

const ThinkingLoader = () => {
  return (
    <div className="flex items-center gap-2.5 py-3">
      <div className="sparkle-container">
        <svg className="sparkle-star w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
        </svg>
        <svg className="sparkle-star w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
        </svg>
        <svg className="sparkle-star w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
        </svg>
        <svg className="sparkle-star w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
        </svg>
      </div>
      <span className="text-sm text-muted-foreground animate-pulse">Thinking...</span>
    </div>
  );
};

export default ThinkingLoader;
