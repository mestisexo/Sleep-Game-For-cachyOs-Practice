<script setup lang="ts">
import { computed } from 'vue'

import { useTerminal } from '~/composables/useTerminal'
import type { Posture } from '~/utils/posture'

const { appName } = useRuntimeConfig().public

const { lines, prompt, lastExitCode, submit, navigateHistory } = useTerminal()

const posture = computed<Posture>(() =>
  lastExitCode.value === null || lastExitCode.value === 0 ? 'de-pie' : 'acostado',
)

useHead({
  title: `Terminal · ${appName}`,
  htmlAttrs: { lang: 'es' },
})
</script>

<template>
  <main class="page">
    <header class="header">
      <h1>Sleepgame Terminal</h1>
      <p>
        Escribe comandos para mover al personaje: los aciertos lo mantienen
        despierto y los errores lo tumban.
      </p>
    </header>

    <div class="layout">
      <section class="stage" aria-label="Personaje">
        <PixelCharacter :posture="posture" />
      </section>

      <SimulatedTerminal
        :lines="lines"
        :prompt="prompt"
        :submit="submit"
        :navigate-history="navigateHistory"
      />
    </div>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: #0f172a;
}

.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  min-height: 100vh;
  padding: 2rem 1rem;
  font-family: system-ui, sans-serif;
  background: radial-gradient(circle at 50% 0%, #17233f 0%, #0f172a 60%);
  color: #e2e8f0;
}

.header {
  max-width: 42rem;
  text-align: center;
}

h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}

.header p {
  margin: 0;
  color: #94a3b8;
  line-height: 1.5;
}

.layout {
  display: grid;
  grid-template-columns: minmax(180px, 192px) minmax(0, 1fr);
  align-items: start;
  gap: 2rem;
  width: min(1100px, 100%);
}

.stage {
  --character-size: 192px;

  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: var(--character-size);
  height: var(--character-size);
}

@media (max-width: 760px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .stage {
    --character-size: 144px;

    width: 100%;
    height: var(--character-size);
  }
}

@media (max-width: 380px) {
  .page {
    padding: 1.25rem 0.75rem;
  }

  h1 {
    font-size: 1.625rem;
  }
}
</style>
