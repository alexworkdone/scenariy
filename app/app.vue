<template>
    <NuxtLayout>
        <NuxtPage/>
    </NuxtLayout>

    <!-- Global loader overlay -->
    <div v-if="loading" class="loader-overlay">
        <div class="loader-spinner" aria-label="Loading"/>
    </div>
</template>

<script setup>
import { getStoredTheme, applyTheme } from '@/utils/theme'
import { getStoredFontSize, applyFontSize } from '@/utils/fontSize'

const loading = useState('loading', () => false)
const router = useRouter()

// Read theme from cookie (SSR-safe) and set html class globally
const savedTheme = getStoredTheme()
const isDark = computed(() => savedTheme === 'dark')

// Read font size from cookie (SSR-safe)
const savedFontSize = getStoredFontSize()

useHead({
    htmlAttrs: {
        class: isDark.value ? 'dark' : undefined,
        style: `font-size: ${savedFontSize}px;`,
    },
})

onMounted(() => {
    // Ensure DOM is synced on client as well
    applyTheme(isDark.value)
    applyFontSize(savedFontSize)
    router.afterEach(() => loading.value = false)
})
</script>

<style>
    html, body, #__nuxt {
        height: 100%;
    }

    .loader-overlay {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }

    .loader-spinner {
        width: 56px;
        height: 56px;
        border: 6px solid #ddd;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
