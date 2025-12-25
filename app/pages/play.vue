<template>
    <main class="viewer">
        <div class="title-row">
            <h1 class="title">{{ data?.title || 'Перегляд пʼєси' }}</h1>
            <NuxtLink to="/" class="link">Редагувати</NuxtLink>
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
</script>

<style>
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
