# Retro Flip Clock

An orange split-flap desk clock, modelled to the millimetre in [Spline](https://spline.design). It shows your local time in 24-hour format, flips every minute, and comes apart as you scroll.

**Live:** _coming soon_

## What it does

- **Real split-flap mechanism.** Each card has a flap on its drum. A snail cam on the drum winds up over the minute (the hour cam over the hour). At the step its follower lever snaps down, the holdback tine swings clear, and the top flap falls 180°, uncovers the next number and lands with a small bounce. The tine then springs back to hold the next flap. On load, the cards flick quickly to the current time.
- **Mechanical sound.** Three parts, timed to the motion: a faint *slip* as the tine lets go, a soft, hollow *flump* as the tile drops onto the card below, and a quieter *settle* as it comes to rest. Each flump varies slightly in pitch and level. The sound is synthesised in the browser with WebAudio (no audio files) and stays off until you turn it on.
- **Scroll-driven exploded view.** The clock comes apart like the real thing: clear cover, front bezel, movement, housing and back plate. Round the back, the screws spin out, the battery cover lifts off and slides aside, and the two AA cells come out through the opening. The setting door lifts off too, and the time-setting knob turns. On the way back the cells go in first and the covers go on last.

## Anatomy

| Part | In the model |
|---|---|
| Outer casing | Glossy orange front bezel, housing and back plate (2.5 mm walls) |
| Display window | Clear acrylic cover tray |
| Time-setting knob | Knurled knob behind the setting door on the back |
| Motor unit | Quartz motor block and copper coil |
| Reduction gear train | Seven nylon gears on brass pinions and arbors |
| Drum and spindle | A flap drum per card on a black spindle, with hubs and a drum gear |
| Flip tiles | Split cards showing the live digits |
| Holdback tines | Orange tines over the top of each card that let one flap go at a time |
| Cams and springs | A snail cam, snap spring and follower lever on each drum |

There are no alarm or radio controls: the clock it's based on has neither.

## How it works

| File | Role |
|---|---|
| `index.html`, `styles.css` | The page: a fixed full-screen canvas behind five scroll sections |
| `main.js` | Loads the scene with `@splinetool/runtime` and maps scroll progress to part positions |
| `timeline.js` | Scroll keyframes for the exploded view |
| `spline/overlay.html` | Copy of the script that lives in the Spline file's HTML layer: digit clipping, flap, tine and cam motion, and sound |

The digits are cut in half at the hinge as you watch. The outlines of 0–9 (Inter Bold) and the spacing of every number from 00 to 59 are stored in the scene variable `glyphData`. The script builds each number from them, clips it at the hinge line, and writes the halves into four flat meshes per card. The flap itself is a pivot rotated on the hinge axis.

The clock is modelled as separate parts, like the real thing: clear cover, front bezel, the movement (cards, drums, cams, gears and quartz coil), the housing and the back plate. The page slides the shells away from the movement as you scroll. The scene's own script only rotates the flap pivots, tines, cams and follower levers and updates the digit meshes, so the two never write the same property.

The page pins `@splinetool/runtime` 2.0.82. If you re-export from a newer Spline editor, bump that version too: an older runtime won't read a newer scene file.

## Run it locally

There's no build step. From this folder:

```sh
npx serve -l 8000
```

Then open <http://localhost:8000>. To load the scene, set `SCENE_URL` in `main.js` to the URL you get from **Spline → Export → Code → `scene.splinecode`**.

To trigger a flip on demand, press **F**.

## Credits

Designed and built by [itskoyii](https://github.com/itskoyii) in Spline.
