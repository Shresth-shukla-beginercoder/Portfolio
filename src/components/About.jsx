import { PROFILE } from "../data/content.js";

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
      <div data-section-body data-layer="about.body" data-owner="5" data-kind="type">
        <p className="text-xl leading-relaxed text-gray-300 max-w-3xl">{PROFILE.about}</p>
      </div>
    </section>
  );
}
