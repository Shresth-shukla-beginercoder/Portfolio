import { NAV, PROFILE } from "../data/content.js";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-gradient-to-b from-[#05060a] to-transparent">
      <a href="#hero" data-layer="nav.logo" data-owner="10" data-kind="nav" className="logo text-lg font-bold tracking-[0.3em] text-white">
        SS<span className="text-[#ff5a3c]">.</span>
      </a>
      <ul className="flex gap-8 text-xs tracking-widest uppercase">
        {NAV.map((n, i) => (
          <li key={n.id} data-layer={`nav.link.${i}`} data-owner="10" data-kind="nav">
            <a href={`#${n.id}`} className="nav-link text-gray-400 hover:text-[#ff5a3c] transition-colors" data-hoverable>
              {n.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
