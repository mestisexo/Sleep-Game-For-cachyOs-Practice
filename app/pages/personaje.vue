<script setup lang="ts">
import { POSTURES, POSTURE_LABELS, type Posture } from '~/utils/posture'

const { appName } = useRuntimeConfig().public

const posture = ref<Posture>('de-pie')

useHead({
  title: `Personaje · ${appName}`,
  htmlAttrs: { lang: 'es' },
})
</script>

<template>
  <main class="page">
    <header class="header">
      <h1>El personaje</h1>
      <p>Elige una postura y observa cómo se desploma.</p>
    </header>

    <div class="stage">
      <PixelCharacter :posture="posture" />
    </div>

    <fieldset class="selector">
      <legend class="legend">Postura del personaje</legend>

      <label
        v-for="item in POSTURES"
        :key="item"
        class="option"
        :class="{ 'is-active': posture === item }"
      >
        <input
          v-model="posture"
          class="option__input"
          type="radio"
          name="postura"
          :value="item"
        >
        <span class="option__mark" aria-hidden="true" />
        <span class="option__label">{{ POSTURE_LABELS[item] }}</span>
      </label>
    </fieldset>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
}

.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  min-height: 100vh;
  padding: 2rem 1rem;
  font-family: system-ui, sans-serif;
  background: radial-gradient(circle at 50% 20%, #17233f 0%, #0f172a 60%);
  color: #e2e8f0;
}

.header {
  text-align: center;
}

h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}

p {
  margin: 0;
  color: #94a3b8;
}

.stage {
  --character-size: 288px;

  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: var(--character-size);
}

.selector {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.legend {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.option {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid #334155;
  border-radius: 999px;
  background: #111c33;
  color: #cbd5e1;
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease;
}

.option:hover {
  border-color: #475569;
}

.option.is-active {
  border-color: #93c5fd;
  background: #16233d;
  color: #f8fafc;
  font-weight: 600;
}

.option:focus-within {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

.option__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}

.option__mark {
  width: 0.75rem;
  height: 0.75rem;
  border: 1px solid currentColor;
  border-radius: 2px;
}

.option.is-active .option__mark {
  background: currentColor;
  box-shadow: inset 0 0 0 2px #16233d;
}

@media (max-width: 380px) {
  .stage {
    --character-size: 240px;
  }

  h1 {
    font-size: 1.625rem;
  }
}
</style>
