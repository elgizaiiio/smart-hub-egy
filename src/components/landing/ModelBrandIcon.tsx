interface ModelBrandIconProps {
  modelId: string;
  className?: string;
}

const ModelBrandIcon = ({ modelId, className = "w-4 h-4" }: ModelBrandIconProps) => {
  if (modelId.includes("megsy") || modelId.includes("gemini-3-flash")) {
    return (
      <span
        className={`inline-flex items-center justify-center font-black leading-none ${className}`}
        style={{
          background: "linear-gradient(135deg, hsl(var(--silver-bright)), hsl(var(--silver-dark)))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        M
      </span>
    );
  }

  if (modelId.includes("gemini") || modelId.includes("veo")) {
    return (
      <svg viewBox="0 0 28 28" className={className} fill="none" aria-hidden="true">
        <path d="M14 0C14 7.732 7.732 14 0 14c7.732 0 14 6.268 14 14 0-7.732 6.268-14 14-14C20.268 14 14 7.732 14 0z" fill="#4285F4" />
      </svg>
    );
  }

  if (modelId.includes("gpt") || modelId.includes("sora") || modelId.includes("openai")) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681z" fill="#10A37F" />
      </svg>
    );
  }

  if (modelId.includes("grok") || modelId.includes("x-ai")) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  if (modelId.includes("deepseek")) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#4D6BFE" />
        <path d="M7 13c1-3 4-5 7-5 2 0 3.5 1 4 2.5.5 1.5 0 3-1 4-1 1-2.5 1.5-4 1.5H11l-2 2v-3c-1-.5-2-1.2-2-2z" fill="white" />
        <circle cx="14.5" cy="11.5" r="1" fill="#4D6BFE" />
      </svg>
    );
  }

  return <span className={`inline-block rounded-full bg-primary ${className}`} aria-hidden="true" />;
};

export default ModelBrandIcon;
