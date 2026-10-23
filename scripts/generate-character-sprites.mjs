#!/usr/bin/env node
// Genera los cuatro sprites pixelados del personaje (48x48, PNG RGBA).
// Sin dependencias: codificador PNG mínimo sobre zlib.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SIZE = 48
const PIVOT_X = 23.5
const PIVOT_Y = 30

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'characters')

const COLORS = {
  outline: [27, 36, 64, 255],
  hair: [74, 58, 92, 255],
  skin: [232, 201, 168, 255],
  pajama: [143, 167, 216, 255],
  pajamaDark: [113, 136, 184, 255],
  eye: [27, 36, 64, 255],
  mouth: [176, 106, 106, 255],
}

/** Dibuja la figura de pie sobre un lienzo transparente. */
function drawFigure(eyes) {
  const buffer = Buffer.alloc(SIZE * SIZE * 4)

  const put = (x, y, color) => {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return
    const i = (y * SIZE + x) * 4
    buffer[i] = color[0]
    buffer[i + 1] = color[1]
    buffer[i + 2] = color[2]
    buffer[i + 3] = color[3]
  }

  const fill = (x0, y0, x1, y1, color) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) put(x, y, color)
    }
  }

  // Piernas y pies
  fill(19, 34, 22, 43, COLORS.pajamaDark)
  fill(26, 34, 29, 43, COLORS.pajamaDark)
  fill(18, 44, 22, 45, COLORS.outline)
  fill(26, 44, 30, 45, COLORS.outline)

  // Torso
  fill(16, 20, 31, 34, COLORS.outline)
  fill(17, 21, 30, 33, COLORS.pajama)

  // Brazos
  fill(13, 21, 16, 32, COLORS.outline)
  fill(14, 22, 15, 31, COLORS.pajama)
  fill(31, 21, 34, 32, COLORS.outline)
  fill(32, 22, 33, 31, COLORS.pajama)

  // Manos
  fill(14, 31, 15, 32, COLORS.skin)
  fill(32, 31, 33, 32, COLORS.skin)

  // Cabeza
  fill(18, 7, 29, 20, COLORS.outline)
  fill(19, 8, 28, 19, COLORS.skin)

  // Pelo
  fill(19, 8, 28, 11, COLORS.hair)
  fill(19, 12, 20, 14, COLORS.hair)
  fill(27, 12, 28, 14, COLORS.hair)

  // Ojos según el grado de sueño
  if (eyes === 'open') {
    fill(21, 14, 22, 15, COLORS.eye)
    fill(25, 14, 26, 15, COLORS.eye)
  } else if (eyes === 'half') {
    fill(21, 15, 22, 15, COLORS.eye)
    fill(25, 15, 26, 15, COLORS.eye)
  } else {
    fill(20, 15, 22, 15, COLORS.eye)
    fill(25, 15, 27, 15, COLORS.eye)
  }

  // Boca
  fill(23, 17, 24, 17, COLORS.mouth)

  return buffer
}

/** Rota alrededor de la cadera con muestreo al vecino más cercano. */
function rotate(source, degrees) {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const out = Buffer.alloc(SIZE * SIZE * 4)

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - PIVOT_X
      const dy = y - PIVOT_Y
      const sx = Math.round(PIVOT_X + dx * cos + dy * sin)
      const sy = Math.round(PIVOT_Y - dx * sin + dy * cos)
      if (sx < 0 || sy < 0 || sx >= SIZE || sy >= SIZE) continue

      const si = (sy * SIZE + sx) * 4
      const di = (y * SIZE + x) * 4
      out[di] = source[si]
      out[di + 1] = source[si + 1]
      out[di + 2] = source[si + 2]
      out[di + 3] = source[si + 3]
    }
  }

  return out
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i++) {
    let value = (crc ^ buffer[i]) & 0xff
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    crc = (crc >>> 8) ^ value
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(rgba, width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // profundidad de bits
  header[9] = 6 // color RGBA
  header[10] = 0
  header[11] = 0
  header[12] = 0

  const stride = width * 4 + 1
  const raw = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0 // filtro None
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4)
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Vista ASCII para revisar la silueta sin abrir el archivo. */
function preview(rgba) {
  const rows = []
  for (let y = 0; y < SIZE; y++) {
    let row = ''
    for (let x = 0; x < SIZE; x++) {
      const alpha = rgba[(y * SIZE + x) * 4 + 3]
      if (alpha === 0) {
        row += ' '
        continue
      }
      const r = rgba[(y * SIZE + x) * 4]
      row += r < 40 ? '#' : r > 200 ? '.' : r > 120 ? 'o' : '*'
    }
    rows.push(row.replace(/\s+$/, ''))
  }
  return rows.join('\n')
}

const SPRITES = [
  { name: 'personaje-de-pie', eyes: 'open', angle: 0 },
  { name: 'personaje-semi-de-pie', eyes: 'half', angle: 30 },
  { name: 'personaje-semi-acostado', eyes: 'closed', angle: 60 },
  { name: 'personaje-acostado', eyes: 'closed', angle: 90 },
]

mkdirSync(OUT_DIR, { recursive: true })

for (const sprite of SPRITES) {
  const pixels = rotate(drawFigure(sprite.eyes), sprite.angle)
  const file = join(OUT_DIR, `${sprite.name}.png`)
  writeFileSync(file, encodePng(pixels, SIZE, SIZE))
  console.log(`\n${sprite.name}.png (${sprite.angle}°)`)
  console.log(preview(pixels))
}
