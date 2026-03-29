import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, ArrowUp, Loader2, Globe, Github, RefreshCw, Triangle, Download } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useIsMobile } from "@/hooks/use-mobile";
import ThinkingLoader from "@/components/ThinkingLoader";
import BuildTimeline, { BuildStep } from "@/components/BuildTimeline";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";

const BUILD_CREDIT_COST = 5;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
  type?: "plan" | "build" | "log" | "status" | "timeline";
}

type FileTree = Record<string, string>;

// ── Parse ===FILE: path=== ... ===END=== format ──
const parseFileMarkers = (raw: string): FileTree => {
  const files: FileTree = {};
  const regex = /===FILE:\s*(.+?)===\n([\s\S]*?)===END===/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    const path = match[1].trim();
    const content = match[2];
    if (path && content !== undefined) {
      files[path] = content;
    }
  }
  return files;
};

// ── Fallback: try JSON parse ──
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

// ── Build HTML for in-browser preview ──
const buildPreviewHtml = (files: FileTree): string => {
  // Collect all JSX/JS files
  const modules: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    if (path.match(/\.(jsx|js|tsx|ts)$/) && !path.includes("vite.config") && !path.includes("postcss") && !path.includes("tailwind.config")) {
      modules[path] = content;
    }
  }

  // Get CSS
  const cssFiles = Object.entries(files)
    .filter(([p]) => p.endsWith(".css"))
    .map(([, c]) => c.replace(/@tailwind\s+\w+;/g, "").replace(/@import\s+[^;]+;/g, ""))
    .join("\n");

  // Build module map as inline scripts
  const moduleScripts = Object.entries(modules)
    .map(([path, code]) => {
      // Escape for embedding in HTML
      const escaped = code
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$\{/g, "\\${");
      return `__modules["${path}"] = \`${escaped}\`;`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<script src="https://unpkg.com/react-router-dom@6/dist/umd/react-router-dom.production.min.js"><\/script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; }
${cssFiles}
</style>
</head>
<body>
<div id="root"></div>
<script>
// Simple module system for in-browser preview
const __modules = {};
${moduleScripts}

// Resolve imports
function __require(name) {
  if (name === 'react' || name === 'React') return React;
  if (name === 'react-dom' || name === 'react-dom/client') return ReactDOM;
  if (name === 'react-router-dom') return ReactRouterDOM;
  
  // Try to find module
  const candidates = [name, name + '.jsx', name + '.js', 'src/' + name, 'src/' + name + '.jsx', 'src/' + name + '.js'];
  for (const c of candidates) {
    if (__modules[c]) return __evalModule(c);
  }
  
  // Return empty module
  console.warn('Module not found:', name);
  return {};
}

const __moduleCache = {};
function __evalModule(path) {
  if (__moduleCache[path]) return __moduleCache[path];
  
  const code = __modules[path];
  if (!code) return {};
  
  try {
    // Transform import/export with Babel
    let transformed = code;
    
    // Replace import statements
    transformed = transformed.replace(/import\\s+(?:React|{[^}]*}|\\*\\s+as\\s+\\w+|\\w+)\\s+from\\s+['"]([^'"]+)['"]/g, (match, mod) => {
      return '/* import from ' + mod + ' */';
    });
    transformed = transformed.replace(/import\\s+['"]([^'"]+)['"]/g, '/* import $1 */');
    
    // Replace export default
    transformed = transformed.replace(/export\\s+default\\s+/g, '__exports.default = ');
    transformed = transformed.replace(/export\\s+(?:const|let|var|function|class)\\s+/g, '__exports.');
    
    const __exports = {};
    const fn = new Function('React', 'ReactDOM', 'ReactRouterDOM', '__exports', '__require', transformed);
    fn(React, ReactDOM, ReactRouterDOM, __exports, __require);
    
    __moduleCache[path] = __exports.default || __exports;
    return __moduleCache[path];
  } catch(e) {
    console.error('Error evaluating', path, e);
    return {};
  }
}

// Try Babel approach for JSX
try {
  // Find App component
  const appCandidates = ['src/App.jsx', 'src/App.js', 'src/App.tsx', 'App.jsx', 'App.js'];
  let appCode = null;
  let appPath = null;
  
  for (const c of appCandidates) {
    if (__modules[c]) {
      appCode = __modules[c];
      appPath = c;
      break;
    }
  }
  
  if (appCode) {
    // Use Babel to transform ALL modules
    const allCode = [];
    
    // Sort: non-App files first, App last
    const sortedPaths = Object.keys(__modules).sort((a, b) => {
      if (a.includes('App')) return 1;
      if (b.includes('App')) return -1;
      return 0;
    });
    
    for (const p of sortedPaths) {
      if (p.includes('main.jsx') || p.includes('main.js') || p.includes('main.tsx')) continue;
      
      let code = __modules[p];
      // Clean imports
      code = code.replace(/import\\s+.*?from\\s+['"][^'"]+['"]/g, '');
      code = code.replace(/import\\s+['"][^'"]+['"]/g, '');
      // Replace exports
      code = code.replace(/export\\s+default\\s+function\\s+(\\w+)/g, 'function $1');
      code = code.replace(/export\\s+default\\s+/g, 'var __default_' + p.replace(/[^a-zA-Z0-9]/g, '_') + ' = ');
      code = code.replace(/export\\s+(const|let|var|function|class)\\s+/g, '$1 ');
      
      allCode.push('// --- ' + p + ' ---\\n' + code);
    }
    
    const combined = allCode.join('\\n\\n');
    
    const transformed = Babel.transform(combined, {
      presets: ['react'],
      filename: 'combined.jsx',
    }).code;
    
    eval(transformed);
    
    // Find App component
    const AppComponent = window.App || window.__default_src_App_jsx || eval('typeof App !== "undefined" ? App : null');
    
    if (AppComponent) {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      
      // Check if react-router-dom is used
      if (typeof ReactRouterDOM !== 'undefined' && appCode.includes('Router')) {
        root.render(React.createElement(ReactRouterDOM.BrowserRouter, null, React.createElement(AppComponent)));
      } else {
        root.render(React.createElement(AppComponent));
      }
    } else {
      document.getElementById('root').innerHTML = '<div style="padding:2rem;color:#888;">Could not find App component</div>';
    }
  } else {
    document.getElementById('root').innerHTML = '<div style="padding:2rem;color:#888;">No App component found in generated files</div>';
  }
} catch(e) {
  console.error('Preview error:', e);
  document.getElementById('root').innerHTML = '<div style="padding:2rem;"><h3 style="color:#ef4444;margin-bottom:8px;">Preview Error</h3><pre style="background:#1a1a1a;color:#fca5a5;padding:1rem;border-radius:8px;overflow:auto;font-size:12px;">' + e.message + '</pre></div>';
}
<\/script>
</body>
</html>`;
};

// ── VITE template defaults ──
const VITE_TEMPLATE: FileTree = {
  "src/main.jsx": `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\nimport './index.css'\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)`,
  "src/App.jsx": `export default function App() { return <div className="min-h-screen flex items-center justify-center bg-gray-50"><h1 className="text-4xl font-bold text-gray-900">Hello from Megsy!</h1></div> }`,
  "src/index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { font-family: system-ui, sans-serif; margin: 0; }`,
};

const DEFAULT_STEPS: () => BuildStep[] = () => [
  { id: "ai", label: "AI Generation", status: "pending" },
  { id: "parse", label: "Parsing files", status: "pending" },
  { id: "preview", label: "Rendering preview", status: "pending" },
];

const callGithub = async (body: Record<string, unknown>) => {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/github-repo`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify(body),
  });
  return resp.json();
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
  const [isThinking, setIsThinking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [isBuildActive, setIsBuildActive] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadedConversation, setLoadedConversation] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);

  const [files, setFiles] = useState<FileTree>({});
  const [conversationId, setConversationId] = useState<string | null>(paramConversationId || null);
  const [projectId, setProjectId] = useState<string | null>(paramProjectId || null);

  const { userId, hasEnoughCredits, refreshCredits } = useCredits();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, buildSteps]);

  // Listen for iframe console errors
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "console-error") {
        setConsoleErrors(prev => [...prev.slice(-9), e.data.message]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Load saved conversation
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

  // Load saved project files
  useEffect(() => {
    if (!paramProjectId) return;
    const loadProject = async () => {
      const { data } = await supabase
        .from("projects")
        .select("files_snapshot")
        .eq("id", paramProjectId)
        .single();
      if (data?.files_snapshot && typeof data.files_snapshot === "object") {
        const loadedFiles = data.files_snapshot as FileTree;
        setFiles(loadedFiles);
        // Re-render preview from saved files
        const html = buildPreviewHtml({ ...VITE_TEMPLATE, ...loadedFiles });
        setPreviewHtml(html);
      }
    };
    loadProject();
  }, [paramProjectId]);

  // Auto-send initial prompt
  useEffect(() => {
    if (prompt && messages.length === 0 && !paramConversationId) {
      handleSend(prompt);
    }
  }, [prompt, loadedConversation]);

  // Render preview in iframe when previewHtml changes
  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const blob = new Blob([previewHtml], { type: "text/html" });
      iframeRef.current.src = URL.createObjectURL(blob);
    }
  }, [previewHtml]);

  const updateStep = (stepId: string, updates: Partial<BuildStep>) => {
    setBuildSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  const createOrGetConversation = async (firstMessage: string) => {
    if (conversationId) return conversationId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const title = firstMessage.slice(0, 50) || "Code Project";
    const { data } = await supabase
      .from("conversations")
      .insert({ title, mode: "code", model: "claude-sonnet", user_id: user.id } as any)
      .select("id")
      .single();
    if (data) { setConversationId(data.id); return data.id; }
    return null;
  };

  // ── Direct build: prompt → generate → parse → preview ──
  const handleSend = async (text?: string, retryCount = 0) => {
    const msgText = text || input;
    if (!msgText.trim() || isLoading) return;

    if (!hasEnoughCredits(BUILD_CREDIT_COST)) {
      toast.error("رصيد MC غير كافي. تحتاج 5 MC للبناء.");
      return;
    }

    const userMsg: ChatMsg = { role: "user", content: msgText };
    if (retryCount === 0) {
      setMessages(prev => [...prev, userMsg]);
      if (!text) setInput("");
    }

    setIsLoading(true);
    setIsThinking(true);
    setIsBuildActive(true);

    // Initialize build steps
    const steps = DEFAULT_STEPS();
    setBuildSteps(steps);
    setMessages(prev => {
      // Remove previous timeline if retrying
      const filtered = prev.filter(m => m.type !== "timeline");
      return [...filtered, { role: "system", content: "", type: "timeline" }];
    });

    const convId = await createOrGetConversation(msgText);

    // Deduct credits
    if (userId && retryCount === 0) {
      const deductResp = await fetch(`${SUPABASE_URL}/functions/v1/deduct-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          user_id: userId, amount: BUILD_CREDIT_COST,
          action_type: "code_build", description: "Code workspace build",
        }),
      });
      const deductData = await deductResp.json();
      if (!deductData.success) {
        toast.error(deductData.error || "MC deduction failed");
        setIsLoading(false); setIsThinking(false); setIsBuildActive(false);
        return;
      }
      refreshCredits();
    }

    // Step 1: AI Generation
    updateStep("ai", { status: "running" });

    const allMessages = messages
      .filter(m => m.role !== "system" && m.type !== "log" && m.type !== "timeline")
      .concat(retryCount === 0 ? [userMsg] : [])
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const buildResp = await fetch(`${SUPABASE_URL}/functions/v1/code-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ messages: allMessages, action: "build" }),
      });

      if (!buildResp.ok || !buildResp.body) {
        const err = await buildResp.json().catch(() => ({ error: "Build request failed" }));
        throw new Error(err.error || "Build request failed");
      }

      // Stream response
      const reader = buildResp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let streamingFiles: FileTree = {};

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
                setIsThinking(false);
                fullContent += content;

                // Streaming file detection
                const currentFiles = parseFileMarkers(fullContent);
                if (Object.keys(currentFiles).length > Object.keys(streamingFiles).length) {
                  streamingFiles = currentFiles;
                  updateStep("ai", { detail: `${Object.keys(streamingFiles).length} files detected` });
                }
              }
            } catch {}
          }
        }
      };

      await readStream();
      updateStep("ai", { status: "done" });

      // Step 2: Parse files
      updateStep("parse", { status: "running" });

      let parsedFiles = parseFileMarkers(fullContent);

      // Fallback to JSON if no file markers found
      if (Object.keys(parsedFiles).length === 0) {
        parsedFiles = parseJsonFallback(fullContent);
      }

      if (Object.keys(parsedFiles).length === 0) {
        // Auto-retry once
        if (retryCount < 1) {
          updateStep("parse", { status: "error", detail: "Retrying..." });
          setIsLoading(false); setIsThinking(false);
          return handleSend(msgText, retryCount + 1);
        }
        throw new Error("Could not parse generated files");
      }

      const allFiles = { ...VITE_TEMPLATE, ...parsedFiles };
      setFiles(allFiles);
      updateStep("parse", { status: "done", detail: `${Object.keys(parsedFiles).length} files` });

      // Step 3: Render preview
      updateStep("preview", { status: "running" });

      const html = buildPreviewHtml(allFiles);
      setPreviewHtml(html);

      updateStep("preview", { status: "done" });

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Project built with ${Object.keys(parsedFiles).length} files:\n${Object.keys(parsedFiles).map(f => `- ${f}`).join("\n")}`,
          type: "build",
        },
      ]);

      // Save project
      if (userId) {
        const { data: proj } = await supabase
          .from("projects")
          .insert({
            user_id: userId,
            name: prompt.slice(0, 50) || "Untitled Project",
            status: "ready",
            files_snapshot: allFiles as any,
            conversation_id: conversationId,
          })
          .select("id")
          .single();
        if (proj) setProjectId(proj.id);
      }

      // Save messages
      if (convId) {
        supabase.from("messages").insert([
          { conversation_id: convId, role: "user", content: msgText },
          { conversation_id: convId, role: "assistant", content: `Built ${Object.keys(parsedFiles).length} files` },
        ]);
      }

      // Switch to preview on mobile
      if (isMobile) setActiveTab("preview");

    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      updateStep("parse", { status: "error", detail: errMsg });
      setMessages(prev => [...prev, { role: "assistant", content: `Build error: ${errMsg}. Please try again.` }]);
    }

    setIsLoading(false);
    setIsThinking(false);
    setIsBuildActive(false);
  };

  const handleRefreshPreview = async () => {
    if (Object.keys(files).length > 0) {
      // Deploy to Vercel for live preview
      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/vercel-deploy`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
          body: JSON.stringify({ files, project_name: prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "megsy-project" }),
        });
        const data = await resp.json();
        if (data.success && data.url) {
          setPreviewHtml(data.url);
        } else {
          // Fallback to local preview
          setPreviewHtml(buildPreviewHtml(files));
        }
      } catch {
        setPreviewHtml(buildPreviewHtml(files));
      }
    }
  };

  const handleDownloadFiles = () => {
    if (Object.keys(files).length === 0) return;
    const content = Object.entries(files)
      .map(([path, code]) => `// ===== ${path} =====\n${code}`)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "megsy-project.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGitHubPush = async () => {
    if (Object.keys(files).length === 0) { toast.error("No files to push. Build first."); return; }
    const connCheck = await callGithub({ action: "check-connection" });
    if (!connCheck.connected) { toast.error("GitHub not connected."); navigate("/settings/integrations"); return; }
    const repoName = `megsy-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "project"}-${Date.now().toString(36)}`;
    const createResult = await callGithub({ action: "create-repo", repo_name: repoName, description: `Created by Megsy Code` });
    if (createResult.error) { toast.error("Failed to create repository"); return; }
    const fileArray = Object.entries(files).map(([path, content]) => ({ path, content }));
    await callGithub({ action: "push-files", repo_name: repoName, files: fileArray });
    toast.success("Repository created on GitHub!");
  };

  const handleVercelDeploy = async () => {
    if (Object.keys(files).length === 0) { toast.error("No files to deploy. Build first."); return; }
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/vercel-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ files, project_name: prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "megsy-project" }),
      });
      const data = await resp.json();
      if (data.success && data.url) {
        setMessages(prev => [...prev, { role: "assistant", content: `Deployed to Vercel!\n\n[${data.url}](${data.url})`, type: "status" }]);
        toast.success("Deployed to Vercel!");
      } else toast.error(data.error || "Vercel deployment failed");
    } catch { toast.error("Failed to deploy"); }
  };

  // ── Chat Panel ──
  const chatPanel = (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <button onClick={() => navigate("/code")} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs text-muted-foreground">{isBuildActive ? "Building..." : "Megsy Code"}</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? (
              <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">{msg.content}</div>
            ) : msg.type === "timeline" ? (
              buildSteps.length > 0 && <BuildTimeline steps={buildSteps} title="Building your project" />
            ) : msg.type === "log" ? (
              <div className="text-xs text-muted-foreground font-mono py-1 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />{msg.content}
              </div>
            ) : (
              <div className="prose-chat text-foreground text-sm" dir="auto">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {isThinking && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && <ThinkingLoader />}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 px-4 py-3 max-w-3xl mx-auto w-full">
        <div className="relative">
          <AnimatedPlusMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onGitHub={handleGitHubPush}
            onVercel={handleVercelDeploy}
            onDownload={handleDownloadFiles}
            onSupabase={() => navigate("/settings/integrations")}
            hasFiles={Object.keys(files).length > 0}
          />
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
            <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Describe your project..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 max-h-32"
              style={{ minHeight: "32px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-20"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Preview Panel ──
  const previewPanel = (
    <div className="h-full relative bg-secondary">
      {previewHtml ? (
        <>
          <iframe
            ref={iframeRef}
            className="w-full h-full border-none"
            title="Project Preview"
            sandbox="allow-scripts allow-same-origin"
          />
          <button
            onClick={handleRefreshPreview}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-all shadow-sm"
            title="Reload preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </>
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

  // Desktop: side-by-side
  if (!isMobile) {
    return (
      <div className="h-[100dvh] flex bg-background">
        <div className="w-[420px] shrink-0 border-r border-border">{chatPanel}</div>
        <div className="flex-1 min-w-0">{previewPanel}</div>
      </div>
    );
  }

  // Mobile: tabbed
  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === "chat" ? chatPanel : previewPanel}
      </div>
      <div className="flex border-t border-border">
        <button onClick={() => setActiveTab("chat")} className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${activeTab === "chat" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"}`}>Chat</button>
        <button onClick={() => setActiveTab("preview")} className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${activeTab === "preview" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"}`}>Preview</button>
      </div>
    </div>
  );
};

// ── Plus Menu ──
const AnimatedPlusMenu = ({ open, onClose, onGitHub, onVercel, onDownload, onSupabase, hasFiles }: {
  open: boolean; onClose: () => void; onGitHub: () => void; onVercel: () => void; onDownload: () => void; onSupabase: () => void; hasFiles: boolean;
}) => (
  <AnimatePresence>
    {open && (
      <>
        <div className="fixed inset-0 z-30" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-56"
        >
          <p className="text-[10px] text-muted-foreground uppercase px-3 py-1">Deploy</p>
          <button onClick={() => { onClose(); onVercel(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm ${hasFiles ? "text-foreground hover:bg-accent" : "text-muted-foreground opacity-50 cursor-not-allowed"}`} disabled={!hasFiles}>
            <Triangle className="w-4 h-4" /> Vercel
          </button>
          <button onClick={() => { onClose(); onGitHub(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm ${hasFiles ? "text-foreground hover:bg-accent" : "text-muted-foreground opacity-50 cursor-not-allowed"}`} disabled={!hasFiles}>
            <Github className="w-4 h-4" /> GitHub
          </button>
          <button onClick={() => { onClose(); onDownload(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm ${hasFiles ? "text-foreground hover:bg-accent" : "text-muted-foreground opacity-50 cursor-not-allowed"}`} disabled={!hasFiles}>
            <Download className="w-4 h-4" /> Download
          </button>
          <p className="text-[10px] text-muted-foreground uppercase px-3 py-1 mt-1">Connect</p>
          <button onClick={() => { onClose(); onSupabase(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-foreground hover:bg-accent">
            <Globe className="w-4 h-4" /> Integrations
          </button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default CodeWorkspace;
