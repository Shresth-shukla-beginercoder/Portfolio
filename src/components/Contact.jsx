import { SOCIALS } from "../data/content.js";
import SignatureAnimation from "./SignatureAnimation.jsx";
import ContactCard3D from "../3d/components/ContactCard3D.jsx";

// Opens a Gmail compose window pre-addressed to the owner, in a new tab, so a
// visitor can mail you directly regardless of their local mail client.
const GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  SOCIALS.email
)}&su=${encodeURIComponent("Let's connect")}`;

export default function Contact() {
  return (
    <section id="contact" className="px-8 md:px-20 py-28 max-w-6xl mx-auto">
      <div data-section-title data-layer="contact.title" data-owner="4" data-kind="type" className="mb-12">
        <span className="text-[#ff5a3c] text-sm tracking-[0.4em]">09 / Handover</span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Contact</h2>
      </div>
      <div data-section-body>
        <ContactCard3D layer="contact.lead">
          <p data-layer="contact.lead" data-owner="6" data-kind="type" className="text-xl text-gray-300 max-w-2xl mb-10">
            Site clear. Keys handed over. If you want to build something cinematic,
            the line is open.
          </p>
          <div className="flex flex-wrap gap-4 mb-16">
            <a href={GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer" data-layer="contact.email" data-owner="11" data-kind="button" className="btn-primary" data-hoverable>{SOCIALS.email}</a>
            <a href={SOCIALS.github} target="_blank" rel="noreferrer" data-layer="contact.github" data-owner="10" data-kind="nav" className="btn-ghost" data-hoverable>GitHub</a>
            <a href={SOCIALS.linkedin} target="_blank" rel="noreferrer" data-layer="contact.linkedin" data-owner="10" data-kind="nav" className="btn-ghost" data-hoverable>LinkedIn</a>
          </div>
        </ContactCard3D>
        <div data-layer="contact.signature" data-owner="9" data-kind="image">
          <SignatureAnimation />
        </div>
      </div>
    </section>
  );
}
