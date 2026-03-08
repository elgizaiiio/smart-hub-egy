const stats = [
  "80+ AI Models",
  "7 Categories",
  "150+ Countries",
  "4B+ Assets Generated",
  "20+ Image Models",
  "10+ Video Models",
  "5 Chat Models",
  "18+ Image Tools",
  "99.9% Uptime",
  "Sub-second Latency",
];

const StatsMarquee = () => {
  const items = [...stats, ...stats];

  return (
    <section className="relative py-6 bg-white/[0.03] border-y border-white/[0.06] overflow-hidden">
      <div className="landing-marquee">
        <div className="landing-marquee-track">
          {items.map((s, i) => (
            <span
              key={i}
              className="flex items-center gap-4 text-white/40 text-sm font-medium uppercase tracking-widest whitespace-nowrap"
            >
              <span>{s}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsMarquee;
