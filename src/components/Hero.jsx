import { PROFILE } from "../data/content.js";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden bg-[#05060a]"
    >
      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(90deg, #ff5a3c 1px, transparent 1px),
            linear-gradient(0deg, #ff5a3c 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 md:px-20 py-20">

        {/* Top-left editorial label */}
        <div data-layer="hero.label-top-left" data-owner="1" data-kind="type" className="absolute top-24 md:top-28 left-6 md:left-20">
          <p className="text-[10px] md:text-xs font-mono tracking-[0.3em] text-gray-600 uppercase leading-relaxed">
            Engineer · Developer<br className="md:hidden" /> · AI Enthusiast
          </p>
        </div>

        {/* Top-right editorial label */}
        <div data-layer="hero.label-top-right" data-owner="1" data-kind="type" className="absolute top-24 md:top-28 right-6 md:right-20">
          <p className="text-[10px] md:text-xs font-mono tracking-[0.3em] text-gray-600 uppercase text-right leading-relaxed">
            Based in India<br className="md:hidden" /> · Building for the Future
          </p>
        </div>

        {/* Left-side vertical label - desktop only */}
        <div data-layer="hero.label-left" data-owner="2" data-kind="type" className="absolute left-6 md:left-16 top-1/2 transform -translate-y-1/2 hidden lg:block">
          <div className="text-[10px] font-mono tracking-[0.25em] text-gray-700 space-y-5">
            <p className="text-[#ff5a3c] font-bold">01 / INTRO</p>
            <div className="space-y-3 mt-4">
              <p>TECHNOLOGY</p>
              <p>PROBLEM</p>
              <p>SOLVING</p>
            </div>
          </div>
        </div>

        {/* Main hero content - portrait + name layering */}
        <div className="relative w-full max-w-5xl mx-auto">

          {/* Tagline above portrait */}
          <div data-layer="hero.tagline" data-owner="6" data-kind="type" className="text-center mb-6 md:mb-8">
            <p className="text-[11px] md:text-xs font-mono tracking-[0.35em] text-gray-500 uppercase leading-relaxed px-4">
              A Developer Exploring the Intersection<br className="hidden sm:block" /> of Software & Artificial Intelligence
            </p>
          </div>

          {/* Portrait with overlaid name */}
          <div className="relative w-full max-w-md md:max-w-lg mx-auto">
            {/* Portrait image - centered, visible, monochrome */}
            <div
              data-layer="hero.portrait"
              data-owner="7"
              data-kind="image"
              className="relative w-full aspect-[4/5] overflow-hidden"
            >
              <img
                data-hero-photo
                src={PROFILE.photo}
                alt="Shresth Shukla"
                className="w-full h-full object-cover object-[center_20%]"
                style={{
                  filter: "grayscale(100%) contrast(1.15) brightness(1.0)"
                }}
              />
              {/* Subtle vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05060a] via-transparent to-transparent opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#05060a]/20 via-transparent to-transparent" />
            </div>

            {/* Oversized name - positioned over lower portion of portrait */}
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 md:pb-4">
              <h1
                data-layer="hero.name"
                data-owner="4"
                data-kind="type"
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-[0.9] tracking-tighter"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  letterSpacing: "-0.04em",
                  textShadow: "0 4px 30px rgba(0,0,0,0.95), 0 0 60px rgba(255, 90, 60, 0.15)"
                }}
              >
                Shresth<br />Shukla
              </h1>
            </div>
          </div>

          {/* Bio paragraph below portrait */}
          <div data-layer="hero.bio" data-owner="5" data-kind="type" className="text-center mt-8 md:mt-10 max-w-2xl mx-auto px-4">
            <p className="text-sm md:text-base text-gray-400 leading-relaxed font-light">
              Computer Science & Engineering student specializing in AI and Machine Learning. Passionate about full-stack development, AI applications, and turning ideas into practical solutions.
            </p>
          </div>

          {/* CTA Buttons */}
          <div data-layer="hero.ctas" data-owner="11" data-kind="button" className="flex flex-col sm:flex-row gap-4 justify-center mt-10 md:mt-12 px-4">
            <a
              href="#projects"
              className="px-6 md:px-8 py-3 md:py-4 bg-[#ff5a3c] text-[#05060a] font-bold uppercase tracking-[0.2em] text-xs md:text-sm transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff5a3c]/50 hover:-translate-y-1 active:translate-y-0 text-center"
              data-hoverable
            >
              Explore My Work ↓
            </a>
            <a
              href="#contact"
              className="px-6 md:px-8 py-3 md:py-4 border-2 border-[#ff5a3c] text-white font-bold uppercase tracking-[0.2em] text-xs md:text-sm transition-all duration-300 hover:bg-[#ff5a3c]/10 hover:shadow-lg hover:shadow-[#ff5a3c]/20 text-center"
              data-hoverable
            >
              Let's Connect ↗
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-[10px] font-mono text-gray-700 uppercase tracking-[0.3em]">Scroll ↓</p>
        </div>
      </div>
    </section>
  );
}
