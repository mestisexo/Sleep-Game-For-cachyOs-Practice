<script setup lang="ts">
import {
  FADE_MS,
  POSTURES,
  POSTURE_LABELS,
  STEP_MS,
  posturePath,
  type Posture,
} from '~/utils/posture'

const props = defineProps<{ posture: Posture }>()

const displayed = ref<Posture>(props.posture)
const reducedMotion = ref(false)

let token = 0
let timers: Array<ReturnType<typeof setTimeout>> = []

function clearTimers() {
  for (const timer of timers) clearTimeout(timer)
  timers = []
}

function onReducedMotionChange(event: MediaQueryListEvent) {
  reducedMotion.value = event.matches

  if (!event.matches) return

  token++
  clearTimers()
  displayed.value = props.posture
}

let mediaQuery: MediaQueryList | undefined

if (import.meta.client) {
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onReducedMotionChange)
}

onBeforeUnmount(() => {
  token++
  clearTimers()
  mediaQuery?.removeEventListener('change', onReducedMotionChange)
})

watch(
  () => props.posture,
  (next) => {
    const currentToken = ++token
    clearTimers()

    if (reducedMotion.value) {
      displayed.value = next
      return
    }

    const path = posturePath(displayed.value, next)

    path.forEach((step, index) => {
      if (index === 0) {
        displayed.value = step
        return
      }

      timers.push(
        setTimeout(() => {
          if (token !== currentToken) return
          displayed.value = step
        }, index * STEP_MS),
      )
    })
  },
)
</script>

<template>
  <div
    class="character"
    role="img"
    :aria-label="`Personaje ${POSTURE_LABELS[posture].toLowerCase()}`"
    :style="{ '--fade': `${FADE_MS}ms` }"
  >
    <img
      v-for="item in POSTURES"
      :key="item"
      class="sprite"
      :class="{ 'is-active': item === displayed }"
      :src="`/characters/personaje-${item}.png`"
      :alt="''"
      aria-hidden="true"
      width="288"
      height="288"
      decoding="async"
      draggable="false"
    >
  </div>
</template>

<style scoped>
.character {
  position: relative;
  width: var(--character-size, 288px);
  height: var(--character-size, 288px);
  max-width: 100%;
  image-rendering: pixelated;
}

.sprite {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  image-rendering: pixelated;
  pointer-events: none;
  user-select: none;
  transition: opacity var(--fade, 260ms) ease-in-out;
}

.sprite.is-active {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .sprite {
    transition-duration: 1ms;
  }
}
</style>
