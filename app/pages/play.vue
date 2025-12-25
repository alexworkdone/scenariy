<template>
  <main class="viewer">
    <header class="topbar">
      <div class="title-row">
        <h1 class="title">{{ data?.title || 'Перегляд пʼєси' }}</h1>
        <NuxtLink to="/" class="link">Редагувати</NuxtLink>
      </div>

      <div v-if="data?.characters?.length" class="characters">
        <button
          v-for="ch in data.characters"
          :key="ch"
          class="chip"
          :class="{ active: active === ch }"
          @click="toggleActive(ch)"
        >
          {{ ch }}
        </button>
        <button v-if="active" class="chip clear" @click="clearActive">Показати всіх</button>
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
          v-else
          class="block dialogue"
          :class="{ dimmed: isDimmed(b.character) }"
        >
          <div class="speaker">
            <span class="name">{{ b.character }}</span>
            <span v-if="b.aside" class="aside">({{ b.aside }})</span>
          </div>
          <div class="line">{{ b.text }}</div>
        </div>
      </template>
    </section>

    <section v-else class="empty">
      <p>Немає даних для показу. Спочатку <NuxtLink to="/">вставте текст сценарію</NuxtLink>.</p>
    </section>
  </main>
</template>

<script setup>
const loading = useState('loading')
const state = useState('parsedPlay', () => null)
const data = ref(state.value)
const active = ref(null)

onMounted(() => {
  if (!data.value) {
    try {
      const raw = localStorage.getItem('parsedPlay')
      if (raw) {
        data.value = JSON.parse(raw)
        state.value = data.value
      }
    } catch {}
  }
})

function toggleActive(ch) {
  active.value = active.value === ch ? null : ch
}
function clearActive() { active.value = null }
function isDimmed(character) {
  return active.value !== null && character !== active.value
}
</script>

<style scoped>
.viewer {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 48px;
}
.topbar {
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 1px solid #eee;
  padding: 12px 16px;
  z-index: 10;
}
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.title {
  font-size: 22px;
  margin: 0;
}
.link { color: #3b82f6; text-decoration: none; }
.link:hover { text-decoration: underline; }

.characters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.chip {
  border: 1px solid #bbb;
  background: #f8f8f8;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
}
.chip.active { border-color: #3b82f6; background: #e8f0fe; }
.chip.clear { border-color: #999; background: #fff; }

.content { padding: 16px; }
.block { margin: 10px 0 14px; }
.dialogue .speaker { font-weight: 700; }
.dialogue .name { margin-right: 6px; }
.dialogue .aside { color: #666; font-weight: 400; }
.dialogue .line { margin-top: 4px; }
.stage {
  text-align: center;
  color: #444;
}
.stage-text { font-style: italic; }
.dimmed { opacity: 0.35; }
.empty { padding: 24px; text-align: center; color: #666; }
</style>
