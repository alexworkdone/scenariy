<template>
    <button
            class="theme-toggle"
            @click="toggleTheme"
    >
        <AppIcon :name="isDark ? 'sun' : 'moon'"/>
    </button>
</template>

<script setup>
import {applyTheme, getStoredTheme} from '@/utils/theme'

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

<style>
    .theme-toggle {
        color: var(--color-gray);
        transition: background 0.3s ease, color 0.3s ease;
    }

    .theme-toggle .app-icon {
        font-size: 1.625rem;
    }
</style>
