import { useState } from "react";
import { CERTIFICATIONS } from "../data/content.js";
import { Award } from "lucide-react";
import CertificateLightbox from "./CertificateLightbox";
import CertificateFrame3D from "../3d/components/CertificateFrame3D.jsx";

export default function Certifications() {
  const [selectedCert, setSelectedCert] = useState(null);

  return (
    <section id="certifications" className="px-8 md:px-20 py-28 max-w-6xl mx-auto">
      <div data-section-title data-layer="certifications.title" data-owner="4" data-kind="type" className="mb-12">
        <span className="text-[#ff5a3c] text-sm tracking-[0.4em]">06 / Credentialed</span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Certifications</h2>
      </div>
      <div data-section-body className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CERTIFICATIONS.map((c, i) => (
          <CertificateFrame3D
            key={c.title}
            cert={c}
            index={i}
            layer={`certifications.card.${i}`}
            onClick={() => setSelectedCert(c)}
          >
            <div
              data-layer={`certifications.card.${i}`}
              data-owner="12"
              data-kind="card"
              className="flex flex-col border border-white/10 bg-[#10131b] overflow-hidden hover:border-[#ff5a3c]/40 transition-colors cursor-pointer group"
            >
              {c.image && (
                <div className="relative overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.title}
                    data-layer={`certifications.card.${i}.img`}
                    data-owner="8"
                    data-kind="image"
                    loading="lazy"
                    className="w-full h-44 object-contain bg-[#0b0d13] border-b border-white/10 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[#ff5a3c]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-black/80 px-3 py-1 rounded text-xs text-white">View Certificate</span>
                  </div>
                </div>
              )}
              <div data-layer={`certifications.card.${i}.meta`} data-owner="6" data-kind="type" className="flex items-start gap-4 p-6">
                <Award className="text-[#ff5a3c] mt-1 shrink-0" size={22} />
                <div>
                  <h3 className="font-bold">{c.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{c.issuer} · {c.year}</p>
                </div>
              </div>
            </div>
          </CertificateFrame3D>
        ))}
      </div>
      {selectedCert && (
        <CertificateLightbox cert={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </section>
  );
}
