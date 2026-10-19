import type { PickConfig } from './contracts.ts'
import { PICK_DISPLAY } from './config.ts'

export function validatePickConfig(config: PickConfig): void {
  const count = config.display.cardCount
  if (!Number.isInteger(count) || count < 1 || count > PICK_DISPLAY.maxCards
    || !Number.isInteger(config.initialTurns) || config.initialTurns < 1) {
    throw new RangeError('Invalid card count or initial turns.')
  }
}
