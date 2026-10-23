/**
 * Tokenizador y despacho de líneas de la terminal.
 *
 * Los metacaracteres de shell (`|`, `>`, `;`, `&&`, `$()`, backticks) se
 * tratan como texto: aquí no se expande ni se ejecuta nada.
 */

import { COMMANDS, type ExecResult, type ShellState } from './commands.ts'

export type { ExecResult, ShellState } from './commands.ts'

export class ShellSyntaxError extends SyntaxError {
  constructor(message: string) {
    super(message)
    this.name = 'ShellSyntaxError'
  }
}

/**
 * Divide una línea en argumentos respetando comillas simples y dobles y el
 * escape con `\`. Una comilla sin cerrar lanza `ShellSyntaxError`.
 */
export function tokenize(line: string): string[] {
  const tokens: string[] = []
  let current = ''
  let started = false
  let quote: '"' | "'" | null = null

  for (let index = 0; index < line.length; index++) {
    const char = line[index]!
    const next = line[index + 1]

    if (quote === "'") {
      if (char === "'") quote = null
      else current += char
      continue
    }

    if (quote === '"') {
      if (char === '\\' && next !== undefined) {
        current += next
        index++
      } else if (char === '"') {
        quote = null
      } else {
        current += char
      }
      continue
    }

    if (char === '\\' && next !== undefined) {
      current += next
      index++
      started = true
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      started = true
      continue
    }

    if (/\s/.test(char)) {
      if (started) {
        tokens.push(current)
        current = ''
        started = false
      }
      continue
    }

    current += char
    started = true
  }

  if (quote !== null) {
    throw new ShellSyntaxError(`bash: error de sintaxis: falta cerrar la comilla ${quote}`)
  }

  if (started) tokens.push(current)

  return tokens
}

/**
 * Ejecuta una línea contra el estado de la sesión.
 *
 * Devuelve `null` para una línea vacía o compuesta solo por espacios: no se
 * ejecuta nada y la postura del personaje no cambia.
 */
export function executeLine(state: ShellState, line: string): ExecResult | null {
  let tokens: string[]

  try {
    tokens = tokenize(line)
  } catch (error) {
    if (error instanceof ShellSyntaxError) {
      return { stdout: [], stderr: [error.message], code: 2 }
    }
    throw error
  }

  if (tokens.length === 0) return null

  const [name, ...args] = tokens
  const command = COMMANDS.get(name!)

  if (!command) {
    return { stdout: [], stderr: [`${name}: orden no encontrada`], code: 127 }
  }

  return command(args, state)
}
