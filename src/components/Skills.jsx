import { SKILLS } from "../data/content.js";
import SkillTile3D from "../3d/components/SkillTile3D.jsx";

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
            <SkillTile3D skill={s} index={i} layer={`skills.bar.${i}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
