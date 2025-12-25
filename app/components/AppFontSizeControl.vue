<template>
  <div class="font-size-control" role="group" aria-label="Font size">
    <button class="fs-btn" @click="decrease" :disabled="size <= min" aria-label="Decrease font size">
      A-
    </button>
    <span class="fs-value" :title="`${size}px`">{{ size }}px</span>
    <button class="fs-btn" @click="increase" :disabled="size >= max" aria-label="Increase font size">
      A+
    </button>
  </div>
</template>

<script setup>
import { applyFontSize, getStoredFontSize, FONT_SIZE_MIN as min, FONT_SIZE_MAX as max } from '@/utils/fontSize'

const size = ref(getStoredFontSize())

// Apply immediately on first render
applyFontSize(size.value)

// On SSR, align initial html font-size to avoid FOUC
useHead({
  htmlAttrs: {
    style: `font-size: ${size.value}px;`,
  },
})

const increase = () => {
  size.value = Math.min(max, size.value + 1)
  applyFontSize(size.value)
}

const decrease = () => {
  size.value = Math.max(min, size.value - 1)
  applyFontSize(size.value)
}
</script>

<style>
.font-size-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.fs-btn {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-border, #e2e2e2);
  background: transparent;
  color: var(--color-gray);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}

.fs-btn:hover:not(:disabled) {
  background: var(--color-hover, rgba(0,0,0,0.05));
}

.fs-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.fs-value {
  min-width: 48px;
  text-align: center;
  color: var(--color-gray);
}
</style>
