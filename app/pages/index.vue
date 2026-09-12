<template>
    <main class="viewer">
        <div class="title-row">
            <h1 class="title">{{ data?.title || 'Перегляд пʼєси' }}</h1>
            <button @click="toPlay" class="link">Ред.</button>
        </div>

        <div class="reader-settings">
            <AppFontSizeControl />
            <AppThemeToggle />
        </div>
        <header ref="topbar" class="topbar">
            <details v-if="scenes.length" ref="sceneMenu" class="scene-menu">
                <summary>Сцени <span class="current-scene">{{ currentScene }}</span></summary>
                <nav aria-label="Перехід до сцени">
                    <button v-for="scene in scenes" :key="scene.index" @click="goToScene(scene.index)">
                        {{ scene.label }} <span>{{ scene.subtitle }}</span>
                    </button>
                </nav>
            </details>
            <div v-if="data?.characters?.length" class="characters">
                <button
                        v-for="ch in data.characters"
                        :key="ch"
                        class="chip"
                        :class="{ active: active === ch }"
                        :aria-pressed="active === ch"
                        :style="{ '--role-color': getColor(ch) }"
                        @click="toggleActive(ch)"
                >
                    {{ ch }}
                </button>
            </div>
        </header>

        <section v-if="data" class="content">
            <div v-for="b in blocks" :id="`block-${b.index}`" :key="b.index" class="reader-block" :data-block="b.index">
                <h2
                        v-if="b.heading"
                        class="script-heading"
                        :class="{ 'act-heading': /ДІЯ|АНТРАКТ|ЗАВІСА/.test(b.label) }"
                >{{ b.label }}<span v-if="b.subtitle" class="scene-subtitle">{{ b.subtitle }}</span></h2>
                <div
                        v-else-if="b.type === 'stage'"
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
                        :class="{ dimmed: active !== null && active !== b.character }"
                >
                    <div class="speaker">
                        <span class="name" :style="{ color: getColor(b.character) }">{{ b.character }}</span>
                    </div>
                    <div class="line">
                        <p v-for="(paragraph, paragraphIndex) in b.paragraphs" :key="paragraphIndex">
                        <span v-if="b.aside && paragraphIndex === 0" class="aside">({{ b.aside }}) </span>
                        <template v-for="(chunk, j) in tokenizeAsides(paragraph)" :key="j">
                            <span v-if="chunk.type === 'aside'" class="aside">({{ chunk.text }})</span>
                            <template v-else>{{ chunk.text }}</template>
                        </template>
                        </p>
                    </div>
                </div>
            </div>
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
import { readerBlocks } from '@/utils/reader'
const topbar = ref(null)
const sceneMenu = ref(null)
const currentScene = ref('')
const blocks = computed(() => readerBlocks(data.value?.blocks || []))
const scenes = computed(() => blocks.value.filter(b => b.heading && /СЦЕНА/.test(b.label)))
// Scope bookmarks to this title and exact version of the script.
const bookmarkKey = computed(() => {
    const source = JSON.stringify(data.value)
    let hash = 2166136261
    for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619)
    return `reader:${data.value?.title}:${hash >>> 0}`
})
let scrollTimer
let ready = false
function savePosition() {
    if (!ready || !data.value) return
    const edge = topbar.value?.getBoundingClientRect().bottom || 0
    const elements = [...document.querySelectorAll('[data-block]')]
    const element = elements.find(el => el.getBoundingClientRect().bottom > edge) || elements.at(-1)
    if (!element) return
    const index = Number(element.dataset.block)
    currentScene.value = scenes.value.filter(scene => scene.index <= index).at(-1)?.label || ''
    try { localStorage.setItem(bookmarkKey.value, JSON.stringify({ active: active.value, index, offset: element.getBoundingClientRect().top - edge })) } catch {}
}
function onScroll() {
    clearTimeout(scrollTimer)
    scrollTimer = setTimeout(savePosition, 150)
}
function goToScene(index) {
    if (sceneMenu.value) sceneMenu.value.open = false
    const el = document.getElementById(`block-${index}`)
    if (el) window.scrollBy({ top: el.getBoundingClientRect().top - (topbar.value?.offsetHeight || 0) - 8, behavior: 'instant' })
    savePosition()
}
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

onMounted(async () => {
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
    await nextTick()
    try {
        const saved = JSON.parse(localStorage.getItem(bookmarkKey.value) || 'null')
        if (saved) {
            active.value = data.value?.characters.includes(saved.active) ? saved.active : null
            await nextTick()
            const el = document.getElementById(`block-${saved.index}`)
            if (el && Number.isFinite(saved.offset)) window.scrollBy(0, el.getBoundingClientRect().top - (topbar.value?.offsetHeight || 0) - saved.offset)
        }
    } catch {}
    ready = true
    savePosition()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', savePosition)
})
onBeforeUnmount(() => {
    savePosition()
    clearTimeout(scrollTimer)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('pagehide', savePosition)
})

watch(() => data.value?.characters, () => {
    buildColorMap()
}, { immediate: false })

function getColor(name) {
    return colorMap.value[name] || '#3b82f6'
}

function toggleActive(ch) {
    active.value = active.value === ch ? null : ch
    savePosition()
}

// Tokenize inline parenthetical asides inside a dialogue line
// Returns array of chunks: [{ type: 'text'|'aside', text: string }]
function tokenizeAsides(text) {
    const chunks = []
    if (!text) return chunks
    let i = 0
    while (i < text.length) {
        const open = text.indexOf('(', i)
        if (open === -1) {
            chunks.push({ type: 'text', text: text.slice(i) })
            break
        }
        const close = text.indexOf(')', open + 1)
        if (close === -1) {
            // No closing, treat the rest as text
            chunks.push({ type: 'text', text: text.slice(i) })
            break
        }
        // Push text before (
        if (open > i) {
            chunks.push({ type: 'text', text: text.slice(i, open) })
        }
        // Extract inside parentheses
        const inside = text.slice(open + 1, close)
        chunks.push({ type: 'aside', text: inside })
        i = close + 1
    }
    return chunks
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
        font-size: 28px;
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
        padding: 0 8px;
        color: var(--color-text);
        opacity: 0.5;
        font-weight: 400;
        font-size: 0.9rem;
    }

    .dialogue .line {
        margin-top: 4px;
    }

    .script-heading {
        margin: 32px 0 20px;
        padding: 12px 16px;
        border-left: 4px solid #3b82f6;
        border-radius: 6px;
        background: rgba(59, 130, 246, 0.12);
        color: var(--color-text);
        font-size: 1.25rem;
        font-weight: 700;
        line-height: 1.4;
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
        opacity: 0.3;
    }

    .empty {
        padding: 24px;
        text-align: center;
        color: #666;
    }
</style>

<style scoped>
.viewer { max-width: 720px; padding: 12px 12px 48px; overflow-wrap: anywhere; }
.viewer > .title-row { align-items: start; }
.title { font-size: 1.15rem; }
.link { min-height: 44px; min-width: 44px; }
.reader-settings { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
.topbar { padding: 0; }
.characters { flex-wrap: nowrap; overflow-x: auto; padding: 6px 0; gap: 6px; }
.chip { --role-color: #3b82f6; flex: 0 0 auto; min-height: 44px; padding: 6px 12px; font-size: .8rem; white-space: nowrap; }
.chip.active { border-color: var(--role-color); box-shadow: inset 0 -3px var(--role-color); background: rgba(59,130,246,.12); font-weight: 700; }
.content { padding: 0; font-size: 1.125rem; line-height: 1.55; }
.dialogue { border-left: 3px solid transparent; padding: 8px 9px; margin: 6px 0; border-radius: 4px; }
.dialogue .speaker { font-size: .85rem; }
.dialogue .aside { padding: 0; opacity: 1; color: var(--reader-muted); font-size: .95em; font-style: italic; }
.viewer { --reader-muted: #565b65; }
:global(html.dark) .viewer { --reader-muted: #b5bbc5; }
.line p { white-space: pre-wrap; }
.line p + p { margin-top: .8em; }
.stage { text-align: left; color: var(--reader-muted); font-size: .95em; padding: 0 12px; margin: 12px 0; }
.script-heading { margin: 22px 0 12px; padding: 10px 12px; font-size: 1.05rem; line-height: 1.4; }
.act-heading { margin-top: 32px; border-left: 0; border-top: 3px solid #3b82f6; font-size: 1.2rem; }
.scene-subtitle { display: block; margin-top: 3px; font-weight: 500; font-size: .95em; }
.quote { margin: 12px 0; }
.scene-menu { position: relative; font-size: .875rem; }
.scene-menu summary { cursor: pointer; min-height: 44px; padding: 10px 4px; }
.current-scene { color: var(--reader-muted); margin-left: 10px; font-size: .8rem; }
.scene-menu nav { position: absolute; top: 100%; left: 0; right: 0; max-height: 55dvh; overflow-y: auto; background: var(--bg-main); border: 1px solid var(--reader-muted); border-radius: 8px; box-shadow: 0 8px 24px #0003; z-index: 20; }
.scene-menu nav button { display: block; width: 100%; min-height: 44px; text-align: left; color: var(--color-text); padding: 12px; font-size: .875rem; border-bottom: 1px solid #8884; }
.scene-menu nav button span { display: block; color: var(--reader-muted); }
button:focus-visible, summary:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
</style>
