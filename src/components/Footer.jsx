import { SOCIALS } from "../data/content.js";

export default function Footer() {
  return (
    <footer
      data-layer="contact.footer"
      data-owner="14"
      data-kind="polish"
      className="px-8 md:px-20 py-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500"
    >
      <p>© 2026 Shresth Shukla — built as a cinematic construction site.</p>
      <div className="flex gap-6">
        <a data-layer="contact.footer.github" data-owner="10" data-kind="nav" href={SOCIALS.github} target="_blank" rel="noreferrer" className="hover:text-[#ff5a3c] transition-colors">GitHub</a>
        <a data-layer="contact.footer.linkedin" data-owner="10" data-kind="nav" href={SOCIALS.linkedin} target="_blank" rel="noreferrer" className="hover:text-[#ff5a3c] transition-colors">LinkedIn</a>
      </div>
    </footer>
  );
}
