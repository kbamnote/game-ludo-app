# tools/make-icons.mjs

Regenerates every app icon from vector source, so the set stays consistent
instead of drifting as separate hand-edited PNGs.

```bash
npm i -D sharp      # not a project dependency; install only when regenerating
node tools/make-icons.mjs
cp out/*.png ../assets/
```

Outputs, and why each is shaped the way it is:

| File | Notes |
|---|---|
| `icon.png` | Full-bleed 1024. iOS applies its own rounded-square mask. Includes the die. |
| `android-icon-background.png` | Flat gradient layer for the adaptive icon. |
| `android-icon-foreground.png` | Board only, at 0.46 scale. A circular launcher mask keeps roughly the inner 33% radius, and at larger scales the die's corner fell outside it and was clipped. |
| `android-icon-monochrome.png` | Themed icons are tinted one colour and only the alpha survives, so this reads from shape alone — any light-against-dark design disappears. |
| `splash-icon.png` | Mark on transparent; the native splash supplies the background. |
| `favicon.png` | 196px, no die, so it stays legible when scaled to 16px. |
