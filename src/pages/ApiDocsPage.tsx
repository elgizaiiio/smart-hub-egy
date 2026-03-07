import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, ArrowLeft } from "lucide-react";

const BASE = "https://api.megsyai.com/v1/router";

type Lang = "curl" | "python" | "javascript";
const LANG_LABELS: Record<Lang, string> = { curl: "cURL", python: "Python", javascript: "JavaScript" };

const TYPES = [
  { id: "chat", title: "Chat", param: "?type=chat", desc: "Conversational AI" },
  { id: "images", title: "Images", param: "?type=images", desc: "Image generation" },
  { id: "video", title: "Video", param: "?type=video", desc: "Video generation" },
  { id: "code", title: "Code", param: "?type=code", desc: "Code generation" },
  { id: "files", title: "Files", param: "?type=files", desc: "File analysis" },
  { id: "chatbot", title: "Chatbot", param: "?type=chatbot", desc: "AI chatbot platform" },
];

const CODE_EXAMPLES: Record<string, Record<Lang, string>> = {
  chat: {
    curl: `curl "${BASE}?type=chat" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'`,
    python: `import requests

response = requests.post(
    "${BASE}?type=chat",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"messages": [{"role": "user", "content": "Hello"}]}
)
print(response.json()["choices"][0]["message"]["content"])`,
    javascript: `const res = await fetch("${BASE}?type=chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello" }]
  })
});
const data = await res.json();
console.log(data.choices[0].message.content);`,
  },
  images: {
    curl: `curl "${BASE}?type=images" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A futuristic city at sunset"}'`,
    python: `import requests

response = requests.post(
    "${BASE}?type=images",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"prompt": "A futuristic city at sunset"}
)
print(response.json()["images"][0]["url"])`,
    javascript: `const res = await fetch("${BASE}?type=images", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ prompt: "A futuristic city at sunset" })
});
const data = await res.json();
console.log(data.images[0].url);`,
  },
  video: {
    curl: `curl "${BASE}?type=video" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A cat walking on the beach"}'`,
    python: `import requests

response = requests.post(
    "${BASE}?type=video",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"prompt": "A cat walking on the beach"}
)
print(response.json()["video"]["url"])`,
    javascript: `const res = await fetch("${BASE}?type=video", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ prompt: "A cat walking on the beach" })
});
const data = await res.json();
console.log(data.video.url);`,
  },
  code: {
    curl: `curl "${BASE}?type=code" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"files": {"index.html": "<h1>Hello</h1>"}}'`,
    python: `import requests

response = requests.post(
    "${BASE}?type=code",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"files": {"index.html": "<h1>Hello</h1>"}}
)
print(response.json()["preview_url"])`,
    javascript: `const res = await fetch("${BASE}?type=code", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ files: { "index.html": "<h1>Hello</h1>" } })
});
const data = await res.json();
console.log(data.preview_url);`,
  },
  files: {
    curl: `curl "${BASE}?type=files" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"file_url": "https://example.com/doc.pdf", "prompt": "Summarize"}'`,
    python: `import requests

response = requests.post(
    "${BASE}?type=files",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"file_url": "https://example.com/doc.pdf", "prompt": "Summarize"}
)
print(response.json()["content"])`,
    javascript: `const res = await fetch("${BASE}?type=files", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    file_url: "https://example.com/doc.pdf",
    prompt: "Summarize"
  })
});
const data = await res.json();
console.log(data.content);`,
  },
  chatbot: {
    curl: `curl "${BASE}?type=chatbot" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"bot_id": "your_bot_id", "message": "Hello"}'`,
    python: `import requests

response = requests.post(
    "${BASE}?type=chatbot",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"bot_id": "your_bot_id", "message": "Hello"}
)
print(response.json()["reply"])`,
    javascript: `const res = await fetch("${BASE}?type=chatbot", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ bot_id: "your_bot_id", message: "Hello" })
});
const data = await res.json();
console.log(data.reply);`,
  },
};

const PARAMS: Record<string, Record<string, string>> = {
  chat: {
    messages: "array — Array of {role, content} message objects",
    model: "string — Model ID (optional, default auto)",
    stream: "boolean — Enable streaming (optional)",
    temperature: "number — 0-2 (optional, default 0.7)",
  },
  images: {
    prompt: "string — Text description of desired image",
    model: "string — Model ID (optional)",
    width: "number — Output width (optional, default 1024)",
    height: "number — Output height (optional, default 1024)",
    image_url: "string — Input image URL (for editing tools)",
  },
  video: {
    prompt: "string — Text description of desired video",
    model: "string — Model ID (optional)",
    image_url: "string — Input image (for I2V models)",
    aspect_ratio: "string — e.g. 16:9, 9:16, 1:1 (optional)",
  },
  code: {
    files: "object — Map of filename to file content",
    command: "string — Command to execute (optional)",
  },
  files: {
    file_url: "string — URL of file to analyze",
    prompt: "string — Instructions for analysis",
  },
  chatbot: {
    bot_id: "string — Your chatbot ID",
    message: "string — User message",
  },
};

const PRICING = [
  { api: "Chat Input", price: "$0.52 / 1M tokens" },
  { api: "Chat Output", price: "$4.30 / 1M tokens" },
  { api: "Images", price: "$0.26 / image" },
  { api: "Video (10s)", price: "$0.85" },
  { api: "Video (30s)", price: "$2.60" },
  { api: "Code Input", price: "$5.20 / 1M tokens" },
  { api: "Code Output", price: "$26.00 / 1M tokens" },
  { api: "Files", price: "$0.06 / page" },
];

const ERRORS = [
  { code: "400", desc: "Bad Request" },
  { code: "401", desc: "Unauthorized" },
  { code: "402", desc: "Insufficient Balance" },
  { code: "429", desc: "Rate Limited" },
  { code: "500", desc: "Server Error" },
];

const CodeBlock = ({ code, defaultLang = "curl" }: { code: Record<Lang, string> | string; defaultLang?: Lang }) => {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [copied, setCopied] = useState(false);
  const text = typeof code === "string" ? code : code[lang];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        {typeof code !== "string" ? (
          <div className="flex gap-1">
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">text</span>
        )}
        <button
          onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm"><code className="text-muted-foreground whitespace-pre">{text}</code></pre>
    </div>
  );
};

const ApiDocsPage = () => {
  const [endpointCopied, setEndpointCopied] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/api" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-display text-lg font-bold text-foreground">Documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/api/models" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Models</Link>
            <Link to="/settings/apis" className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Get API Key
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">Documentation</h1>
          <p className="text-muted-foreground">Complete API reference for Megsy AI</p>
        </motion.div>

        {/* Unified Endpoint */}
        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Unified Endpoint</h2>
          <button
            onClick={() => { navigator.clipboard.writeText(`POST ${BASE}?type={type}`); setEndpointCopied(true); setTimeout(() => setEndpointCopied(false), 2000); }}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors"
          >
            <code className="text-sm text-foreground">POST {BASE}?type=&#123;type&#125;</code>
            <span className="text-xs text-muted-foreground">{endpointCopied ? "Copied" : "Click to copy"}</span>
          </button>
          <p className="text-sm text-muted-foreground mt-3">
            All APIs are accessed through a single unified endpoint. Use the <code className="text-primary bg-primary/10 px-1 py-0.5 rounded text-xs">type</code> parameter to specify: <code className="text-xs bg-secondary px-1 py-0.5 rounded">chat</code>, <code className="text-xs bg-secondary px-1 py-0.5 rounded">images</code>, <code className="text-xs bg-secondary px-1 py-0.5 rounded">video</code>, <code className="text-xs bg-secondary px-1 py-0.5 rounded">code</code>, or <code className="text-xs bg-secondary px-1 py-0.5 rounded">files</code>.
          </p>
        </section>

        {/* Supported Types */}
        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Supported Types</h2>
          <p className="text-sm text-muted-foreground mb-4">One endpoint, multiple capabilities. Choose a type to see detailed parameters and examples.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TYPES.map(t => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-center"
              >
                <h3 className="font-display font-bold text-primary text-sm">{t.title}</h3>
                <code className="text-[10px] text-muted-foreground">{t.param}</code>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Authentication */}
        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Authentication</h2>
          <p className="text-sm text-muted-foreground mb-3">All requests require an API key in the Authorization header.</p>
          <CodeBlock code="Authorization: Bearer YOUR_API_KEY" />
        </section>

        {/* Request Format */}
        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Request Format</h2>
          <p className="text-sm text-muted-foreground mb-3">Send JSON with Content-Type header.</p>
          <CodeBlock code={`curl "${BASE}?type=chat" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'`} />
        </section>

        {/* Each Type */}
        {TYPES.map(t => (
          <section key={t.id} id={t.id}>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">{t.title}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary mb-4">
              <span className="text-xs font-bold text-primary">POST</span>
              <code className="text-sm text-foreground">{BASE}{t.param}</code>
            </div>

            {/* Params */}
            {PARAMS[t.id] && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Parameters</h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  {Object.entries(PARAMS[t.id]).map(([key, desc], i) => (
                    <div key={key} className={`flex gap-4 px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                      <code className="text-primary font-medium shrink-0 w-24">{key}</code>
                      <span className="text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Example */}
            {CODE_EXAMPLES[t.id] && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Example</h3>
                <CodeBlock code={CODE_EXAMPLES[t.id]} />
              </div>
            )}
          </section>
        ))}

        {/* Pricing */}
        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Pricing</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-2 px-4 py-2.5 border-b border-border bg-secondary/30 text-xs font-medium text-muted-foreground">
              <span>API</span>
              <span className="text-right">Price</span>
            </div>
            {PRICING.map((row, i) => (
              <div key={row.api} className={`grid grid-cols-2 px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                <span className="text-foreground">{row.api}</span>
                <span className="text-primary font-medium text-right">{row.price}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Error Codes */}
        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Error Codes</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-2 px-4 py-2.5 border-b border-border bg-secondary/30 text-xs font-medium text-muted-foreground">
              <span>Code</span>
              <span>Description</span>
            </div>
            {ERRORS.map((err, i) => (
              <div key={err.code} className={`grid grid-cols-2 px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
                <code className="text-destructive font-bold">{err.code}</code>
                <span className="text-muted-foreground">{err.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <h2 className="font-display text-xl font-bold text-foreground mb-3">Ready to build?</h2>
          <div className="flex items-center justify-center gap-3">
            <Link to="/settings/apis" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
            <Link to="/settings/apis" className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Get API Key
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
