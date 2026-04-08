const stripCodeFences = (content: string) => content
  .replace(/```html\s*/gi, "")
  .replace(/```markdown\s*/gi, "")
  .replace(/```md\s*/gi, "")
  .replace(/```\s*/g, "")
  .trim();

const hasRawHtml = (content: string) => /<!doctype html|<html[\s>]|<body[\s>]|<main[\s>]|<section[\s>]|<div[\s>]/i.test(content);

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const inlineFormat = (text: string) => {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
};

const normalizeLines = (content: string) => stripCodeFences(content)
  .replace(/\r/g, "")
  .split("\n")
  .map((line) => line.trimEnd());

const titleFromRequest = (request: string, fallback: string) => {
  const cleaned = request.trim().replace(/[.#*_`]/g, "");
  return cleaned ? cleaned.slice(0, 80) : fallback;
};

const chunk = <T,>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
};

function extractSections(content: string, request: string) {
  const lines = normalizeLines(content);
  const sections: { title: string; body: string[] }[] = [];
  let current = { title: titleFromRequest(request, "Overview"), body: [] as string[] };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (current.body[current.body.length - 1] !== "") current.body.push("");
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      if (current.body.length > 0) sections.push(current);
      current = { title: line.replace(/^#{1,3}\s+/, "").trim(), body: [] };
      continue;
    }

    current.body.push(line);
  }

  if (current.body.length > 0) sections.push(current);

  if (sections.length > 1) return sections;

  const paragraphs = stripCodeFences(content)
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    const sentences = stripCodeFences(content)
      .split(/(?<=[.!?؟])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    return chunk(sentences, 3).map((group, index) => ({
      title: index === 0 ? titleFromRequest(request, "Overview") : `Section ${index + 1}`,
      body: group,
    }));
  }

  return chunk(paragraphs, 2).map((group, index) => ({
    title: index === 0 ? titleFromRequest(request, "Overview") : `Section ${index + 1}`,
    body: group,
  }));
}

function renderBlocks(lines: string[]) {
  const html: string[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    html.push(`<ul>${listBuffer.map((item) => `<li>${inlineFormat(item)}</li>`).join("")}</ul>`);
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      listBuffer.push(line.replace(/^([-*•]\s+|\d+[.)]\s+)/, ""));
      continue;
    }

    flushList();
    html.push(`<p>${inlineFormat(line)}</p>`);
  }

  flushList();
  return html.join("\n");
}

function buildSlidesHtml(content: string, request: string) {
  const sections = extractSections(content, request).filter((section) => section.body.length > 0);
  const safeSections = sections.length > 0 ? sections : [{ title: titleFromRequest(request, "Presentation"), body: [stripCodeFences(content) || request] }];
  const title = safeSections[0]?.title || titleFromRequest(request, "Presentation");

  const slidesMarkup = safeSections.map((section, index) => `
    <section class="slide" data-slide="${index + 1}">
      <div class="slide-inner">
        <div class="slide-kicker">Slide ${index + 1}</div>
        <h2>${inlineFormat(section.title)}</h2>
        <div class="slide-body">${renderBlocks(section.body)}</div>
      </div>
    </section>
  `).join("\n");

  const dotsMarkup = safeSections.map((_, index) => `<button class="dot" type="button" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #07111f;
      --panel: rgba(10, 22, 39, 0.78);
      --card: rgba(255,255,255,0.06);
      --text: #f4f7fb;
      --muted: #a5b4c7;
      --accent: #7dd3fc;
      --accent-2: #f9a8d4;
      --border: rgba(255,255,255,0.12);
      --shadow: 0 30px 80px rgba(0,0,0,0.35);
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: radial-gradient(circle at top, rgba(125,211,252,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(249,168,212,0.18), transparent 28%), var(--bg); color: var(--text); font-family: Arial, Helvetica, sans-serif; height: 100%; overflow: hidden; }
    body { display: grid; grid-template-rows: auto 1fr auto; }
    .topbar {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 18px 24px; position: relative; z-index: 2;
    }
    .brand { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
    .title { font-size: clamp(20px, 4vw, 34px); font-weight: 700; margin: 0; }
    .viewport {
      position: relative; overflow: hidden; padding: 12px 24px 24px;
    }
    .track {
      height: 100%; display: grid; grid-auto-flow: column; grid-auto-columns: 100%;
      overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; gap: 18px;
      scrollbar-width: none;
    }
    .track::-webkit-scrollbar { display: none; }
    .slide {
      scroll-snap-align: start; min-height: 100%; padding: 12px 0 0;
    }
    .slide-inner {
      min-height: calc(100vh - 170px); border: 1px solid var(--border); border-radius: 32px;
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
      box-shadow: var(--shadow); padding: clamp(28px, 5vw, 56px);
      display: grid; align-content: start; gap: 24px; overflow: hidden;
      position: relative;
    }
    .slide-inner::after {
      content: ""; position: absolute; inset: auto -12% -25% auto; width: 280px; height: 280px;
      border-radius: 999px; background: radial-gradient(circle, rgba(125,211,252,0.22), transparent 70%);
      pointer-events: none;
    }
    .slide-kicker { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); }
    h2 { margin: 0; font-size: clamp(32px, 7vw, 68px); line-height: 0.96; max-width: 12ch; }
    .slide-body { max-width: min(860px, 100%); color: var(--muted); font-size: clamp(16px, 2.1vw, 24px); line-height: 1.7; }
    .slide-body p { margin: 0 0 14px; }
    .slide-body ul { margin: 0; padding-left: 1.1em; display: grid; gap: 10px; }
    .slide-body li::marker { color: var(--accent-2); }
    .slide-body a { color: var(--text); }
    .controls {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 0 24px 22px;
    }
    .dots { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .dot {
      width: 10px; height: 10px; border-radius: 999px; border: 0; cursor: pointer;
      background: rgba(255,255,255,0.16); transition: transform 0.2s ease, background 0.2s ease;
    }
    .dot.active { background: var(--accent); transform: scale(1.2); }
    .navs { display: flex; gap: 10px; }
    .btn {
      border: 1px solid var(--border); background: var(--panel); color: var(--text);
      border-radius: 999px; padding: 10px 16px; cursor: pointer;
    }
    @media (max-width: 768px) {
      .topbar, .viewport, .controls { padding-left: 16px; padding-right: 16px; }
      .slide-inner { min-height: calc(100vh - 184px); border-radius: 24px; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div>
      <div class="brand">Megsy Slides</div>
      <h1 class="title">${inlineFormat(title)}</h1>
    </div>
    <div class="brand">HTML / CSS / JS</div>
  </header>

  <main class="viewport">
    <div class="track" id="track">${slidesMarkup}</div>
  </main>

  <footer class="controls">
    <div class="dots" id="dots">${dotsMarkup}</div>
    <div class="navs">
      <button class="btn" type="button" id="prevBtn">Previous</button>
      <button class="btn" type="button" id="nextBtn">Next</button>
    </div>
  </footer>

  <script>
    const track = document.getElementById('track');
    const dots = Array.from(document.querySelectorAll('.dot'));
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const slides = Array.from(document.querySelectorAll('.slide'));
    let currentIndex = 0;

    const update = (index) => {
      currentIndex = Math.max(0, Math.min(index, slides.length - 1));
      track.scrollTo({ left: currentIndex * track.clientWidth, behavior: 'smooth' });
      dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    };

    dots.forEach((dot) => dot.addEventListener('click', () => update(Number(dot.dataset.index || 0))));
    prevBtn.addEventListener('click', () => update(currentIndex - 1));
    nextBtn.addEventListener('click', () => update(currentIndex + 1));

    track.addEventListener('scroll', () => {
      const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
      currentIndex = index;
    }, { passive: true });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') update(currentIndex + 1);
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') update(currentIndex - 1);
    });

    update(0);
  </script>
</body>
</html>`;
}

function buildDocumentHtml(content: string, request: string, agent: string | null) {
  const sections = extractSections(content, request);
  const title = sections[0]?.title || titleFromRequest(request, agent === "resume" ? "Resume" : "Document");
  const subtitle = agent === "resume"
    ? "Structured HTML resume"
    : agent === "spreadsheet"
      ? "Structured HTML worksheet"
      : "Structured HTML document";

  const sectionsMarkup = sections.map((section, index) => `
    <section class="section">
      <div class="section-index">${String(index + 1).padStart(2, '0')}</div>
      <div>
        <h2>${inlineFormat(section.title)}</h2>
        <div class="section-body">${renderBlocks(section.body)}</div>
      </div>
    </section>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --card: #ffffff;
      --text: #101828;
      --muted: #667085;
      --accent: #0f172a;
      --border: #dbe3f0;
      --shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: linear-gradient(180deg, #eef3fb 0%, #f7f9fc 100%); color: var(--text); font-family: Arial, Helvetica, sans-serif; }
    body { min-height: 100vh; padding: 32px 16px; }
    .shell { max-width: 1080px; margin: 0 auto; }
    .hero {
      background: linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96));
      color: white; border-radius: 28px; padding: clamp(28px, 5vw, 56px);
      box-shadow: var(--shadow); position: relative; overflow: hidden;
    }
    .hero::after {
      content: ""; position: absolute; width: 280px; height: 280px; border-radius: 999px;
      right: -90px; top: -90px; background: radial-gradient(circle, rgba(125,211,252,0.18), transparent 70%);
    }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.18em; font-size: 12px; color: rgba(255,255,255,0.68); }
    h1 { margin: 14px 0 10px; font-size: clamp(34px, 5vw, 64px); line-height: 0.98; }
    .subtitle { font-size: 16px; color: rgba(255,255,255,0.76); max-width: 62ch; }
    .content {
      display: grid; gap: 18px; margin-top: 22px;
    }
    .section {
      display: grid; grid-template-columns: 56px 1fr; gap: 18px; padding: 24px;
      background: var(--card); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shadow);
    }
    .section-index {
      width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
      background: #e9eef8; color: var(--accent); font-weight: 700;
    }
    h2 { margin: 0 0 12px; font-size: clamp(24px, 3vw, 34px); }
    .section-body { color: var(--muted); font-size: 17px; line-height: 1.8; }
    .section-body p { margin: 0 0 14px; }
    .section-body ul { margin: 0; padding-left: 1.1em; display: grid; gap: 8px; }
    .section-body a { color: var(--accent); }
    @media (max-width: 720px) {
      .section { grid-template-columns: 1fr; }
      .section-index { width: 48px; height: 48px; border-radius: 16px; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="hero">
      <div class="eyebrow">Megsy Workspace</div>
      <h1>${inlineFormat(title)}</h1>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
    </header>
    <main class="content">${sectionsMarkup}</main>
  </div>
</body>
</html>`;
}

export function buildPreviewHtml({ content, agent, request }: { content: string; agent: string | null; request: string }) {
  const cleaned = stripCodeFences(content);
  if (hasRawHtml(cleaned)) return cleaned;
  if (agent === "slides") return buildSlidesHtml(cleaned, request);
  return buildDocumentHtml(cleaned, request, agent);
}
