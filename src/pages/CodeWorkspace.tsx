import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, ArrowUp, Loader2, Globe, Paperclip, MessageSquare, Database, Github } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import ThinkingLoader from "@/components/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import { AnimatePresence, motion } from "framer-motion";

const BUILD_CREDIT_COST = 5;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
  type?: "plan" | "build" | "log" | "status";
}

interface SandboxState {
  appName: string | null;
  machineId: string | null;
  previewUrl: string | null;
  status: "idle" | "creating" | "ready" | "building" | "error";
}

// Hidden file tree - not shown to user
type FileTree = Record<string, string>;

const callSandbox = async (body: Record<string, unknown>) => {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/code-sandbox`, {
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

// Generate a Vite + React template
const VITE_TEMPLATE: FileTree = {
  "package.json": JSON.stringify({
    name: "megsy-project",
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite --host 0.0.0.0",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
    },
    devDependencies: {
      "@types/react": "^18.3.1",
      "@types/react-dom": "^18.3.1",
      "@vitejs/plugin-react": "^4.3.1",
      vite: "^5.4.0",
    },
  }, null, 2),
  "vite.config.js": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })`,
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Megsy Project</title></head>
<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>`,
  "src/main.jsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)`,
  "src/App.jsx": `export default function App() { return <div style={{padding:'2rem',fontFamily:'sans-serif'}}><h1>Hello from Megsy!</h1><p>Your project is ready.</p></div> }`,
  "src/index.css": `* { margin:0; padding:0; box-sizing:border-box; } body { font-family: system-ui, sans-serif; }`,
};

const CodeWorkspace = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const [searchParams] = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<"plan" | "build">("plan");
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sandbox state
  const [sandbox, setSandbox] = useState<SandboxState>({
    appName: null, machineId: null, previewUrl: null, status: "idle",
  });
  const [files, setFiles] = useState<FileTree>({});
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const { userId, hasEnoughCredits, refreshCredits } = useCredits();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send initial prompt
  useEffect(() => {
    if (prompt && messages.length === 0) {
      handleSend(prompt);
    }
  }, [prompt]);

  const addLog = (content: string) => {
    setMessages((prev) => [...prev, { role: "system", content, type: "log" }]);
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
    setMessages((prev) => [...prev, userMsg]);
    if (!text) setInput("");
    setIsLoading(true);
    setIsThinking(true);

    const convId = await createOrGetConversation(msgText);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = "";
    const systemPrompt =
      mode === "plan"
        ? `You are Megsy Code, a coding assistant. The user wants to build something. Analyze their request, explain what you understand, outline a plan (files, features, tech stack), and ask if they want to proceed. Be conversational. Do not use emoji. Respond in the user's language. Keep it concise.`
        : `You are Megsy Code in build mode. Generate a complete React+Vite project. Output ONLY a JSON object with this exact format: {"files":{"src/App.jsx":"code here","src/components/Header.jsx":"code here"}}. Include ALL necessary files. Do NOT include package.json, vite.config.js, index.html, src/main.jsx, src/index.css unless you need to modify them. Do not wrap in markdown code blocks.`;

    const allMessages = messages
      .filter((m) => m.role !== "system")
      .concat(userMsg)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    allMessages.unshift({ role: "user" as const, content: `[System]: ${systemPrompt}` });

    await streamChat({
      messages: allMessages,
      model: "x-ai/grok-3",
      onDelta: (chunk) => {
        setIsThinking(false);
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.type !== "log") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantContent, type: mode }];
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
    const appName = `megsy-${Date.now()}`;
    setSandbox((s) => ({ ...s, status: "creating" }));
    addLog("Creating sandbox environment...");

    try {
      // Create app
      await callSandbox({ action: "create-app", app_name: appName });
      addLog("Sandbox app created.");

      // Create machine
      const machine = await callSandbox({ action: "create-machine", app_name: appName });
      const machineId = machine.id;
      addLog("Machine provisioned. Waiting for startup...");

      // Wait for machine to be ready
      await new Promise((r) => setTimeout(r, 5000));

      const previewUrl = `https://${appName}.fly.dev`;
      const newState: SandboxState = { appName, machineId, previewUrl, status: "ready" };
      setSandbox(newState);
      addLog(`Sandbox ready at ${previewUrl}`);
      return newState;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      addLog(`Sandbox error: ${errMsg}`);
      setSandbox((s) => ({ ...s, status: "error" }));
      throw e;
    }
  };

  const writeFilesToSandbox = async (
    sb: SandboxState,
    filesToWrite: FileTree
  ) => {
    for (const [filePath, content] of Object.entries(filesToWrite)) {
      addLog(`Writing ${filePath}...`);
      await callSandbox({
        action: "write-file",
        app_name: sb.appName,
        machine_id: sb.machineId,
        file_path: filePath,
        file_content: content,
      });
    }
  };

  const handleApprove = async () => {
    if (!hasEnoughCredits(BUILD_CREDIT_COST)) {
      toast.error("رصيد الكريدت غير كافي. تحتاج 5 كريدت للبناء.");
      return;
    }

    setMode("build");
    addLog("Plan approved. Starting build...");
    setIsLoading(true);
    setIsThinking(true);

    // Deduct credits
    if (userId) {
      const deductResp = await fetch(`${SUPABASE_URL}/functions/v1/deduct-credits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          user_id: userId,
          amount: BUILD_CREDIT_COST,
          action_type: "code_build",
          description: "Code workspace build",
        }),
      });
      const deductData = await deductResp.json();
      if (!deductData.success) {
        toast.error(deductData.error || "Credit deduction failed");
        setIsLoading(false);
        setIsThinking(false);
        return;
      }
      refreshCredits();
      addLog(`${BUILD_CREDIT_COST} credits deducted.`);
    }

    // Get AI to generate files
    const controller = new AbortController();
    abortRef.current = controller;
    let assistantContent = "";

    const buildPrompt = `You are Megsy Code in build mode. Based on the conversation, generate a complete React+Vite project. Output ONLY a valid JSON object: {"files":{"path":"content",...}}. Include all source files needed. Do NOT include package.json, vite.config.js, index.html, src/main.jsx unless you need to modify the defaults. Output raw JSON only, no markdown.`;

    const allMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
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
        addLog("AI code generation complete. Parsing files...");

        try {
          // Parse AI output as JSON
          let parsed: { files: FileTree };
          // Try to extract JSON from potential markdown wrapping
          let cleaned = assistantContent
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/g, "")
            .trim();
          const jsonStart = cleaned.search(/[\{\[]/);
          const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');
          if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found in AI response");
          cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            // Fix control characters and trailing commas
            cleaned = cleaned
              .replace(/,\s*}/g, "}")
              .replace(/,\s*]/g, "]")
              .replace(/[\x00-\x1F\x7F]/g, "");
            parsed = JSON.parse(cleaned);
          }

          if (!parsed.files || typeof parsed.files !== "object") {
            throw new Error("Invalid file structure in AI response");
          }

          // Merge with template
          const allFiles = { ...VITE_TEMPLATE, ...parsed.files };
          setFiles(allFiles);
          addLog(`${Object.keys(parsed.files).length} files generated.`);

          // Show what was generated
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Project built with ${Object.keys(parsed.files).length} files:\n${Object.keys(parsed.files).map((f) => `• ${f}`).join("\n")}`,
              type: "build",
            },
          ]);

          // Save project to Supabase immediately (before sandbox)
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
              addLog("Project saved.");
            }
          }

          // Provision sandbox and deploy
          try {
            addLog("Provisioning cloud sandbox...");
            const sb = await provisionSandbox();

            // Write all files
            await writeFilesToSandbox(sb, allFiles);

            // Install deps and start dev server
            addLog("Installing dependencies...");
            await callSandbox({
              action: "exec",
              app_name: sb.appName,
              machine_id: sb.machineId,
              command: "cd /app && npm install",
            });

            addLog("Starting dev server...");
            await callSandbox({
              action: "exec",
              app_name: sb.appName,
              machine_id: sb.machineId,
              command: "cd /app && npm run dev &",
            });

            addLog("Build complete! Switch to Preview tab to see your project.");

            // Update project with sandbox info
            if (savedProjectId) {
              await supabase
                .from("projects")
                .update({
                  fly_machine_id: sb.machineId,
                  fly_app_name: sb.appName,
                  preview_url: sb.previewUrl,
                  status: "running",
                })
                .eq("id", savedProjectId);
            }

            setActiveTab("preview");
          } catch (sandboxErr) {
            const sandboxErrMsg = sandboxErr instanceof Error ? sandboxErr.message : "Sandbox error";
            addLog(`Sandbox failed: ${sandboxErrMsg}. Project files are still saved.`);
            // Update project status to reflect sandbox failure
            if (savedProjectId) {
              await supabase
                .from("projects")
                .update({ status: "ready" })
                .eq("id", savedProjectId);
            }
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : "Unknown error";
          addLog(`Build failed: ${errMsg}`);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Build error: ${errMsg}. Please try again.` },
          ]);
        }

        setIsLoading(false);
      },
      onError: (err) => {
        toast.error(err);
        setIsLoading(false);
        setIsThinking(false);
      },
      signal: controller.signal,
    });
  };

  const handleGitHubPush = async () => {
    if (Object.keys(files).length === 0) {
      toast.error("No project files to push. Build the project first.");
      return;
    }

    addLog("Checking GitHub connection...");
    const connCheck = await callGithub({ action: "check-connection" });
    if (!connCheck.connected) {
      toast.error("GitHub not connected. Go to Settings > Integrations to connect.");
      navigate("/settings/integrations");
      return;
    }

    const repoName = `megsy-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "project"}-${Date.now().toString(36)}`;
    addLog(`Creating GitHub repo: ${repoName}...`);

    const createResult = await callGithub({
      action: "create-repo",
      repo_name: repoName,
      description: `Created by Megsy Code: ${prompt.slice(0, 100)}`,
    });

    if (createResult.error) {
      addLog(`GitHub error: ${createResult.error}`);
      toast.error("Failed to create repository");
      return;
    }

    addLog("Pushing files to GitHub...");
    const fileArray = Object.entries(files).map(([path, content]) => ({ path, content }));
    await callGithub({ action: "push-files", repo_name: repoName, files: fileArray });

    const repoUrl = createResult.data?.execution_output?.data?.html_url || `https://github.com/${repoName}`;
    addLog(`Repository created: ${repoUrl}`);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: `GitHub repository created successfully!\n\n[${repoName}](${repoUrl})`, type: "status" },
    ]);
    toast.success("Repository created on GitHub!");
  };

  const handleSupabaseConnect = () => {
    toast.info("Navigating to Supabase integration...");
    navigate("/settings/integrations");
  };

  const lastAssistantIsPlan =
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant" &&
    mode === "plan" &&
    !isLoading;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      {activeTab === "chat" && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <button
            onClick={() => navigate("/code")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {mode === "plan" ? "Chat Mode" : "Build Mode"}
            </span>
            {sandbox.status === "ready" && (
              <span className="w-2 h-2 rounded-full bg-green-500" title="Sandbox running" />
            )}
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
              {isThinking &&
                (messages.length === 0 ||
                  messages[messages.length - 1]?.role === "user") && (
                  <ThinkingLoader />
                )}
              {isLoading &&
                messages.length > 0 &&
                messages[messages.length - 1]?.role === "assistant" && (
                  <ThinkingLoader />
                )}
              {/* Approve plan button */}
              {lastAssistantIsPlan && (
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Approve Plan ({BUILD_CREDIT_COST} credits)
                </button>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="shrink-0 px-4 py-3 max-w-3xl mx-auto w-full">
              <div className="relative">
                <AnimatedPlusMenu
                  open={menuOpen}
                  onToggle={() => setMenuOpen(!menuOpen)}
                  onClose={() => setMenuOpen(false)}
                  mode={mode}
                  onModeChange={(m) => {
                    setMode(m);
                    setMenuOpen(false);
                  }}
                  onGitHub={handleGitHubPush}
                  onSupabase={handleSupabaseConnect}
                  hasFiles={Object.keys(files).length > 0}
                />
                <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-secondary/80 px-3 py-2">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
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
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {sandbox.previewUrl ? (
              <iframe
                src={sandbox.previewUrl}
                className="w-full h-full border-none"
                title="Project Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-secondary">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">Preview will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sandbox.status === "creating"
                      ? "Creating sandbox..."
                      : sandbox.status === "building"
                        ? "Building project..."
                        : "Approve the plan to start building"}
                  </p>
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
            activeTab === "chat"
              ? "text-primary border-t-2 border-primary"
              : "text-muted-foreground"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${
            activeTab === "preview"
              ? "text-primary border-t-2 border-primary"
              : "text-muted-foreground"
          }`}
        >
          Preview
          {sandbox.status === "ready" && (
            <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
        </button>
      </div>
    </div>
  );
};

// Plus menu for code workspace
const AnimatedPlusMenu = ({
  open,
  onToggle,
  onClose,
  mode,
  onModeChange,
  onGitHub,
  onSupabase,
  hasFiles,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  mode: "plan" | "build";
  onModeChange: (m: "plan" | "build") => void;
  onGitHub: () => void;
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
          <button
            onClick={() => onModeChange("plan")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              mode === "plan" ? "bg-primary/10 text-primary" : "hover:bg-accent"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm">Chat Mode</p>
              <p className="text-[10px] text-muted-foreground">Plan before building</p>
            </div>
            {mode === "plan" && <span className="ml-auto text-xs text-primary">On</span>}
          </button>
          <div className="border-t border-border mt-1 pt-1">
            <p className="text-[10px] text-muted-foreground uppercase px-3 py-1">
              Connect
            </p>
            <button
              onClick={() => {
                onClose();
                onGitHub();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                hasFiles
                  ? "text-foreground hover:bg-accent"
                  : "text-muted-foreground cursor-not-allowed opacity-50"
              }`}
              disabled={!hasFiles}
            >
              <Github className="w-4 h-4 text-muted-foreground" /> Push to GitHub
            </button>
            <button
              onClick={() => {
                onClose();
                onSupabase();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-accent transition-colors text-sm text-foreground"
            >
              <Database className="w-4 h-4 text-muted-foreground" /> Supabase
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default CodeWorkspace;
