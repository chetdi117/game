# my-phaser-game

Một source Vite + TypeScript chứa nhiều mini game độc lập. Game vòng quay dùng Phaser; chỉ tải engine khi mở game đó.

## Chạy local

Yêu cầu Node.js hỗ trợ Vite 8 (20.19+ hoặc 22.12+) và Yarn 4.

```sh
yarn install
yarn dev
yarn test
yarn build
yarn preview
```

Chạy lệnh ở thư mục gốc `my-phaser-game`. App nằm trong workspace `game-platform`.

## Routes

| URL | Nội dung |
| --- | --- |
| `/` | Trang chọn game |
| `/games/lucky-wheel` | Vòng quay may mắn, tám ô, animation và kết quả |
| `/games/lucky-pick` | Game lật một trong ba thẻ |
| URL khác | Trang không tìm thấy |

Có lazy loading, điều hướng không tải lại trang, Back/Forward và cleanup khi rời game.

## Cấu trúc

```text
game-platform/src/
  app/                  # Router và registry các game
  common/               # UI/layout và contract dùng chung
  constants/            # Hằng số chung
  utils/                # Hàm thuần dùng chung
  games/
    lucky-wheel/        # Phaser scene, cấu hình quà, công thức góc quay
    lucky-pick/         # Game thẻ độc lập và cấu hình lời chúc
```

Không đặt logic riêng của một game vào common/utils. Không import chéo giữa các game.

## Thêm game

1. Tạo `src/games/<id>/index.ts` và `config.ts`.
2. Export `mountGame(host: HTMLElement): () => void`. Hàm trả về phải hủy game instance, listener, timer và DOM.
3. Thêm path vào `constants/app.ts` và metadata + dynamic import vào `app/game-registry.ts`.
4. Thêm test cho luật game, chạy `yarn test` và `yarn build`.

## Deploy

Build output: `game-platform/dist`. Static host phải rewrite các đường dẫn không phải file về `index.html` để mở trực tiếp hoặc refresh game route.

Ví dụ Nginx tại domain root:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Nếu deploy dưới `/arcade/`, đổi `base` trong `vite.config.ts` thành `/arcade/` và cấu hình fallback về `/arcade/index.html`. Router tự lấy base từ Vite.

## Bản chơi thử

Kết quả được chọn ngẫu nhiên trong trình duyệt. Điểm/lời chúc không có giá trị quy đổi. Khi tích hợp quà thật, backend phải quyết định kết quả và quản lý lượt chơi/đổi thưởng; frontend chỉ hiển thị và animate kết quả.

## API — Axios

Client dùng chung: `game-platform/src/common/api/client.ts`.
Factory dùng cho test hoặc dịch vụ khác: `create-api-client.ts`.
Base URL và timeout mặc định ở `constants/api.ts`. Lỗi HTTP/network được truyền về caller; không tự retry POST hoặc đổi lỗi thành kết quả thành công.

Copy `game-platform/.env.example` thành `game-platform/.env.local`, chỉnh `VITE_API_BASE_URL`, rồi khởi động lại Vite. Cấu hình `VITE_*` là dữ liệu public trong bundle, không đặt secret/service API key ở đây. Backend khác origin cần cho phép CORS cho origin của frontend.

Ví dụ service đặt tại `games/<id>/api.ts` (thay endpoint và DTO bằng contract backend thật):

```ts
import { apiClient } from '../../common/api/client.ts'

interface GameConfig {
  id: string
  title: string
}

export async function getGameConfig(id: string, signal: AbortSignal): Promise<GameConfig> {
  const { data } = await apiClient.get<GameConfig>(
    '/games/' + encodeURIComponent(id),
    { signal },
  )
  return data
}
```

Trong `mountGame`, tạo `AbortController`; truyền signal cho các request và gọi `controller.abort()` trong cleanup. Caller xử lý cancellation riêng với `axios.isCancel(error)`, hiển thị lỗi API trong UI khi cần. Không tự retry request quay/đổi thưởng. Game demo chưa gọi backend do chưa có contract API.

## Styles — SCSS

Entry: `src/styles/main.scss`, dùng Sass `@use`:
- `_tokens.scss`: màu sắc và breakpoints dùng chung.
- `_mixins.scss`: responsive mixins.
- `_base.scss`: font, reset và CSS custom properties.
- `_layout.scss`: shell, trang chọn game và cards.
- `_game.scss`: giao diện chơi game dùng chung hiện tại.
- `_responsive.scss`: responsive overrides, giữ thứ tự cascade hiện tại.

Khi game mới có styles riêng, đặt `games/<id>/style.scss` và import từ entry game đó để Vite tải cùng game. Dùng tokens/mixins qua `@use '../../styles/tokens'` / `@use '../../styles/mixins'`.

SCSS là lựa chọn styling hiện tại. Chưa cài Tailwind; Tailwind v4 không được thiết kế để chạy qua Sass. Nếu bổ sung sau, giữ entry CSS của Tailwind riêng và quyết định rõ phạm vi của hai hệ styling.
