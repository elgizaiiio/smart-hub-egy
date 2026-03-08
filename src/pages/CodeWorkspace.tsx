import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, ArrowUp, Loader2, Globe, MessageSquare, Database, Github, RefreshCw, Triangle } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
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

interface SandboxState {
  spriteName: string | null;
  previewUrl: string | null;
  status: "idle" | "creating" | "ready" | "building" | "error";
}

type FileTree = Record<string, string>;

const callSandbox = async (body: Record<string, unknown>) => {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/sprites-sandbox`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Sandbox error: ${resp.status}`);
  }
  return resp.json();
};

const callGithub = async (body: Record<string, unknown>) => {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/github-repo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return resp.json();
};

const VITE_TEMPLATE: FileTree = {
  "package.json": JSON.stringify({
    name: "megsy-project",
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: { dev: "vite --host 0.0.0.0 --port 3000", build: "vite build", preview: "vite preview" },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.30.0",
    },
    devDependencies: {
      "@types/react": "^18.3.1",
      "@types/react-dom": "^18.3.1",
      "@vitejs/plugin-react": "^4.3.1",
      vite: "^5.4.0",
      tailwindcss: "^3.4.0",
      postcss: "^8.4.0",
      autoprefixer: "^10.4.0",
    },
  }, null, 2),
  "vite.config.js": `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()], server: { host: '0.0.0.0', port: 3000 } })`,
  "index.html": `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Megsy Project</title></head>\n<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>\n</html>`,
  "src/main.jsx": `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\nimport './index.css'\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)`,
  "src/App.jsx": `export default function App() { return <div className="min-h-screen flex items-center justify-center bg-gray-50"><h1 className="text-4xl font-bold text-gray-900">Hello from Megsy!</h1></div> }`,
  "src/index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { font-family: system-ui, sans-serif; margin: 0; }`,
  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n}`,
  "postcss.config.js": `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`,
};

const DEFAULT_STEPS: () => BuildStep[] = () => [
  { id: "ai", label: "AI Generation", status: "pending" },
  { id: "parse", label: "Parsing files", status: "pending" },
  { id: "sandbox", label: "Creating sandbox", status: "pending" },
  { id: "write", label: "Writing files", status: "pending" },
  { id: "install", label: "Installing dependencies", status: "pending" },
  { id: "start", label: "Starting dev server", status: "pending" },
];

const CodeWorkspace = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const [searchParams] = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  const paramConversationId = searchParams.get("conversation_id") || "";
  const paramProjectId = searchParams.get("project_id") || "";
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<"plan" | "build">("plan");
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [isBuildActive, setIsBuildActive] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadedConversation, setLoadedConversation] = useState(false);

  const [sandbox, setSandbox] = useState<SandboxState>({
    spriteName: null, previewUrl: null, status: "idle",
  });
  const [files, setFiles] = useState<FileTree>({});
  const [conversationId, setConversationId] = useState<string | null>(paramConversationId || null);
  const [projectId, setProjectId] = useState<string | null>(paramProjectId || null);

  const { userId, hasEnoughCredits, refreshCredits } = useCredits();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, buildSteps]);

  // Load saved conversation messages
  useEffect(() => {
    if (!paramConversationId || loadedConversation) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", paramConversationId)
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        const loaded: ChatMsg[] = data.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          type: "plan" as const,
        }));
        setMessages(loaded);
      }
      setLoadedConversation(true);
    };
    loadMessages();
  }, [paramConversationId, loadedConversation]);

  // Load saved project sandbox info
  useEffect(() => {
    if (!paramProjectId) return;
    const loadProject = async () => {
      const { data } = await supabase
        .from("projects")
        .select("fly_app_name, preview_url, status, files_snapshot")
        .eq("id", paramProjectId)
        .single();
      if (data) {
        if (data.preview_url && data.fly_app_name) {
          setSandbox({
            spriteName: data.fly_app_name,
            previewUrl: data.preview_url,
            status: data.status === "running" ? "ready" : "idle",
          });
        }
        if (data.files_snapshot && typeof data.files_snapshot === "object") {
          setFiles(data.files_snapshot as FileTree);
        }
      }
    };
    loadProject();
  }, [paramProjectId]);

  // Auto-send initial prompt (only if no conversation loaded)
  useEffect(() => {
    if (prompt && messages.length === 0 && !paramConversationId) {
      handleSend(prompt);
    }
  }, [prompt, loadedConversation]);

  const updateStep = (stepId: string, updates: Partial<BuildStep>) => {
    setBuildSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  const createOrGetConversation = async (firstMessage: string) => {
    if (conversationId) return conversationId;
    const title = firstMessage.slice(0, 50) || "Code Project";
    const { data } = await supabase
      .from("conversations")
      .insert({ title, mode: "code", model: "grok-3" })
      .select("id")
      .single();
    if (data) {
      setConversationId(data.id);
      return data.id;
    }
    return null;
  };

  const handleSend = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || isLoading) return;

    const userMsg: ChatMsg = { role: "user", content: msgText };
    setMessages(prev => [...prev, userMsg]);
    if (!text) setInput("");
    setIsLoading(true);
    setIsThinking(true);

    const convId = await createOrGetConversation(msgText);
    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = "";

    // Always use plan mode for chat - user must explicitly switch
    const systemPrompt = `You are Megsy Code, an expert full-stack AI programming agent. You build complete React applications with:
- React + Vite + React Router
- Tailwind CSS for styling
- Multiple pages/routes with react-router-dom
- Component-based architecture
- Clean, production-ready code

Analyze the user's request thoroughly:
1. Understand the full scope (pages, components, features)
2. Outline a detailed plan with file structure, tech stack, and features
3. Ask clarifying questions if the request is ambiguous
4. Plan: Pages → Components → Styling → Interactivity

Be conversational. Do not use emoji. Respond in the user's language. Keep plans structured and actionable.`;

    const allMessages = messages
      .filter(m => m.role !== "system" && m.type !== "log" && m.type !== "timeline")
      .concat(userMsg)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
    allMessages.unshift({ role: "user" as const, content: `[System]: ${systemPrompt}` });

    await streamChat({
      messages: allMessages,
      model: "x-ai/grok-3",
      onDelta: (chunk) => {
        setIsThinking(false);
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.type !== "log" && last.type !== "timeline") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { role: "assistant", content: assistantContent, type: "plan" }];
        });
      },
      onDone: () => {
        setIsLoading(false);
        setIsThinking(false);
        if (convId) {
          supabase.from("messages").insert([
            { conversation_id: convId, role: "user", content: msgText },
            { conversation_id: convId, role: "assistant", content: assistantContent },
          ]);
        }
      },
      onError: (err) => {
        toast.error(err);
        setIsLoading(false);
        setIsThinking(false);
      },
      signal: controller.signal,
    });
  };

  const provisionSandbox = async (): Promise<SandboxState> => {
    const spriteName = `megsy-${Date.now()}`;
    setSandbox(s => ({ ...s, status: "creating" }));

    const spriteData = await callSandbox({ action: "create", sprite_name: spriteName });
    const previewUrl = spriteData.url || `https://${spriteName}.sprites.app`;

    await new Promise(r => setTimeout(r, 3000));

    const newState: SandboxState = { spriteName, previewUrl, status: "ready" };
    setSandbox(newState);
    return newState;
  };

  const writeFilesToSandbox = async (sb: SandboxState, filesToWrite: FileTree) => {
    const entries = Object.entries(filesToWrite);
    for (let i = 0; i < entries.length; i++) {
      const [filePath, content] = entries[i];
      updateStep("write", { detail: filePath });
      await callSandbox({
        action: "write-file",
        sprite_name: sb.spriteName,
        file_path: `/app/${filePath}`,
        file_content: content,
      });
    }
  };

  const handleApprove = async () => {
    if (!hasEnoughCredits(BUILD_CREDIT_COST)) {
      toast.error("رصيد MC غير كافي. تحتاج 5 MC للبناء.");
      return;
    }

    // Initialize build timeline
    const steps = DEFAULT_STEPS();
    setBuildSteps(steps);
    setIsBuildActive(true);
    setIsLoading(true);
    setIsThinking(true);

    // Add timeline message
    setMessages(prev => [...prev, { role: "system", content: "", type: "timeline" }]);

    // Deduct credits
    if (userId) {
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
        setIsLoading(false);
        setIsThinking(false);
        setIsBuildActive(false);
        return;
      }
      refreshCredits();
    }

    // Step 1: AI Generation
    updateStep("ai", { status: "running" });

    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";

    const buildPrompt = `You are Megsy Code in build mode. Based on the conversation, generate a complete React+Vite project with Tailwind CSS. Output ONLY a valid JSON object: {"files":{"path":"content",...}}. 

Rules:
- Use React with JSX (.jsx files)
- Use react-router-dom for multi-page apps (BrowserRouter)
- Tailwind CSS for all styling
- Keep files in src/ directory
- Include proper error handling and responsive design
- Do NOT include package.json, vite.config.js, index.html, src/main.jsx, src/index.css, tailwind.config.js, postcss.config.js unless you need to modify defaults
- Output raw JSON only, no markdown.`;

    const allMessages = messages
      .filter(m => m.role !== "system")
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
    allMessages.unshift({ role: "user" as const, content: `[System]: ${buildPrompt}` });
    allMessages.push({ role: "user" as const, content: "Build the project now. Output only JSON." });

    await streamChat({
      messages: allMessages,
      model: "x-ai/grok-3",
      onDelta: (chunk) => {
        setIsThinking(false);
        assistantContent += chunk;
      },
      onDone: async () => {
        setIsThinking(false);
        updateStep("ai", { status: "done" });

        // Step 2: Parse
        updateStep("parse", { status: "running" });

        try {
          let parsed: { files: FileTree };
          let cleaned = assistantContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
          const jsonStart = cleaned.search(/[\{\[]/);
          const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === "[" ? "]" : "}");
          if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
          cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
            parsed = JSON.parse(cleaned);
          }

          if (!parsed.files || typeof parsed.files !== "object") throw new Error("Invalid file structure");

          const allFiles = { ...VITE_TEMPLATE, ...parsed.files };
          setFiles(allFiles);
          updateStep("parse", { status: "done", detail: `${Object.keys(parsed.files).length} files` });

          // Show generated files
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: `Project built with ${Object.keys(parsed.files).length} files:\n${Object.keys(parsed.files).map(f => `• ${f}`).join("\n")}`,
              type: "build",
            },
          ]);

          // Save project
          let savedProjectId: string | null = null;
          if (userId) {
            const { data: proj } = await supabase
              .from("projects")
              .insert({
                user_id: userId,
                name: prompt.slice(0, 50) || "Untitled Project",
                status: "created",
                files_snapshot: allFiles as any,
                conversation_id: conversationId,
              })
              .select("id")
              .single();
            if (proj) {
              savedProjectId = proj.id;
              setProjectId(proj.id);
            }
          }

          // Step 3: Sandbox
          updateStep("sandbox", { status: "running" });
          try {
            const sb = await provisionSandbox();
            updateStep("sandbox", { status: "done" });

            // Step 4: Write files
            updateStep("write", { status: "running" });
            await writeFilesToSandbox(sb, allFiles);
            updateStep("write", { status: "done" });

            // Step 5: Install
            updateStep("install", { status: "running" });
            await callSandbox({ action: "exec", sprite_name: sb.spriteName, command: "cd /app && npm install" });
            updateStep("install", { status: "done" });

            // Step 6: Start
            updateStep("start", { status: "running" });
            await callSandbox({ action: "exec", sprite_name: sb.spriteName, command: "cd /app && npm run dev &" });
            updateStep("start", { status: "done" });

            if (savedProjectId) {
              await supabase.from("projects").update({
                fly_app_name: sb.spriteName,
                preview_url: sb.previewUrl,
                status: "running",
              }).eq("id", savedProjectId);
            }

            setPreviewError(false);
            setActiveTab("preview");
          } catch (sandboxErr) {
            updateStep("sandbox", { status: "error", detail: sandboxErr instanceof Error ? sandboxErr.message : "Error" });
            if (savedProjectId) {
              await supabase.from("projects").update({ status: "ready" }).eq("id", savedProjectId);
            }
          }
        } catch (e) {
          updateStep("parse", { status: "error", detail: e instanceof Error ? e.message : "Error" });
          setMessages(prev => [
            ...prev,
            { role: "assistant", content: `Build error: ${e instanceof Error ? e.message : "Unknown"}. Please try again.` },
          ]);
        }

        setIsLoading(false);
        // Return to plan mode after build so chat mode isn't auto-activated
        setMode("plan");
      },
      onError: (err) => {
        toast.error(err);
        setIsLoading(false);
        setIsThinking(false);
        updateStep("ai", { status: "error", detail: err });
      },
      signal: controller.signal,
    });
  };

  const handleGitHubPush = async () => {
    if (Object.keys(files).length === 0) {
      toast.error("No project files to push. Build the project first.");
      return;
    }
    const connCheck = await callGithub({ action: "check-connection" });
    if (!connCheck.connected) {
      toast.error("GitHub not connected. Go to Settings > Integrations.");
      navigate("/settings/integrations");
      return;
    }
    const repoName = `megsy-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "project"}-${Date.now().toString(36)}`;
    const createResult = await callGithub({
      action: "create-repo", repo_name: repoName,
      description: `Created by Megsy Code: ${prompt.slice(0, 100)}`,
    });
    if (createResult.error) { toast.error("Failed to create repository"); return; }
    const fileArray = Object.entries(files).map(([path, content]) => ({ path, content }));
    await callGithub({ action: "push-files", repo_name: repoName, files: fileArray });
    const repoUrl = createResult.data?.execution_output?.data?.html_url || `https://github.com/${repoName}`;
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: `GitHub repository created!\n\n[${repoName}](${repoUrl})`, type: "status" },
    ]);
    toast.success("Repository created on GitHub!");
  };

  const handleVercelDeploy = async () => {
    if (Object.keys(files).length === 0) {
      toast.error("No project files to deploy. Build the project first.");
      return;
    }
    setMessages(prev => [...prev, { role: "system", content: "Deploying to Vercel...", type: "log" }]);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/vercel-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          files,
          project_name: prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "megsy-project",
        }),
      });
      const data = await resp.json();
      if (data.success && data.url) {
        setMessages(prev => [
          ...prev.filter(m => !(m.type === "log" && m.content === "Deploying to Vercel...")),
          { role: "assistant", content: `Deployed to Vercel!\n\n[${data.url}](${data.url})`, type: "status" },
        ]);
        toast.success("Deployed to Vercel!");
      } else {
        toast.error(data.error || "Vercel deployment failed");
        setMessages(prev => prev.filter(m => !(m.type === "log" && m.content === "Deploying to Vercel...")));
      }
    } catch {
      toast.error("Failed to deploy to Vercel");
      setMessages(prev => prev.filter(m => !(m.type === "log" && m.content === "Deploying to Vercel...")));
    }
  };

  const handleRetryPreview = () => {
    setPreviewError(false);
    if (sandbox.previewUrl) {
      setSandbox(s => ({ ...s, previewUrl: s.previewUrl + "?" + Date.now() }));
    }
  };

  const lastAssistantIsPlan =
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant" &&
    mode === "plan" &&
    !isLoading &&
    !isBuildActive;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      {activeTab === "chat" && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <button onClick={() => navigate("/code")} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {isBuildActive ? "Building..." : "Chat Mode"}
            </span>
            {sandbox.status === "ready" && <span className="w-2 h-2 rounded-full bg-green-500" title="Sandbox running" />}
          </div>
          <div className="w-8" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === "chat" ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                  {msg.role === "user" ? (
                    <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">
                      {msg.content}
                    </div>
                  ) : msg.type === "timeline" ? (
                    buildSteps.length > 0 && (
                      <BuildTimeline steps={buildSteps} title="Building your project" />
                    )
                  ) : msg.type === "log" ? (
                    <div className="text-xs text-muted-foreground font-mono py-1 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {msg.content}
                    </div>
                  ) : (
                    <div className="prose-chat text-foreground text-sm" dir="auto">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {isThinking && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && <ThinkingLoader />}
              {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && <ThinkingLoader />}

              {/* Approve plan button */}
              {lastAssistantIsPlan && (
                <motion.button
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleApprove}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Approve Plan ({BUILD_CREDIT_COST} MC)
                </motion.button>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 py-3 max-w-3xl mx-auto w-full">
              <div className="relative">
                <AnimatedPlusMenu
                  open={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  onGitHub={handleGitHubPush}
                  onVercel={handleVercelDeploy}
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
                    placeholder="Ask about your project..."
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
        ) : (
          <div className="h-full relative">
            {sandbox.previewUrl && !previewError ? (
              <>
                <iframe
                  ref={iframeRef}
                  src={sandbox.previewUrl}
                  className="w-full h-full border-none"
                  title="Project Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onError={() => setPreviewError(true)}
                />
                {/* Refresh button overlay */}
                <button
                  onClick={handleRetryPreview}
                  className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-background transition-all shadow-sm"
                  title="Reload preview"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-secondary">
                <div className="text-center space-y-3">
                  {previewError ? (
                    <>
                      <p className="text-foreground text-sm font-medium">Preview unavailable</p>
                      <p className="text-xs text-muted-foreground">The sandbox may still be starting up</p>
                      <button
                        onClick={handleRetryPreview}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" /> Retry
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-sm">Preview will appear here</p>
                      <p className="text-xs text-muted-foreground">
                        {sandbox.status === "creating"
                          ? "Creating sandbox..."
                          : sandbox.status === "building"
                          ? "Building project..."
                          : "Approve the plan to start building"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom tabs */}
      <div className="flex border-t border-border">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${
            activeTab === "chat" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${
            activeTab === "preview" ? "text-primary border-t-2 border-primary" : "text-muted-foreground"
          }`}
        >
          Preview
        </button>
      </div>
    </div>
  );
};

// Plus menu - removed Chat Mode toggle since it should always be in plan/chat mode
const AnimatedPlusMenu = ({
  open,
  onClose,
  onGitHub,
  onVercel,
  onSupabase,
  hasFiles,
}: {
  open: boolean;
  onClose: () => void;
  onGitHub: () => void;
  onVercel: () => void;
  onSupabase: () => void;
  hasFiles: boolean;
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
          <button
            onClick={() => { onClose(); onVercel(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
              hasFiles ? "text-foreground hover:bg-accent" : "text-muted-foreground cursor-not-allowed opacity-50"
            }`}
            disabled={!hasFiles}
          >
            <Triangle className="w-4 h-4 text-muted-foreground" /> Deploy to Vercel
          </button>
          <button
            onClick={() => { onClose(); onGitHub(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
              hasFiles ? "text-foreground hover:bg-accent" : "text-muted-foreground cursor-not-allowed opacity-50"
            }`}
            disabled={!hasFiles}
          >
            <Github className="w-4 h-4 text-muted-foreground" /> Push to GitHub
          </button>
          <p className="text-[10px] text-muted-foreground uppercase px-3 py-1 mt-1">Connect</p>
          <button
            onClick={() => { onClose(); onSupabase(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground"
          >
            <Database className="w-4 h-4 text-muted-foreground" /> Supabase
          </button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default CodeWorkspace;
