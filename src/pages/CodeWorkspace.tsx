import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Plus, ArrowUp, Loader2, Globe, Github, RefreshCw, Triangle, Download, Database } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import CodeChatContainer from "@/components/code/CodeChatContainer";
import SupabaseConnectCard from "@/components/code/SupabaseConnectCard";
import { CodeStep, StepType } from "@/components/code/CodeStepMessage";
import { AnimatePresence, motion } from "framer-motion";

const BUILD_CREDIT_COST = 5;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
  type?: "plan" | "build" | "log" | "status" | "timeline" | "steps";
}

type FileTree = Record<string, string>;

const parseFileMarkers = (raw: string): FileTree => {
  const files: FileTree = {};
  const regex = /===FILE:\s*(.+?)===\n([\s\S]*?)===END===/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    const path = match[1].trim();
    const content = match[2];
    if (path && content !== undefined) files[path] = content;
  }
  return files;
};

const parseJsonFallback = (raw: string): FileTree => {
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const jsonStart = cleaned.search(/[\{\[]/);
  const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === "[" ? "]" : "}");
  if (jsonStart === -1 || jsonEnd === -1) return {};
  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.files && typeof parsed.files === "object") return parsed.files;
  } catch {}
  return {};
};

const VITE_TEMPLATE: FileTree = {
  "src/main.jsx": `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\nimport './index.css'\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)`,
  "src/App.jsx": `export default function App() { return <div className="min-h-screen flex items-center justify-center bg-gray-50"><h1 className="text-4xl font-bold text-gray-900">Hello from Megsy!</h1></div> }`,
  "src/index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { font-family: system-ui, sans-serif; margin: 0; }`,
  "index.html": `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Megsy App</title></head>\n<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>`,
  "package.json": `{"name":"megsy-app","private":true,"version":"0.0.1","type":"module","scripts":{"dev":"vite","build":"vite build"},"dependencies":{"react":"^18.3.1","react-dom":"^18.3.1"},"devDependencies":{"@vitejs/plugin-react":"^4.3.0","vite":"^5.4.0","tailwindcss":"^3.4.0","postcss":"^8.4.0","autoprefixer":"^10.4.0"}}`,
  "vite.config.js": `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })`,
  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */\nexport default { content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], theme: { extend: {} }, plugins: [] }`,
  "postcss.config.js": `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`,
};

const callGithub = async (body: Record<string, unknown>) => {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/github-repo`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify(body),
  });
  return resp.json();
};

const stepDelay = (type: StepType): number => {
  const base: Record<string, [number, number]> = {
    thinking: [400, 800], reading: [300, 600], writing: [500, 900],
    editing: [500, 900], creating: [600, 1000], searching: [400, 700],
    saving: [200, 400], done: [100, 200], pre_message: [100, 200],
    post_message: [100, 200], error: [100, 200],
  };
  const [min, max] = base[type] || [200, 500];
  return min + Math.random() * (max - min);
};

let stepCounter = 0;
const makeStep = (type: StepType, text: string, file?: string): CodeStep => ({
  id: `step-${++stepCounter}`, type, text, file, status: "active",
});

// Nodepod preview component
const NodepodPreview = ({ files, previewKey }: { files: FileTree; previewKey: number }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const nodepodRef = useRef<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const bootAndRun = useCallback(async () => {
    if (Object.keys(files).length === 0) return;
    setLoading(true);
    setError(null);
    setLogs([]);

    try {
      const { Nodepod } = await import("@scelar/nodepod");

      // Destroy previous instance
      if (nodepodRef.current) {
        try { nodepodRef.current = null; } catch {}
      }

      const nodepod = await Nodepod.boot({
        files: Object.fromEntries(
          Object.entries(files).map(([path, content]) => [
            path.startsWith("/") ? path : `/${path}`,
            content,
          ])
        ),
        watermark: false,
        onServerReady: (port: number, url: string) => {
          setLogs(prev => [...prev, `Server ready on port ${port}`]);
          setPreviewUrl(url);
          setLoading(false);
        },
      });

      nodepodRef.current = nodepod;

      // Install dependencies from package.json
      setLogs(prev => [...prev, "Installing dependencies..."]);
      await nodepod.packages.installFromManifest("/package.json", {
        onProgress: (msg: string) => setLogs(prev => [...prev.slice(-15), msg]),
      });
      setLogs(prev => [...prev, "Dependencies installed"]);

      // Run vite dev server
      setLogs(prev => [...prev, "Starting dev server..."]);
      const proc = await nodepod.spawn("npx", ["vite", "--host", "0.0.0.0", "--port", "5173"]);
      
      proc.on("output", (text: string) => {
        setLogs(prev => [...prev.slice(-20), text]);
      });
      proc.on("error", (text: string) => {
        setLogs(prev => [...prev.slice(-20), `stderr: ${text}`]);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!previewUrl) {
          const url = nodepod.port(5173);
          if (url) {
            setPreviewUrl(url);
            setLoading(false);
          }
        }
      }, 15000);

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to boot preview";
      setError(msg);
      setLoading(false);
      console.error("Nodepod boot error:", e);
    }
  }, [files]);

  useEffect(() => {
    bootAndRun();
    return () => {
      nodepodRef.current = null;
    };
  }, [previewKey]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm text-foreground font-medium">Booting preview...</p>
          <p className="text-xs text-muted-foreground">Installing packages & starting Vite</p>
        </div>
        {logs.length > 0 && (
          <div className="max-w-md w-full mx-4 mt-2 max-h-32 overflow-y-auto rounded-lg bg-secondary/80 border border-border p-3">
            {logs.slice(-5).map((log, i) => (
              <p key={i} className="text-[10px] font-mono text-muted-foreground truncate">{log}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-6">
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-destructive text-lg">!</span>
        </div>
        <p className="text-sm text-foreground font-medium">Preview Error</p>
        <p className="text-xs text-muted-foreground text-center max-w-sm">{error}</p>
        <button onClick={bootAndRun} className="text-xs text-primary hover:underline mt-2">Retry</button>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        title="Preview"
      />
    );
  }

  return null;
};

const CodeWorkspace = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const [searchParams] = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  const paramConversationId = searchParams.get("conversation_id") || "";
  const paramProjectId = searchParams.get("project_id") || "";
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSupabaseConnect, setShowSupabaseConnect] = useState(false);
  const [loadedConversation, setLoadedConversation] = useState(false);

  const [steps, setSteps] = useState<CodeStep[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const [files, setFiles] = useState<FileTree>({});
  const [previewKey, setPreviewKey] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(paramConversationId || null);
  const [projectId, setProjectId] = useState<string | null>(paramProjectId || null);
  const [supabaseConfig, setSupabaseConfig] = useState<{ url: string; anon_key: string } | null>(null);

  const { userId, credits, hasEnoughCredits, refreshCredits, loading: creditsLoading } = useCredits();

  useEffect(() => {
    if (!paramConversationId || loadedConversation) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", paramConversationId)
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
      setLoadedConversation(true);
    };
    loadMessages();
  }, [paramConversationId, loadedConversation]);

  useEffect(() => {
    if (!paramProjectId) return;
    const loadProject = async () => {
      const { data } = await supabase
        .from("projects")
        .select("files_snapshot")
        .eq("id", paramProjectId)
        .single();
      if (data?.files_snapshot && typeof data.files_snapshot === "object") {
        const snap = data.files_snapshot as any;
        if (snap.__supabase_config) setSupabaseConfig(snap.__supabase_config);
        const loadedFiles = { ...snap };
        delete loadedFiles.__supabase_config;
        setFiles({ ...VITE_TEMPLATE, ...loadedFiles });
        setPreviewKey(k => k + 1);
      }
    };
    loadProject();
  }, [paramProjectId]);

  useEffect(() => {
    if (prompt && messages.length === 0 && !paramConversationId && !creditsLoading) {
      handleSend(prompt);
    }
  }, [prompt, loadedConversation, creditsLoading]);

  const addStep = async (type: StepType, text: string, file?: string): Promise<CodeStep> => {
    const step = makeStep(type, text, file);
    setSteps(prev => prev.map(s => s.status === "active" ? { ...s, status: "done" as const } : s).concat(step));
    setActiveStepId(step.id);
    await new Promise(r => setTimeout(r, stepDelay(type)));
    return step;
  };

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: "done" as const } : s));
  };

  const completeAllSteps = () => {
    setSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
    setActiveStepId(null);
  };

  const createOrGetConversation = async (firstMessage: string) => {
    if (conversationId) return conversationId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const title = firstMessage.slice(0, 50) || "Code Project";
    const { data } = await supabase
      .from("conversations")
      .insert({ title, mode: "code", model: "claude-haiku", user_id: user.id } as any)
      .select("id")
      .single();
    if (data) { setConversationId(data.id); return data.id; }
    return null;
  };

  const handleSend = async (text?: string, retryCount = 0) => {
    const msgText = text || input;
    if (!msgText.trim() || isLoading) return;

    if (creditsLoading) { toast.error("Loading balance..."); return; }
    if (credits !== null && !hasEnoughCredits(BUILD_CREDIT_COST)) {
      toast.error("Not enough MC. You need 5 MC to build.");
      return;
    }

    const userMsg: ChatMsg = { role: "user", content: msgText };
    if (retryCount === 0) {
      setMessages(prev => [...prev, userMsg]);
      if (!text) setInput("");
    }

    setIsLoading(true);
    setSteps([]);
    setActiveStepId(null);

    const convId = await createOrGetConversation(msgText);

    if (userId && retryCount === 0) {
      const deductResp = await fetch(`${SUPABASE_URL}/functions/v1/deduct-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ user_id: userId, amount: BUILD_CREDIT_COST, action_type: "code_build", description: "Code workspace build" }),
      });
      const deductData = await deductResp.json();
      if (!deductData.success) { toast.error(deductData.error || "MC deduction failed"); setIsLoading(false); return; }
      refreshCredits();
    }

    await addStep("pre_message", getPreMessage(msgText));
    const thinkStep = await addStep("thinking", "Analyzing request...");

    try {
      const buildResp = await fetch(`${SUPABASE_URL}/functions/v1/code-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ messages: messages.filter(m => m.role !== "system").concat(retryCount === 0 ? [userMsg] : []).map(m => ({ role: m.role, content: m.content })), action: "build" }),
      });

      if (!buildResp.ok || !buildResp.body) {
        const err = await buildResp.json().catch(() => ({ error: "Build failed" }));
        throw new Error(err.error || "Build failed");
      }

      completeStep(thinkStep.id);
      const searchStep = await addStep("searching", "Searching docs...");

      const reader = buildResp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let detectedFileCount = 0;

      const readStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let ni: number;
          while ((ni = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, ni);
            buffer = buffer.slice(ni + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") return;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                const currentFiles = parseFileMarkers(fullContent);
                const newCount = Object.keys(currentFiles).length;
                if (newCount > detectedFileCount) {
                  const newFileNames = Object.keys(currentFiles).slice(detectedFileCount);
                  for (const fname of newFileNames) {
                    await addStep("creating", "Creating", fname);
                  }
                  detectedFileCount = newCount;
                }
              }
            } catch {}
          }
        }
      };

      completeStep(searchStep.id);
      const writeStep = await addStep("writing", "Generating code...");
      await readStream();
      completeStep(writeStep.id);

      const parseStep = await addStep("reading", "Parsing files...");
      let parsedFiles = parseFileMarkers(fullContent);
      if (Object.keys(parsedFiles).length === 0) parsedFiles = parseJsonFallback(fullContent);

      if (Object.keys(parsedFiles).length === 0) {
        if (retryCount < 1) { completeAllSteps(); setIsLoading(false); return handleSend(msgText, retryCount + 1); }
        throw new Error("Could not parse generated files");
      }
      completeStep(parseStep.id);

      const saveStep = await addStep("saving", "Saving changes...");
      const allFiles = { ...VITE_TEMPLATE, ...parsedFiles };
      setFiles(allFiles);
      setPreviewKey(k => k + 1);
      completeStep(saveStep.id);

      await addStep("done", "Done");
      completeAllSteps();

      const postMsg = getPostMessage(msgText, Object.keys(parsedFiles));
      setMessages(prev => [...prev, { role: "assistant", content: postMsg, type: "build" }]);

      if (userId) {
        const { data: proj } = await supabase.from("projects")
          .insert({ user_id: userId, name: msgText.slice(0, 50) || "Untitled Project", status: "ready", files_snapshot: { ...allFiles, ...(supabaseConfig ? { __supabase_config: supabaseConfig } : {}) } as any, conversation_id: conversationId })
          .select("id").single();
        if (proj) setProjectId(proj.id);
      }

      if (convId) {
        supabase.from("messages").insert([
          { conversation_id: convId, role: "user", content: msgText },
          { conversation_id: convId, role: "assistant", content: postMsg },
        ]);
      }

      if (isMobile) setActiveTab("preview");

    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      await addStep("error", `Error: ${errMsg}`);
      completeAllSteps();
      setMessages(prev => [...prev, { role: "assistant", content: `Build error: ${errMsg}. Please try again.` }]);
    }

    setIsLoading(false);
  };

  const handleRefreshPreview = () => {
    setPreviewKey(k => k + 1);
  };

  const handleDownloadFiles = () => {
    if (Object.keys(files).length === 0) return;
    const content = Object.entries(files).map(([p, c]) => `// ===== ${p} =====\n${c}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "megsy-project.txt";
    a.click();
  };

  const handleGitHubPush = async () => {
    if (Object.keys(files).length === 0) { toast.error("No files to push."); return; }
    toast.loading("Creating GitHub repo...");
    try {
      const result = await callGithub({ action: "auto-create-push", files: Object.entries(files).map(([path, content]) => ({ path, content })), project_name: prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "megsy-project" });
      if (result.error) throw new Error(result.error);
      toast.dismiss();
      toast.success(`Repository created: ${result.repo_url || "Success!"}`);
      if (result.repo_url) {
        setMessages(prev => [...prev, { role: "assistant", content: `✅ GitHub repo created!\n\n[${result.repo_url}](${result.repo_url})` }]);
      }
    } catch (e) {
      toast.dismiss();
      toast.error(e instanceof Error ? e.message : "Failed to push to GitHub");
    }
  };

  const handleVercelDeploy = async () => {
    if (Object.keys(files).length === 0) { toast.error("No files to deploy."); return; }
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/vercel-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ files, project_name: prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "megsy-project" }),
      });
      const data = await resp.json();
      if (data.success && data.url) {
        setMessages(prev => [...prev, { role: "assistant", content: `Deployed!\n\n[${data.url}](${data.url})`, type: "status" }]);
        toast.success("Deployed to Vercel!");
      } else toast.error(data.error || "Deploy failed");
    } catch { toast.error("Failed to deploy"); }
  };

  const chatPanel = (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <button onClick={() => navigate("/code")} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{prompt?.slice(0, 40) || "Megsy Code"}</span>
        <div className="w-8" />
      </div>

      <CodeChatContainer messages={messages} steps={steps} activeStepId={activeStepId} isThinking={isLoading && steps.length === 0} />

      {showSupabaseConnect && (
        <div className="px-4 pb-2">
          <SupabaseConnectCard projectId={projectId} onConnected={(url, key) => {
            setSupabaseConfig({ url, anon_key: key });
            setShowSupabaseConnect(false);
            setMessages(prev => [...prev, { role: "assistant", content: "Supabase connected!" }]);
          }} />
        </div>
      )}

      <div className="shrink-0 px-4 py-3 max-w-3xl mx-auto w-full">
        <div className="relative">
          <AnimatedPlusMenu open={menuOpen} onClose={() => setMenuOpen(false)} onGitHub={handleGitHubPush} onVercel={handleVercelDeploy} onDownload={handleDownloadFiles} onSupabase={() => { setMenuOpen(false); setShowSupabaseConnect(true); }} hasFiles={Object.keys(files).length > 0} />
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Describe your project..." rows={1} className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32 font-mono" style={{ minHeight: "32px" }} />
            <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const previewPanel = (
    <div className="h-full relative bg-secondary flex flex-col">
      {Object.keys(files).length > 0 ? (
        <div className="flex-1 h-full relative overflow-hidden">
          <NodepodPreview files={files} previewKey={previewKey} />
          <button onClick={handleRefreshPreview} className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-all shadow-sm z-10" title="Reload">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-2">
            <Globe className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">Preview will appear here</p>
            <p className="text-xs text-muted-foreground/60">Describe your project to start building</p>
          </div>
        </div>
      )}
    </div>
  );

  if (!isMobile) {
    return (
      <div className="h-[100dvh] flex bg-background">
        <div className="w-[420px] shrink-0 border-r border-border">{chatPanel}</div>
        <div className="flex-1 min-w-0">{previewPanel}</div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 overflow-hidden min-h-0">{activeTab === "chat" ? chatPanel : previewPanel}</div>
      <div className="flex border-t border-border">
        <button onClick={() => setActiveTab("chat")} className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${activeTab === "chat" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"}`}>Chat</button>
        <button onClick={() => setActiveTab("preview")} className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${activeTab === "preview" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"}`}>Preview</button>
      </div>
    </div>
  );
};

function getPreMessage(prompt: string): string {
  const isArabic = /[\u0600-\u06FF]/.test(prompt);
  return isArabic
    ? `تمام، هبدأ أبني المشروع دلوقتي. هعمل كل الملفات والصفحات اللي محتاجها وهخلي التصميم نظيف ومتجاوب.`
    : `Got it! I'll start building your project now. I'll create all the necessary files, components, and styles.`;
}

function getPostMessage(prompt: string, fileNames: string[]): string {
  const isArabic = /[\u0600-\u06FF]/.test(prompt);
  const count = fileNames.length;
  return isArabic
    ? `خلصت! عملت ${count} ملف:\n${fileNames.map(f => `- ${f}`).join("\n")}\n\nتقدر تشوف البريفيو دلوقتي. لو عايز تعدل حاجة قولي.`
    : `Done! Built ${count} files:\n${fileNames.map(f => `- ${f}`).join("\n")}\n\nCheck the preview. Let me know if you want changes.`;
}

const AnimatedPlusMenu = ({ open, onClose, onGitHub, onVercel, onDownload, onSupabase, hasFiles }: {
  open: boolean; onClose: () => void; onGitHub: () => void; onVercel: () => void; onDownload: () => void; onSupabase: () => void; hasFiles: boolean;
}) => (
  <AnimatePresence>
    {open && (
      <>
        <div className="fixed inset-0 z-30" onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-56">
          <p className="text-[10px] text-muted-foreground uppercase px-3 py-1">Deploy</p>
          <button onClick={() => { onClose(); onVercel(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm ${hasFiles ? "text-foreground hover:bg-accent" : "text-muted-foreground opacity-50 cursor-not-allowed"}`} disabled={!hasFiles}><Triangle className="w-4 h-4" /> Vercel</button>
          <button onClick={() => { onClose(); onGitHub(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm ${hasFiles ? "text-foreground hover:bg-accent" : "text-muted-foreground opacity-50 cursor-not-allowed"}`} disabled={!hasFiles}><Github className="w-4 h-4" /> GitHub</button>
          <button onClick={() => { onClose(); onDownload(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm ${hasFiles ? "text-foreground hover:bg-accent" : "text-muted-foreground opacity-50 cursor-not-allowed"}`} disabled={!hasFiles}><Download className="w-4 h-4" /> Download</button>
          <p className="text-[10px] text-muted-foreground uppercase px-3 py-1 mt-1">Connect</p>
          <button onClick={onSupabase} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent"><Database className="w-4 h-4" /> Supabase</button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default CodeWorkspace;
