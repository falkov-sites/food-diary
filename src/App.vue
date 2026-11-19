<script setup lang="ts">
import ThemeToggle from './components/ThemeToggle.vue'
import ThemePalettePicker from './theme-palette/ThemePalettePicker.vue'
// import Snowflakes from './components/Snowflakes.vue'

import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { User } from 'firebase/auth'
import {
  loginWithEmail,
  logoutCurrentUser,
  observeAuthState,
  registerWithEmail
} from './services/authService'
import { createEntry, observeUserEntries, removeEntryById } from './services/entriesService'
import type { Entry, Totals } from './types'

const authMode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const authError = ref('')
const authBusy = ref(false)
const authLoading = ref(true)
const user = ref<User | null>(null)
const nowMs = ref(Date.now())
let nowIntervalId: number | null = null

const entryMode = ref<'direct' | 'per100'>('direct')
const directProteins = ref('')
const directFats = ref('')
const directCarbs = ref('')
const directCalories = ref('')
const per100Proteins = ref('')
const per100Fats = ref('')
const per100Carbs = ref('')
const per100Calories = ref('')
const per100Grams = ref('')
const saveBusy = ref(false)
const formError = ref('')
const entriesError = ref('')

const entries = ref<Entry[]>([])
let entriesUnsubscribe: (() => void) | null = null
const isDev = import.meta.env.DEV
const showDevCacheBanner = ref(import.meta.env.DEV)
const showUpdateBanner = ref(false)
const SWIPE_DELETE_WIDTH = 92
const SWIPE_OPEN_THRESHOLD = 38
const rowOffsetById = reactive<Record<string, number>>({})
const ignoreDeleteClickUntil = reactive<Record<string, number>>({})
const activeSwipe = ref<{
  id: string
  startX: number
  startY: number
  startOffset: number
  isHorizontal: boolean
} | null>(null)

const toNumber = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

const recalculateDirectCalories = () => {
  const p = toNumber(directProteins.value)
  const f = toNumber(directFats.value)
  const c = toNumber(directCarbs.value)
  const calculated = 4 * p + 9 * f + 4 * c
  directCalories.value = String(Math.round(calculated))
}

const recalculatePer100Calories = () => {
  const p = toNumber(per100Proteins.value)
  const f = toNumber(per100Fats.value)
  const c = toNumber(per100Carbs.value)
  const calculated = 4 * p + 9 * f + 4 * c
  per100Calories.value = String(Math.round(calculated))
}

const getPer100Totals = () => {
  const grams = toNumber(per100Grams.value)
  const factor = grams / 100

  return {
    proteins: Math.round(toNumber(per100Proteins.value) * factor),
    fats: Math.round(toNumber(per100Fats.value) * factor),
    carbs: Math.round(toNumber(per100Carbs.value) * factor),
    calories: Math.round(toNumber(per100Calories.value) * factor)
  }
}

const clearEntryForm = () => {
  if (entryMode.value === 'direct') {
    directProteins.value = ''
    directFats.value = ''
    directCarbs.value = ''
    directCalories.value = ''
    return
  }

  per100Proteins.value = ''
  per100Fats.value = ''
  per100Carbs.value = ''
  per100Calories.value = ''
  per100Grams.value = ''
}

const stopEntriesSubscription = () => {
  if (entriesUnsubscribe) {
    entriesUnsubscribe()
    entriesUnsubscribe = null
  }
}

const subscribeToEntries = (uid: string) => {
  stopEntriesSubscription()

  entriesUnsubscribe = observeUserEntries(
    uid,
    userEntries => {
      entries.value = userEntries
      entriesError.value = ''
    },
    error => {
      entriesError.value = error.message
      entries.value = []
    }
  )
}

observeAuthState(currentUser => {
  user.value = currentUser
  authLoading.value = false
  authError.value = ''

  if (currentUser) {
    subscribeToEntries(currentUser.uid)
  } else {
    stopEntriesSubscription()
    entries.value = []
    entriesError.value = ''
  }
})

onBeforeUnmount(() => {
  stopEntriesSubscription()

  if (nowIntervalId !== null) {
    window.clearInterval(nowIntervalId)
    nowIntervalId = null
  }

  window.removeEventListener('focus', refreshNow)
  window.removeEventListener('pageshow', refreshNow)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('sw-update-available', onSwUpdateAvailable)
})

onMounted(() => {
  refreshNow()
  nowIntervalId = window.setInterval(refreshNow, 60_000)
  window.addEventListener('focus', refreshNow)
  window.addEventListener('pageshow', refreshNow)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('sw-update-available', onSwUpdateAvailable)
})

function refreshNow() {
  nowMs.value = Date.now()
}

function onVisibilityChange() {
  if (!document.hidden) {
    refreshNow()
  }
}

function onSwUpdateAvailable() {
  showUpdateBanner.value = true
}

const applyAppUpdate = async () => {
  if (!('serviceWorker' in navigator)) {
    window.location.reload()
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  const registration = registrations.find(item => item.waiting)

  if (!registration?.waiting) {
    window.location.reload()
    return
  }

  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
}

const clearDevCacheAndReload = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(registration => registration.unregister()))
    }

    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
    }
  } finally {
    window.location.reload()
  }
}

const authSubmit = async () => {
  authBusy.value = true
  authError.value = ''

  try {
    if (authMode.value === 'login') {
      await loginWithEmail(email.value.trim(), password.value)
    } else {
      await registerWithEmail(email.value.trim(), password.value)
    }

    email.value = ''
    password.value = ''
  } catch (error) {
    authError.value =
      error instanceof Error
        ? 'Ошибка авторизации: ' + error.message
        : 'Не удалось выполнить авторизацию.'
  } finally {
    authBusy.value = false
  }
}

const logout = async () => {
  await logoutCurrentUser()
}

const addEntry = async () => {
  if (!user.value) {
    return
  }

  const entryValues =
    entryMode.value === 'direct'
      ? {
          proteins: toNumber(directProteins.value),
          fats: toNumber(directFats.value),
          carbs: toNumber(directCarbs.value),
          calories: toNumber(directCalories.value)
        }
      : getPer100Totals()

  if (
    entryValues.proteins === 0 &&
    entryValues.fats === 0 &&
    entryValues.carbs === 0 &&
    entryValues.calories === 0
  ) {
    formError.value = 'Заполните хотя бы одно значение'
    return
  }

  if (entryMode.value === 'per100' && toNumber(per100Grams.value) === 0) {
    formError.value = 'Укажите количество грамм'
    return
  }

  formError.value = ''
  saveBusy.value = true

  try {
    await createEntry(user.value.uid, {
      proteins: entryValues.proteins,
      fats: entryValues.fats,
      carbs: entryValues.carbs,
      calories: entryValues.calories
    })

    clearEntryForm()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Ошибка сохранения.'
  } finally {
    saveBusy.value = false
  }
}

const removeEntry = async (entry: Entry) => {
  const confirmed = window.confirm(
    `Удалить запись?\n${formatDateTime(entry.createdAtMs)}  Б:${entry.proteins}  Ж:${entry.fats}  У:${entry.carbs}  Ккал:${entry.calories}`
  )

  if (!confirmed) {
    rowOffsetById[entry.id] = 0
    return
  }

  try {
    await removeEntryById(entry.id)
  } finally {
    rowOffsetById[entry.id] = 0
  }
}

const getRowOffset = (entryId: string) => rowOffsetById[entryId] ?? 0

const setRowOffset = (entryId: string, value: number) => {
  rowOffsetById[entryId] = Math.max(-SWIPE_DELETE_WIDTH, Math.min(0, value))
}

const closeAllSwipes = (exceptId?: string) => {
  Object.keys(rowOffsetById).forEach(id => {
    if (!exceptId || id !== exceptId) {
      rowOffsetById[id] = 0
    }
  })
}

const isRowDragging = (entryId: string) => activeSwipe.value?.id === entryId

const toggleRowDelete = (entryId: string) => {
  const isOpen = getRowOffset(entryId) <= -SWIPE_DELETE_WIDTH + 2

  if (isOpen) {
    setRowOffset(entryId, 0)
    return
  }

  closeAllSwipes(entryId)
  setRowOffset(entryId, -SWIPE_DELETE_WIDTH)
}

const isMobileLikeInput = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

const onDeleteIconClick = (entry: Entry) => {
  if (isMobileLikeInput()) {
    toggleRowDelete(entry.id)
    return
  }

  void removeEntry(entry)
}

const onDeleteButtonPointerUp = (entry: Entry, event: PointerEvent) => {
  const isTouchOrPen = event.pointerType === 'touch' || event.pointerType === 'pen'
  if (!isTouchOrPen) {
    return
  }

  ignoreDeleteClickUntil[entry.id] = Date.now() + 700
  void removeEntry(entry)
}

const onDeleteButtonClick = (entry: Entry) => {
  const ignoreUntil = ignoreDeleteClickUntil[entry.id] ?? 0
  if (ignoreUntil > Date.now()) {
    return
  }

  void removeEntry(entry)
}

const onRowPointerDown = (entryId: string, event: PointerEvent) => {
  const isTouchOrPen = event.pointerType === 'touch' || event.pointerType === 'pen'
  if (!isTouchOrPen) {
    return
  }

  if (event.button !== 0) {
    return
  }

  const target = event.target as HTMLElement | null
  if (target?.closest('button, a, input, textarea, select')) {
    return
  }

  closeAllSwipes(entryId)

  activeSwipe.value = {
    id: entryId,
    startX: event.clientX,
    startY: event.clientY,
    startOffset: getRowOffset(entryId),
    isHorizontal: false
  }
}

const onRowPointerMove = (entryId: string, event: PointerEvent) => {
  const swipe = activeSwipe.value
  if (!swipe || swipe.id !== entryId) {
    return
  }

  const deltaX = event.clientX - swipe.startX
  const deltaY = event.clientY - swipe.startY

  if (!swipe.isHorizontal) {
    if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) {
      return
    }

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      activeSwipe.value = null
      return
    }

    swipe.isHorizontal = true
  }

  event.preventDefault()

  const nextOffset = swipe.startOffset + deltaX
  const withResistance = nextOffset > 0 ? nextOffset / 3 : nextOffset
  setRowOffset(entryId, withResistance)
}

const finishSwipe = (entryId: string) => {
  const offset = getRowOffset(entryId)

  if (offset <= -SWIPE_OPEN_THRESHOLD) {
    setRowOffset(entryId, -SWIPE_DELETE_WIDTH)
  } else {
    setRowOffset(entryId, 0)
  }

  activeSwipe.value = null
}

const onRowPointerUp = (entryId: string) => {
  if (activeSwipe.value?.id !== entryId) {
    return
  }
  finishSwipe(entryId)
}

const onRowPointerCancel = (entryId: string) => {
  if (activeSwipe.value?.id !== entryId) {
    return
  }
  setRowOffset(entryId, 0)
  activeSwipe.value = null
}

const onRowContentClick = (entryId: string) => {
  if (getRowOffset(entryId) < 0) {
    setRowOffset(entryId, 0)
  }
}

const isRowActive = (entryId: string) => getRowOffset(entryId) < 0 || isRowDragging(entryId)

const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
    // day: '2-digit',
    // month: '2-digit'
  }).format(value)

const isInRange = (ts: number, start: number, end: number) => ts >= start && ts < end

const getRange = (timestamp: number) => {
  const now = new Date(timestamp)

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()

  const mondayOffset = (now.getDay() + 6) % 7
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset
  ).getTime()
  const endOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset + 7
  ).getTime()

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()

  return {
    startOfToday,
    startOfTomorrow,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    startOfNextMonth
  }
}

const sumEntries = (list: Entry[]): Totals =>
  list.reduce(
    (acc, entry) => ({
      proteins: acc.proteins + entry.proteins,
      fats: acc.fats + entry.fats,
      carbs: acc.carbs + entry.carbs,
      calories: acc.calories + entry.calories
    }),
    {
      proteins: 0,
      fats: 0,
      carbs: 0,
      calories: 0
    }
  )

const todayEntries = computed(() => {
  const { startOfToday, startOfTomorrow } = getRange(nowMs.value)
  return entries.value.filter(entry => isInRange(entry.createdAtMs, startOfToday, startOfTomorrow))
})

const totalsToday = computed(() => sumEntries(todayEntries.value))

const totalsWeek = computed(() => {
  const { startOfWeek, endOfWeek } = getRange(nowMs.value)
  return sumEntries(
    entries.value.filter(entry => isInRange(entry.createdAtMs, startOfWeek, endOfWeek))
  )
})

const totalsMonth = computed(() => {
  const { startOfMonth, startOfNextMonth } = getRange(nowMs.value)
  return sumEntries(
    entries.value.filter(entry => isInRange(entry.createdAtMs, startOfMonth, startOfNextMonth))
  )
})

const per100CalculatedTotals = computed(() => getPer100Totals())

const setEntryMode = (mode: 'direct' | 'per100') => {
  if (entryMode.value !== mode) {
    entryMode.value = mode
    formError.value = ''
  }
}

watch(entries, nextEntries => {
  const existingIds = new Set(nextEntries.map(entry => entry.id))

  Object.keys(rowOffsetById).forEach(id => {
    if (!existingIds.has(id)) {
      delete rowOffsetById[id]
    }
  })
})
</script>

<template>
  <!-- <Snowflakes :amount="20" />  -->

  <main class="mx-auto min-h-screen w-full max-w-xl px-4 py-6">
    <section
      v-if="isDev && showDevCacheBanner"
      class="mb-4 rounded-2xl border border-amber-300 bg-amber-100 p-3 text-sm text-amber-900"
    >
      <p class="font-semibold">Режим разработки</p>
      <p class="mt-1">
        Этот блок виден только локально. Если после правок появился странный UI/данные, очисти
        SW-кэш.
      </p>
      <div class="mt-2 flex gap-2">
        <button
          type="button"
          class="cursor-pointer rounded-lg bg-amber-500 px-3 py-1.5 font-medium text-white"
          @click="clearDevCacheAndReload"
        >
          Очистить кэш и перезагрузить
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-amber-400 px-3 py-1.5 font-medium"
          @click="showDevCacheBanner = false"
        >
          Скрыть
        </button>
      </div>
    </section>

    <section
      v-if="showUpdateBanner"
      class="mb-4 rounded-2xl border border-emerald-400 bg-emerald-100 p-3 text-sm text-emerald-900"
    >
      <p class="font-semibold">Доступно обновление приложения</p>
      <p class="mt-1">Нажмите “Обновить”, чтобы применить новую версию.</p>
      <div class="mt-2 flex gap-2">
        <button
          type="button"
          class="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white"
          @click="applyAppUpdate"
        >
          Обновить
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-emerald-400 px-3 py-1.5 font-medium"
          @click="showUpdateBanner = false"
        >
          Позже
        </button>
      </div>
    </section>

    <!-- hero ----------------------------------------- -->
    <header class="_panel mb-4 p-4 py-2">
      <div class="flex justify-between">
        <h1 class="text-2xl font-bold">Food Diary</h1>
        <ThemeToggle />
      </div>

      <p class="mt-1 text-sm">Ежедневный учёт белков, жиров, углеводов</p>
    </header>

    <section v-if="authLoading" class="_surface-strong p-4 text-center">Загрузка...</section>

    <!-- форма входа/регистрации ---------------------- -->
    <section v-else-if="!user" class="_surface-strong border-border rounded-xl border-2 p-2">
      <h2 class="text-lg font-semibold">
        {{ authMode === 'login' ? 'Вход' : 'Регистрация' }}
      </h2>

      <form class="mt-1 space-y-3" @submit.prevent="authSubmit">
        <label class="block">
          <span class="_input-label">Email</span>
          <input
            v-model="email"
            type="email"
            required
            class="_input-value px-4"
            placeholder="name@example.com"
          />
        </label>

        <label class="block">
          <span class="_input-label">Пароль</span>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            class="_input-value px-4 text-base"
            placeholder="Минимум 6 символов"
          />
        </label>

        <p v-if="authError" class="rounded-md bg-red-500 p-2 text-center text-base text-white">
          {{ authError }}
        </p>

        <button
          type="submit"
          :disabled="authBusy"
          class="border-border bg-panel-background my-3 w-full cursor-pointer rounded-xl border-2 p-4 text-base font-semibold"
        >
          {{ authBusy ? 'Подождите...' : authMode === 'login' ? 'Войти' : 'Зарегистрироваться' }}
        </button>
      </form>

      <button
        class="text-md mt-3 font-medium"
        @click="authMode = authMode === 'login' ? 'register' : 'login'"
      >
        {{ authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти' }}
      </button>
    </section>

    <!-- ввод БЖУК ------------------------------------ -->
    <section v-else class="space-y-4">
      <div class="_panel px-2 py-3">
        <div class="mb-3 grid grid-cols-2 gap-6">
          <button
            type="button"
            class="cursor-pointer rounded-xl border-2 px-3 py-2 text-sm font-semibold transition"
            :class="
              entryMode === 'direct'
                ? 'outline-border border-border from-gradient-start via-gradient-middle to-gradient-end text-panel-foreground bg-linear-to-b outline-2 outline-offset-2'
                : 'border-border text-panel-foreground/40 bg-linear-to-b'
            "
            @click="setEntryMode('direct')"
          >
            БЖУК
          </button>

          <button
            type="button"
            class="cursor-pointer rounded-xl border-2 px-3 py-2 text-sm font-semibold transition"
            :class="
              entryMode === 'per100'
                ? 'outline-border border-border from-gradient-start via-gradient-middle to-gradient-end text-panel-foreground bg-linear-to-b outline-2 outline-offset-2'
                : 'border-border text-panel-foreground/40 bg-linear-to-b'
            "
            @click="setEntryMode('per100')"
          >
            БЖУК за 100г
          </button>
        </div>

        <div class="mb-3 flex items-center justify-between px-2">
          <p class="text-sm font-medium">{{ user.email }}</p>
          <button class="text-sm font-medium" @click="logout">Выйти</button>
        </div>

        <form class="space-y-3" @submit.prevent="addEntry">
          <div v-if="entryMode === 'direct'" class="iphone:grid-cols-4 grid grid-cols-2 gap-2">
            <label class="block">
              <span class="_input-label">белки</span>
              <input
                v-model="directProteins"
                type="number"
                min="0"
                step="1"
                class="_input-value"
                @input="recalculateDirectCalories"
              />
            </label>

            <label class="block">
              <span class="_input-label">жиры</span>
              <input
                v-model="directFats"
                type="number"
                min="0"
                step="1"
                class="_input-value"
                @input="recalculateDirectCalories"
              />
            </label>

            <label class="block">
              <span class="_input-label">углеводы</span>
              <input
                v-model="directCarbs"
                type="number"
                min="0"
                step="1"
                class="_input-value"
                @input="recalculateDirectCalories"
              />
            </label>

            <label class="block">
              <span class="_input-label">ккал</span>
              <input v-model="directCalories" type="number" min="0" step="1" class="_input-value" />
            </label>
          </div>

          <div v-else class="space-y-3">
            <div class="iphone:grid-cols-4 grid grid-cols-2 gap-2">
              <label class="block">
                <span class="_input-label">Б/100 г</span>
                <input
                  v-model="per100Proteins"
                  type="number"
                  min="0"
                  step="1"
                  class="_input-value"
                  @input="recalculatePer100Calories"
                />
              </label>

              <label class="block">
                <span class="_input-label">Ж/100 г</span>
                <input
                  v-model="per100Fats"
                  type="number"
                  min="0"
                  step="1"
                  class="_input-value"
                  @input="recalculatePer100Calories"
                />
              </label>

              <label class="block">
                <span class="_input-label">У/100 г</span>
                <input
                  v-model="per100Carbs"
                  type="number"
                  min="0"
                  step="1"
                  class="_input-value"
                  @input="recalculatePer100Calories"
                />
              </label>

              <label class="block">
                <span class="_input-label">ккал/100 г</span>
                <input
                  v-model="per100Calories"
                  type="number"
                  min="0"
                  step="1"
                  class="_input-value"
                />
              </label>
            </div>

            <div class="grid grid-cols-[1fr_auto] items-end gap-2">
              <label class="block">
                <span class="_input-label">грамм съедено</span>
                <input v-model="per100Grams" type="number" min="0" step="1" class="_input-value" />
              </label>

              <div class="border-border/60 rounded-xl border-2 border-dashed px-3 py-3 text-center">
                <p class="text-panel-foreground/70 text-xs">вес продукта</p>
                <p class="text-base font-semibold">
                  {{ per100Grams ? `${per100Grams} г` : '0 г' }}
                </p>
              </div>
            </div>

            <div class="border-border/60 bg-panel-background/50 rounded-xl border-2 p-3">
              <p class="_panel-title mb-2">Потреблено</p>
              <p class="grid grid-cols-4 gap-2 text-center text-sm">
                <span>белки: {{ per100CalculatedTotals.proteins }}</span>
                <span>жиры: {{ per100CalculatedTotals.fats }}</span>
                <span>углев: {{ per100CalculatedTotals.carbs }}</span>
                <span>ккал: {{ per100CalculatedTotals.calories }}</span>
              </p>
            </div>
          </div>

          <p v-if="formError" class="my-2 text-center text-base font-semibold">
            {{ formError }}
          </p>

          <button type="submit" :disabled="saveBusy" class="_btn-add-record">
            {{ saveBusy ? 'Сохраняем...' : '+ добавить' }}
          </button>
        </form>
      </div>

      <!-- Записи за сегодня -------------------------- -->
      <div class="_panel p-2">
        <h3 class="_panel-title">Записи за сегодня</h3>
        <p v-if="entriesError" class="mb-2 rounded-md p-2 text-center text-base text-white">
          Ошибка чтения записей: {{ entriesError }}
        </p>

        <ul v-if="todayEntries.length" class="">
          <p
            class="iphone:*:text-base text-panel-foreground/60 mb-2 flex justify-between px-1 *:text-xs"
          >
            <span>время</span>
            <span>белки</span>
            <span>жиры</span>
            <span>углев</span>
            <span>ккал</span>
            <span class="">удалить</span>
          </p>

          <li
            v-for="entry in todayEntries"
            :key="entry.id"
            class="_swipe-row"
            :class="{ '_swipe-row--active': isRowActive(entry.id) }"
          >
            <div class="_swipe-delete-wrap">
              <button
                class="_swipe-delete-btn"
                @pointerup.stop.prevent="onDeleteButtonPointerUp(entry, $event)"
                @click.stop.prevent="onDeleteButtonClick(entry)"
              >
                удалить
              </button>
            </div>

            <div
              class="_swipe-content"
              :class="{ '_swipe-content--dragging': isRowDragging(entry.id) }"
              :style="{ transform: `translateX(${getRowOffset(entry.id)}px)` }"
              @pointerdown="onRowPointerDown(entry.id, $event)"
              @pointermove="onRowPointerMove(entry.id, $event)"
              @pointerup="onRowPointerUp(entry.id)"
              @pointercancel="onRowPointerCancel(entry.id)"
              @click="onRowContentClick(entry.id)"
            >
              <p class="flex justify-between *:my-1 *:basis-1/6 *:text-center *:text-base">
                <span>{{ formatDateTime(entry.createdAtMs) }}</span>
                <span>{{ entry.proteins }}</span>
                <span>{{ entry.fats }}</span>
                <span>{{ entry.carbs }}</span>
                <span>{{ entry.calories }}</span>
                <button class="_row-delete-toggle" @click.stop="onDeleteIconClick(entry)">
                  ❌
                </button>
              </p>
            </div>
          </li>
        </ul>

        <p v-else class="text-center text-sm">Сегодня записей пока нет</p>
      </div>

      <!-- Всего за сегодня --------------------------- -->
      <article class="_panel p-2">
        <h3 class="_panel-title">Всего за сегодня</h3>
        <p class="_all-labels">
          <span>белки</span>
          <span>жиры</span>
          <span>углев</span>
          <span>ккал</span>
        </p>

        <p class="_all-data">
          <span>{{ totalsToday.proteins }}</span>
          <span>{{ totalsToday.fats }}</span>
          <span>{{ totalsToday.carbs }}</span>
          <span>{{ totalsToday.calories }}</span>
        </p>
      </article>

      <!-- Всего за неделю ---------------------------- -->
      <article class="_panel p-2">
        <h3 class="_panel-title">Всего за неделю</h3>
        <p class="_all-labels">
          <span>белки</span>
          <span>жиры</span>
          <span>углев</span>
          <span>ккал</span>
        </p>
        <p class="_all-data">
          <span>{{ totalsWeek.proteins }}</span>
          <span>{{ totalsWeek.fats }}</span>
          <span>{{ totalsWeek.carbs }}</span>
          <span>{{ totalsWeek.calories }}</span>
        </p>
        <!-- <p class="mt-2 text-sm text-slate-600">Б: {{ totalsWeek.proteins.toFixed(1) }} г</p> -->
      </article>

      <!-- Всего за месяц ----------------------------- -->
      <article class="_panel p-2">
        <h3 class="_panel-title">Всего за месяц</h3>
        <p class="_all-labels">
          <span>белки</span>
          <span>жиры</span>
          <span>углев</span>
          <span>ккал</span>
        </p>
        <p class="_all-data">
          <span>{{ totalsMonth.proteins }}</span>
          <span>{{ totalsMonth.fats }}</span>
          <span>{{ totalsMonth.carbs }}</span>
          <span>{{ totalsMonth.calories }}</span>
        </p>
      </article>

      <ThemePalettePicker />
    </section>
  </main>
</template>
