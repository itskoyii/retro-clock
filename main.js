import { Application } from 'https://unpkg.com/@splinetool/runtime@2.0.60/build/runtime.js';
import { pose, SECTION_STOPS } from './timeline.js';

// Spline → Export → Code → copy the scene.splinecode URL and paste it here.
const SCENE_URL = 'https://prod.spline.design/V4MRvqDF3GSNgWzS/scene.splinecode';

const canvas = document.getElementById('scene');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const DEG = Math.PI / 180;
const CENTER = { x: 0, y: 73, z: 0 };                                      // clock body centre (world, mm)
const TOWARD_CAMERA = { x: Math.sin(24 * DEG), z: Math.cos(24 * DEG) };   // Site Camera sits at azimuth 24°

const copy = (v) => ({ x: v.x, y: v.y, z: v.z });

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

  const find = (name) => {
    const o = app.findObjectByName(name);
    if (!o) console.warn('Retro Flip Clock: missing object "' + name + '"');
    return o;
  };
  const parts = {
    clock: find('Retro Flip Clock'),
    cover: find('Clear Cover'),
    hour: find('Hour Card'),
    minute: find('Minute Card'),
    screws: ['Screw TL', 'Screw TR', 'Screw BL', 'Screw BR'].map(find),
    setting: find('Setting Door Assembly'),
    battery: find('Battery Door Assembly'),
    liner: find('Battery Gap Liner')
  };
  const all = [parts.clock, parts.cover, parts.hour, parts.minute, parts.setting, parts.battery, parts.liner, ...parts.screws];
  loader.classList.add('is-done');
  if (all.some((o) => !o)) return;   // scene still shows and flips; only the scroll story is skipped

  // Authored transforms: every scroll pose is an offset from these
  const base = new Map();
  for (const o of all) base.set(o, { p: copy(o.position), r: copy(o.rotation) });

  const offsetZ = (o, dz) => { o.position.z = base.get(o).p.z + dz; };

  function apply(p) {
    const s = pose(p);

    // Rotate the whole clock about its body centre (the group origin sits slightly off it)
    const c = base.get(parts.clock);
    const th = s.clock.rot * DEG;
    const vx = c.p.x - CENTER.x, vz = c.p.z - CENTER.z;
    parts.clock.position.x = CENTER.x + vx * Math.cos(th) + vz * Math.sin(th) + TOWARD_CAMERA.x * s.clock.dolly;
    parts.clock.position.z = CENTER.z - vx * Math.sin(th) + vz * Math.cos(th) + TOWARD_CAMERA.z * s.clock.dolly;
    parts.clock.rotation.y = c.r.y + th;

    offsetZ(parts.cover, s.cover);
    offsetZ(parts.hour, s.cards);
    offsetZ(parts.minute, s.cards);
    parts.screws.forEach((o, i) => {
      const b = base.get(o);
      o.position.z = b.p.z - s.screws[i].out;
      o.rotation.z = b.r.z - s.screws[i].spin * DEG;   // counter-clockwise seen from the back: unscrewing
    });
    offsetZ(parts.setting, -s.setting);
    const bd = base.get(parts.battery);
    parts.battery.position.z = bd.p.z - s.battery.dz;
    parts.battery.position.y = bd.p.y - s.battery.dy;
    parts.liner.visible = s.linerVisible;
  }

  // Narrow portrait screens: zoom out so the whole clock fits the width
  const fit = () => {
    const aspect = innerWidth / innerHeight;
    if (aspect < 1.2) app.setZoom(Math.max(0.45, aspect / 1.35));
  };
  fit();
  addEventListener('resize', fit);

  // Scroll → progress, smoothed so wheel steps glide; reduced motion snaps to section poses
  const progress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  };
  const nearestStop = (p) => SECTION_STOPS.reduce((a, b) => (Math.abs(b - p) < Math.abs(a - p) ? b : a));
  let target = 0, current = 0, applied = -1, last = performance.now();
  const onScroll = () => { const p = progress(); target = reduceMotion.matches ? nearestStop(p) : p; };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  current = target;

  (function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    current = reduceMotion.matches ? target : current + (target - current) * (1 - Math.exp(-dt * 8));
    if (Math.abs(target - current) < 1e-4) current = target;
    if (current !== applied) { apply(current); applied = current; }
    requestAnimationFrame(tick);
  })(last);
}

start();
