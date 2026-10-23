import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  HOME_DIR,
  VfsError,
  createInitialVfs,
  findNode,
  getNode,
  listDirectory,
  makeDirectory,
  readFile,
  removeDirectory,
  removeFile,
  resolvePath,
  touchFile,
  type Vfs,
} from '../app/utils/terminal/vfs.ts'
import { COMMANDS } from '../app/utils/terminal/commands.ts'
import {
  ShellSyntaxError,
  executeLine,
  tokenize,
} from '../app/utils/terminal/shell.ts'
import {
  MAX_HISTORY,
  MAX_LINES,
  formatPrompt,
  useTerminal,
} from '../app/composables/useTerminal.ts'

function expectVfsError(fn: () => unknown, code: string): void {
  assert.throws(fn, (error: unknown) => {
    assert.ok(error instanceof VfsError, 'se esperaba un VfsError')
    assert.equal(error.code, code)
    return true
  })
}

function newState() {
  return { vfs: createInitialVfs(), cwd: HOME_DIR }
}

function run(state: ReturnType<typeof newState>, line: string) {
  const result = executeLine(state, line)
  assert.ok(result, `la línea "${line}" no debería ser vacía`)
  return result
}


describe('resolvePath', () => {
  it('resuelve rutas relativas desde el directorio actual', () => {
    assert.equal(resolvePath('/home/guest', 'sueno'), '/home/guest/sueno')
    assert.equal(resolvePath('/home/guest/sueno', 'diario.txt'), '/home/guest/sueno/diario.txt')
  })

  it('resuelve rutas absolutas e ignora el directorio actual', () => {
    assert.equal(resolvePath('/home/guest', '/home/guest/notas.txt'), '/home/guest/notas.txt')
    assert.equal(resolvePath('/home/guest/sueno', '/home'), '/home')
  })

  it('normaliza . y ..', () => {
    assert.equal(resolvePath('/home/guest', './sueno/../notas.txt'), '/home/guest/notas.txt')
    assert.equal(resolvePath('/home/guest', '..'), '/home')
    assert.equal(resolvePath('/home/guest', 'sueno/..'), '/home/guest')
    assert.equal(resolvePath('/home/guest', '.'), '/home/guest')
  })

  it('nunca escapa de la raíz', () => {
    assert.equal(resolvePath('/', '..'), '/')
    assert.equal(resolvePath('/', '../..'), '/')
    assert.equal(resolvePath('/home/guest', '../../../../etc'), '/etc')
  })
})

describe('sistema de archivos virtual', () => {
  it('expone el contenido inicial determinista', () => {
    const vfs = createInitialVfs()

    assert.deepEqual(listDirectory(vfs, HOME_DIR), ['notas.txt', 'sueno', 'vacio'])
    assert.equal(readFile(vfs, `${HOME_DIR}/notas.txt`), 'Recuerda apagar la luz antes de dormir.')
    assert.equal(readFile(vfs, `${HOME_DIR}/sueno/diario.txt`), 'Noche 1: todavia no puedo dormir.')
    assert.deepEqual(listDirectory(vfs, `${HOME_DIR}/vacio`), [])

    const second = createInitialVfs()
    assert.deepEqual(second, vfs)
  })

  it('crea y elimina archivos y directorios', () => {
    const vfs = createInitialVfs()

    makeDirectory(vfs, `${HOME_DIR}/nuevo`)
    assert.ok(getNode(vfs, `${HOME_DIR}/nuevo`))

    touchFile(vfs, `${HOME_DIR}/nuevo/archivo.txt`)
    assert.equal(readFile(vfs, `${HOME_DIR}/nuevo/archivo.txt`), '')

    touchFile(vfs, `${HOME_DIR}/nuevo/archivo.txt`)
    assert.equal(readFile(vfs, `${HOME_DIR}/nuevo/archivo.txt`), '')

    removeFile(vfs, `${HOME_DIR}/nuevo/archivo.txt`)
    assert.equal(findNode(vfs, `${HOME_DIR}/nuevo/archivo.txt`), null)

    removeDirectory(vfs, `${HOME_DIR}/nuevo`)
    assert.equal(findNode(vfs, `${HOME_DIR}/nuevo`), null)
  })

  it('falla con ENOENT cuando la ruta no existe', () => {
    const vfs = createInitialVfs()
    expectVfsError(() => getNode(vfs, '/noexiste.txt'), 'ENOENT')
    expectVfsError(() => readFile(vfs, `${HOME_DIR}/falta.txt`), 'ENOENT')
    expectVfsError(() => makeDirectory(vfs, `${HOME_DIR}/falta/hijo`), 'ENOENT')
    expectVfsError(() => removeFile(vfs, '/noexiste.txt'), 'ENOENT')
    expectVfsError(() => removeDirectory(vfs, '/noexiste'), 'ENOENT')
  })

  it('falla con ENOTDIR al atravesar un archivo', () => {
    const vfs = createInitialVfs()
    expectVfsError(() => listDirectory(vfs, `${HOME_DIR}/notas.txt`), 'ENOTDIR')
    expectVfsError(() => getNode(vfs, `${HOME_DIR}/notas.txt/hijo`), 'ENOTDIR')
    expectVfsError(() => removeDirectory(vfs, `${HOME_DIR}/notas.txt`), 'ENOTDIR')
  })

  it('falla con EISDIR al leer o borrar un directorio', () => {
    const vfs = createInitialVfs()
    expectVfsError(() => readFile(vfs, `${HOME_DIR}/sueno`), 'EISDIR')
    expectVfsError(() => removeFile(vfs, `${HOME_DIR}/sueno`), 'EISDIR')
    expectVfsError(() => removeFile(vfs, '/'), 'EISDIR')
  })

  it('falla con EEXIST al crear algo que ya existe', () => {
    const vfs = createInitialVfs()
    expectVfsError(() => makeDirectory(vfs, HOME_DIR), 'EEXIST')
    expectVfsError(() => makeDirectory(vfs, `${HOME_DIR}/notas.txt`), 'EEXIST')
  })

  it('falla con ENOTEMPTY al borrar un directorio con contenido', () => {
    const vfs = createInitialVfs()
    expectVfsError(() => removeDirectory(vfs, `${HOME_DIR}/sueno`), 'ENOTEMPTY')
  })

  it('trata nombres especiales como entradas normales', () => {
    const vfs: Vfs = createInitialVfs()

    makeDirectory(vfs, `${HOME_DIR}/__proto__`)
    touchFile(vfs, `${HOME_DIR}/__proto__/constructor`)
    assert.ok(getNode(vfs, `${HOME_DIR}/__proto__`))
    assert.ok(getNode(vfs, `${HOME_DIR}/__proto__/constructor`))
    assert.deepEqual(listDirectory(vfs, `${HOME_DIR}/__proto__`), ['constructor'])
  })
})

describe('comandos', () => {
  it('registra exactamente los doce comandos', () => {
    assert.equal(COMMANDS.size, 12)
    assert.deepEqual([...COMMANDS.keys()].sort(), [
      'cat',
      'cd',
      'clear',
      'echo',
      'help',
      'ls',
      'mkdir',
      'pwd',
      'rm',
      'rmdir',
      'touch',
      'whoami',
    ])
  })

  it('ejecuta con éxito cada comando', () => {
    const state = newState()

    let result = run(state, 'help')
    assert.equal(result.code, 0)
    assert.ok(result.stdout.includes('Comandos disponibles:'))

    assert.deepEqual(run(state, 'pwd').stdout, ['/home/guest'])
    assert.deepEqual(run(state, 'whoami').stdout, ['guest'])
    assert.deepEqual(run(state, 'echo hola mundo').stdout, ['hola mundo'])
    assert.deepEqual(run(state, 'ls').stdout, ['notas.txt', 'sueno', 'vacio'])
    assert.deepEqual(run(state, 'ls notas.txt').stdout, ['notas.txt'])
    assert.deepEqual(run(state, 'cat notas.txt').stdout, [
      'Recuerda apagar la luz antes de dormir.',
    ])
    assert.deepEqual(run(state, 'cat sueno/diario.txt').stdout, [
      'Noche 1: todavia no puedo dormir.',
    ])

    assert.deepEqual(run(state, 'mkdir nuevo').stdout, [])
    assert.deepEqual(run(state, 'ls nuevo').stdout, [])
    assert.deepEqual(run(state, 'touch nuevo/archivo.txt').stdout, [])
    assert.deepEqual(run(state, 'ls nuevo').stdout, ['archivo.txt'])
    assert.deepEqual(run(state, 'cat nuevo/archivo.txt').stdout, [])
    assert.deepEqual(run(state, 'rm nuevo/archivo.txt').stdout, [])
    assert.deepEqual(run(state, 'rmdir nuevo').stdout, [])
    assert.deepEqual(run(state, 'rmdir vacio').stdout, [])

    assert.deepEqual(run(state, 'cd sueno').stdout, [])
    assert.equal(state.cwd, '/home/guest/sueno')
    assert.deepEqual(run(state, 'pwd').stdout, ['/home/guest/sueno'])
    assert.deepEqual(run(state, 'cd').stdout, [])
    assert.equal(state.cwd, HOME_DIR)

    result = run(state, 'clear')
    assert.equal(result.code, 0)
    assert.equal(result.clearScreen, true)
    assert.deepEqual(result.stdout, [])
  })

  it('devuelve el código de salida de la tabla para cada error', () => {
    const cases: Array<[string, number]> = [
      ['ls /noexiste', 2],
      ['ls notas.txt/hijo', 2],
      ['cd /noexiste', 1],
      ['cd notas.txt', 1],
      ['cat', 1],
      ['cat /noexiste', 1],
      ['cat sueno', 1],
      ['mkdir', 1],
      ['mkdir notas.txt', 1],
      ['mkdir /sin/padre', 1],
      ['touch', 1],
      ['touch /sin/padre/archivo', 1],
      ['rm', 1],
      ['rm /noexiste', 1],
      ['rm sueno', 1],
      ['rmdir', 1],
      ['rmdir /noexiste', 1],
      ['rmdir notas.txt', 1],
      ['rmdir sueno', 1],
      ['git status', 127],
      ['constructor', 127],
      ['prototype', 127],
      ['__proto__', 127],
      ['toString', 127],
      ['rm -rf /', 1],
      ['echo "sin cerrar', 2],
    ]

    for (const [line, code] of cases) {
      const result = run(newState(), line)
      assert.equal(result.code, code, `código de "${line}"`)
      assert.ok(result.stderr.length > 0, `"${line}" debe escribir en stderr`)
      assert.deepEqual(result.stdout, [], `"${line}" no debe escribir en stdout`)
    }
  })

  it('no permite que nombres heredados se comporten como comandos', () => {
    for (const name of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      const result = run(newState(), name)
      assert.equal(result.code, 127)
      assert.match(result.stderr[0]!, /orden no encontrada/)
    }
  })
})

describe('shell', () => {
  it('tokeniza comillas, escapes y argumentos vacíos', () => {
    assert.deepEqual(tokenize("echo 'hola mundo' \"adios mundo\""), [
      'echo',
      'hola mundo',
      'adios mundo',
    ])
    assert.deepEqual(tokenize('echo hola\\ mundo'), ['echo', 'hola mundo'])
    assert.deepEqual(tokenize('echo ""'), ['echo', ''])
    assert.deepEqual(tokenize('   '), [])
  })

  it('rechaza comillas sin cerrar con código 2', () => {
    assert.throws(() => tokenize("echo 'sin cerrar"), ShellSyntaxError)
    assert.throws(() => tokenize('echo "sin cerrar'), ShellSyntaxError)
    assert.deepEqual(run(newState(), "echo 'sin cerrar").code, 2)
  })

  it('trata los metacaracteres como texto literal', () => {
    const state = newState()

    assert.deepEqual(run(state, 'echo "$(whoami)"').stdout, ['$(whoami)'])
    assert.deepEqual(run(state, 'echo "hola | rm"').stdout, ['hola | rm'])
    assert.deepEqual(run(state, 'echo hola > notas.txt').stdout, ['hola > notas.txt'])
    assert.deepEqual(run(state, 'echo hola; rm notas.txt').stdout, ['hola; rm notas.txt'])
    assert.deepEqual(run(state, 'echo `whoami`').stdout, ['`whoami`'])

    assert.equal(
      readFile(state.vfs, '/home/guest/notas.txt'),
      'Recuerda apagar la luz antes de dormir.',
    )
  })

  it('devuelve null para una línea vacía', () => {
    assert.equal(executeLine(newState(), ''), null)
    assert.equal(executeLine(newState(), '    '), null)
    assert.equal(executeLine(newState(), '\t'), null)
  })
})

describe('useTerminal', () => {
  it('parte de un estado determinista con banner, ayuda y prompt', () => {
    const terminal = useTerminal()

    assert.equal(terminal.cwd.value, HOME_DIR)
    assert.equal(terminal.prompt.value, 'guest@sleepgame:~$ ')
    assert.equal(terminal.lastExitCode.value, null)
    assert.deepEqual(terminal.history.value, [])
    assert.equal(terminal.lines.value[0]?.text, 'Sleepgame Terminal')
    assert.ok(terminal.lines.value.some((line) => line.text === 'Comandos disponibles:'))
  })

  it('no altera el código de salida con una línea vacía', () => {
    const terminal = useTerminal()

    terminal.submit('')
    assert.equal(terminal.lastExitCode.value, null)

    terminal.submit('pwd')
    assert.equal(terminal.lastExitCode.value, 0)

    const before = terminal.lines.value.length
    terminal.submit('    ')
    assert.equal(terminal.lastExitCode.value, 0)
    assert.equal(terminal.lines.value.length, before + 1)
    assert.deepEqual(terminal.history.value, ['pwd'])
  })

  it('actualiza el directorio y el prompt al cambiar de carpeta', () => {
    const terminal = useTerminal()

    terminal.submit('cd sueno')
    assert.equal(terminal.cwd.value, '/home/guest/sueno')
    assert.equal(terminal.prompt.value, 'guest@sleepgame:~/sueno$ ')

    terminal.submit('cd /')
    assert.equal(terminal.prompt.value, 'guest@sleepgame:/$ ')
    assert.equal(formatPrompt(HOME_DIR), 'guest@sleepgame:~$ ')
  })

  it('recorre el historial arriba y abajo sin ejecutar', () => {
    const terminal = useTerminal()

    terminal.submit('pwd')
    terminal.submit('whoami')

    assert.equal(terminal.navigateHistory('up'), 'whoami')
    assert.equal(terminal.navigateHistory('up'), 'pwd')
    assert.equal(terminal.navigateHistory('up'), 'pwd')
    assert.equal(terminal.navigateHistory('down'), 'whoami')
    assert.equal(terminal.navigateHistory('down'), '')
    assert.equal(terminal.navigateHistory('down'), '')

    terminal.submit('echo hola')
    assert.equal(terminal.navigateHistory('up'), 'echo hola')
  })

  it('limpia la pantalla con clear y deja el código en 0', () => {
    const terminal = useTerminal()

    terminal.submit('help')
    terminal.submit('git status')
    assert.equal(terminal.lastExitCode.value, 127)

    terminal.submit('clear')
    assert.deepEqual(terminal.lines.value, [])
    assert.equal(terminal.lastExitCode.value, 0)
    assert.equal(terminal.prompt.value, 'guest@sleepgame:~$ ')
  })

  it('recorta la pantalla a 500 líneas y el historial a 100 comandos', () => {
    const terminal = useTerminal()

    for (let index = 0; index < 300; index++) {
      terminal.submit(`echo ${index}`)
    }

    assert.equal(terminal.lines.value.length, MAX_LINES)
    assert.equal(terminal.lines.value.at(-1)?.text, '299')
    assert.equal(terminal.history.value.length, MAX_HISTORY)
    assert.equal(terminal.history.value.at(-1), 'echo 299')
  })

  it('traduce un error en código distinto de cero y un acierto en cero', () => {
    const terminal = useTerminal()

    terminal.submit('git status')
    assert.equal(terminal.lastExitCode.value, 127)

    terminal.submit('pwd')
    assert.equal(terminal.lastExitCode.value, 0)
  })
})


