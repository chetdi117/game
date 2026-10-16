export interface WheelBlock {
  id: number
  name: string
  probability: number
  type: 'POINT' | 'VOUCHER' | 'NOTHING'
  value: number
}
export interface WheelConfig {
  gameId: string
  name: string
  blocks: WheelBlock[]
}
export interface SpinResult {
  spinId: string
  reward: WheelBlock
  pointsAdded: number
  totalPoints: number
  remainingSpins: number
}

