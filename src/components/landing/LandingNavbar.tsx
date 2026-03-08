import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";

const links = [
  { label: "Features", href: "#features" },
  { label: "Models", href: "#models" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-black/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 via-purple-600 to-purple-800 text-sm font-black text-white">
            M
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Megsy</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-white/60 transition-colors duration-300 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Log in
          </button>
          <FancyButton onClick={() => navigate("/auth")} className="text-sm">
            Start Creating
          </FancyButton>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-sm font-bold uppercase tracking-wider text-white md:hidden"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 bg-black/95 backdrop-blur-xl px-6 py-6 md:hidden"
        >
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-lg font-medium text-white/70 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="rounded-lg border border-white/20 py-2 text-sm text-white"
            >
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
