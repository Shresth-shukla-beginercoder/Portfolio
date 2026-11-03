import { useState } from "react";
import { FileText, Download, Eye } from "lucide-react";
import Resume3DCard from "../3d/components/Resume3DCard.jsx";
import ResumeViewer from "./ResumeViewer.jsx";

// Real assets, served from the public/ folder (absolute paths so Vite + Vercel resolve them).
const RESUME_PNG = "/resume/Shresth_Shukla_Resume.png";
const RESUME_PDF = "/resume/Shresth_Shukla_Resume.pdf";
const DOWNLOAD_NAME = "Shresth_Shukla_Resume.pdf";

/**
 * Resume Section — premium 3D resume / document card + in-page viewer.
 *
 * The card and its sub-parts carry `data-layer` ids (`resume.card`,
 * `resume.card.preview`, `resume.card.actions`) so the 15-agent construction
 * tour measures them and reveals them in-viewport when the tour reaches this
 * section. Nothing here is visible (or interactive) before its worker builds
 * it.
 */
export default function Resume() {
  const [showViewer, setShowViewer] = useState(false);

  const handleDownload = (e) => {
    e?.stopPropagation?.();
    const link = document.createElement("a");
    link.href = RESUME_PDF;
    link.download = DOWNLOAD_NAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="resume" className="px-8 md:px-20 py-28 max-w-6xl mx-auto scroll-mt-20">
      {/* Section header */}
      <div
        data-section-title
        data-layer="resume.title"
        data-owner="4"
        data-kind="type"
        className="mb-16"
      >
        <span className="text-[#ff5a3c] text-sm tracking-[0.4em] font-mono">06 / Documents</span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mt-2">Resume</h2>
        <p className="text-gray-400 text-lg mt-4 max-w-2xl">
          Full-stack developer profile covering experience, skills and projects.
          View it right here on the site, or download the original file.
        </p>
      </div>

      {/* Main content */}
      <div data-section-body className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">
        {/* 3D Resume card */}
        <div className="lg:col-span-2">
          <Resume3DCard layer="resume.card" onView={() => setShowViewer(true)} onDownload={handleDownload}>
            <div className="flex flex-col gap-5 md:gap-6">
              {/* Document header */}
              <div className="flex items-start gap-4">
                <div
                  className="p-3 md:p-4 rounded-lg bg-gradient-to-br from-[#ff5a3c]/20 to-[#ff5a3c]/5 border border-[#ff5a3c]/30 shrink-0"
                  style={{ transform: "translateZ(8px)" }}
                >
                  <FileText className="text-[#ff5a3c]" size={24} />
                </div>
                <div style={{ transform: "translateZ(6px)" }}>
                  <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">Shresth Shukla</h3>
                  <p className="text-[#ff5a3c] font-mono text-xs md:text-sm mt-1">Full Stack Developer</p>
                </div>
              </div>

              {/* Actual resume preview (lazy-loaded, staged in by the tour) */}
              <div
                data-layer="resume.card.preview"
                data-owner="8"
                data-kind="image"
                className="relative rounded-md overflow-hidden border border-white/10 bg-[#e9e6df] cursor-pointer group"
                onClick={() => setShowViewer(true)}
                role="button"
                aria-label="Open resume viewer"
                style={{ transform: "translateZ(4px)" }}
              >
                <div className="aspect-[8.5/11] w-full">
                  <img
                    src={RESUME_PNG}
                    alt="Shresth Shukla resume preview"
                    loading="lazy"
                    className="w-full h-full object-cover object-top select-none"
                  />
                </div>
                {/* hover scrim + prompt */}
                <div className="absolute inset-0 bg-[#05060a]/0 group-hover:bg-[#05060a]/40 transition-colors duration-300 flex items-end justify-end p-3">
                  <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-mono tracking-wider px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={13} /> View full
                  </span>
                </div>
              </div>

              {/* Actions — staged in last, buttons are inert until the tour builds them */}
              <div
                data-layer="resume.card.actions"
                data-owner="11"
                data-kind="button"
                className="flex gap-3 pt-2"
                style={{ transform: "translateZ(4px)" }}
              >
                <button
                  onClick={() => setShowViewer(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#ff5a3c] text-[#05060a] font-mono text-xs md:text-sm tracking-widest uppercase rounded-lg hover:bg-[#ff8568] transition-all shadow-lg shadow-[#ff5a3c]/30 hover:shadow-[#ff5a3c]/50 group"
                >
                  <Eye size={18} className="group-hover:scale-110 transition-transform" />
                  <span>View Resume</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-[#ff5a3c]/60 text-white font-mono text-xs md:text-sm tracking-widest uppercase rounded-lg hover:bg-[#ff5a3c]/10 hover:border-[#ff5a3c] transition-all group"
                >
                  <Download size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Download</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-500">
                Original PDF · preserves full quality · opens in-page, never leaves this site
              </p>
            </div>
          </Resume3DCard>
        </div>

        {/* Side info panel */}
        <div data-layer="resume.info" data-owner="5" data-kind="type" className="lg:col-span-1 space-y-6">
          <div className="p-6 border border-white/10 rounded-lg bg-[#10131b]/50 backdrop-blur-sm space-y-4">
            <h4 className="font-bold text-white uppercase tracking-widest text-xs">At a glance</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Education</p>
                <p className="text-white font-mono text-xs">B.Tech CSE (AI &amp; ML) · ITM GIDA</p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <p className="text-gray-400 mb-1">Experience</p>
                <p className="text-white font-mono text-xs">Gen-AI / Java Full-Stack internships</p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <p className="text-gray-400 mb-1">Focus</p>
                <p className="text-white font-mono text-xs">React · Node · PostgreSQL · MCP</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <p className="text-xs text-gray-400">Interested in working together?</p>
            <a
              href="#contact"
              onClick={(e) => {
                const el = document.getElementById("contact");
                if (!el) return;
                e.preventDefault();
                if (window.__lenis) window.__lenis.scrollTo(el, { offset: -70, duration: 1.2 });
                else el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-block mt-2 text-[#ff5a3c] hover:text-[#ff8568] font-mono text-sm transition-colors"
            >
              Get in touch ↗
            </a>
          </div>
        </div>
      </div>

      {/* In-page resume viewer */}
      {showViewer && (
        <ResumeViewer
          image={RESUME_PNG}
          pdf={RESUME_PDF}
          downloadName={DOWNLOAD_NAME}
          onClose={() => setShowViewer(false)}
        />
      )}
    </section>
  );
}
