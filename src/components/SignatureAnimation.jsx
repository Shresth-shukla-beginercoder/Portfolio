import { useEffect } from "react";
import { initSignature } from "../fx/signature.js";
import { SIGNATURE_VIEWBOX, SIGNATURE_STROKES } from "../data/signatureStrokes.js";

/*
 * Signature sign-off. Renders the reconstructed strokes; the vanilla GSAP
 * engine (fx/signature.js) drives the progressive stroke draw + pen tip.
 */
export default function SignatureAnimation() {
  useEffect(() => {
    initSignature();
  }, []);

  return (
    <div id="sign-off" className="signature-block">
      <svg viewBox={SIGNATURE_VIEWBOX} className="signature-svg" fill="none">
        {SIGNATURE_STROKES.map((s, i) => (
          <path
            key={i}
            className="sig-stroke"
            data-seg={i + 1}
            d={s.d}
            stroke="#ff5a3c"
            strokeWidth={s.w}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        <circle
          className="sig-pen"
          cx="0"
          cy="0"
          r="8"
          fill="#fff"
          style={{ filter: "drop-shadow(0 0 12px #ff5a3c) drop-shadow(0 0 24px #ff5a3c)" }}
        />
      </svg>
      <p className="sign-off-caption">— signed off by the foreman</p>
    </div>
  );
}
