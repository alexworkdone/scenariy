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
        window.location.href = '/'
    } catch(e) {
        console.error(e)
        alert('Сталася помилка під час розбору тексту')
        loading.value = false
    }
}
</script>

<style>
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
