import { games } from './game-registry.ts'
import { APP_NAME } from '../constants/app.ts'
import { renderShell, showMessage } from '../common/layout.ts'
import type { Cleanup } from '../common/game.ts'
import { routeHref, routePath } from '../utils/path.ts'

export function startRouter(app: HTMLElement): Cleanup {
  const base = import.meta.env.BASE_URL
  const view = renderShell(app, base)
  let disposeGame: Cleanup | undefined
  let revision = 0

  async function render(): Promise<void> {
    const current = ++revision
    disposeGame?.()
    disposeGame = undefined
    const path = routePath(location.pathname, base)
    document.title = APP_NAME
    view.focus({ preventScroll: true })

    if (path === '/') {
      view.innerHTML = `
        <section class="hero">
          <div><span class="eyebrow"><span class="tiny-star">✳</span> CHÀO MỪNG ĐẾN GÓC VUI NHỎ</span>
          <h1>Chạm một chút.<br /><span>May mắn một ngày.</span></h1>
          <p>Tạm gác bận rộn. Chọn một trò chơi, thử vận may<br class="desktop-break" /> và mang một nụ cười về nhé.</p></div>
          <div class="hero-stamp" aria-hidden="true"><span>GOOD THINGS<br />ARE COMING</span><b>✳</b><span>LUCKY YOU!</span></div>
        </section>
        <section aria-labelledby="games-title"><div class="section-heading"><h2 id="games-title">Chọn niềm vui của bạn</h2><span>02 TRÒ CHƠI / VÔ VÀN BẤT NGỜ</span></div>
        <div class="game-grid">${games.map(game => `
          <a class="game-card" data-route href="${routeHref(game.path, base)}">
            <div class="card-art art-${game.art}"><span class="art-label">${game.tag}</span>
            ${game.art === 'wheel' ? '<div class="mini-wheel"><span>✳</span></div><span class="art-spark spark-one">✧</span><span class="art-spark spark-two">✦</span>' : '<div class="mini-cards"><span>?</span><span>✳</span><span>?</span></div>'}
            <span class="art-caption">A LITTLE PLAY, A LOT OF JOY.</span></div>
            <div class="card-content"><span class="card-number">/${game.number}</span><h3>${game.title}</h3><p>${game.description}</p><span class="card-cta">Chơi ngay <span aria-hidden="true">↗</span></span></div>
          </a>`).join('')}</div></section>`
      return
    }

    const game = games.find(item => item.path === path)
    if (!game) {
      showMessage(view, 'Bạn đi lạc một chút rồi.', 'Trò chơi này chưa có trong Lucky Club. Cùng quay về chọn một trò nhé.', base)
      return
    }
    document.title = game.title + ' · ' + APP_NAME
    view.innerHTML = `
      <div class="game-heading"><a data-route href="${routeHref('/', base)}">← Tất cả trò chơi</a><span class="eyebrow">GAME /${game.number}</span><h1>${game.title}</h1><p>${game.description}</p></div>
      <section class="game-host" aria-label="${game.title}"><p class="loading" role="status">Đang chuẩn bị niềm vui…</p></section>`
    const host = view.querySelector<HTMLElement>('.game-host')!
    try {
      const module = await game.load()
      if (current !== revision) return
      disposeGame = module.mountGame(host)
    } catch (error) {
      if (current !== revision) return
      console.error('Unable to load game:', error)
      showMessage(host, 'Chưa tải được trò chơi.', 'Kiểm tra kết nối và tải lại trang để thử lại nhé.', base)
    }
  }

  const onClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-route]') : null
    if (!link || link.target || link.hasAttribute('download')) return
    const url = new URL(link.href)
    if (url.origin !== location.origin || routePath(url.pathname, base) === null) return
    event.preventDefault()
    history.pushState(null, '', url.pathname + url.search + url.hash)
    void render()
  }
  const onPopState = (): void => { void render() }
  app.addEventListener('click', onClick)
  window.addEventListener('popstate', onPopState)
  void render()
  return () => {
    revision++
    disposeGame?.()
    app.removeEventListener('click', onClick)
    window.removeEventListener('popstate', onPopState)
  }
}
