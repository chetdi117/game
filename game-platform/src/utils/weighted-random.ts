export function selectWeightedItem<T extends { probability: number }>(blocks: readonly T[], roll: number): T {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 100
    || blocks.some(block => !Number.isFinite(block.probability) || block.probability < 0)
    || blocks.reduce((sum, block) => sum + block.probability, 0) !== 100) {
    throw new RangeError('Invalid reward probabilities or roll.')
  }
  let cumulative = 0
  for (const block of blocks) {
    cumulative += block.probability
    if (roll < cumulative) return block
  }
  throw new RangeError('No reward found.')
}

