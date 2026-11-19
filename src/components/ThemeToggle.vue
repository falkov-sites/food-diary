<template>
  <div
    ref="containerRef"
    role="button"
    :aria-label="`Переключить на ${isDark ? 'светлую' : 'темную'} тему`"
    :title="`Текущая тема: ${isDark ? 'темная' : 'светлая'}`"
    class="flex items-center justify-center gap-5 *:cursor-pointer"
  >
    <button type="button" @click.stop="setLightTheme" aria-label="Светлая тема">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="stroke-panel-foreground fill-none stroke-2"
      >
        <path d="M14.828 14.828a4 4 0 1 0 -5.656 -5.656a4 4 0 0 0 5.656 5.656z" />
        <path d="M6.343 17.657l-1.414 1.414" />
        <path d="M6.343 6.343l-1.414 -1.414" />
        <path d="M17.657 6.343l1.414 -1.414" />
        <path d="M17.657 17.657l1.414 1.414" />
        <path d="M4 12h-2" />
        <path d="M12 4v-2" />
        <path d="M20 12h2" />
        <path d="M12 20v2" />
      </svg>
    </button>

    <button type="button" @click.stop="setDarkTheme" aria-label="Темная тема">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="stroke-panel-foreground fill-none stroke-2"
      >
        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const THEME_STORAGE_KEY = 'theme'
const containerRef = ref<HTMLElement | null>(null)

const isDark = ref(false)

/** Получить текущую тему из localStorage или системных настроек */
const getInitialTheme = (): 'dark' | 'light' => {
  // 1. Проверяем localStorage
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'dark' | 'light' | null
  if (storedTheme) {
    return storedTheme
  }

  // 2. Проверяем системные настройки
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  // 3. Светлая тема по умолчанию
  return 'light'
}

/** Применить тему к документу */
const applyTheme = (theme: 'dark' | 'light') => {
  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
    isDark.value = true
  } else {
    root.classList.remove('dark')
    isDark.value = false
  }

  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

const setLightTheme = () => {
  if (!isDark.value) return
  applyTheme('light')
}

const setDarkTheme = () => {
  if (isDark.value) return
  applyTheme('dark')
}

/** Переключить тему */
// const toggleTheme = () => {
//   const newTheme = isDark.value ? 'light' : 'dark'
//   applyTheme(newTheme)
// }

/** Слушатель изменений системной темы */
const watchSystemTheme = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleChange = (e: MediaQueryListEvent) => {
    // Меняем тему только если пользователь не выбрал тему вручную
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light')
    }
  }

  // Современный способ
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange)
  } else {
    // Для старых браузеров
    mediaQuery.addListener(handleChange)
  }

  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleChange)
    } else {
      mediaQuery.removeListener(handleChange)
    }
  }
}

// Инициализация
onMounted(() => {
  const initialTheme = getInitialTheme()
  applyTheme(initialTheme)
  watchSystemTheme()
})

// Фокус на контейнере при изменении темы (для доступности)
watch(isDark, () => {
  if (containerRef.value) {
    containerRef.value.focus()
  }
})
</script>
