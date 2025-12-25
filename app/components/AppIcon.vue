<template>
  <div class="app-icon" v-html="data" />
</template>

<script setup>
import { consola } from 'consola';

const props = defineProps({ name: { type: String, required: true } });
const data = ref('');
const getIcon = async () => {
  const icons = import.meta.glob('~/assets/icon/**/**.svg', {
    query: '?raw',
    import: 'default',
    eager: true,
  });
  if (!props.name?.trim()) return; // if empty name
  const path = Object.keys(icons).find(p => p.endsWith(`/${props.name}.svg`));
  if (!path) return consola.warn(`icon '${props.name}.svg' not found in 'assets/icon'`);
  data.value = icons[path];
};
import.meta.server ? await getIcon() : watchEffect(getIcon);
</script>

<style lang="scss">
.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 1em;
    height: 1em;
  }
}
</style>
