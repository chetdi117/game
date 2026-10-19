import type { PickConfig } from './contracts.ts'

export const DEMO_PICK: PickConfig = {
  gameId: 'lucky-pick',
  name: 'Lucky You',
  display: { cardCount: 8 },
  initialTurns: 3,
  rewards: [
    { id: 201, name: '10 điểm', probability: 25, type: 'POINT', value: 10 },
    { id: 202, name: '50 điểm', probability: 10, type: 'POINT', value: 50 },
    { id: 203, name: '100 điểm', probability: 6, type: 'POINT', value: 100 },
    { id: 204, name: 'Voucher 50K', probability: 3, type: 'VOUCHER', value: 50000 },
    { id: 205, name: 'May mắn lần sau', probability: 25, type: 'NOTHING', value: 0 },
    { id: 206, name: '20 điểm', probability: 8, type: 'POINT', value: 20 },
    { id: 207, name: '30 điểm', probability: 6, type: 'POINT', value: 30 },
    { id: 208, name: '40 điểm', probability: 5, type: 'POINT', value: 40 },
    { id: 209, name: '60 điểm', probability: 4, type: 'POINT', value: 60 },
    { id: 210, name: '80 điểm', probability: 3, type: 'POINT', value: 80 },
    { id: 211, name: '150 điểm', probability: 2, type: 'POINT', value: 150 },
    { id: 212, name: '200 điểm', probability: 1.5, type: 'POINT', value: 200 },
    { id: 213, name: 'Voucher 10K', probability: 0.75, type: 'VOUCHER', value: 10000 },
    { id: 214, name: 'Voucher 20K', probability: 0.5, type: 'VOUCHER', value: 20000 },
    { id: 215, name: 'Voucher 100K', probability: 0.125, type: 'VOUCHER', value: 100000 },
    { id: 216, name: '500 điểm', probability: 0.125, type: 'POINT', value: 500 },
  ],}

export const PICK_DISPLAY = { maxCards: 12, revealDuration: 650 } as const
