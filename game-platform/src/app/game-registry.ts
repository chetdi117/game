import type { GameDefinition } from '../common/game.ts'
import { GAME_PATHS } from '../constants/app.ts'

export const games: readonly GameDefinition[] = [
  {
    id: 'lucky-wheel',
    path: GAME_PATHS.luckyWheel,
    title: 'Vòng quay may mắn',
    description: 'Một vòng quay, tám điều bất ngờ. Hôm nay vận may sẽ gọi tên bạn?',
    number: '01',
    tag: 'THỬ VẬN MAY',
    art: 'wheel',
    load: () => import('../games/lucky-wheel/index.ts'),
  },
  {
    id: 'lucky-pick',
    path: GAME_PATHS.luckyPick,
    title: 'Lật thẻ bất ngờ',
    description: 'Chạm lá bài bí mật, khám phá vận may của bạn.' ,
    number: '02',
    tag: 'CHỌN ĐIỀU BẤT NGỜ',
    art: 'cards',
    load: () => import('../games/lucky-pick/index.ts'),
  },
]
