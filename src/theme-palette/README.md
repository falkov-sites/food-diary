# Theme Palette Module

This folder contains a portable palette switcher for Vue apps.

## What it includes

- `palettes.ts` - shared palette IDs, labels, and swatches
- `usePaletteTheme.ts` - localStorage and `data-palette` handling
- `theme-palette.css` - CSS variables for each palette
- `ThemePalettePicker.vue` - ready-to-use palette picker UI

## How to use it in another Vue project

1. Copy the whole `src/theme-palette/` folder into the new project.
2. Import `ThemePalettePicker.vue` where you want the palette controls to appear.
3. Call `createPaletteTheme().initPaletteTheme()` before `createApp(...)` to restore the saved palette on startup.
4. Import `theme-palette.css` once in your global stylesheet or app entry so Tailwind can see the palette-driven utilities.
5. Edit `palettes.ts` if you want different palette IDs, labels, or swatches.
6. Use `createPaletteTheme({ storageKey, attributeName, defaultPalette, palettes })` if you need custom settings.

## Notes

- The default storage key is `color-palette`.
- The theme is applied by setting `data-palette` on `<html>`.
- The first palette is `blue` by default if nothing is saved yet.
- The module exposes both token families:
  - `bg-background` / `text-foreground`
  - `bg-panel-background` / `text-panel-foreground`
