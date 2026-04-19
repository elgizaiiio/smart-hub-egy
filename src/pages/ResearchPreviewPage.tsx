import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, MoreHorizontal, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
      try {
        setData(JSON.parse(raw));
      } catch {
        setData(null);
      }
    }
  }, [id]);

  const cleanReport = useMemo(() => {
    if (!data) return "";
    return data.report
      .replace(/^\s*>\s*(thinking|reasoning|internal)[\s\S]*?(?=\n##|\n#|$)/gim, "")
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .trim();
  }, [data]);

  if (!data) {
    return (
      <div className="flex h-[100dvh] items-center justify-center milk-page-canvas">
        <p className="text-sm font-medium text-muted-foreground">التقرير غير موجود.</p>
      </div>
    );
  }

  const downloadMarkdown = () => {
    const blob = new Blob([cleanReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${data.query.slice(0, 40).replace(/[^a-z0-9]/gi, "-")}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل الملف");
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(cleanReport);
    toast.success("تم نسخ التقرير");
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: data.query, text: cleanReport.slice(0, 280) });
        return;
      } catch {
        return;
      }
    }
    await copyReport();
  };

  return (
    <div className="min-h-[100dvh] milk-page-canvas pb-12">
      <div className="sticky top-0 z-20 px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/92 px-2 py-2 shadow-[0_10px_28px_hsl(0_0%_0%_/_.05)] backdrop-blur-xl">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="milk-circle-button h-11 w-11">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-2xl liquid-glass p-1.5">
                <DropdownMenuItem onClick={downloadMarkdown} className="rounded-xl">تنزيل بصيغة Markdown</DropdownMenuItem>
                <DropdownMenuItem onClick={copyReport} className="rounded-xl">نسخ التقرير</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={shareReport} className="milk-circle-button h-11 w-11">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <h1 className="flex-1 truncate text-base font-bold text-foreground md:text-xl">تقرير شامل عن {data.query}</h1>

          <button onClick={() => navigate(-1)} className="milk-circle-button h-11 w-11 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div className="milk-report-card overflow-hidden p-5 md:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">المؤلف</p>
              <p className="mt-1 text-2xl font-bold text-foreground">Megsy AI</p>
            </div>
            <button onClick={copyReport} className="milk-circle-button h-12 w-12 shrink-0">
              <Copy className="h-5 w-5" />
            </button>
          </div>

          {data.images && data.images.length > 0 ? (
            <div className="-mx-1 mb-8 overflow-x-auto px-1 pb-2">
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {data.images.map((image, index) => (
                  <div key={index} className="h-44 w-64 shrink-0 overflow-hidden rounded-[24px] border border-border/60 bg-secondary/60">
                    <img src={image} alt={data.query} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <article className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-h1:mb-4 prose-h1:text-4xl prose-h2:mt-10 prose-h2:text-3xl prose-h3:mt-8 prose-h3:text-2xl prose-p:text-lg prose-p:leading-9 prose-strong:text-foreground prose-li:text-lg prose-li:leading-9 prose-ul:my-5 prose-ol:my-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanReport}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
};

export default ResearchPreviewPage;
