// Scroll timeline for the exploded "anatomy" view.
// p runs 0 → 1 over the whole page. Section centres sit at 0, .25, .5, .75 and 1,
// and each pose holds for a while around its centre so the copy can be read.

export const SECTION_STOPS = [0, 0.25, 0.5, 0.75, 1];

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const span = (p, a, b) => easeInOut(clamp01((p - a) / (b - a)));
// 0 → 1 over [a, b], hold, then back to 0 over [c, d]
const outAndBack = (p, a, b, c, d) => span(p, a, b) * (1 - span(p, c, d));

// Whole clock: rotation about its vertical axis (degrees) and a dolly toward the camera (mm)
const CLOCK_KEYS = [
  { p: 0.00, rot: 0, dolly: 0 },      // hero
  { p: 0.08, rot: 0, dolly: 0 },
  { p: 0.20, rot: 18, dolly: 70 },    // mechanism: turn to the camera, come closer
  { p: 0.30, rot: 18, dolly: 70 },
  { p: 0.45, rot: -50, dolly: 0 },    // front pulled apart, seen from the side
  { p: 0.55, rot: -50, dolly: 0 },
  { p: 0.70, rot: -165, dolly: 0 },   // back comes apart
  { p: 0.80, rot: -165, dolly: 0 },
  { p: 0.95, rot: -360, dolly: 0 },   // one full turn back to the hero pose
  { p: 1.00, rot: -360, dolly: 0 }
];

function clockPose(p) {
  for (let i = 0; i < CLOCK_KEYS.length - 1; i++) {
    const a = CLOCK_KEYS[i], b = CLOCK_KEYS[i + 1];
    if (p <= b.p) {
      const t = easeInOut(clamp01((p - a.p) / (b.p - a.p)));
      return { rot: a.rot + (b.rot - a.rot) * t, dolly: a.dolly + (b.dolly - a.dolly) * t };
    }
  }
  const last = CLOCK_KEYS[CLOCK_KEYS.length - 1];
  return { rot: last.rot, dolly: last.dolly };
}

// Offsets are in millimetres along the clock's own axes (+z = front, -z = back).
export function pose(p) {
  const battery = outAndBack(p, 0.64, 0.74, 0.80, 0.88);
  return {
    clock: clockPose(p),
    cover: 70 * outAndBack(p, 0.32, 0.40, 0.84, 0.93),          // cover leaves first, returns last
    cards: 42 * outAndBack(p, 0.36, 0.46, 0.80, 0.88),          // cards lift out of their wells
    screws: [0, 1, 2, 3].map((i) => {
      const t = outAndBack(p, 0.58 + i * 0.015, 0.68 + i * 0.015, 0.80, 0.88);
      return { out: 15 * t, spin: 720 * t };                     // two turns as they back out
    }),
    setting: 10 * outAndBack(p, 0.62, 0.70, 0.80, 0.88),
    battery: { dz: 14 * battery, dy: 6 * battery },
    linerVisible: battery < 0.03                                // gap liner hides once the door lifts
  };
}
