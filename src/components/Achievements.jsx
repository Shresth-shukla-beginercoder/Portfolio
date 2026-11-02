import { ACHIEVEMENTS } from "../data/content.js";
import { Trophy } from "lucide-react";
import Achievement3D from "../3d/components/Achievement3D.jsx";

export default function Achievements() {
  return (
    <section id="achievements" className="px-8 md:px-20 py-28 max-w-6xl mx-auto">
      <div data-section-title data-layer="achievements.title" data-owner="4" data-kind="type" className="mb-12">
        <span className="text-[#ff5a3c] text-sm tracking-[0.4em]">07 / Highlights</span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Achievements</h2>
      </div>
      <div data-section-body className="space-y-4">
        {ACHIEVEMENTS.map((a, i) => (
          <Achievement3D key={i} achievement={a} index={i} layer={`achievements.item.${i}`}>
            <div data-layer={`achievements.item.${i}`} data-owner="13" data-kind="polish" className="flex items-center gap-4 border-b border-white/10 pb-4">
              <Trophy size={18} className="text-[#ff5a3c]" />
              <span className="text-gray-300">{a}</span>
            </div>
          </Achievement3D>
        ))}
      </div>
    </section>
  );
}
