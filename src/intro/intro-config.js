// All opening-sequence timings in one place (spec: "keep durations configurable").
// Total opening = S + 2*waveGap + wave + sync + hold + dispatch + 0.2 ≈ 7.2 s.
export const TIMINGS = {
  S: 1.0,        // S monogram appearance
  waveGap: 0.5,  // gap between the three five-agent entrance waves
  wave: 1.0,     // one wave's curved flight into orbit
  sync: 1.0,     // circular synchronization (agents slow into formation)
  hold: 2.0,     // formation hold
  dispatch: 1.0, // formation break — arrows fly to their first hero targets
  fade: 0.4,     // S + rings fade at the handover into construction
};

export const ORBIT = {
  turnsOnSync: 0.06, // ring rotation while agents lock into formation
  turnsOnHold: 0.12,  // continuous slow orbit through the hold — the loading
                      // screen shows arrows circling the S, never a frozen ring
};
