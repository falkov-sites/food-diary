import { ref, type Ref } from 'vue'
import {
  paletteOptions as defaultPaletteOptions,
  type PaletteId,
  type PaletteOption
} from './palettes'

export interface PaletteThemeOptions {
  palettes?: PaletteOption[]
  storageKey?: string
  attributeName?: string
  defaultPalette?: PaletteId
}

export interface PaletteThemeController {
  paletteOptions: PaletteOption[]
  selectedPalette: Ref<PaletteId>
  isPaletteId: (value: string) => value is PaletteId
  getInitialPalette: () => PaletteId
  applyPalette: (palette: PaletteId) => void
  initPaletteTheme: () => void
  setPalette: (palette: PaletteId) => void
}

const defaultOptions: Required<Pick<PaletteThemeOptions, 'storageKey' | 'attributeName'>> &
  Pick<PaletteThemeOptions, 'defaultPalette'> = {
  storageKey: 'color-palette',
  attributeName: 'data-palette',
  defaultPalette: 'blue'
}

export const createPaletteTheme = (options: PaletteThemeOptions = {}): PaletteThemeController => {
  const palettes = options.palettes ?? defaultPaletteOptions
  const storageKey = options.storageKey ?? defaultOptions.storageKey
  const attributeName = options.attributeName ?? defaultOptions.attributeName
  const defaultPalette =
    options.defaultPalette ?? defaultOptions.defaultPalette ?? palettes[0]?.id ?? 'blue'

  const isPaletteId = (value: string): value is PaletteId =>
    palettes.some(palette => palette.id === value)

  const readStoredPalette = (): PaletteId | null => {
    if (typeof window === 'undefined') {
      return null
    }

    const storedPalette = window.localStorage.getItem(storageKey)
    return storedPalette && isPaletteId(storedPalette) ? storedPalette : null
  }

  const getInitialPalette = () => readStoredPalette() ?? defaultPalette

  const applyPalette = (palette: PaletteId) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(attributeName, palette)
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, palette)
    }
  }

  const selectedPalette = ref<PaletteId>(getInitialPalette())

  const initPaletteTheme = () => {
    const initialPalette = getInitialPalette()
    selectedPalette.value = initialPalette
    applyPalette(initialPalette)
  }

  const setPalette = (palette: PaletteId) => {
    if (selectedPalette.value === palette) {
      return
    }

    selectedPalette.value = palette
    applyPalette(palette)
  }

  return {
    paletteOptions: palettes,
    selectedPalette,
    isPaletteId,
    getInitialPalette,
    applyPalette,
    initPaletteTheme,
    setPalette
  }
}
