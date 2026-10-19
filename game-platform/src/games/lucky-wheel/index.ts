import Phaser from 'phaser'
import { GAME_CANVAS } from '../../constants/app.ts'
import type { Cleanup } from '../../common/game.ts'
import { routeHref } from '../../utils/path.ts'
import './style.scss'
import axios from 'axios'
import { createWheelApi } from './api.ts'
import type { WheelConfig } from './contracts.ts'
import { WHEEL_CONFIG } from './config.ts'
import { normalizeDegrees, targetRotation } from './math.ts'

export function mountGame(host: HTMLElement): Cleanup {
  document.body.classList.add('wheel-playing')
  host.innerHTML = `<section class="wheel-screen" aria-label="Vòng quay may mắn">
    <header class="wheel-hud">
      <a class="wheel-back" data-route href="${routeHref('/', import.meta.env.BASE_URL)}" aria-label="Về danh sách game">←</a>
      <h1>Vòng quay may mắn</h1>
      <div class="wheel-turns" aria-live="polite">Còn <strong>3</strong> lượt</div>
    </header>
    <div class="wheel-play-area">
      <div class="wheel-stage">
        <button class="wheel-touch" type="button" disabled aria-label="Chạm vào bánh xe để quay" aria-describedby="wheel-hint"></button>
      </div>
    </div>
    <div class="wheel-feedback">
      <p id="wheel-hint" class="wheel-hint">Đang tải vòng quay…</p>
      <p class="wheel-result" role="status" aria-live="polite" aria-atomic="true"></p>
      <p class="wheel-demo">Chơi thử · Điểm và voucher không có giá trị quy đổi.</p>
    </div>
  </section>`
  const stage = host.querySelector<HTMLElement>('.wheel-stage')!
  const button = host.querySelector<HTMLButtonElement>('.wheel-touch')!
  const status = host.querySelector<HTMLElement>('.wheel-result')!
  const hint = host.querySelector<HTMLElement>('.wheel-hint')!
  const turns = host.querySelector<HTMLElement>('.wheel-turns strong')!
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const controller = new AbortController()
  const api = createWheelApi()
  let config: WheelConfig
  let game: Phaser.Game | undefined
  let spinning = false
  let disposed = false
  let spin: (() => void) | undefined

  class WheelScene extends Phaser.Scene {
    private wheel!: Phaser.GameObjects.Container

    constructor() { super(WHEEL_CONFIG.sceneKey) }

    create(): void {
      if (disposed) return
      const center = GAME_CANVAS.width / 2
      const radius = WHEEL_CONFIG.radius
      this.add.circle(center, center + 12, radius + 22, 0x163b30, 0.12)
      this.add.circle(center, center, radius + 18, 0x214e40)
      this.add.circle(center, center, radius + 7, 0xf6d775)
      this.wheel = this.add.container(center, center)
      const segment = Math.PI * 2 / config.blocks.length
      config.blocks.forEach((prize, index) => {
        const color = WHEEL_CONFIG.colors[index % WHEEL_CONFIG.colors.length]
        const start = -Math.PI / 2 + index * segment
        const end = start + segment
        const graphics = this.add.graphics()
        graphics.fillStyle(color)
        graphics.beginPath()
        graphics.moveTo(0, 0)
        graphics.arc(0, 0, radius, start, end)
        graphics.closePath()
        graphics.fillPath()
        graphics.lineStyle(2, 0x214e40, 0.25)
        graphics.strokePath()
        const angle = start + segment / 2
        const label = this.add.text(Math.cos(angle) * 175, Math.sin(angle) * 175, prize.name, {
          fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold', color: color === 0x25594c ? '#ffffff' : '#213d35',
        }).setOrigin(0.5).setRotation(angle + Math.PI / 2)
        const dot = this.add.circle(Math.cos(angle) * 225, Math.sin(angle) * 225, 4, color === 0x25594c ? 0xf4cf69 : 0x25594c)
        this.wheel.add([graphics, label, dot])
      })
      for (let index = 0; index < 24; index++) {
        const angle = index * Math.PI * 2 / 24
        this.add.circle(center + Math.cos(angle) * (radius + 12), center + Math.sin(angle) * (radius + 12), 3, 0xfff5cf)
      }
      this.add.circle(center, center, 58, 0x214e40)
      this.add.circle(center, center, 49, 0xfff3cf)
      this.add.text(center, center - 4, '✳', { fontFamily: 'Arial', fontSize: '66px', color: '#25594c' }).setOrigin(0.5)
      this.add.triangle(center, center - radius + 9, 0, 0, 34, 0, 17, 40, 0xd65e35).setStrokeStyle(3, 0xfff3cf)
      spin = () => { void this.startSpin() }
      button.disabled = false
      hint.textContent = 'Chạm bánh xe để quay'
    }

    private async startSpin(): Promise<void> {
      if (spinning || disposed) return
      spinning = true
      button.disabled = true
      hint.textContent = 'May mắn đang đến…'
      status.textContent = 'Vòng quay đang chạy. Cùng chờ một chút nhé!'
      try {
        const result = await api.spin(crypto.randomUUID(), controller.signal)
        if (disposed) return
        turns.textContent = String(result.remainingSpins)
        const index = config.blocks.findIndex(block => block.id === result.reward.id)
        if (index < 0) throw new Error('API returned an unknown reward.')
        const rotation = this.wheel.angle
        this.tweens.add({
          targets: this.wheel,
          angle: targetRotation(rotation, index, config.blocks.length, WHEEL_CONFIG.turns),
          duration: reducedMotion ? 150 : WHEEL_CONFIG.duration,
          ease: 'Cubic.Out',
          onComplete: () => {
            if (disposed) return
            this.wheel.angle = normalizeDegrees(this.wheel.angle)
            status.textContent = result.reward.name + ' | Tổng: ' + result.totalPoints + ' điểm demo | Còn ' + result.remainingSpins + ' lượt'
            hint.textContent = result.remainingSpins > 0 ? 'Chạm bánh xe để quay tiếp' : 'Đã hết lượt demo'
            button.disabled = result.remainingSpins === 0
            spinning = false
          },
        })
      } catch (error) {
        if (disposed || axios.isCancel(error)) return
        status.textContent = axios.isAxiosError(error)
          ? String(error.response?.data?.message ?? error.message)
          : error instanceof Error ? error.message : 'Unable to spin.'
        hint.textContent = 'Retry'
        button.disabled = false
        spinning = false
      }
    }
  }

  void api.getConfig(controller.signal).then(data => {
    if (disposed) return
    config = data
    status.textContent = config.name + ' | 0 điểm demo | 3 lượt quay'
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: stage,
      width: GAME_CANVAS.width,
      height: GAME_CANVAS.height,
      transparent: true,
      scene: WheelScene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true },
      audio: { noAudio: true },
    })
  }).catch(error => {
    if (disposed || axios.isCancel(error)) return
    status.textContent = error instanceof Error ? error.message : 'Unable to load wheel.'
  })
  const onSpin = (): void => spin?.()
  button.addEventListener('click', onSpin)
  return () => {
    disposed = true
    spin = undefined
    button.removeEventListener('click', onSpin)
    document.body.classList.remove('wheel-playing')
    controller.abort()
    game?.destroy(true)
    host.replaceChildren()
  }
}
