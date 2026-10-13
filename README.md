# Retro Flip Clock

An orange split-flap desk clock, modelled to the millimetre in [Spline](https://spline.design). It shows your local time in 24-hour format, flips every minute, and comes apart as you scroll.

**Live:** _coming soon_

## What it does

- **Real split-flap mechanism.** Each card has a flap on its hinge pins. On the minute, the top flap falls 180°, uncovers the next number and lands with a small bounce. On load, the cards flick quickly to the current time.
- **Mechanical sound.** A tick when a flap releases and a clack when it lands. The sound is synthesised in the browser with WebAudio (no audio files) and stays off until you turn it on.
- **Scroll-driven exploded view.** The clear cover slides off, the cards lift out of their wells, the screws spin out, and the battery door slides away to show the AA cell.

## How it works

| File | Role |
|---|---|
| `index.html`, `styles.css` | The page: a fixed full-screen canvas behind five scroll sections |
| `main.js` | Loads the scene with `@splinetool/runtime` and maps scroll progress to part positions |
| `timeline.js` | Scroll keyframes for the exploded view |
| `spline/overlay.html` | Copy of the script that lives in the Spline file's HTML layer: digit clipping, flap animation and sound |

The digits are cut in half at the hinge as you watch. A hidden text object renders each number, the script reads its triangles, clips them at the hinge line, and writes the halves into four flat meshes per card. The flap itself is a pivot rotated on the hinge axis.

The page only moves whole parts (cover, cards, screws, doors). The scene's own script only rotates the flap pivots and updates the digit meshes, so the two never write the same property.

## Run it locally

There's no build step. From this folder:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. To load the scene, set `SCENE_URL` in `main.js` to the URL you get from **Spline → Export → Code → `scene.splinecode`**.

To trigger a flip on demand, press **F**.

## Credits

Designed and built by [itskoyii](https://github.com/itskoyii) in Spline. Inspired by the classic Twemco QT-30 flip clock.
