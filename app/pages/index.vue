<template>
    <main class="viewer">
        <div class="title-row">
            <h1 class="title">{{ data?.title || 'Перегляд пʼєси' }}</h1>
            <button @click="toPlay" class="link">Редагувати</button>
        </div>

        <header class="topbar">
            <div v-if="data?.characters?.length" class="characters">
                <button
                        v-for="ch in data.characters"
                        :key="ch"
                        class="chip"
                        :class="{ active: active === ch }"
                        :style="active === ch ? { backgroundColor: getColor(ch) } : { opacity: 0.5 }"
                        @click="toggleActive(ch)"
                >
                    {{ ch }}
                </button>
            </div>
        </header>

        <section v-if="data" class="content">
            <template v-for="(b, i) in data.blocks" :key="i">
                <div
                        v-if="b.type === 'stage'"
                        class="block stage"
                >
                    <span class="stage-text">({{ b.text }})</span>
                </div>
                <div
                        v-else-if="b.type === 'quote'"
                        class="block quote"
                >
                    <blockquote class="quote-text">{{ b.text }}</blockquote>
                </div>
                <div
                        v-else
                        class="block dialogue"
                        :class="{ dimmed: isDimmed(b.character) }"
                >
                    <div class="speaker">
                        <span class="name" :style="{ color: getColor(b.character) }">{{ b.character }}</span>
                        <span v-if="b.aside" class="aside">({{ b.aside }})</span>
                    </div>
                    <div class="line">{{ b.text }}</div>
                </div>
            </template>
        </section>

        <section v-else class="empty">
            <p>Немає даних для показу. Спочатку
                <NuxtLink to="/">вставте текст сценарію</NuxtLink>
                .
            </p>
        </section>
    </main>
</template>

<script setup>
const loading = useState('loading')
const state = useState('parsedPlay', () => null)
const data = ref(state.value)
const active = ref(null)

// Deterministic color palette for speakers
const palette = [
    '#e11d48',
    '#7c3aed',
    '#0050ff',
    '#16a34a',
    '#d97706',
    '#0ea5e9',
    '#f59e0b',
    '#ef4444',
]

const colorMap = ref({})

function buildColorMap() {
    const chars = data.value?.characters || []
    const next = {}
    let idx = 0
    for (const name of chars) {
        // Preserve previously chosen color if exists
        next[name] = colorMap.value[name] || palette[idx % palette.length]
        idx++
    }
    colorMap.value = next
}

onMounted(() => {
    if(!data.value) {
        try {
            const raw = localStorage.getItem('parsedPlay')
            if(raw) {
                data.value = JSON.parse(raw)
                state.value = data.value
            }
        } catch {
        }
    }
    buildColorMap()
})

watch(() => data.value?.characters, () => {
    buildColorMap()
}, { immediate: false })

function getColor(name) {
    return colorMap.value[name] || '#3b82f6'
}

function toggleActive(ch) {
    active.value = active.value === ch ? null : ch
}

function isDimmed(character) {
    return active.value !== null && character !== active.value
}

function toPlay() {
    window.location.href = '/play'
}
</script>

<style>
    :root {
        --bg-main: #ffffff;
        --color-text: #000000;

        --color-gray-rgb: 119 118 122;
        --color-gray: rgb(var(--color-gray-rgb) / 1);

        --padding-side: 24px;
        --space: 16px;
    }

    html.dark {
        --bg-main: #101419;
        --color-text: #ffffff;
    }

    /* reset ------------------------------------------------- */
    *,
    *:before,
    *:after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
    }

    * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-text-size-adjust: 100%;
    }

    main,
    nav,
    section,
    footer,
    header,
    aside,
    article,
    dialog,
    figcaption,
    figure,
    hgroup {
        display: block;
    }

    ul,
    dl {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    ol {
        padding-left: 20px;
        font-size: 0.8rem;
    }

    img {
        max-width: 100%;
        border: 0;
        vertical-align: top;
        user-select: none;
    }

    h1 {
        margin: 0;
    }

    button {
        margin: 0;
        padding: 0;
        background-color: transparent;
        border: none;
        cursor: pointer;
    }

    a:focus,
    img:focus,
    button:focus,
    input:focus,
    textarea:focus,
    select:focus,
    option:focus {
        outline: none;
    }

    b,
    strong {
        font-weight: 600;
    }

    input,
    textarea,
    select,
    button {
        font-size: 1rem;
        font-weight: 400;
        outline: none;
        border: none;
        background-color: transparent;
    }

    select::-ms-expand {
        display: none;
    }

    input::-webkit-input-placeholder {
        color: var(--bg-main);
    }

    input::placeholder {
        color: var(--color-gray);
    }

    input:focus::-webkit-input-placeholder {
        color: transparent;
    }

    input[type='number'] {
        -moz-appearance: textfield;
    }

    input[type='number']::-webkit-inner-spin-button,
    input[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* Firefox */
    input[type='number'] {
        -moz-appearance: textfield;
    }
    /* Chrome, Safari, Edge */
    input[type='number']::-webkit-outer-spin-button,
    input[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type='submit'],
    input[type='text'],
    input[type='email'],
    input[type='search'],
    textarea,
    select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
    }

    input[type='search']::-webkit-search-cancel-button {
        -webkit-appearance: none;
        appearance: none;
    }

    svg,
    symbol,
    image,
    marker,
    pattern {
        overflow-x: visible !important;
        overflow-y: visible !important;
    }

    a,
    a:hover,
    a:focus,
    a:active {
        color: inherit;
        text-decoration: none;
        outline: none;
        box-shadow: none;
        background: transparent;
    }

    /* -------------------------------------------------  */
    html {
        font-size: 1rem;
    }

    body {
        position: relative;
        min-width: 320px;
        background-color: var(--bg-main);
        color: var(--color-text);
        font-family: Arial, sans-serif;
        font-size: 1rem;
        font-weight: 400;
        overflow-y: auto;
        overflow-x: hidden;
        line-height: 1.4;

        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-size-adjust: 100%;
        scroll-behavior: smooth;

        font-synthesis: none;
        text-rendering: optimizeLegibility;
    }

    .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .container {
        max-width: 900px;
        margin: 24px auto;
        padding: 0 16px 32px;
        display: flex;
        flex-direction: column;
    }

    .viewer {
        max-width: 900px;
        margin: 0 auto;
        padding-bottom: 48px;
    }

    .topbar {
        position: sticky;
        top: 0;
        border-bottom: 1px solid rgba(var(--color-gray-rgb) / 0.5);
        background-color: var(--bg-main);
        padding: 6px 0;
        z-index: 10;
    }

    .title {
        font-size: 1.375rem;
        margin: 0;
    }

    .link {
        color: #3b82f6;
        text-decoration: none;
    }

    .link:hover {
        text-decoration: underline;
    }

    .characters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .chip {
        border: 1px solid rgba(var(--color-gray-rgb) / 0.5);
        background: var(--bg-main);
        color: var(--color-text);
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 0.875rem;
        cursor: pointer;
    }

    .chip:hover {
        border-color: red;
    }

    .content {
        padding: 16px;
    }

    .block {
        margin: 10px 0 14px;
    }

    .dialogue .speaker {
        font-size: 0.8rem;
        font-weight: 700;
    }

    .dialogue .name {
        margin-right: 6px;
    }

    .dialogue .aside {
        color: #666;
        font-weight: 400;
    }

    .dialogue .line {
        margin-top: 4px;
    }

    .stage {
        text-align: center;
        color: var(--color-gray);
    }

    .stage-text {
        font-style: italic;
    }

    .quote {
        margin-left: 16px;
        margin-right: 16px;
    }

    .quote-text {
        margin: 0;
        padding: 8px 12px;
        border-left: 4px solid rgba(var(--color-gray-rgb) / 0.3);
        background: rgba(var(--color-gray-rgb) / 0.1);
        white-space: pre-wrap;
    }

    .dimmed {
        opacity: 0.2;
    }

    .empty {
        padding: 24px;
        text-align: center;
        color: #666;
    }
</style>
