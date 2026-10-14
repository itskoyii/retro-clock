# Retro Flip Clock

An orange split-flap desk clock, modelled to the millimetre in [Spline](https://spline.design). It shows your local time in 24-hour format, flips every minute, and comes apart as you scroll.

**Live:** _coming soon_

## What it does

- **Real split-flap mechanism.** Each card has a flap on its hinge pins. On the minute, the top flap falls 180°, uncovers the next number and lands with a small bounce. On load, the cards flick quickly to the current time.
- **Mechanical sound.** A tick when a flap releases and a clack when it lands. The sound is synthesised in the browser with WebAudio (no audio files) and stays off until you turn it on.
- **Scroll-driven exploded view.** The clock comes apart like the real thing: clear cover, front bezel, movement, housing and back plate. Round the back, the screws spin out, the battery cover lifts off and slides aside, and the two AA cells come out through the opening. On the way back the cells go in first and the cover goes on last.

## How it works

| File | Role |
|---|---|
| `index.html`, `styles.css` | The page: a fixed full-screen canvas behind five scroll sections |
| `main.js` | Loads the scene with `@splinetool/runtime` and maps scroll progress to part positions |
| `timeline.js` | Scroll keyframes for the exploded view |
| `spline/overlay.html` | Copy of the script that lives in the Spline file's HTML layer: digit clipping, flap animation and sound |

The digits are cut in half at the hinge as you watch. The outlines of 0–9 (Inter Bold) and the spacing of every number from 00 to 59 are stored in the scene variable `glyphData`. The script builds each number from them, clips it at the hinge line, and writes the halves into four flat meshes per card. The flap itself is a pivot rotated on the hinge axis.

The clock is modelled as separate parts, like the real thing: clear cover, front bezel, the movement (cards, flap drums, gears and quartz coil), the housing and the back plate. The page slides the shells away from the movement as you scroll. The scene's own script only rotates the flap pivots and updates the digit meshes, so the two never write the same property.

The page pins `@splinetool/runtime` 2.0.79. If you re-export from a newer Spline editor, bump that version too: an older runtime won't read a newer scene file.

## Run it locally

There's no build step. From this folder:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. To load the scene, set `SCENE_URL` in `main.js` to the URL you get from **Spline → Export → Code → `scene.splinecode`**.

To trigger a flip on demand, press **F**.

## Credits

Designed and built by [itskoyii](https://github.com/itskoyii) in Spline. Inspired by the classic Twemco QT-30 flip clock.
