import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const agents = [
  { id: "deep-research", label: "Deep Research", description: "In-depth web research with citations" },
  { id: "education", label: "Education", description: "Learning assistant with explanations" },
  { id: "file-upload", label: "Upload File", description: "Analyze documents and files" },
  { id: "image-upload", label: "Upload Image", description: "Analyze or edit images" },
];

const integrations = [
  "Supabase", "GitHub", "Google Drive", "Slack", "Notion",
  "Discord", "Figma", "Linear", "Jira", "Trello",
  "Asana", "Vercel", "Netlify", "AWS", "Firebase",
  "MongoDB", "Stripe", "Twilio", "SendGrid", "Zapier",
];

interface AgentMenuProps {
  open: boolean;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const AgentMenu = ({ open, onClose, onSelectAgent, fileInputRef }: AgentMenuProps) => {
  const [showIntegrations, setShowIntegrations] = useState(false);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute bottom-full mb-2 left-0 z-40 glass-panel p-2 w-72"
        >
          {!showIntegrations ? (
            <div className="space-y-0.5">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    if (agent.id === "file-upload" || agent.id === "image-upload") {
                      fileInputRef.current?.click();
                    } else {
                      onSelectAgent(agent.id);
                    }
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors group"
                >
                  <div>
                    <p className="text-sm text-foreground">{agent.label}</p>
                    <p className="text-xs text-muted-foreground">{agent.description}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowIntegrations(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent transition-colors group"
              >
                <div>
                  <p className="text-sm text-foreground">More Integrations</p>
                  <p className="text-xs text-muted-foreground">Connect with 20+ services</p>
                </div>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <p className="text-sm font-medium text-foreground">Integrations</p>
                <button onClick={() => setShowIntegrations(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {integrations.map((name) => (
                  <button
                    key={name}
                    onClick={() => { onSelectAgent(name.toLowerCase().replace(/\s/g, "-")); onClose(); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default AgentMenu;
