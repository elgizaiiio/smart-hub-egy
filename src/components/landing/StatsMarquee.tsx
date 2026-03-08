const stats = [
  "80+ AI Models",
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
  const items = [...stats, ...stats, ...stats, ...stats];

  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.02] py-5">
      <div className="landing-marquee">
        <div className="landing-marquee-track">
          {items.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-4 whitespace-nowrap text-base font-bold uppercase tracking-widest text-white/40 md:text-lg"
            >
              {s}
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsMarquee;
