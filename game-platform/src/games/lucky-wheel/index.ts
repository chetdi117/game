import Phaser from 'phaser'
import { GAME_CANVAS } from '../../constants/app.ts'
import type { Cleanup } from '../../common/game.ts'
import { renderGameFrame } from '../../common/layout.ts'
import axios from 'axios'
import { createWheelApi } from './api.ts'
import type { WheelConfig } from './contracts.ts'
import { WHEEL_CONFIG } from './config.ts'
import { normalizeDegrees, targetRotation } from './math.ts'

export function mountGame(host: HTMLElement): Cleanup {
  const { stage, controls, status } = renderGameFrame(host)
  host.querySelector('.game-instructions')!.textContent = 'Demo 3 lượt quay. Điểm và voucher không có giá trị quy đổi. Tải lại trang để chơi lại.'
  stage.setAttribute('role', 'img')
  stage.setAttribute('aria-label', 'Vòng quay năm ô thưởng')
  controls.innerHTML = '<button class="spin-button" type="button" disabled>Đang tải vòng quay…</button><span class="control-note">Mỗi vòng quay là một bất ngờ mới</span>'
  const button = controls.querySelector<HTMLButtonElement>('button')!
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
      button.textContent = 'Quay ngay ↗'
    }

    private async startSpin(): Promise<void> {
      if (spinning || disposed) return
      spinning = true
      button.disabled = true
      button.textContent = 'May mắn đang đến…'
      status.textContent = 'Vòng quay đang chạy. Cùng chờ một chút nhé!'
      try {
        const result = await api.spin(crypto.randomUUID(), controller.signal)
        if (disposed) return
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
            button.textContent = result.remainingSpins > 0 ? 'Quay tiếp' : 'Đã hết lượt demo'
            button.disabled = result.remainingSpins === 0
            spinning = false
          },
        })
      } catch (error) {
        if (disposed || axios.isCancel(error)) return
        status.textContent = axios.isAxiosError(error)
          ? String(error.response?.data?.message ?? error.message)
          : error instanceof Error ? error.message : 'Unable to spin.'
        button.textContent = 'Retry'
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
    controller.abort()
    game?.destroy(true)
    host.replaceChildren()
  }
}
