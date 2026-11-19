# Theme Palette Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the color scheme switcher into a portable Vue module with shared config, composable logic, global theme CSS, and a short reuse guide.

**Architecture:** Keep the palette definitions, persistence logic, and UI in a dedicated `src/theme-palette/` folder. Initialize the saved palette before app mount so the active theme is applied without a flash, and let the picker component consume the same shared config and composable.

**Tech Stack:** Vue 3, TypeScript, Vite, Tailwind CSS

## Global Constraints

- Preserve existing palette names, swatches, and localStorage key behavior unless the module explicitly documents a change.
- Keep the default palette application at app startup so the current app does not flash the wrong colors on reload.
- Touch only the theme palette surface area plus the minimal wiring in app bootstrap.

---

### Task 1: Create the reusable theme-palette module

**Files:**
- Create: `src/theme-palette/palettes.ts`
- Create: `src/theme-palette/usePaletteTheme.ts`
- Create: `src/theme-palette/theme-palette.css`

**Interfaces:**
- Consumes: Vue `ref` from `usePaletteTheme`, palette config from `palettes.ts`
- Produces: `paletteOptions`, `PaletteId`, `PaletteOption`, `createPaletteTheme`

- [ ] **Step 1: Add palette config and shared types**

```ts
export type PaletteId =
  | 'blue'
  | 'sky'
  | 'red'
  | 'orange'
  | 'purple'
  | 'fuchsia'
  | 'yellow'
  | 'green'
  | 'brown'
  | 'zinc'

export interface PaletteOption {
  id: PaletteId
  label: string
  swatch: string
}

export const paletteOptions: PaletteOption[] = [
  { id: 'blue', label: 'Синяя', swatch: 'oklch(62.3% 0.214 259.815)' },
  { id: 'sky', label: 'Небо', swatch: 'oklch(58.8% 0.158 241.966)' },
  { id: 'red', label: 'Красная', swatch: 'oklch(63.7% 0.237 25.331)' },
  { id: 'orange', label: 'Оранжевый', swatch: 'oklch(70.5% 0.213 47.604)' },
  { id: 'purple', label: 'Пурпурный', swatch: 'oklch(62.7% 0.265 303.9)' },
  { id: 'fuchsia', label: 'Фуксия', swatch: 'oklch(66.7% 0.295 322.15)' },
  { id: 'yellow', label: 'Желтая', swatch: 'oklch(79.5% 0.184 86.047)' },
  { id: 'green', label: 'Зеленая', swatch: 'oklch(72.3% 0.219 149.579)' },
  { id: 'brown', label: 'Коричневая', swatch: '#8a5c39' },
  { id: 'zinc', label: 'Цинк', swatch: 'oklch(55.2% 0.016 285.938)' }
]
```

- [ ] **Step 2: Add a composable that can also be initialized before mount**

```ts
export interface PaletteThemeOptions {
  palettes?: PaletteOption[]
  storageKey?: string
  attributeName?: string
  defaultPalette?: PaletteId
}

export const createPaletteTheme = (options: PaletteThemeOptions = {}) => {
  // returns selectedPalette, paletteOptions, isPaletteId, getInitialPalette,
  // applyPalette, initPaletteTheme, setPalette
}
```

- [ ] **Step 3: Move palette CSS variables into the module stylesheet**

```css
:root,
html[data-palette='sky'] {
  --theme-background: var(--color-sky-400);
  --theme-foreground: var(--color-black);
  --theme-border: var(--color-sky-600);
  --theme-gradient-start: var(--color-sky-500);
  --theme-gradient-middle: var(--color-sky-300);
  --theme-gradient-end: var(--color-sky-500);
}

/* repeat the existing palette blocks for blue, red, yellow, purple,
   fuchsia, green, orange, zinc, brown */

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-panel-background: var(--theme-background);
  --color-panel-foreground: var(--theme-foreground);
  --color-border: var(--theme-border);
  --color-gradient-start: var(--theme-gradient-start);
  --color-gradient-middle: var(--theme-gradient-middle);
  --color-gradient-end: var(--theme-gradient-end);
}
```

- [ ] **Step 4: Verify the new module exports and CSS load without TypeScript or build errors**

Run: `npm run build`
Expected: build succeeds with the new module files in place.

### Task 2: Wire the app to the reusable module

**Files:**
- Modify: `src/components/ThemePalettePicker.vue`
- Modify: `src/App.vue`
- Modify: `src/main.ts`
- Modify: `src/styles/_theme.css`
- Modify: `src/styles/style.css`

**Interfaces:**
- Consumes: `createPaletteTheme`, `paletteOptions`, `initPaletteTheme`
- Produces: the app bootstraps theme state before mount and the picker uses only shared module state

- [ ] **Step 1: Move the picker to the shared palette module logic**

```vue
<script setup lang="ts">
import './theme-palette.css'
import { createPaletteTheme } from './usePaletteTheme'

const { paletteOptions, selectedPalette, setPalette } = createPaletteTheme()
</script>
```

- [ ] **Step 2: Initialize the saved palette before app mount**

```ts
import { createPaletteTheme } from './theme-palette/usePaletteTheme'

const paletteTheme = createPaletteTheme()
paletteTheme.initPaletteTheme()
```

- [ ] **Step 3: Remove the old palette bootstrapping from `App.vue`**

```ts
// delete the local palette storage key, palette list, and onMounted palette restore
```

- [ ] **Step 4: Remove duplicated palette CSS from the app stylesheet**

```css
/* delete the palette variable blocks from _theme.css after moving them into
   src/theme-palette/theme-palette.css */
```

- [ ] **Step 5: Confirm the app still renders and the palette switcher still works**

Run: `npm run build`
Expected: build succeeds and the app still has the palette picker on the page.

### Task 3: Add a short reuse guide

**Files:**
- Create: `src/theme-palette/README.md`

**Interfaces:**
- Consumes: the files in `src/theme-palette/`
- Produces: a copy/paste guide for adding the module to another Vue project

- [ ] **Step 1: Write a concise integration guide**

```md
# Theme Palette Module

1. Copy `src/theme-palette/` into the new project.
2. Import `theme-palette.css` once in the app entry or in the picker component.
3. Call `createPaletteTheme().initPaletteTheme()` before `createApp(...)` to restore the saved palette.
4. Render `<ThemePalettePicker />` where the user should change the palette.
5. Customize `paletteOptions`, `storageKey`, and `defaultPalette` inside `createPaletteTheme(...)` if needed.
```

- [ ] **Step 2: Verify the guide matches the actual module file names**

Run: `sed -n '1,200p' src/theme-palette/README.md`
Expected: the instructions reference the exact files and functions that exist.
