/**
 * Sistema de archivos virtual en memoria.
 *
 * No importa Node, Nuxt ni Vue y nunca toca el sistema real: todo el estado
 * vive en el árbol que devuelve `createInitialVfs()`.
 */

export type VfsErrorCode =
  | 'ENOENT'
  | 'ENOTDIR'
  | 'EISDIR'
  | 'EEXIST'
  | 'ENOTEMPTY'

export type VfsDirNode = {
  type: 'dir'
  children: Record<string, VfsNode>
}

export type VfsFileNode = {
  type: 'file'
  content: string
}

export type VfsNode = VfsDirNode | VfsFileNode

export interface Vfs {
  root: VfsDirNode
}

/** Directorio inicial de cada sesión. */
export const HOME_DIR = '/home/guest'

export const VFS_ERROR_MESSAGES: Record<VfsErrorCode, string> = {
  ENOENT: 'No existe el archivo o el directorio',
  ENOTDIR: 'No es un directorio',
  EISDIR: 'Es un directorio',
  EEXIST: 'El archivo ya existe',
  ENOTEMPTY: 'El directorio no está vacío',
}

export class VfsError extends Error {
  readonly code: VfsErrorCode

  constructor(code: VfsErrorCode, message?: string) {
    super(message ?? VFS_ERROR_MESSAGES[code])
    this.name = 'VfsError'
    this.code = code
  }
}

function dir(children: Record<string, VfsNode> = {}): VfsDirNode {
  return { type: 'dir', children }
}

function file(content = ''): VfsFileNode {
  return { type: 'file', content }
}

function hasChild(node: VfsDirNode, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(node.children, name)
}

function childOf(node: VfsDirNode, name: string): VfsNode | undefined {
  return hasChild(node, name) ? node.children[name] : undefined
}

function setChild(parent: VfsDirNode, name: string, node: VfsNode): void {
  // `defineProperty` evita que nombres como `__proto__` actúen sobre el
  // prototipo del objeto y permite representarlos como entradas normales.
  Object.defineProperty(parent.children, name, {
    value: node,
    enumerable: true,
    configurable: true,
    writable: true,
  })
}

/** Contenido inicial determinista, idéntico en servidor y cliente. */
export function createInitialVfs(): Vfs {
  return {
    root: dir({
      home: dir({
        guest: dir({
          'notas.txt': file('Recuerda apagar la luz antes de dormir.'),
          sueno: dir({
            'diario.txt': file('Noche 1: todavia no puedo dormir.'),
          }),
          vacio: dir(),
        }),
      }),
    }),
  }
}

function segments(path: string): string[] {
  return path.split('/').filter((segment) => segment !== '')
}

/**
 * Resuelve una ruta absoluta o relativa a `cwd`, normalizando `.` y `..`.
 * Un `..` en la raíz se queda en la raíz: nunca se escapa de `/`.
 */
export function resolvePath(cwd: string, input: string): string {
  const target = input === '' ? cwd : input
  const absolute = target.startsWith('/') ? target : `${cwd}/${target}`
  const stack: string[] = []

  for (const segment of absolute.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      stack.pop()
      continue
    }
    stack.push(segment)
  }

  return `/${stack.join('/')}`
}

/** Último componente de una ruta ya normalizada. */
export function basename(path: string): string {
  const parts = segments(path)
  return parts[parts.length - 1] ?? '/'
}

/**
 * Busca un nodo. Devuelve `null` si falta el último componente, pero lanza
 * `ENOTDIR` si se intenta atravesar un archivo.
 */
export function findNode(vfs: Vfs, path: string): VfsNode | null {
  let node: VfsNode = vfs.root

  for (const segment of segments(path)) {
    if (node.type !== 'dir') throw new VfsError('ENOTDIR')
    const next = childOf(node, segment)
    if (!next) return null
    node = next
  }

  return node
}

export function getNode(vfs: Vfs, path: string): VfsNode {
  const node = findNode(vfs, path)
  if (!node) throw new VfsError('ENOENT')
  return node
}

function getParent(vfs: Vfs, path: string): { parent: VfsDirNode; name: string } {
  const parts = segments(path)
  const name = parts.pop()
  if (!name) throw new VfsError('EEXIST')

  let node: VfsNode = vfs.root
  for (const segment of parts) {
    if (node.type !== 'dir') throw new VfsError('ENOTDIR')
    const next = childOf(node, segment)
    if (!next) throw new VfsError('ENOENT')
    node = next
  }

  if (node.type !== 'dir') throw new VfsError('ENOTDIR')
  return { parent: node, name }
}

/** Nombres del directorio, ordenados. Lanza `ENOTDIR` si no es un directorio. */
export function listDirectory(vfs: Vfs, path: string): string[] {
  const node = getNode(vfs, path)
  if (node.type !== 'dir') throw new VfsError('ENOTDIR')
  return Object.keys(node.children).sort()
}

/** Contenido de un archivo. Lanza `EISDIR` si la ruta es un directorio. */
export function readFile(vfs: Vfs, path: string): string {
  const node = getNode(vfs, path)
  if (node.type === 'dir') throw new VfsError('EISDIR')
  return node.content
}

export function makeDirectory(vfs: Vfs, path: string): void {
  const { parent, name } = getParent(vfs, path)
  if (hasChild(parent, name)) throw new VfsError('EEXIST')
  setChild(parent, name, dir())
}

/**
 * Crea un archivo vacío si no existe. Si ya existe un archivo o un
 * directorio, no hace nada (como `touch` en coreutils).
 */
export function touchFile(vfs: Vfs, path: string): void {
  const existing = findNode(vfs, path)
  if (existing) return

  const { parent, name } = getParent(vfs, path)
  setChild(parent, name, file())
}

export function removeFile(vfs: Vfs, path: string): void {
  const node = getNode(vfs, path)
  if (node.type === 'dir') throw new VfsError('EISDIR')

  const { parent, name } = getParent(vfs, path)
  delete parent.children[name]
}

export function removeDirectory(vfs: Vfs, path: string): void {
  const node = getNode(vfs, path)
  if (node.type !== 'dir') throw new VfsError('ENOTDIR')
  if (Object.keys(node.children).length > 0) throw new VfsError('ENOTEMPTY')

  const { parent, name } = getParent(vfs, path)
  delete parent.children[name]
}
