<template>
    <main class="container">
        <h1>Редактор сценарію</h1>

        <label for="title" class="label">Назва пʼєси (необовʼязково)</label>
        <input id="title" v-model="title" class="input" placeholder="Наприклад: Наталка, Зінька і Овсій"/>

        <label for="script" class="label">Текст сценарію</label>
        <textarea
                id="script"
                v-model="script"
                class="textarea"
                rows="18"
                placeholder="Вставте ваш сценарій тут..."
        />

        <div class="actions">
            <button class="btn" @click="onParse">Розкласти і переглянути</button>
        </div>

        <p class="hint">
            Приклад формату:
            <br/>
            (Входить Овсій)
            <br/>
            Наталка(спочатку у кімнаті ...): От і прибралась...
            <br/>
            Зінька: Гм, чортеня….
        </p>
    </main>
</template>

<script setup>
import {parseScript} from '~/utils/parseScript'

const router = useRouter()
const loading = useState('loading')
const parsedState = useState('parsedPlay', () => null)

const sample = `(
Наталка(спочатку у кімнаті біля дверей, а далі вибіга: пританцьовуючи і крутячись) От і прибралась, бач, яка цяця, бач, яка краля! (співа) Зінько, голубочко, я слухатимусь, коли ти висилатимеш з хати.
Зінька: Гм, чортеня….
Наталка: А яка ти гарнесенька, сестрице, сьогодні! У стрічках та у плахті. Чого ти щодня так не ходиш?
Зінька: При матері ходила, а тепер ота моди завела; батько силують  до кохт.
Наталка: І я тієї Власівни не люблю…я їй межи очі плюну. Можна, Зінько?
Зінька: А батько?
Наталка:  А я плюну та й утечу: мене не піймають!
Зінька(обніма її) Голубочко моя.
Наталка(цілує її): Ти така в цьому гарна, така гарна!
(Входить Овсій)
Овсій: А правда, чудесно, як намальовані; а то неначе в хомуті ходите.
Зінька: Ой, це ти , Овсію?
Овсій: Та я ж.
)`

const script = ref(sample)
const title = ref('')

onMounted(() => {
    // Ensure loader hides after each navigation
    router.afterEach(() => {
        loading.value = false
    })
})

function onParse() {
    loading.value = true
    try {
        const parsed = parseScript(script.value, title.value || 'Назва пʼєси')
        if(title.value) parsed.title = title.value
        parsedState.value = parsed
        // persist
        localStorage.setItem('parsedPlay', JSON.stringify(parsed))
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

    .container {
        max-width: 900px;
        margin: 24px auto;
        padding: 0 16px 32px;
    }

    .label {
        display: block;
        margin-top: 12px;
        margin-bottom: 6px;
        font-weight: 600;
    }

    .input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 16px;
    }

    .textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 14px;
    }

    .actions {
        margin-top: 16px;
        display: flex;
        gap: 12px;
    }

    .btn {
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

    .hint {
        margin-top: 16px;
        color: #666;
        font-size: 13px;
    }
</style>
