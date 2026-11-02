import { SKILLS } from "../data/content.js";

export default function Skills() {
  return (
    <section id="skills" className="px-8 md:px-20 py-28 max-w-6xl mx-auto">
      <div data-section-title data-layer="skills.title" data-owner="4" data-kind="type" className="mb-12">
        <span className="text-[#ff5a3c] text-sm tracking-[0.4em]">03 / Capabilities</span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Skills</h2>
      </div>
      <div data-section-body className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
        {SKILLS.map((s, i) => (
          <div key={s.name} data-layer={`skills.bar.${i}`} data-owner="12" data-kind="card">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-200 tracking-wide">{s.name}</span>
              <span className="text-[#ff5a3c] font-mono">{s.level}%</span>
            </div>
            <div className="h-[3px] bg-white/10 overflow-hidden">
              <div data-skill-bar style={{ width: `${s.level}%` }} className="h-full bg-[#ff5a3c]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
