/**
 * Registro de comandos de la terminal simulada.
 *
 * Cada comando recibe sus argumentos ya tokenizados y el estado de la
 * sesión. Devuelve siempre el mismo contrato (`stdout`, `stderr`, código)
 * para que la interfaz y la postura del personaje dependan de un único
 * resultado.
 */

import {
  HOME_DIR,
  VfsError,
  basename,
  getNode,
  makeDirectory,
  readFile,
  removeDirectory,
  removeFile,
  resolvePath,
  touchFile,
  type Vfs,
} from './vfs.ts'

export interface ExecResult {
  stdout: string[]
  stderr: string[]
  code: number
  clearScreen?: boolean
}

export interface ShellState {
  vfs: Vfs
  cwd: string
}

export type CommandHandler = (args: string[], state: ShellState) => ExecResult

export const HELP_LINES: readonly string[] = [
  'Comandos disponibles:',
  '  help            Muestra esta ayuda.',
  '  clear           Limpia la pantalla.',
  '  pwd             Muestra el directorio actual.',
  '  cd [ruta]       Cambia de directorio.',
  '  ls [ruta]       Lista el contenido de un directorio.',
  '  cat <ruta>      Muestra el contenido de un archivo.',
  '  echo [args]     Escribe los argumentos.',
  '  mkdir <ruta>    Crea un directorio.',
  '  touch <ruta>    Crea un archivo vacío.',
  '  rm <ruta>       Elimina un archivo.',
  '  rmdir <ruta>    Elimina un directorio vacío.',
  '  whoami          Muestra el usuario actual.',
]

function ok(stdout: string[] = []): ExecResult {
  return { stdout, stderr: [], code: 0 }
}

function fail(message: string, code = 1): ExecResult {
  return { stdout: [], stderr: [message], code }
}

function describe(error: unknown): string {
  if (error instanceof VfsError) return error.message
  throw error
}

const help: CommandHandler = () => ok([...HELP_LINES])

const clear: CommandHandler = () => ({
  stdout: [],
  stderr: [],
  code: 0,
  clearScreen: true,
})

const pwd: CommandHandler = (_args, state) => ok([state.cwd])

const whoami: CommandHandler = () => ok(['guest'])

const echo: CommandHandler = (args) => ok([args.join(' ')])

const cd: CommandHandler = (args, state) => {
  const target = args[0] ?? HOME_DIR
  const path = resolvePath(state.cwd, target)

  try {
    const node = getNode(state.vfs, path)
    if (node.type !== 'dir') return fail(`cd: ${target}: No es un directorio`)
    state.cwd = path
    return ok()
  } catch (error) {
    return fail(`cd: ${target}: ${describe(error)}`)
  }
}

const ls: CommandHandler = (args, state) => {
  const target = args[0] ?? '.'
  const path = resolvePath(state.cwd, target)

  try {
    const node = getNode(state.vfs, path)
    if (node.type === 'file') return ok([basename(path)])
    return ok(Object.keys(node.children).sort())
  } catch (error) {
    return fail(`ls: no se puede acceder a '${target}': ${describe(error)}`, 2)
  }
}

const cat: CommandHandler = (args, state) => {
  const target = args[0]
  if (target === undefined) return fail('cat: falta un operando')

  const path = resolvePath(state.cwd, target)

  try {
    const content = readFile(state.vfs, path)
    return ok(content === '' ? [] : content.split('\n'))
  } catch (error) {
    return fail(`cat: ${target}: ${describe(error)}`)
  }
}

const mkdir: CommandHandler = (args, state) => {
  const target = args[0]
  if (target === undefined) return fail('mkdir: falta un operando')

  try {
    makeDirectory(state.vfs, resolvePath(state.cwd, target))
    return ok()
  } catch (error) {
    return fail(`mkdir: no se puede crear el directorio '${target}': ${describe(error)}`)
  }
}

const touch: CommandHandler = (args, state) => {
  const target = args[0]
  if (target === undefined) return fail('touch: falta un operando')

  try {
    touchFile(state.vfs, resolvePath(state.cwd, target))
    return ok()
  } catch (error) {
    return fail(`touch: no se puede crear '${target}': ${describe(error)}`)
  }
}

const rm: CommandHandler = (args, state) => {
  const targets = args.filter((arg) => !arg.startsWith('-'))
  if (targets.length === 0) return fail('rm: falta un operando')

  for (const target of targets) {
    try {
      removeFile(state.vfs, resolvePath(state.cwd, target))
    } catch (error) {
      return fail(`rm: no se puede borrar '${target}': ${describe(error)}`)
    }
  }

  return ok()
}

const rmdir: CommandHandler = (args, state) => {
  const target = args[0]
  if (target === undefined) return fail('rmdir: falta un operando')

  try {
    removeDirectory(state.vfs, resolvePath(state.cwd, target))
    return ok()
  } catch (error) {
    return fail(`rmdir: no se puede borrar '${target}': ${describe(error)}`)
  }
}

/**
 * `Map` en lugar de un objeto literal: nombres heredados como `constructor`,
 * `toString` o `__proto__` no pueden colarse como comandos.
 */
export const COMMANDS: ReadonlyMap<string, CommandHandler> = new Map<
  string,
  CommandHandler
>([
  ['help', help],
  ['clear', clear],
  ['pwd', pwd],
  ['cd', cd],
  ['ls', ls],
  ['cat', cat],
  ['echo', echo],
  ['mkdir', mkdir],
  ['touch', touch],
  ['rm', rm],
  ['rmdir', rmdir],
  ['whoami', whoami],
])
