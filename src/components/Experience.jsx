import { EXPERIENCE } from "../data/content.js";
import { Timeline3D, TimelineEntry3D } from "../3d/components/Timeline3D.jsx";

export default function Experience() {
  return (
    <section id="experience" className="px-8 md:px-20 py-28 max-w-6xl mx-auto">
      <div data-section-title data-layer="experience.title" data-owner="4" data-kind="type" className="mb-12">
        <span className="text-[#ff5a3c] text-sm tracking-[0.4em]">05 / Track Record</span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Experience</h2>
      </div>
      <div data-section-body>
        <Timeline3D entries={EXPERIENCE}>
          {EXPERIENCE.map((e, i) => (
            <TimelineEntry3D key={e.org + e.role} entry={e} index={i} layer={`experience.entry.${i}`}>
              <div data-layer={`experience.entry.${i}`} data-owner="5" data-kind="type" className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 border-l-2 border-[#ff5a3c]/40 pl-6">
                <div>
                  <p className="font-mono text-xs text-[#ff5a3c]">{e.period}</p>
                  <p className="text-gray-500 text-sm mt-1">{e.org}</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{e.role}</h3>
                  <p className="text-gray-400 mt-2">{e.summary}</p>
                </div>
              </div>
            </TimelineEntry3D>
          ))}
        </Timeline3D>
      </div>
    </section>
  );
}
