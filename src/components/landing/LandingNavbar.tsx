import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import FancyButton from "@/components/FancyButton";
import { ChevronDown, ArrowRight } from "lucide-react";
/* ── Mega-menu data ── */
interface SubItem {
  label: string;
  desc: string;
  href: string;
}

interface MenuColumn {
  title: string;
  items: SubItem[];
}

interface NavDropdown {
  label: string;
  columns: MenuColumn[];
  featured?: { title: string; cta: string; href: string };
}

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

type NavItem = NavDropdown | NavLink;

const isDropdown = (item: NavItem): item is NavDropdown => "columns" in item;

const navItems: NavItem[] = [
  {
    label: "Create",
    columns: [
      {
        title: "AI Creation",
        items: [
          { label: "AI Image Generator", desc: "Create stunning visuals with Megsy Pro", href: "/services/images" },
          { label: "AI Video Generator", desc: "Generate cinematic videos instantly", href: "/services/videos" },
          { label: "AI Chat", desc: "Chat with 80+ models including Megsy Pro", href: "/services/chat" },
        ],
      },
      {
        title: "Productivity",
        items: [
          { label: "File Analysis", desc: "Upload & analyze documents with AI", href: "/services/files" },
          { label: "Code Builder", desc: "Build & deploy full-stack apps", href: "/services/code" },
        ],
      },
    ],
    featured: { title: "Powered by\nMegsy Pro", cta: "Try it free", href: "/auth" },
  },
  {
    label: "Products",
    columns: [
      {
        title: "Tools",
        items: [
          { label: "AI Chat", desc: "Chat with 80+ AI models", href: "/chat" },
          { label: "Image Generation", desc: "Create stunning visuals", href: "/images" },
          { label: "Video Generation", desc: "Generate AI videos", href: "/videos" },
          { label: "Code Builder", desc: "Build & deploy full-stack apps", href: "/code" },
        ],
      },
      {
        title: "Featured Models",
        items: [
          { label: "Megsy Pro", desc: "Our flagship creative model", href: "/#models" },
          { label: "GPT-4o", desc: "Advanced reasoning", href: "/#models" },
          { label: "Claude Sonnet", desc: "Best for code & analysis", href: "/#models" },
          { label: "Gemini Flash", desc: "Ultra-fast responses", href: "/#models" },
        ],
      },
    ],
  },
  {
    label: "Learn",
    columns: [
      {
        title: "Resources",
        items: [
          { label: "Blog", desc: "Tips, tutorials and updates", href: "#" },
          { label: "Support", desc: "Get help from our team", href: "/contact" },
          { label: "Changelog", desc: "What's new in Megsy", href: "#" },
          { label: "API Docs", desc: "Integrate Megsy into your apps", href: "#" },
        ],
      },
    ],
  },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/contact" },
];

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setPinned(false);
    if (href.startsWith("http")) {
      window.open(href, "_blank");
    } else if (href.startsWith("/#")) {
      const hash = href.replace("/", "");
      if (location.pathname === "/") {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/");
        setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 300);
      }
    } else {
      navigate(href);
    }
  };

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!pinned) setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    if (!pinned) {
      timeoutRef.current = setTimeout(() => setOpenDropdown(null), 200);
    }
  };

  const handleClick = (label: string) => {
    if (openDropdown === label && pinned) {
      setOpenDropdown(null);
      setPinned(false);
    } else {
      setOpenDropdown(label);
      setPinned(true);
    }
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-border bg-background/90 backdrop-blur-xl" : "bg-background/55 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); navigate("/"); }}
          className="font-display text-3xl font-black uppercase tracking-tight text-foreground"
        >
          MEGSY
        </a>

        {/* ── Desktop Nav ── */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) =>
            isDropdown(item) ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={() => handleClick(item.label)}
                  className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openDropdown === item.label ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {openDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="fixed left-1/2 top-16 z-50 mt-1 -translate-x-1/2"
                    >
                      <div
                        className="flex max-h-[80vh] overflow-auto overscroll-contain gap-0 rounded-2xl border border-white/[0.06] bg-background p-6 shadow-2xl shadow-black/60"
                        style={{ width: item.featured ? "min(740px, calc(100vw - 2rem))" : "min(600px, calc(100vw - 2rem))" }}
                      >
                        {/* Columns */}
                        <div className="flex flex-1 gap-6">
                          {item.columns.map((col) => (
                            <div key={col.title} className="min-w-[200px] flex-1">
                              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                {col.title}
                              </h4>
                              <div className="space-y-1">
                                {col.items.map((sub) => (
                                  <button
                                    key={sub.label}
                                    onClick={() => handleNav(sub.href)}
                                    className="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all hover:bg-primary/[0.06]"
                                  >
                                    <div>
                                      <div className="text-[14px] font-semibold text-foreground/90 group-hover:text-foreground">
                                        {sub.label}
                                      </div>
                                      <div className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground group-hover:text-foreground/50">
                                        {sub.desc}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Featured card */}
                        {item.featured && (
                          <div className="ml-5 flex w-52 flex-col justify-between rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-cyan-500 p-6">
                            <div className="mb-6 h-20 w-full rounded-xl bg-white/10 backdrop-blur" />
                            <div>
                              <p className="text-base font-black leading-snug text-white whitespace-pre-line">
                                {item.featured.title}
                              </p>
                              <button
                                onClick={() => handleNav(item.featured!.href)}
                                className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-5 py-2 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-white/30"
                              >
                                {item.featured.cta}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.href);
                }}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            )
          )}
        </div>

        {/* Auth buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => navigate("/auth")}
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-all hover:border-foreground/35"
          >
            Log in
          </button>
          <FancyButton onClick={() => navigate("/auth")} className="text-sm">
            Start Creating
          </FancyButton>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-sm font-bold uppercase tracking-wider text-foreground md:hidden">
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-h-[80vh] overflow-y-auto border-t border-border bg-background px-6 py-5 md:hidden">
          {navItems.map((item) =>
            isDropdown(item) ? (
              <div key={item.label}>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                  className="flex w-full items-center justify-between py-3 text-base font-medium text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileExpanded === item.label ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileExpanded === item.label && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pb-3 pl-2">
                        {item.columns.map((col) => (
                          <div key={col.title}>
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/30">{col.title}</h4>
                            {col.items.map((sub) => {
                              
                              return (
                                <button
                                  key={sub.label}
                                  onClick={() => handleNav(sub.href)}
                                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.06]"
                                >
                                  
                                  <div>
                                    <span className="text-sm text-white/80">{sub.label}</span>
                                    <span className="block text-xs text-white/30">{sub.desc}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.href);
                }}
                className="block py-3 text-base font-medium text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </a>
            )
          )}
          <div className="mt-5 flex flex-col gap-3">
            <button onClick={() => navigate("/auth")} className="rounded-lg border border-border py-2.5 text-sm font-medium text-foreground">
              Log in
            </button>
            <FancyButton onClick={() => navigate("/auth")}>Start Creating</FancyButton>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default LandingNavbar;
