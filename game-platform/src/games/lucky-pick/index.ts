import axios from 'axios'
import type { Cleanup } from '../../common/game.ts'
import { routeHref } from '../../utils/path.ts'
import { createPickApi } from './api.ts'
import { PICK_DISPLAY } from './config.ts'
import type { PickConfig } from './contracts.ts'
import { validatePickConfig } from './rules.ts'
import './style.scss'

export function mountGame(host: HTMLElement): Cleanup {
  document.body.classList.add('pick-playing')
  host.innerHTML = `<section class="pick-screen" aria-label="Lucky You">
    <header class="pick-hud">
      <a class="pick-back" data-route href="${routeHref('/', import.meta.env.BASE_URL)}" aria-label="Về danh sách game">←</a>
      <h1>Lucky You</h1>
      <div class="pick-turns" aria-live="polite">Còn <strong>—</strong> lượt</div>
    </header>
    <div class="pick-board" aria-label="Chọn một lá bài"></div>
    <div class="pick-feedback">
      <p class="pick-hint">Đang tải bài…</p>
      <p class="pick-result" role="status" aria-live="polite" aria-atomic="true"></p>
      <p class="pick-disclaimer">Chơi thử · Điểm và voucher không có giá trị quy đổi.</p>
    </div>
  </section>`
  const board = host.querySelector<HTMLElement>('.pick-board')!
  const status = host.querySelector<HTMLElement>('.pick-result')!
  const hint = host.querySelector<HTMLElement>('.pick-hint')!
  const turns = host.querySelector<HTMLElement>('.pick-turns strong')!
  const controller = new AbortController()
  const api = createPickApi()
  let config: PickConfig | undefined
  let disposed = false
  let busy = false
  let remainingTurns = 0
  let revealTimer: ReturnType<typeof setTimeout> | undefined
  let revealed: HTMLButtonElement | undefined

  const resetCards = (): void => {
    board.querySelectorAll<HTMLButtonElement>('.lucky-card').forEach(card => {
      card.classList.remove('is-revealed', 'is-muted')
      card.querySelector('.lucky-card-reward')!.textContent = ''
      card.setAttribute('aria-label', 'Lật lá bài số ' + (Number(card.dataset.index) + 1))
    })
    revealed = undefined
  }

  const play = async (card: HTMLButtonElement): Promise<void> => {
    if (busy || disposed || !config || remainingTurns === 0 || card === revealed) return
    busy = true
    resetCards()
    board.setAttribute('aria-busy', 'true')
    board.querySelectorAll<HTMLButtonElement>('.lucky-card').forEach(item => { item.disabled = true })
    hint.textContent = 'Đang mở vận may…'
    try {
      const result = await api.play(crypto.randomUUID(), Number(card.dataset.index), controller.signal)
      if (disposed) return
      remainingTurns = result.remainingTurns
      turns.textContent = String(remainingTurns)
      revealed = card
      card.querySelector('.lucky-card-reward')!.textContent = result.reward.name
      card.setAttribute('aria-label', result.reward.name)
      card.classList.add('is-revealed')
      board.querySelectorAll<HTMLButtonElement>('.lucky-card').forEach(item => item.classList.toggle('is-muted', item !== card))
      status.textContent = result.reward.name + ' | Tổng: ' + result.totalPoints + ' điểm demo'
      hint.textContent = remainingTurns > 0 ? 'Chọn lá khác để chơi tiếp' : 'Đã hết lượt demo'
      revealTimer = setTimeout(() => {
        if (disposed) return
        busy = false
        board.setAttribute('aria-busy', 'false')
        // A single-card configuration still supports every configured turn.
        if (config?.display.cardCount === 1 && remainingTurns > 0) resetCards()
        board.querySelectorAll<HTMLButtonElement>('.lucky-card').forEach(item => {
          item.disabled = remainingTurns === 0 || item === revealed
        })
        if (config?.display.cardCount === 1 && remainingTurns > 0) hint.textContent = 'Chạm lá bài để chơi tiếp'
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : PICK_DISPLAY.revealDuration)
    } catch (error) {
      if (disposed || axios.isCancel(error)) return
      busy = false
      board.setAttribute('aria-busy', 'false')
      status.textContent = axios.isAxiosError(error)
        ? String(error.response?.data?.message ?? error.message)
        : error instanceof Error ? error.message : 'Không thể mở bài.'
      hint.textContent = 'Chọn lá bài để thử lại'
      board.querySelectorAll<HTMLButtonElement>('.lucky-card').forEach(item => { item.disabled = false })
    }
  }

  const onPick = (event: MouseEvent): void => {
    const card = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.lucky-card') : null
    if (card && board.contains(card)) void play(card)
  }
  board.addEventListener('click', onPick)
  void api.getConfig(controller.signal).then(data => {
    if (disposed) return
    validatePickConfig(data)
    config = data
    remainingTurns = data.initialTurns
    turns.textContent = String(remainingTurns)
    host.querySelector('h1')!.textContent = data.name
    board.dataset.count = String(data.display.cardCount)
    for (let index = 0; index < data.display.cardCount; index++) {
      const card = document.createElement('button')
      card.type = 'button'
      card.className = 'lucky-card'
      card.dataset.index = String(index)
      card.setAttribute('aria-label', 'Lật lá bài số ' + (index + 1))
      card.innerHTML = '<span class="lucky-card-inner"><span class="lucky-card-front" aria-hidden="true"><b>✳</b><small>LUCKY YOU</small></span><span class="lucky-card-back"><b aria-hidden="true">✦</b><span class="lucky-card-reward"></span></span></span>'
      board.append(card)
    }
    hint.textContent = 'Chạm một lá bài để thử vận may'
  }).catch(error => {
    if (disposed || axios.isCancel(error)) return
    hint.textContent = 'Không tải được cấu hình'
    status.textContent = error instanceof Error ? error.message : 'Vui lòng tải lại trang.'
  })

  return () => {
    disposed = true
    controller.abort()
    clearTimeout(revealTimer)
    board.removeEventListener('click', onPick)
    document.body.classList.remove('pick-playing')
    host.replaceChildren()
  }
}
