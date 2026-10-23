export const POSTURES = ['de-pie', 'semi-de-pie', 'semi-acostado', 'acostado'] as const

export type Posture = (typeof POSTURES)[number]

export const POSTURE_LABELS: Record<Posture, string> = {
  'de-pie': 'De pie',
  'semi-de-pie': 'Semi de pie',
  'semi-acostado': 'Semi acostado',
  'acostado': 'Acostado',
}

/** Duración del fundido cruzado entre dos sprites contiguos. */
export const FADE_MS = 260

/** Intervalo entre pasos cuando la transición recorre varias posturas. */
export const STEP_MS = 180

export function postureIndex(posture: Posture): number {
  return POSTURES.indexOf(posture)
}

/**
 * Posturas que hay que recorrer para ir de `from` a `to`, sin incluir el
 * origen e incluyendo el destino. En un salto no contiguo devuelve las
 * intermedias en orden, de forma que el cambio se lea como movimiento.
 */
export function posturePath(from: Posture, to: Posture): Posture[] {
  const start = postureIndex(from)
  const end = postureIndex(to)

  if (start === -1 || end === -1 || start === end) return [to]

  const step = start < end ? 1 : -1
  const path: Posture[] = []

  for (let index = start + step; ; index += step) {
    path.push(POSTURES[index]!)
    if (index === end) break
  }

  return path
}
