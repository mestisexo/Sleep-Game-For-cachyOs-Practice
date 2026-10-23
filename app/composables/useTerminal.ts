/**
 * Estado reactivo de una sesión de terminal.
 *
 * Envuelve la simulación pura (`vfs`, `commands`, `shell`) y mantiene los
 * límites de pantalla e historial. El estado inicial es determinista para
 * que el HTML del servidor y el del cliente coincidan.
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'

import { HELP_LINES } from '../utils/terminal/commands.ts'
import { executeLine } from '../utils/terminal/shell.ts'
import { HOME_DIR, createInitialVfs } from '../utils/terminal/vfs.ts'

export type TerminalLineKind = 'system' | 'command' | 'stdout' | 'stderr'

export interface TerminalLine {
  kind: TerminalLineKind
  text: string
}

export type HistoryDirection = 'up' | 'down'

export interface TerminalSession {
  lines: Ref<TerminalLine[]>
  cwd: Ref<string>
  history: Ref<string[]>
  lastExitCode: Ref<number | null>
  prompt: ComputedRef<string>
  submit: (raw: string) => void
  navigateHistory: (direction: HistoryDirection) => string
}

export const MAX_LINES = 500
export const MAX_HISTORY = 100

function initialLines(): TerminalLine[] {
  return [
    { kind: 'system', text: 'Sleepgame Terminal' },
    {
      kind: 'system',
      text: 'Terminal Linux simulada en memoria. Nada de lo que escribas se ejecuta en el sistema real.',
    },
    { kind: 'system', text: '' },
    ...HELP_LINES.map((text): TerminalLine => ({ kind: 'system', text })),
  ]
}

/** `guest@sleepgame:~$ ` con `~` para el directorio inicial. */
export function formatPrompt(cwd: string): string {
  let display = cwd

  if (cwd === HOME_DIR) display = '~'
  else if (cwd.startsWith(`${HOME_DIR}/`)) display = `~${cwd.slice(HOME_DIR.length)}`

  return `guest@sleepgame:${display}$ `
}

export function useTerminal(): TerminalSession {
  const state = { vfs: createInitialVfs(), cwd: HOME_DIR }

  const lines = ref<TerminalLine[]>(initialLines())
  const cwd = ref(state.cwd)
  const history = ref<string[]>([])
  const lastExitCode = ref<number | null>(null)

  // `null` representa el borrador (campo vacío); no necesita reactividad
  // porque solo se consulta desde `navigateHistory`.
  let historyIndex: number | null = null

  const prompt = computed(() => formatPrompt(cwd.value))

  function trimLines(): void {
    if (lines.value.length > MAX_LINES) {
      lines.value = lines.value.slice(-MAX_LINES)
    }
  }

  function remember(raw: string): void {
    history.value.push(raw)
    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(-MAX_HISTORY)
    }
  }

  function submit(raw: string): void {
    lines.value.push({ kind: 'command', text: `${prompt.value}${raw}` })
    historyIndex = null

    if (raw.trim() === '') {
      trimLines()
      return
    }

    remember(raw)

    const result = executeLine(state, raw)
    if (result === null) {
      trimLines()
      return
    }

    if (result.clearScreen) {
      lines.value = []
    } else {
      for (const text of result.stdout) {
        lines.value.push({ kind: 'stdout', text })
      }
      for (const text of result.stderr) {
        lines.value.push({ kind: 'stderr', text })
      }
    }

    lastExitCode.value = result.code
    cwd.value = state.cwd
    trimLines()
  }

  function navigateHistory(direction: HistoryDirection): string {
    if (history.value.length === 0) {
      historyIndex = null
      return ''
    }

    if (direction === 'up') {
      historyIndex =
        historyIndex === null ? history.value.length - 1 : Math.max(0, historyIndex - 1)
      return history.value[historyIndex]!
    }

    if (historyIndex === null) return ''

    const next = historyIndex + 1
    if (next >= history.value.length) {
      historyIndex = null
      return ''
    }

    historyIndex = next
    return history.value[next]!
  }

  return {
    lines,
    cwd,
    history,
    lastExitCode,
    prompt,
    submit,
    navigateHistory,
  }
}
