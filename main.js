import { Application } from 'https://unpkg.com/@splinetool/runtime@2.0.82/build/runtime.js';
import { pose, SECTION_STOPS } from './timeline.js';

// Spline → Export → Code → copy the scene.splinecode URL and paste it here
// (and in the preload link in index.html, along with the runtime version above).
const SCENE_URL = 'https://prod.spline.design/V4MRvqDF3GSNgWzS/scene.splinecode';

const canvas = document.getElementById('scene');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const DEG = Math.PI / 180;
const ANCHOR = { x: 0, y: 0, z: 0 };                                      // clock centre on the table (world, mm)
const CAMERA_RIGHT = { x: Math.cos(24 * DEG), z: -Math.sin(24 * DEG) };   // screen-right for the Site Camera (azimuth 24°)
const panScale = () => (innerWidth > 640 ? 1 : 0);                        // phones stack the cards below, no pan
// Windows narrower than 16:9: shrink the clock in proportion, so it never runs off the side
const fitScale = () => { const aspect = innerWidth / innerHeight; return aspect < 1.8 ? Math.max(0.45, aspect / 1.8) : 1; };

const copy = (v) => ({ x: v.x, y: v.y, z: v.z });

// Spline's WebGPU renderer draws the "Built with Spline" badge differently from its classic WebGL
// renderer, in two ways that need fixing (the badge itself always stays on screen):
// 1. Size: it draws the badge at half the image's width in CSS pixels, where the WebGL renderer
//    uses a quarter, so it comes out twice as big. A half-size copy of the image restores the
//    usual size (137 × 36 px).
// 2. Resizing: it bakes the badge's size into its effect chain and doesn't rebuild the chain on
//    resize, so the badge stretches. The runtime resizes the canvas's drawing buffer whenever the
//    size or pixel ratio changes; handing it the texture again at that point rebuilds it.
// The WebGL renderer sizes the badge every frame and has no watermarkTexture, so nothing runs there.
function fixBadge(app) {
  const pipeline = app._renderer && app._renderer.pipeline;
  const original = pipeline && pipeline.watermarkTexture;
  if (!original) return;
  let badge = original;
  try {
    const img = original.image, half = document.createElement('canvas');
    half.width = Math.round(img.width / 2);
    half.height = Math.round(img.height / 2);
    const ctx = half.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, half.width, half.height);
    ctx.getImageData(0, 0, 1, 1);   // throws if the image couldn't be read; keep the original then
    badge = original.clone();
    badge.source = new original.source.constructor(half);
    badge.needsUpdate = true;
    pipeline.setWatermark(badge);
  } catch (e) {
    badge = original;
  }
  new MutationObserver(() => pipeline.setWatermark(badge))
    .observe(canvas, { attributes: true, attributeFilter: ['width', 'height'] });
}

async function start() {
  if (SCENE_URL.includes('REPLACE_WITH')) {
    loaderText.textContent = 'Add the Spline scene URL in main.js to load the clock.';
    return;
  }

  // inline: the scene's own HTML overlay (flip mechanism + sound toggle) runs as part of this page
  const app = new Application(canvas, { htmlContentMode: 'inline' });
  try {
    await app.load(SCENE_URL);
  } catch (err) {
    console.error(err);
    loaderText.textContent = 'The clock could not load. Try refreshing the page.';
    return;
  }
  fixBadge(app);

  const find = (name) => {
    const o = app.findObjectByName(name);
    if (!o) console.warn('Retro Flip Clock: missing object "' + name + '"');
    return o;
  };
  const parts = {
    clock: find('Retro Flip Clock'),
    cover: find('Clear Cover'),
    bezel: find('Front Bezel Group'),
    housing: find('Housing Group'),
    back: find('Back Plate Group'),
    screws: ['Screw TL', 'Screw TR', 'Screw BL', 'Screw BR'].map(find),
    setting: find('Setting Door Assembly'),
    knob: find('Time Set Knob'),
    batteryDoor: find('Battery Door Assembly'),
    batteries: ['AA Battery 1', 'AA Battery 2'].map(find),
    liner: find('Battery Gap Liner')
  };
  if (/[?&]debug\b/.test(location.search)) window.__retro = { app, parts };   // inspection hook for testing
  const all = [parts.clock, parts.cover, parts.bezel, parts.housing, parts.back, parts.setting, parts.knob,
    parts.batteryDoor, parts.liner, ...parts.batteries, ...parts.screws].filter(Boolean);
  loader.classList.add('is-done');
  if (!parts.clock) return;   // scene still shows and flips; only the scroll story is skipped

  // Authored transforms: every scroll pose is an offset from these.
  // A part missing from the scene is simply left where it is.
  const base = new Map();
  for (const o of all) base.set(o, { p: copy(o.position), r: copy(o.rotation) });

  const move = (o, d) => {
    if (!o) return;
    const b = base.get(o).p;
    o.position.x = b.x + (d.x || 0);
    o.position.y = b.y + (d.y || 0);
    o.position.z = b.z + (d.z || 0);
  };

  function apply(p) {
    const s = pose(p);

    // Turn and scale the whole clock about its centre on the table, so it pivots in place and its
    // feet stay on the surface (the group's origin sits slightly off that point)
    const c = base.get(parts.clock);
    const th = s.clock.rot * DEG, k = s.clock.size * fitScale();
    const lx = ANCHOR.x - c.p.x, ly = ANCHOR.y - c.p.y, lz = ANCHOR.z - c.p.z;   // anchor in the group's own frame
    const pan = s.clock.pan * panScale();
    parts.clock.position.x = ANCHOR.x - k * (lx * Math.cos(th) + lz * Math.sin(th)) + CAMERA_RIGHT.x * pan;
    parts.clock.position.y = ANCHOR.y - k * ly;
    parts.clock.position.z = ANCHOR.z - k * (-lx * Math.sin(th) + lz * Math.cos(th)) + CAMERA_RIGHT.z * pan;
    parts.clock.rotation.y = c.r.y + th;
    parts.clock.scale.x = parts.clock.scale.y = parts.clock.scale.z = k;

    // Shells slide away from the movement, which stays put
    move(parts.cover, { z: s.cover });
    move(parts.bezel, { z: s.bezel });
    move(parts.housing, { z: s.housing });
    move(parts.back, { z: s.back });

    // Back details move relative to the back plate
    parts.screws.forEach((o, i) => {
      if (!o) return;
      move(o, { z: -s.screws[i].out });
      o.rotation.z = base.get(o).r.z - s.screws[i].spin * DEG;   // counter-clockwise seen from the back: unscrewing
    });
    move(parts.setting, { z: -s.setting.dz, y: s.setting.dy });
    if (parts.knob) parts.knob.rotation.z = base.get(parts.knob).r.z + s.knob * DEG;
    // pull the battery cover off the back, then slide it clear of the opening
    move(parts.batteryDoor, { z: -s.batteryDoor.dz, x: s.batteryDoor.dx });
    parts.batteries.forEach((o, i) => move(o, { z: -s.batteries[i].dz, y: s.batteries[i].dy }));
    if (parts.liner) parts.liner.visible = s.linerVisible;
  }

  // Scroll → progress, smoothed so wheel steps glide; reduced motion snaps to section poses.
  // The loop only runs while the clock is catching up with the scroll position.
  const progress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  };
  const nearestStop = (p) => SECTION_STOPS.reduce((a, b) => (Math.abs(b - p) < Math.abs(a - p) ? b : a));
  let target = 0, current = 0, applied = -1, last = 0, running = false;

  function tick(now) {
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
    last = now;
    current = reduceMotion.matches ? target : current + (target - current) * (1 - Math.exp(-dt * 8));
    if (Math.abs(target - current) < 1e-4) current = target;
    if (current !== applied) { apply(current); applied = current; }
    if (current === target) { running = false; return; }
    requestAnimationFrame(tick);
  }
  const wake = () => {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  };
  const onScroll = () => { const p = progress(); target = reduceMotion.matches ? nearestStop(p) : p; wake(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { applied = -1; onScroll(); });   // re-fit size and pan to the new window
  onScroll();
  current = target;
}

start();
