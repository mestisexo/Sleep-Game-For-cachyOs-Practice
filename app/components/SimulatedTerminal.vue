<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import type {
  HistoryDirection,
  TerminalLine,
} from '~/composables/useTerminal'

const props = defineProps<{
  lines: TerminalLine[]
  prompt: string
  submit: (raw: string) => void
  navigateHistory: (direction: HistoryDirection) => string
}>()

const input = ref('')
const screen = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

function scrollToBottom(): void {
  nextTick(() => {
    if (!screen.value) return
    screen.value.scrollTop = screen.value.scrollHeight
  })
}

function focusInput(): void {
  inputEl.value?.focus()
}

function onSubmit(): void {
  props.submit(input.value)
  input.value = ''
  scrollToBottom()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    input.value = props.navigateHistory('up')
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    input.value = props.navigateHistory('down')
  }
}

watch(() => props.lines.length, scrollToBottom)

onMounted(scrollToBottom)
</script>

<template>
  <section class="terminal" aria-label="Terminal simulada">
    <div
      ref="screen"
      class="screen"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      @click="focusInput"
    >
      <p
        v-for="(line, index) in lines"
        :key="index"
        class="line"
        :class="`line--${line.kind}`"
      >
        {{ line.text }}
      </p>

      <div class="prompt-row">
        <span class="prompt" aria-hidden="true">{{ prompt }}</span>

        <form class="form" @submit.prevent="onSubmit">
          <label class="sr-only" for="terminal-input">Comando</label>
          <input
            id="terminal-input"
            ref="inputEl"
            v-model="input"
            class="input"
            type="text"
            name="command"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            enterkeyhint="send"
            @keydown="onKeydown"
          >
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.terminal {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  height: clamp(280px, 52dvh, 520px);
  border: 1px solid #334155;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #0b1220;
  box-shadow: 0 20px 45px rgb(0 0 0 / 35%);
}

.screen {
  flex: 1;
  min-height: 0;
  padding: 1rem;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.45;
  cursor: text;
  scrollbar-gutter: stable;
}

.line {
  min-height: 1.45em;
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.line--system {
  color: #94a3b8;
}

.line--command {
  color: #93c5fd;
}

.line--stdout {
  color: #e2e8f0;
}

.line--stderr {
  color: #fca5a5;
}

.prompt-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-height: 1.45em;
}

.prompt {
  flex: none;
  color: #4ade80;
  white-space: nowrap;
}

.form {
  display: flex;
  flex: 1;
  min-width: 0;
}

.input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: #f8fafc;
  font: inherit;
  caret-color: #4ade80;
}

.input:focus {
  outline: none;
}

.prompt-row:focus-within .input {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip: rect(0, 0, 0, 0);
}
</style>
