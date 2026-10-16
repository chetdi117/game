import Phaser from 'phaser'
import { GAME_CANVAS } from '../../constants/app.ts'
import type { Cleanup } from '../../common/game.ts'
import { renderGameFrame } from '../../common/layout.ts'
import { randomIndex } from '../../utils/random.ts'
import { WHEEL_CONFIG } from './config.ts'
import { normalizeDegrees, targetRotation } from './math.ts'

export function mountGame(host: HTMLElement): Cleanup {
  const { stage, controls, status } = renderGameFrame(host)
  host.querySelector('.game-instructions')!.textContent = 'Nhấn quay và để vòng quay chọn một món quà tinh thần dành riêng cho bạn.'
  stage.setAttribute('role', 'img')
  stage.setAttribute('aria-label', 'Vòng quay tám ô quà với kim chỉ ở phía trên')
  controls.innerHTML = '<button class="spin-button" type="button" disabled>Đang tải vòng quay…</button><span class="control-note">Mỗi vòng quay là một bất ngờ mới</span>'
  const button = controls.querySelector<HTMLButtonElement>('button')!
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
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
      const segment = Math.PI * 2 / WHEEL_CONFIG.prizes.length
      WHEEL_CONFIG.prizes.forEach((prize, index) => {
        const start = -Math.PI / 2 + index * segment
        const end = start + segment
        const graphics = this.add.graphics()
        graphics.fillStyle(prize.color)
        graphics.beginPath()
        graphics.moveTo(0, 0)
        graphics.arc(0, 0, radius, start, end)
        graphics.closePath()
        graphics.fillPath()
        graphics.lineStyle(2, 0x214e40, 0.25)
        graphics.strokePath()
        const angle = start + segment / 2
        const label = this.add.text(Math.cos(angle) * 175, Math.sin(angle) * 175, prize.label, {
          fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold', color: prize.ink,
        }).setOrigin(0.5).setRotation(angle + Math.PI / 2)
        const dot = this.add.circle(Math.cos(angle) * 225, Math.sin(angle) * 225, 4, prize.color === 0x25594c ? 0xf4cf69 : 0x25594c)
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
      spin = () => this.startSpin()
      button.disabled = false
      button.textContent = 'Quay ngay ↗'
    }

    private startSpin(): void {
      if (spinning || disposed) return
      spinning = true
      button.disabled = true
      button.textContent = 'May mắn đang đến…'
      status.textContent = 'Vòng quay đang chạy. Cùng chờ một chút nhé!'
      const index = randomIndex(WHEEL_CONFIG.prizes.length)
      const rotation = this.wheel.angle
      this.tweens.add({
        targets: this.wheel,
        angle: targetRotation(rotation, index, WHEEL_CONFIG.prizes.length, WHEEL_CONFIG.turns),
        duration: reducedMotion ? 150 : WHEEL_CONFIG.duration,
        ease: 'Cubic.Out',
        onComplete: () => {
          if (disposed) return
          this.wheel.angle = normalizeDegrees(this.wheel.angle)
          status.textContent = '✦ Bạn nhận được: ' + WHEEL_CONFIG.prizes[index].value + '!'
          button.textContent = 'Thử thêm lần nữa ↗'
          button.disabled = false
          spinning = false
        },
      })
    }
  }

  const game = new Phaser.Game({
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
  const onSpin = (): void => spin?.()
  button.addEventListener('click', onSpin)
  return () => {
    disposed = true
    spin = undefined
    button.removeEventListener('click', onSpin)
    game.destroy(true)
    host.replaceChildren()
  }
}
