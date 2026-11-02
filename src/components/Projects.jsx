import { PROJECTS } from "../data/content.js";
import { ArrowUpRight } from "lucide-react";

export default function Projects() {
  return (
    <section id="projects" className="px-8 md:px-20 py-28 max-w-6xl mx-auto">
      <div data-section-title data-layer="projects.title" data-owner="4" data-kind="type" className="mb-12">
        <span className="text-[#ff5a3c] text-sm tracking-[0.4em]">04 / Selected Work</span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Projects</h2>
      </div>
      <div data-section-body className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {PROJECTS.map((p, i) => (
          <article key={p.id} data-layer={`projects.card.${i}`} data-owner="12" data-kind="card" className="group project-card border border-white/10 bg-[#10131b] hover:border-[#ff5a3c]/40 transition-colors" data-hoverable>
            <div className="relative overflow-hidden aspect-[16/10]">
              <img src={p.image} alt={p.title} data-layer={`projects.card.${i}.img`} data-owner="8" data-kind="image" className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
              <span data-layer={`projects.card.${i}.year`} data-owner="14" data-kind="polish" className="absolute top-3 right-3 font-mono text-xs text-[#ff5a3c]">{p.year}</span>
            </div>
            <div className="p-6">
              <h3 data-layer={`projects.card.${i}.title`} data-owner="4" data-kind="type" className="text-2xl font-bold mb-2 flex items-center gap-2">
                {p.title} <ArrowUpRight size={18} className="text-[#ff5a3c]" />
              </h3>
              <p data-layer={`projects.card.${i}.desc`} data-owner="5" data-kind="type" className="text-gray-400 mb-4">{p.blurb}</p>
              <div data-layer={`projects.card.${i}.tags`} data-owner="12" data-kind="card" className="flex flex-wrap gap-2 mb-4">
                {p.tags.map((t) => (
                  <span key={t} className="text-xs px-3 py-1 border border-white/10 rounded-full text-gray-300">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                {p.repoUrl && (
                  <a data-layer={`projects.card.${i}.repo`} data-owner="11" data-kind="button" href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#ff5a3c] underline underline-offset-4 hover:text-[#ff8568] transition-colors" data-hoverable>
                    View Repository →
                  </a>
                )}
                {p.liveUrl && (
                  <a data-layer={`projects.card.${i}.live`} data-owner="11" data-kind="button" href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#ff5a3c] underline underline-offset-4 hover:text-[#ff8568] transition-colors" data-hoverable>
                    Live Demo →
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
