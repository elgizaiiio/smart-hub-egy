import { useNavigate } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "AI Chat", href: "#features" },
    { label: "Image Generation", href: "#features" },
    { label: "Video Generation", href: "#features" },
    { label: "Code Builder", href: "#features" },
    { label: "Image Tools", href: "#features" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Changelog", href: "#" },
    { label: "Status", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Partners", href: "#" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "#" },
    { label: "Acceptable Use", href: "#" },
  ],
};

const LandingFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="relative border-t border-white/[0.06] bg-black">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Logo column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 via-purple-600 to-purple-800 flex items-center justify-center font-black text-white text-sm">
                M
              </div>
              <span className="text-white font-bold text-lg">Megsy</span>
            </div>
            <p className="text-white/30 text-sm leading-relaxed">
              The all-in-one AI creative platform. Create, generate, and deploy with 80+ models.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        if (link.href.startsWith("/")) {
                          e.preventDefault();
                          navigate(link.href);
                        }
                      }}
                      className="text-white/30 hover:text-white/60 text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-sm">
            2024-2026 Megsy AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/20 hover:text-white/40 text-sm transition-colors">
              Twitter / X
            </a>
            <a href="#" className="text-white/20 hover:text-white/40 text-sm transition-colors">
              Discord
            </a>
            <a href="#" className="text-white/20 hover:text-white/40 text-sm transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
