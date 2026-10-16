import { APP_NAME } from '../constants/app.ts'
import { routeHref } from '../utils/path.ts'

export function renderShell(app: HTMLElement, base: string): HTMLElement {
  app.innerHTML = `
    <div class="site-shell">
      <header class="site-header">
        <a class="brand" data-route href="${routeHref('/', base)}"><span class="brand-icon" aria-hidden="true">✳</span>${APP_NAME}<span class="brand-dot">®</span></a>
        <a class="nav-link" data-route href="${routeHref('/', base)}">Góc trò chơi <span aria-hidden="true">↗</span></a>
        <span class="header-note"><i></i> Một chút may mắn mỗi ngày</span>
      </header>
      <main id="view" tabindex="-1"></main>
      <footer><span>Chơi một chút. Vui một ngày.</span><span>MINI GAMES / BIG SMILES <span aria-hidden="true">✳</span></span></footer>
    </div>`
  return app.querySelector<HTMLElement>('#view')!
}

export function showMessage(host: HTMLElement, title: string, detail: string, base: string): void {
  host.innerHTML = `<section class="message-panel"><span class="eyebrow">LUCKY CLUB</span><h1></h1><p></p><a class="primary-link" data-route href="${routeHref('/', base)}">Về góc trò chơi ↗</a></section>`
  host.querySelector('h1')!.textContent = title
  host.querySelector('p')!.textContent = detail
}

export function renderGameFrame(host: HTMLElement): { stage: HTMLElement; controls: HTMLElement; status: HTMLElement } {
  host.innerHTML = `
    <div class="play-layout">
      <div class="game-stage"></div>
      <aside class="play-sidebar">
        <span class="eyebrow">DÀNH MỘT CHÚT CHO NIỀM VUI</span>
        <h2>Sẵn sàng đón<br />điều bất ngờ?</h2>
        <p class="game-instructions"></p>
        <div class="game-controls"></div>
        <div class="result-box" role="status" aria-live="polite" aria-atomic="true">Vận may đang chờ bạn. Bắt đầu thôi!</div>
        <p class="demo-note">Bản chơi thử · Kết quả ngẫu nhiên, không có giá trị quy đổi.</p>
      </aside>
    </div>`
  return {
    stage: host.querySelector<HTMLElement>('.game-stage')!,
    controls: host.querySelector<HTMLElement>('.game-controls')!,
    status: host.querySelector<HTMLElement>('.result-box')!,
  }
}
