import {
  GraduationCap, ShoppingCart, Search, Presentation, PenTool,
  FileSpreadsheet, ScrollText, ImageIcon, Video, Code, Mic,
  FileText, Sparkles, Brain
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AgentDef {
  id: string;
  label: string;
  mention: string; // e.g. "@slides"
  icon: LucideIcon;
  color: string; // tailwind text color token
  bg: string; // tailwind bg token
  description: string;
  category: "chat" | "files" | "images" | "videos" | "voice" | "code";
}

export const AGENTS: AgentDef[] = [
  // Chat modes
  { id: "learning", label: "Learning", mention: "@learning", icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/15", description: "Step-by-step explanations", category: "chat" },
  { id: "shopping", label: "Shopping", mention: "@shopping", icon: ShoppingCart, color: "text-amber-400", bg: "bg-amber-500/15", description: "Product search & compare", category: "chat" },
  { id: "deep-research", label: "Deep Research", mention: "@research", icon: Search, color: "text-blue-400", bg: "bg-blue-500/15", description: "In-depth web research", category: "chat" },

  // File agents
  { id: "slides", label: "Slides", mention: "@slides", icon: Presentation, color: "text-violet-400", bg: "bg-violet-500/15", description: "Create presentations", category: "files" },
  { id: "resume", label: "Resume", mention: "@resume", icon: PenTool, color: "text-cyan-400", bg: "bg-cyan-500/15", description: "Build professional resumes", category: "files" },
  { id: "spreadsheet", label: "Spreadsheet", mention: "@spreadsheet", icon: FileSpreadsheet, color: "text-green-400", bg: "bg-green-500/15", description: "Generate spreadsheets", category: "files" },
  { id: "document", label: "Document", mention: "@document", icon: ScrollText, color: "text-orange-400", bg: "bg-orange-500/15", description: "Write documents & reports", category: "files" },

  // Cross-workspace
  { id: "images", label: "Images", mention: "@images", icon: ImageIcon, color: "text-pink-400", bg: "bg-pink-500/15", description: "Generate AI images", category: "images" },
  { id: "videos", label: "Videos", mention: "@videos", icon: Video, color: "text-red-400", bg: "bg-red-500/15", description: "Create AI videos", category: "videos" },
  { id: "code", label: "Code", mention: "@code", icon: Code, color: "text-sky-400", bg: "bg-sky-500/15", description: "Build apps & code", category: "code" },
  { id: "voice", label: "Voice", mention: "@voice", icon: Mic, color: "text-purple-400", bg: "bg-purple-500/15", description: "Text-to-speech & voice", category: "voice" },
];

export const getAgentById = (id: string) => AGENTS.find(a => a.id === id);
export const getAgentByMention = (mention: string) => AGENTS.find(a => a.mention === mention);
export const filterAgents = (query: string) => {
  const q = query.toLowerCase();
  return AGENTS.filter(a => a.label.toLowerCase().includes(q) || a.mention.toLowerCase().includes(q));
};
