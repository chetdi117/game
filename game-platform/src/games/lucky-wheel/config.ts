import type { WheelConfig } from './contracts.ts'

export const WHEEL_CONFIG = {
  radius: 252,
  turns: 6,
  duration: 4600,
  sceneKey: 'lucky-wheel',
  colors: [0xf4cf69, 0x25594c, 0xffa784, 0xf8f2d8, 0xf4cf69],
} as const

export const DEMO_WHEEL: WheelConfig = {
  gameId: 'lucky-wheel',
  name: 'Vòng quay may mắn',
  blocks: [
    { id: 101, name: '10 điểm', probability: 40, type: 'POINT', value: 10 },
    { id: 102, name: '50 điểm', probability: 25, type: 'POINT', value: 50 },
    { id: 103, name: '100 điểm', probability: 10, type: 'POINT', value: 100 },
    { id: 104, name: 'Voucher 50K', probability: 5, type: 'VOUCHER', value: 50000 },
    { id: 105, name: 'Chúc may mắn', probability: 20, type: 'NOTHING', value: 0 },
  ],
}
