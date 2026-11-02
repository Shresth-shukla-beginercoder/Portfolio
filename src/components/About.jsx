import { ABOUT } from "../data/about.js";
import Card3D from "../3d/components/Card3D.jsx";

const OWNERS = { 1: 4, 2: 5, 3: 4, 4: 5, 5: 6, 6: 4 };

function SectionTitle({ index, children, layer, owner }) {
  return (
    <div data-section-title data-layer={layer} data-owner={owner} data-kind="type" className="mb-12">
      <span className="text-[#ff5a3c] text-sm tracking-[0.4em]">{index}</span>
      <h2 className="text-4xl md:text-5xl font-black tracking-tight">{children}</h2>
    </div>
  );
}

export default function About() {
  return (
    <section id="about" className="px-8 md:px-20 py-28 max-w-6xl mx-auto">
      <SectionTitle index="02 / About" layer="about.title" owner="4">The Engineer</SectionTitle>
      <div data-section-body className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {Object.entries(ABOUT).map(([key, block]) => {
          const num = parseInt(key.replace("s", ""), 10);
          const layer = `about.s${num}`;
          return (
            <Card3D key={key} layer={layer} depth={20} glow={true} float={true}>
              <div data-layer={layer} data-owner={OWNERS[num]} data-kind="type" className="border border-white/10 bg-[#10131b] p-6">
                <h3 className="text-lg font-bold text-[#ff5a3c] mb-3">{block.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{block.body}</p>
              </div>
            </Card3D>
          );
        })}
      </div>
    </section>
  );
}
