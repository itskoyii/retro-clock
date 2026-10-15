// Scroll timeline for the exploded "anatomy" view.
// p runs 0 → 1 over the whole page. Section centres sit at 0, .25, .5, .75 and 1,
// and each pose holds for a while around its centre so the copy can be read.

export const SECTION_STOPS = [0, 0.25, 0.5, 0.75, 1];

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const span = (p, a, b) => easeInOut(clamp01((p - a) / (b - a)));
// 0 → 1 over [a, b], hold, then back to 0 over [c, d]
const outAndBack = (p, a, b, c, d) => span(p, a, b) * (1 - span(p, c, d));

// Whole clock: rotation about its vertical axis (degrees), its size on screen (the export's camera is
// orthographic, so size comes from scaling the model) and a sideways pan (mm, + = right on screen)
// that keeps it clear of each section's card.
const CLOCK_KEYS = [
  { p: 0.00, rot: 0, size: 0.8, pan: 60 },       // hero (card on the left)
  { p: 0.08, rot: 0, size: 0.8, pan: 60 },
  { p: 0.20, rot: 18, size: 1.0, pan: 70 },      // mechanism: turn to the camera, come closer
  { p: 0.30, rot: 18, size: 1.0, pan: 70 },
  { p: 0.45, rot: -30, size: 0.55, pan: -65 },   // full exploded view, small enough for every layer (card on the right)
  { p: 0.55, rot: -30, size: 0.55, pan: -65 },
  { p: 0.70, rot: -150, size: 0.8, pan: 30 },    // round to the back: screws, battery cover, batteries
  { p: 0.80, rot: -150, size: 0.8, pan: 30 },
  { p: 0.95, rot: -360, size: 0.8, pan: -40 },   // one full turn back to the hero pose (card on the right)
  { p: 1.00, rot: -360, size: 0.8, pan: -40 }
];

function clockPose(p) {
  const lerp = (a, b, t) => ({
    rot: a.rot + (b.rot - a.rot) * t,
    size: a.size + (b.size - a.size) * t,
    pan: a.pan + (b.pan - a.pan) * t
  });
  for (let i = 0; i < CLOCK_KEYS.length - 1; i++) {
    const a = CLOCK_KEYS[i], b = CLOCK_KEYS[i + 1];
    if (p <= b.p) return lerp(a, b, easeInOut(clamp01((p - a.p) / (b.p - a.p))));
  }
  const last = CLOCK_KEYS[CLOCK_KEYS.length - 1];
  return lerp(last, last, 0);
}

// Offsets are in millimetres along the clock's own axes (+z = front, -z = back).
// The movement stays put; the shells slide away from it along z.
// Back sequence: the battery cover pulls out and slides aside, then both AA cells come out
// through the opening. The setting door lifts off the same way and the time-setting knob turns.
// Everything settles by the section centre (0.75), so nothing is still moving while the back is on show.
// On the way back the cells go in first and the covers go on last.
export function pose(p) {
  const doorPull = outAndBack(p, 0.60, 0.64, 0.865, 0.89);     // off the clock, then back on at the very end
  const doorSlide = outAndBack(p, 0.64, 0.68, 0.84, 0.865);    // clear of the opening, then back over it
  const cell1 = outAndBack(p, 0.685, 0.735, 0.81, 0.84);
  const cell2 = outAndBack(p, 0.695, 0.745, 0.80, 0.83);
  const settingPull = outAndBack(p, 0.62, 0.66, 0.855, 0.89);
  const settingSlide = outAndBack(p, 0.66, 0.70, 0.83, 0.855);
  return {
    clock: clockPose(p),
    cover: 110 * outAndBack(p, 0.32, 0.42, 0.87, 0.96),
    bezel: 55 * outAndBack(p, 0.34, 0.44, 0.86, 0.94),
    housing: -60 * outAndBack(p, 0.34, 0.44, 0.86, 0.94),
    back: -120 * outAndBack(p, 0.32, 0.42, 0.87, 0.96),
    screws: [0, 1, 2, 3].map((i) => {
      const t = outAndBack(p, 0.58 + i * 0.015, 0.68 + i * 0.015, 0.83, 0.89);
      return { out: 25 * t, spin: 720 * t };                    // two turns as they back out
    }),
    setting: { dz: 14 * settingPull, dy: 45 * settingSlide },   // out past the screws, then up clear of the knob
    knob: 90 * outAndBack(p, 0.70, 0.745, 0.80, 0.83),           // a quarter turn while it's uncovered
    batteryDoor: { dz: 30 * doorPull, dx: -120 * doorSlide },   // out past the screws, then to screen-right
    batteries: [
      { dz: 45 * cell1, dy: 6 * cell1 },                         // the two AA cells come out through the opening,
      { dz: 45 * cell2, dy: -6 * cell2 }                         // spreading apart slightly
    ],
    linerVisible: doorPull < 0.03                                // gap liner hides once the cover lifts
  };
}
