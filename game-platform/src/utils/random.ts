export function randomIndex(length: number): number {
  if (!Number.isSafeInteger(length) || length < 1 || length > 0x100000000) {
    throw new RangeError('length must be a positive integer up to 2^32.')
  }
  const range = 0x100000000
  const limit = range - range % length
  const values = new Uint32Array(1)
  do {
    crypto.getRandomValues(values)
  } while (values[0] >= limit)
  return values[0] % length
}
