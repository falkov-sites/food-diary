export type PaletteId = string

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
