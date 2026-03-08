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
    <footer className="border-t border-white/[0.06] bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 via-purple-600 to-purple-800 text-sm font-black text-white">
                M
              </div>
              <span className="text-lg font-bold text-white">Megsy</span>
            </div>
            <p className="text-sm leading-relaxed text-white/30">
              The all-in-one AI creative platform. Create, generate, and deploy with 80+ models.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
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
                      className="text-sm text-white/30 transition-colors hover:text-white/60"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <p className="text-sm text-white/20">2024-2026 Megsy AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-white/20 transition-colors hover:text-white/40">Twitter / X</a>
            <a href="#" className="text-sm text-white/20 transition-colors hover:text-white/40">Discord</a>
            <a href="#" className="text-sm text-white/20 transition-colors hover:text-white/40">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
