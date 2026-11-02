import { PROFILE, SOCIALS } from "../data/content.js";
import { Github, Linkedin } from "lucide-react";

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center px-8 md:px-20 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" data-layer="hero.wordmark" data-owner="4" data-kind="type">
        <h1 data-hero-reveal className="text-[18vw] leading-none font-black text-[#ff5a3c] select-none opacity-90">
          SHUKLA
        </h1>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 w-full max-w-6xl mx-auto">
        <div className="order-2 md:order-1 flex-1">
          <p data-hero-reveal data-layer="hero.kicker" data-owner="6" data-kind="type" className="text-[#ff5a3c] tracking-[0.4em] text-sm mb-4 uppercase">
            Shresth Shukla
          </p>
          <h2 data-hero-reveal data-layer="hero.headline" data-owner="4" data-kind="type" className="text-4xl md:text-6xl font-black leading-tight">
            {PROFILE.role.split("|")[0].trim()}
          </h2>
          <p data-hero-reveal data-layer="hero.bio" data-owner="5" data-kind="type" className="mt-4 text-gray-400 max-w-md">{PROFILE.bio}</p>

          {PROFILE.subRoles?.length > 0 && (
            <div data-hero-reveal data-layer="hero.chips" data-owner="12" data-kind="card" className="mt-5 flex flex-wrap gap-2">
              {PROFILE.subRoles.map((s) => (
                <span key={s} className="font-mono text-xs text-gray-300 border border-white/10 rounded-full px-3 py-1">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div data-hero-reveal className="mt-8 flex gap-4">
            <a href={SOCIALS.github} target="_blank" rel="noreferrer" data-layer="hero.cta.github" data-owner="11" data-kind="button" className="btn-primary" data-hoverable>
              <Github size={18} /> GitHub
            </a>
            <a href={SOCIALS.linkedin} target="_blank" rel="noreferrer" data-layer="hero.cta.linkedin" data-owner="11" data-kind="button" className="btn-ghost" data-hoverable>
              <Linkedin size={18} /> LinkedIn
            </a>
          </div>
        </div>

        <div data-hero-reveal data-layer="hero.portrait" data-owner="7" data-kind="image" className="order-1 md:order-2 relative">
          <img
            data-hero-photo
            src={PROFILE.photo}
            alt="Shresth Shukla"
            className="w-64 md:w-80 h-80 md:h-96 object-cover grayscale contrast-125 border border-[#ff5a3c]/30"
          />
          <div className="absolute -inset-4 border border-[#ff5a3c]/20 pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
