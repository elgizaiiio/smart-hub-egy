/* Custom SVG icons matching Leonardo.ai style — filled, colorful, distinctive */

const IconImageGen = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="url(#ig1)" />
    <path d="M8 15l3-4 2.5 3L16 11l4 6H4l4-2z" fill="rgba(0,0,0,0.3)" />
    <circle cx="9" cy="9" r="2" fill="rgba(255,255,255,0.8)" />
    <defs><linearGradient id="ig1" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#a78bfa" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
  </svg>
);

const IconCreative = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a2 2 0 002 2h4a2 2 0 002-2v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" fill="url(#cr1)" />
    <rect x="9" y="20" width="6" height="2" rx="1" fill="#fbbf24" />
    <path d="M12 6l1 2.5L15.5 9l-2.5 1L12 12.5 11 10 8.5 9l2.5-1L12 6z" fill="rgba(255,255,255,0.9)" />
    <defs><linearGradient id="cr1" x1="5" y1="2" x2="19" y2="19"><stop stopColor="#fbbf24" /><stop offset="1" stopColor="#f59e0b" /></linearGradient></defs>
  </svg>
);

const IconBgRemover = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#334155" />
    <rect x="2" y="2" width="10" height="10" fill="#64748b" /><rect x="12" y="12" width="10" height="10" fill="#64748b" />
    <path d="M6 18l4-5 3 3.5L16 12l4 6H4z" fill="url(#bg1)" />
    <path d="M2 12h20v10a3 3 0 01-3 3H5a3 3 0 01-3-3V12z" fill="url(#bg1)" opacity="0.8" />
    <defs><linearGradient id="bg1" x1="2" y1="12" x2="22" y2="22"><stop stopColor="#f472b6" /><stop offset="1" stopColor="#ec4899" /></linearGradient></defs>
  </svg>
);

const IconTrainModel = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <circle cx="12" cy="12" r="10" fill="url(#tm1)" />
    <circle cx="12" cy="8" r="2" fill="rgba(255,255,255,0.9)" />
    <circle cx="8" cy="14" r="2" fill="rgba(255,255,255,0.9)" />
    <circle cx="16" cy="14" r="2" fill="rgba(255,255,255,0.9)" />
    <line x1="12" y1="10" x2="9" y2="13" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    <line x1="12" y1="10" x2="15" y2="13" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    <line x1="10" y1="14" x2="14" y2="14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    <defs><linearGradient id="tm1" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#4f46e5" /></linearGradient></defs>
  </svg>
);

const IconVideoGen = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="3" fill="url(#vg1)" />
    <polygon points="10,8 10,16 17,12" fill="rgba(255,255,255,0.9)" />
    <defs><linearGradient id="vg1" x1="2" y1="4" x2="22" y2="20"><stop stopColor="#06b6d4" /><stop offset="1" stopColor="#0891b2" /></linearGradient></defs>
  </svg>
);

const IconImageEditor = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <path d="M20.71 4.04a3 3 0 00-4.24 0L4 16.5V20h3.5L20 7.5a3 3 0 000-4.24v.78z" fill="url(#ie1)" />
    <path d="M4 20h3.5l-2-2H4v2z" fill="#94a3b8" />
    <defs><linearGradient id="ie1" x1="4" y1="4" x2="20" y2="20"><stop stopColor="#f97316" /><stop offset="1" stopColor="#ea580c" /></linearGradient></defs>
  </svg>
);

const IconUpscaler = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <rect x="2" y="2" width="9" height="9" rx="2" fill="#64748b" opacity="0.5" />
    <rect x="7" y="7" width="15" height="15" rx="3" fill="url(#us1)" />
    <path d="M14.5 11v6m0-6l-2.5 2.5m2.5-2.5l2.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <defs><linearGradient id="us1" x1="7" y1="7" x2="22" y2="22"><stop stopColor="#10b981" /><stop offset="1" stopColor="#059669" /></linearGradient></defs>
  </svg>
);

const IconChat = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <path d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.96L3 20l1.338-3.346C3.493 15.373 3 13.74 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" fill="url(#ch1)" />
    <circle cx="8.5" cy="12" r="1" fill="rgba(255,255,255,0.8)" />
    <circle cx="12" cy="12" r="1" fill="rgba(255,255,255,0.8)" />
    <circle cx="15.5" cy="12" r="1" fill="rgba(255,255,255,0.8)" />
    <defs><linearGradient id="ch1" x1="3" y1="4" x2="21" y2="20"><stop stopColor="#8b5cf6" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
  </svg>
);

const IconCode = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <rect x="2" y="3" width="20" height="18" rx="3" fill="url(#cd1)" />
    <path d="M8 10l-3 2.5L8 15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 10l3 2.5L16 15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="13" y1="8" x2="11" y2="17" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    <defs><linearGradient id="cd1" x1="2" y1="3" x2="22" y2="21"><stop stopColor="#1e293b" /><stop offset="1" stopColor="#0f172a" /></linearGradient></defs>
  </svg>
);

const IconBlog = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <rect x="3" y="2" width="18" height="20" rx="3" fill="url(#bl1)" />
    <rect x="6" y="5" width="8" height="1.5" rx="0.75" fill="rgba(255,255,255,0.8)" />
    <rect x="6" y="8.5" width="12" height="1" rx="0.5" fill="rgba(255,255,255,0.3)" />
    <rect x="6" y="11" width="12" height="1" rx="0.5" fill="rgba(255,255,255,0.3)" />
    <rect x="6" y="13.5" width="9" height="1" rx="0.5" fill="rgba(255,255,255,0.3)" />
    <defs><linearGradient id="bl1" x1="3" y1="2" x2="21" y2="22"><stop stopColor="#2563eb" /><stop offset="1" stopColor="#1d4ed8" /></linearGradient></defs>
  </svg>
);

const IconSupport = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <circle cx="12" cy="12" r="10" fill="url(#sp1)" />
    <circle cx="12" cy="12" r="4" fill="rgba(0,0,0,0.25)" />
    <circle cx="12" cy="12" r="3" fill="url(#sp1)" />
    <rect x="11" y="1" width="2" height="5" rx="1" fill="rgba(255,255,255,0.7)" />
    <rect x="11" y="18" width="2" height="5" rx="1" fill="rgba(255,255,255,0.7)" />
    <rect x="18" y="11" width="5" height="2" rx="1" fill="rgba(255,255,255,0.7)" />
    <rect x="1" y="11" width="5" height="2" rx="1" fill="rgba(255,255,255,0.7)" />
    <defs><linearGradient id="sp1" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#ef4444" /><stop offset="1" stopColor="#dc2626" /></linearGradient></defs>
  </svg>
);

const IconChangelog = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <rect x="3" y="2" width="18" height="20" rx="3" fill="url(#cl1)" />
    <circle cx="8" cy="8" r="1.5" fill="rgba(255,255,255,0.8)" />
    <rect x="11" y="7" width="7" height="1.5" rx="0.75" fill="rgba(255,255,255,0.5)" />
    <circle cx="8" cy="12" r="1.5" fill="rgba(255,255,255,0.8)" />
    <rect x="11" y="11" width="7" height="1.5" rx="0.75" fill="rgba(255,255,255,0.5)" />
    <circle cx="8" cy="16" r="1.5" fill="rgba(255,255,255,0.8)" />
    <rect x="11" y="15" width="7" height="1.5" rx="0.75" fill="rgba(255,255,255,0.5)" />
    <defs><linearGradient id="cl1" x1="3" y1="2" x2="21" y2="22"><stop stopColor="#8b5cf6" /><stop offset="1" stopColor="#6d28d9" /></linearGradient></defs>
  </svg>
);

const IconAPI = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <rect x="2" y="6" width="20" height="12" rx="3" fill="url(#ap1)" />
    <circle cx="7" cy="12" r="2" fill="rgba(255,255,255,0.8)" />
    <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.8)" />
    <circle cx="17" cy="12" r="2" fill="rgba(255,255,255,0.8)" />
    <line x1="9" y1="12" x2="10" y2="12" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    <line x1="14" y1="12" x2="15" y2="12" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    <defs><linearGradient id="ap1" x1="2" y1="6" x2="22" y2="18"><stop stopColor="#14b8a6" /><stop offset="1" stopColor="#0d9488" /></linearGradient></defs>
  </svg>
);

const IconMegsyPro = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <polygon points="12,2 15,9 22,9 16.5,13.5 18.5,21 12,16.5 5.5,21 7.5,13.5 2,9 9,9" fill="url(#mp1)" />
    <defs><linearGradient id="mp1" x1="2" y1="2" x2="22" y2="21"><stop stopColor="#fbbf24" /><stop offset="1" stopColor="#f59e0b" /></linearGradient></defs>
  </svg>
);

const IconGPT = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <circle cx="12" cy="12" r="10" fill="url(#gp1)" />
    <path d="M12 6v6l4 2" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
    <defs><linearGradient id="gp1" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#10b981" /><stop offset="1" stopColor="#059669" /></linearGradient></defs>
  </svg>
);

const IconClaude = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#cu1)" />
    <path d="M8 12h8M12 8v8" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
    <defs><linearGradient id="cu1" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#f97316" /><stop offset="1" stopColor="#ea580c" /></linearGradient></defs>
  </svg>
);

const IconGemini = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="url(#gm1)" />
    <path d="M12 7l-4 2.5v5L12 17l4-2.5v-5L12 7z" fill="rgba(255,255,255,0.25)" />
    <defs><linearGradient id="gm1" x1="4" y1="2" x2="20" y2="22"><stop stopColor="#3b82f6" /><stop offset="1" stopColor="#2563eb" /></linearGradient></defs>
  </svg>
);

export {
  IconImageGen, IconCreative, IconBgRemover, IconTrainModel,
  IconVideoGen, IconImageEditor, IconUpscaler,
  IconChat, IconCode,
  IconBlog, IconSupport, IconChangelog, IconAPI,
  IconMegsyPro, IconGPT, IconClaude, IconGemini,
};
