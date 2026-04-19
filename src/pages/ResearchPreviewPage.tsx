import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportData {
  query: string;
  report: string;
  images: string[];
}

const ResearchPreviewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!id) return;
    const raw = sessionStorage.getItem(`dr_report_${id}`);
    if (raw) {
      try { setData(JSON.parse(raw)); } catch { /* noop */ }
    }
  }, [id]);

  if (!data) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  // Strip any internal AI thinking blocks (lines starting with > thinking, [thinking], etc.)
  const cleanReport = data.report
    .replace(/^\s*>\s*(thinking|reasoning|internal)[\s\S]*?(?=\n##|\n#|$)/gim, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .trim();

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-foreground/5 bg-background/80 px-4 py-3 backdrop-blur-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-foreground/5 transition"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="flex-1 truncate text-sm font-semibold text-foreground">{data.query}</h1>
      </header>

      {/* Body — content only, no sources, no like/copy buttons */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-8">
          {/* Horizontally scrolling images */}
          {data.images && data.images.length > 0 && (
            <div className="-mx-5 mb-8 overflow-x-auto px-5 pb-2 scrollbar-thin">
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {data.images.map((img, i) => (
                  <div
                    key={i}
                    className="h-44 w-64 shrink-0 overflow-hidden rounded-2xl border border-foreground/5 bg-foreground/5"
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report — formatted as a clean document */}
          <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h3:text-base prose-p:leading-relaxed prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanReport}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
};

export default ResearchPreviewPage;
