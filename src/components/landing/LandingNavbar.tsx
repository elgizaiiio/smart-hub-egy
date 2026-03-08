import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

const links = [
  { label: "Features", href: "#features" },
  { label: "Models", href: "#models" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About Us", href: "https://about.megsyai.com", external: true },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "#faq" },
];

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/[0.06] bg-black/90 backdrop-blur-xl" : "bg-black/55 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="font-display text-3xl font-black uppercase tracking-tight text-foreground">
          MEGSY
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...((l as any).external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

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

        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-sm font-bold uppercase tracking-wider text-foreground md:hidden">
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-border bg-background px-6 py-5 md:hidden">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              {...((l as any).external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="block py-3 text-base font-medium text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
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
