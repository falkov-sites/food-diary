export interface Entry {
  id: string
  userId: string
  proteins: number
  fats: number
  carbs: number
  calories: number
  createdAtMs: number
}

export interface Totals {
  proteins: number
  fats: number
  carbs: number
  calories: number
}
