<template>
  <section class="_panel px-3 py-3">
    <div class="grid grid-cols-5 gap-2">
      <button
        v-for="palette in paletteOptions"
        :key="palette.id"
        type="button"
        :title="`Палитра: ${palette.label}`"
        :aria-label="`Выбрать палитру: ${palette.label}`"
        class="h-10 cursor-pointer rounded-xl transition-transform focus:outline-hidden"
        :class="
          selectedPalette === palette.id
            ? 'border-black/70 dark:border-white/80'
            : 'border-white/60 dark:border-slate-600'
        "
        :style="{ backgroundColor: palette.swatch }"
        @click="setPalette(palette.id)"
      >
        <span class="sr-only">{{ palette.label }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { createPaletteTheme } from './usePaletteTheme'

const { paletteOptions, selectedPalette, setPalette } = createPaletteTheme()
</script>
