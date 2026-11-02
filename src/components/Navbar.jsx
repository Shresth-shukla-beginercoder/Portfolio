import { useEffect, useRef, useState } from "react";
import { NAV, PROFILE } from "../data/content.js";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [active, setActive] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);

  // Active-section tracking (post-handover). During the tour the nav is
  // clip-hidden and inert; this still runs harmlessly as the tour scrolls.
  useEffect(() => {
    const ids = NAV.map((n) => n.id);
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Sticky glass surface on scroll (charcoal blur, no layout jump).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet when a link is chosen.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav
      ref={navRef}
      data-layer="nav.root"
      data-owner="10"
      data-kind="nav"
      className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-20 py-5 transition-all duration-300 ${
        scrolled
          ? "nav-glass border-b border-[#ff5a3c]/20"
          : "border-b border-[#ff5a3c]/10"
      }`}
      style={{
        backdropFilter: scrolled ? "blur(12px)" : "blur(8px)",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "blur(8px)",
        background: scrolled
          ? "rgba(11, 13, 19, 0.75)"
          : "rgba(5, 6, 10, 0.5)"
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo - elegant serif */}
        <a
          href="#hero"
          data-layer="nav.logo"
          data-owner="10"
          data-kind="nav"
          className="nav-enter text-lg font-serif font-bold tracking-wider text-white"
          style={{
            animationDelay: "0.05s",
            fontFamily: "Georgia, 'Times New Roman', serif"
          }}
        >
          Shresth Shukla
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-10 text-xs tracking-widest uppercase">
          {NAV.map((n, i) => (
            <li
              key={n.id}
              data-layer={`nav.link.${i}`}
              data-owner="10"
              data-kind="nav"
              className="nav-enter"
              style={{ animationDelay: `${0.12 + i * 0.07}s` }}
            >
              <a
                href={`#${n.id}`}
                data-hoverable
                className={`nav-link relative text-gray-400 transition-colors hover:text-[#ff5a3c] ${
                  active === n.id ? "text-[#ff5a3c] nav-active" : ""
                }`}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Let's Talk button (desktop) */}
        <a
          href="#contact"
          data-layer="nav.lets-talk"
          data-owner="10"
          data-kind="button"
          className="hidden md:block px-6 py-2 text-xs font-mono tracking-widest uppercase text-white border border-[#ff5a3c]/60 rounded transition-all duration-300 hover:bg-[#ff5a3c]/10 hover:border-[#ff5a3c] hover:shadow-lg hover:shadow-[#ff5a3c]/20"
          data-hoverable
        >
          Let's Talk ↗
        </a>

        {/* Mobile toggle */}
        <button
          type="button"
          data-layer="nav.menu"
          data-owner="10"
          data-kind="nav"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-gray-300 hover:text-[#ff5a3c] transition-colors"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-4 pb-4 text-xs tracking-widest uppercase border-t border-white/10 pt-4">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                onClick={() => setOpen(false)}
                data-hoverable
                className={`nav-link relative block text-gray-400 transition-colors hover:text-[#ff5a3c] ${
                  active === n.id ? "text-[#ff5a3c] nav-active" : ""
                }`}
              >
                {n.label}
              </a>
            </li>
          ))}
          <li className="mt-4 pt-4 border-t border-white/10">
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              data-hoverable
              className="block px-4 py-2 text-xs font-mono tracking-widest uppercase text-white border border-[#ff5a3c]/60 rounded text-center transition-all duration-300 hover:bg-[#ff5a3c]/10 hover:border-[#ff5a3c]"
            >
              Let's Connect ↗
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
