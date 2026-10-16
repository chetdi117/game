import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePath, routeHref, routePath } from '../src/utils/path.ts'

test('normalizes root and trailing slashes', () => {
  assert.equal(normalizePath(''), '/')
  assert.equal(routePath('/games/lucky-wheel/', '/'), '/games/lucky-wheel')
})
test('supports deployment in a subdirectory without matching sibling prefixes', () => {
  assert.equal(routePath('/arcade/games/lucky-wheel', '/arcade/'), '/games/lucky-wheel')
  assert.equal(routePath('/arcade', '/arcade/'), '/')
  assert.equal(routePath('/arcade-other/games/lucky-wheel', '/arcade/'), null)
  assert.equal(routeHref('/games/lucky-wheel', '/arcade/'), '/arcade/games/lucky-wheel')
  assert.equal(routeHref('/', '/'), '/')
})
