<template>
  <AppButton
    color="light"
    class="theme-toggle icon-only"
    size="small"
    @click="toggleTheme"
  >
    <AppIcon :name="isDark ? 'sun' : 'moon'" />
  </AppButton>
</template>

<script setup>
import { applyTheme, getStoredTheme } from '@/utils/theme'

const saved = getStoredTheme()
const isDark = ref(saved === 'dark')

applyTheme(isDark.value)

useHead({
  htmlAttrs: {
    class: isDark.value ? 'dark' : undefined,
  },
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
}
</script>

<style lang="scss">
.theme-toggle {
  color: var(--color-gray);
  transition: background 0.3s ease, color 0.3s ease;

  .app-icon {
    font-size: 26px;
  }
}
</style>
