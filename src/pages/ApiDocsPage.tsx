import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, ArrowLeft, Book, Key, MessageSquare, Image, Video, Globe, Code, AlertTriangle, ChevronRight } from "lucide-react";

const BASE_URL = "https://api.megsyai.com/v1";

type Lang = "curl" | "python" | "javascript" | "nodejs";

const LANG_LABELS: Record<Lang, string> = { curl: "cURL", python: "Python", javascript: "JavaScript", nodejs: "Node.js" };

interface CodeBlock {
  curl: string;
  python: string;
  javascript: string;
  nodejs: string;
}

interface Endpoint {
  id: string;
  method: string;
  path: string;
  title: string;
  description: string;
  icon: React.ElementType;
  request: Record<string, string>;
  response: string;
  code: CodeBlock;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: "chat",
    method: "POST",
    path: "/v1/chat/completions",
    title: "Chat Completions",
    description: "Generate AI chat completions with multi-turn conversation support. Supports streaming and all chat models.",
    icon: MessageSquare,
    request: {
      model: "string — Model ID (e.g. \"megsy-v1\", \"gpt-5\", \"grok-3\")",
      messages: "array — Array of {role, content} message objects",
      stream: "boolean — Enable streaming responses (optional)",
      temperature: "number — Creativity level 0-2 (optional, default 0.7)",
      max_tokens: "number — Max response tokens (optional)",
    },
    response: `{
  "id": "chat-abc123",
  "object": "chat.completion",
  "model": "megsy-v1",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 8,
    "total_tokens": 20,
    "credits_used": 1
  }
}`,
    code: {
      curl: `curl ${BASE_URL}/chat/completions \\
  -H "Authorization: Bearer mk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "megsy-v1",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is artificial intelligence?"}
    ],
    "temperature": 0.7
  }'`,
      python: `import requests

response = requests.post(
    "${BASE_URL}/chat/completions",
    headers={
        "Authorization": "Bearer mk_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "model": "megsy-v1",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is artificial intelligence?"}
        ],
        "temperature": 0.7
    }
)

data = response.json()
print(data["choices"][0]["message"]["content"])`,
      javascript: `const response = await fetch("${BASE_URL}/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "megsy-v1",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is artificial intelligence?" }
    ],
    temperature: 0.7
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`,
      nodejs: `const response = await fetch("${BASE_URL}/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "megsy-v1",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is artificial intelligence?" }
    ]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`,
    },
  },
  {
    id: "images",
    method: "POST",
    path: "/v1/images/generate",
    title: "Image Generation",
    description: "Generate images from text prompts or edit existing images. Supports 19+ generation models and 18+ editing tools.",
    icon: Image,
    request: {
      model: "string — Model ID (e.g. \"megsy-v1-img\", \"gpt-image\", \"flux-2-pro\")",
      prompt: "string — Text description of desired image",
      image_url: "string — Input image URL (required for tools, optional for models)",
      width: "number — Output width in pixels (optional, default 1024)",
      height: "number — Output height in pixels (optional, default 1024)",
      num_images: "number — Number of images to generate (optional, default 1)",
    },
    response: `{
  "id": "img-abc123",
  "model": "megsy-v1-img",
  "images": [{
    "url": "https://cdn.megsyai.com/generated/abc123.png",
    "width": 1024,
    "height": 1024
  }],
  "usage": {
    "credits_used": 4
  }
}`,
    code: {
      curl: `curl ${BASE_URL}/images/generate \\
  -H "Authorization: Bearer mk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "megsy-v1-img",
    "prompt": "A futuristic city at sunset, cyberpunk style",
    "width": 1024,
    "height": 1024
  }'`,
      python: `import requests

response = requests.post(
    "${BASE_URL}/images/generate",
    headers={
        "Authorization": "Bearer mk_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "model": "megsy-v1-img",
        "prompt": "A futuristic city at sunset, cyberpunk style",
        "width": 1024,
        "height": 1024
    }
)

data = response.json()
print(data["images"][0]["url"])`,
      javascript: `const response = await fetch("${BASE_URL}/images/generate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "megsy-v1-img",
    prompt: "A futuristic city at sunset, cyberpunk style",
    width: 1024,
    height: 1024
  })
});

const data = await response.json();
console.log(data.images[0].url);`,
      nodejs: `const response = await fetch("${BASE_URL}/images/generate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "megsy-v1-img",
    prompt: "A futuristic city at sunset, cyberpunk style",
    width: 1024,
    height: 1024
  })
});

const data = await response.json();
console.log(data.images[0].url);`,
    },
  },
  {
    id: "videos",
    method: "POST",
    path: "/v1/videos/generate",
    title: "Video Generation",
    description: "Generate videos from text prompts or images. Supports T2V, I2V, and avatar models.",
    icon: Video,
    request: {
      model: "string — Model ID (e.g. \"megsy-video\", \"veo-3.1\", \"kling-3-pro\")",
      prompt: "string — Text description of desired video",
      image_url: "string — Input image URL (required for I2V and avatar models)",
      duration: "number — Video duration in seconds (optional, default 5)",
      aspect_ratio: "string — e.g. \"16:9\", \"9:16\", \"1:1\" (optional)",
    },
    response: `{
  "id": "vid-abc123",
  "model": "megsy-video",
  "status": "completed",
  "video": {
    "url": "https://cdn.megsyai.com/generated/abc123.mp4",
    "duration": 5,
    "width": 1280,
    "height": 720
  },
  "usage": {
    "credits_used": 6
  }
}`,
    code: {
      curl: `curl ${BASE_URL}/videos/generate \\
  -H "Authorization: Bearer mk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "megsy-video",
    "prompt": "A cat walking on the beach at sunset",
    "aspect_ratio": "16:9"
  }'`,
      python: `import requests

response = requests.post(
    "${BASE_URL}/videos/generate",
    headers={
        "Authorization": "Bearer mk_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "model": "megsy-video",
        "prompt": "A cat walking on the beach at sunset",
        "aspect_ratio": "16:9"
    }
)

data = response.json()
print(data["video"]["url"])`,
      javascript: `const response = await fetch("${BASE_URL}/videos/generate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "megsy-video",
    prompt: "A cat walking on the beach at sunset",
    aspect_ratio: "16:9"
  })
});

const data = await response.json();
console.log(data.video.url);`,
      nodejs: `const response = await fetch("${BASE_URL}/videos/generate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "megsy-video",
    prompt: "A cat walking on the beach at sunset",
    aspect_ratio: "16:9"
  })
});

const data = await response.json();
console.log(data.video.url);`,
    },
  },
  {
    id: "search",
    method: "POST",
    path: "/v1/search",
    title: "Web Search",
    description: "Search the web with AI-powered result summarization and structured data extraction.",
    icon: Globe,
    request: {
      query: "string — Search query",
      num_results: "number — Number of results (optional, default 5)",
      include_summary: "boolean — Include AI summary (optional, default true)",
    },
    response: `{
  "id": "search-abc123",
  "query": "latest AI news",
  "summary": "Here are the latest developments in AI...",
  "results": [{
    "title": "...",
    "url": "https://...",
    "snippet": "..."
  }],
  "usage": {
    "credits_used": 2
  }
}`,
    code: {
      curl: `curl ${BASE_URL}/search \\
  -H "Authorization: Bearer mk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "latest developments in artificial intelligence",
    "num_results": 5
  }'`,
      python: `import requests

response = requests.post(
    "${BASE_URL}/search",
    headers={
        "Authorization": "Bearer mk_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "query": "latest developments in artificial intelligence",
        "num_results": 5
    }
)

data = response.json()
print(data["summary"])`,
      javascript: `const response = await fetch("${BASE_URL}/search", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    query: "latest developments in artificial intelligence",
    num_results: 5
  })
});

const data = await response.json();
console.log(data.summary);`,
      nodejs: `const response = await fetch("${BASE_URL}/search", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    query: "latest developments in artificial intelligence",
    num_results: 5
  })
});

const data = await response.json();
console.log(data.summary);`,
    },
  },
  {
    id: "code",
    method: "POST",
    path: "/v1/code/execute",
    title: "Code Execution",
    description: "Execute code in a sandboxed environment with package support and live preview URLs.",
    icon: Code,
    request: {
      files: "object — Map of filename → file content",
      command: "string — Command to execute (optional)",
      language: "string — Programming language (optional, auto-detected)",
    },
    response: `{
  "id": "exec-abc123",
  "status": "completed",
  "output": "Hello, World!\\n",
  "preview_url": "https://sandbox-abc123.megsyai.com/",
  "usage": {
    "credits_used": 5
  }
}`,
    code: {
      curl: `curl ${BASE_URL}/code/execute \\
  -H "Authorization: Bearer mk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "files": {
      "index.html": "<!DOCTYPE html><html><body><h1>Hello!</h1></body></html>",
      "style.css": "h1 { color: blue; }"
    }
  }'`,
      python: `import requests

response = requests.post(
    "${BASE_URL}/code/execute",
    headers={
        "Authorization": "Bearer mk_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "files": {
            "index.html": "<!DOCTYPE html><html><body><h1>Hello!</h1></body></html>",
            "style.css": "h1 { color: blue; }"
        }
    }
)

data = response.json()
print(data["preview_url"])`,
      javascript: `const response = await fetch("${BASE_URL}/code/execute", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    files: {
      "index.html": "<!DOCTYPE html><html><body><h1>Hello!</h1></body></html>",
      "style.css": "h1 { color: blue; }"
    }
  })
});

const data = await response.json();
console.log(data.preview_url);`,
      nodejs: `const response = await fetch("${BASE_URL}/code/execute", {
  method: "POST",
  headers: {
    "Authorization": "Bearer mk_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    files: {
      "index.html": "<!DOCTYPE html><html><body><h1>Hello!</h1></body></html>",
      "style.css": "h1 { color: blue; }"
    }
  })
});

const data = await response.json();
console.log(data.preview_url);`,
    },
  },
];

const ERROR_CODES = [
  { code: "400", desc: "Bad Request — Invalid parameters" },
  { code: "401", desc: "Unauthorized — Invalid or missing API key" },
  { code: "402", desc: "Payment Required — Insufficient credits" },
  { code: "429", desc: "Too Many Requests — Rate limit exceeded" },
  { code: "500", desc: "Internal Server Error — Try again later" },
];

const CopyableCode = ({ code, lang }: { code: string; lang: Lang }) => {
  const [copied, setCopied] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Lang>(lang);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <div className="flex gap-1">
          {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setSelectedLang(l)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${selectedLang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(typeof code === "string" ? code : (code as any)[selectedLang]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm"><code className="text-muted-foreground whitespace-pre">{typeof code === "string" ? code : (code as any)[selectedLang]}</code></pre>
    </div>
  );
};

const EndpointCodeBlock = ({ endpoint }: { endpoint: Endpoint }) => {
  const [selectedLang, setSelectedLang] = useState<Lang>("curl");
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <div className="flex gap-1">
          {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setSelectedLang(l)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${selectedLang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(endpoint.code[selectedLang]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm"><code className="text-muted-foreground whitespace-pre">{endpoint.code[selectedLang]}</code></pre>
    </div>
  );
};

const ResponseBlock = ({ response }: { response: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <span className="text-xs text-muted-foreground">Response</span>
        <button onClick={() => { navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm"><code className="text-muted-foreground whitespace-pre">{response}</code></pre>
    </div>
  );
};

const NAV_ITEMS = [
  { id: "auth", label: "Authentication", icon: Key },
  ...ENDPOINTS.map(e => ({ id: e.id, label: e.title, icon: e.icon })),
  { id: "errors", label: "Error Codes", icon: AlertTriangle },
  { id: "rate-limits", label: "Rate Limits", icon: AlertTriangle },
];

const ApiDocsPage = () => {
  const [activeSection, setActiveSection] = useState("auth");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/api" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-display text-lg font-bold text-foreground">API Documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/api/models" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Models</Link>
            <Link to="/settings/apis" className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Get API Key
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 py-8">
        {/* Sidebar Nav */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Navigation</div>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === item.id ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-16">
          {/* Intro */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Book className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold text-foreground">Megsy API Reference</h1>
            </div>
            <p className="text-muted-foreground mb-4">
              The Megsy API provides a unified interface to access AI models for chat, image generation, video creation, web search, and code execution.
            </p>
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="text-xs text-muted-foreground mb-1">Base URL</div>
              <code className="text-sm text-primary font-medium">{BASE_URL}</code>
            </div>
          </motion.div>

          {/* Authentication */}
          <section id="auth">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" /> Authentication
            </h2>
            <p className="text-muted-foreground mb-4">
              All API requests require a Bearer token in the Authorization header. Get your API key from the <Link to="/settings/apis" className="text-primary hover:underline">dashboard</Link>.
            </p>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-3 py-2 border-b border-border bg-secondary/30">
                <span className="text-xs text-muted-foreground">Header</span>
              </div>
              <pre className="p-4 text-sm"><code className="text-muted-foreground">Authorization: Bearer mk_your_api_key</code></pre>
            </div>
          </section>

          {/* Endpoints */}
          {ENDPOINTS.map(ep => (
            <section key={ep.id} id={ep.id}>
              <div className="flex items-center gap-2 mb-2">
                <ep.icon className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold text-foreground">{ep.title}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{ep.description}</p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary mb-4">
                <span className="text-xs font-bold text-primary">{ep.method}</span>
                <code className="text-sm text-foreground">{ep.path}</code>
              </div>

              {/* Parameters */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Parameters</h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  {Object.entries(ep.request).map(([key, desc], i) => (
                    <div key={key} className={`flex gap-4 px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                      <code className="text-primary font-medium shrink-0 w-28">{key}</code>
                      <span className="text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Example Request</h3>
                <EndpointCodeBlock endpoint={ep} />
              </div>

              {/* Response */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Example Response</h3>
                <ResponseBlock response={ep.response} />
              </div>
            </section>
          ))}

          {/* Error Codes */}
          <section id="errors">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" /> Error Codes
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              {ERROR_CODES.map((err, i) => (
                <div key={err.code} className={`flex gap-4 px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                  <code className="text-destructive font-bold shrink-0 w-12">{err.code}</code>
                  <span className="text-muted-foreground">{err.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Error Response Format</h3>
              <pre className="text-sm"><code className="text-muted-foreground">{`{
  "error": {
    "code": "insufficient_credits",
    "message": "You need 5 credits but only have 2.",
    "type": "payment_required"
  }
}`}</code></pre>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Rate Limits</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              {[
                { plan: "Free", limit: "10 requests/minute" },
                { plan: "Pro", limit: "60 requests/minute" },
                { plan: "Business", limit: "300 requests/minute" },
                { plan: "Enterprise", limit: "Custom" },
              ].map((r, i) => (
                <div key={r.plan} className={`flex justify-between px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                  <span className="font-medium text-foreground">{r.plan}</span>
                  <span className="text-muted-foreground">{r.limit}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Rate limit headers are included in every response: <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">X-RateLimit-Remaining</code>, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">X-RateLimit-Reset</code>
            </p>
          </section>

          {/* Footer CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-8 text-center">
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Ready to Build?</h2>
            <p className="text-sm text-muted-foreground mb-4">Get your API key and start building AI-powered apps today.</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/settings/apis" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                Get API Key
              </Link>
              <Link to="/api/models" className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                Browse Models <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ApiDocsPage;
