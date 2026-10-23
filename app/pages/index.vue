<script setup lang="ts">
const { appName } = useRuntimeConfig().public

useHead({
  title: appName,
  htmlAttrs: { lang: 'es' },
})
</script>

<template>
  <main class="page">
    <h1>{{ appName }}</h1>
    <p>Servidor Nuxt 4 en ejecución.</p>
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
  min-height: 100vh;
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}

h1 {
  margin: 0 0 0.5rem;
  font-size: 2.5rem;
}

p {
  margin: 0;
  color: #94a3b8;
}
</style>
