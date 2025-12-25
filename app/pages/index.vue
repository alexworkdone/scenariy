<template>
    <main class="container">
        <div class="title-row">
            <h1>Редактор сценарію</h1>
            <AppFontSizeControl />
            <AppThemeToggle />
        </div>

        <label for="title" class="label">Назва пʼєси (необовʼязково)</label>
        <input id="title" v-model="title" class="input" placeholder="Сон літньої ночі"/>

        <label for="script" class="label">Текст сценарію</label>
        <textarea
                id="script"
                v-model="script"
                class="textarea"
                rows="18"
                placeholder="Вставте ваш сценарій тут..."
        />

        <div class="actions">
            <button class="btn" @click="onParse">До роботи!</button>
        </div>
    </main>
</template>

<script setup>
import {parseScript} from '@/utils/parseScript'

const router = useRouter()
const loading = useState('loading')
const parsedState = useState('parsedPlay', () => null)
const cookieParsedPlay = useCookie('parsedPlay')
// Store raw inputs to cookies so we can restore on "Редагувати"
const cookieRawScript = useCookie('rawScript')
const cookieRawTitle = useCookie('rawTitle')

const script = ref('')
const title = ref('')

onMounted(async () => {
    // Restore raw inputs from localStorage first (handles long texts beyond cookie limits)
    try {
        const lsScript = localStorage.getItem('rawScript')
        const lsTitle = localStorage.getItem('rawTitle')
        if (lsScript !== null) script.value = lsScript
        if (lsTitle !== null) title.value = lsTitle
    } catch {}

    // Fallback to cookies if localStorage is empty/unavailable
    try {
        if (!script.value && cookieRawScript.value) script.value = cookieRawScript.value
        if (!title.value && cookieRawTitle.value) title.value = cookieRawTitle.value
    } catch {}

    // If still empty, try to preload from public/content.js
    if (!script.value) {
        try {
            const res = await fetch('/content.js', { cache: 'no-store' })
            if (res.ok) {
                const js = await res.text()
                const titleMatch = js.match(/const\s+title\s*=\s*['"]([\s\S]*?)['"]\s*;/)
                const contentMatch = js.match(/const\s+content\s*=\s*`([\s\S]*?)`\s*;/)
                const fileTitle = titleMatch?.[1]?.trim() || ''
                const fileContent = contentMatch?.[1]?.trim() || ''
                if (fileContent) {
                    script.value = fileContent
                    if (!title.value && fileTitle) title.value = fileTitle

                    // persist for future sessions and to prioritize cookies over file next time
                    try { cookieRawScript.value = script.value } catch {}
                    try { cookieRawTitle.value = title.value } catch {}
                    try { localStorage.setItem('rawScript', script.value) } catch {}
                    try { localStorage.setItem('rawTitle', title.value) } catch {}
                }
            }
        } catch {}
    }

    router.afterEach(() => loading.value = false )
})

function onParse() {
    loading.value = true

    try {
        const parsed = parseScript(script.value, title.value || 'Назва пʼєси')
        if(title.value) parsed.title = title.value
        parsedState.value = parsed

        // save parsed object
        try { cookieParsedPlay.value = parsed } catch {}

        // also save raw inputs for future editing
        try { cookieRawScript.value = script.value } catch {}
        try { cookieRawTitle.value = title.value } catch {}
        try { localStorage.setItem('rawScript', script.value) } catch {}
        try { localStorage.setItem('rawTitle', title.value) } catch {}

        try { localStorage.setItem('parsedPlay', JSON.stringify(parsed)) } catch {}

        // navigate
        router.push('/play')
    } catch(e) {
        console.error(e)
        alert('Сталася помилка під час розбору тексту')
        loading.value = false
    }
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

    // reset -------------------------------------------------
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

    // -------------------------------------------------
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

    .label {
        display: block;
        margin-top: 12px;
        margin-bottom: 6px;
        font-size: 0.875rem;
        color: rgb(var(--color-gray-rgb) / 0.9);
    }

    input,
    textarea {
        padding: 10px 12px;
        border: 1px solid rgb(var(--color-gray-rgb) / 0.3);
        border-radius: 8px;
        font-size: 1rem;
        color: var(--color-text);
    }

    input::placeholder,
    textarea::placeholder {
        color: rgb(var(--color-gray-rgb) / 0.5);
    }

    .actions {
        margin-top: 16px;
        display: flex;
        gap: 12px;
    }

    .btn {
        margin-left: auto;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        cursor: pointer;
    }

    .btn:hover {
        background: #2563eb;
    }
</style>
