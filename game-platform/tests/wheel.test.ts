import test from 'node:test'
import assert from 'node:assert/strict'
import { targetRotation, indexAtPointer } from '../src/games/lucky-wheel/math.ts'
import { randomIndex } from '../src/utils/random.ts'

test('every selected prize stops under the pointer from arbitrary starting angles', () => {
  for (const count of [3, 5, 8, 12]) {
    for (const start of [-720, -45, 0, 120, 359, 4000]) {
      for (let index = 0; index < count; index++) {
        const target = targetRotation(start, index, count, 6)
        assert.equal(indexAtPointer(target, count), index)
        assert.ok(target - start >= 6 * 360)
        assert.ok(target - start < 7 * 360)
      }
    }
  }
})
test('rejects invalid prize indices and spin parameters', () => {
  assert.throws(() => targetRotation(0, 8, 8, 6), RangeError)
  assert.throws(() => targetRotation(0, 0, 0, 6), RangeError)
  assert.throws(() => targetRotation(0, 0, 8, 0), RangeError)
})
test('random index stays within bounds and rejects invalid lengths', () => {
  assert.equal(randomIndex(1), 0)
  for (let i = 0; i < 200; i++) assert.ok(randomIndex(8) >= 0 && randomIndex(8) < 8)
  for (const value of [0, -1, 1.5, Infinity, 2 ** 32 + 1]) assert.throws(() => randomIndex(value), RangeError)
})
