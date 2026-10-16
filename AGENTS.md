# Agent guidelines for my-phaser-game

## Stack and scope
- This is a TypeScript + Vite + Phaser browser game platform, with Axios for HTTP and SCSS for styles. Do not apply backend C#/.NET conventions here.
- The application lives in `game-platform/`; run commands from the repository root using Yarn workspaces.
- Read existing files and preserve user changes. Use two spaces, UTF-8, LF, and TypeScript strict mode.
- Make focused changes; do not add a framework or dependencies unless needed.

## Code organization
- `src/app/`: application bootstrap, routing and lazy game registry.
- `src/common/`: reusable UI, contracts, lifecycle and components shared by multiple games.
- `src/utils/`: small pure, domain-independent helpers. No DOM, Phaser, or game-specific rules here.
- `src/constants/`: shared constants such as application name, routing paths and canvas dimensions.
- `src/games/<game-id>/`: one independent game per folder, including its scene, config, rules and styles/assets if needed.
- Keep prize tables, colors, durations and game rules in that game's `config.ts`. Do not put game rules into global constants.
- Prefer existing shared implementations. Extract shared code when two games use it; do not turn common/utils into dumping grounds.

## Routing and game lifecycle
- Register a game in `app/game-registry.ts` with a unique id, URL path, metadata and dynamic import.
- Each game exports `mountGame(host)` and returns a cleanup callback.
- Only load the selected game. Destroy its Phaser instance, DOM listeners and timers on navigation.
- Support direct URLs, browser Back/Forward, unknown routes, configured Vite base paths and failed lazy imports.
- Prevent a stale async import from mounting after navigation.
- Use normal links for navigation and buttons for actions. Keep keyboard focus and live status accessible.
- A game must not import another game's implementation.

## Game behavior
- Prevent repeated action while a spin/round is running.
- Use a pure, tested function to align the wheel's selected segment with the pointer.
- Demo outcomes are browser-local; production reward selection and redemption belong on the backend.
- Do not imply demo points or vouchers can be redeemed.

## Validation
- `yarn test`: routing, random helpers and wheel geometry tests.
- `yarn build`: strict TypeScript check and production Vite build.
- Check desktop/mobile layout and route switching in a browser when available.
- Document new game routes and deployment fallback requirements in README.md.

## HTTP and styling
- Use the shared Axios instance in src/common/api/client.ts; keep endpoint-specific services and DTOs within the owning game.
- Configure the public API base URL with VITE_API_BASE_URL. Never bundle service credentials.
- Pass AbortSignal to requests and abort on game cleanup. Preserve backend error responses and handle cancellation separately. Never automatically retry a reward/spin POST.
- Use src/styles/main.scss with @use, shared tokens and responsive mixins. Keep game-only SCSS inside its game directory.
- Tailwind is not installed. Do not add a second styling system without an explicit request.
