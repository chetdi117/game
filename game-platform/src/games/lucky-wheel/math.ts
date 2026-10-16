export function normalizeDegrees(angle: number): number {
  return ((angle % 360) + 360) % 360
}

// Segment zero begins at twelve o'clock; the fixed pointer is also at twelve.
export function targetRotation(current: number, index: number, count: number, turns: number): number {
  if (!Number.isFinite(current) || !Number.isInteger(count) || count < 1
    || !Number.isInteger(index) || index < 0 || index >= count
    || !Number.isInteger(turns) || turns < 1) {
    throw new RangeError('Invalid wheel rotation parameters.')
  }
  const target = normalizeDegrees(-(index + 0.5) * (360 / count))
  return current + turns * 360 + normalizeDegrees(target - normalizeDegrees(current))
}

export function indexAtPointer(rotation: number, count: number): number {
  return Math.floor(normalizeDegrees(-rotation) / (360 / count))
}
