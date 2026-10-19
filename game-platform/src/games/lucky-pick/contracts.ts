export interface PickReward {
  id: number
  name: string
  probability: number
  type: 'POINT' | 'VOUCHER' | 'NOTHING'
  value: number
}

export interface PickConfig {
  gameId: string
  name: string
  display: { cardCount: number }
  initialTurns: number
  rewards: PickReward[]
}

export interface PickResult {
  playId: string
  cardIndex: number
  reward: PickReward
  pointsAdded: number
  totalPoints: number
  remainingTurns: number
}
