import type { Cleanup } from '../../common/game.ts'
import { renderGameFrame } from '../../common/layout.ts'
import { randomIndex } from '../../utils/random.ts'
import { PICK_CONFIG } from './config.ts'

export function mountGame(host: HTMLElement): Cleanup {
  const { stage, controls, status } = renderGameFrame(host)
  host.querySelector('.game-instructions')!.textContent = 'Chọn một trong ba chiếc thẻ. Có một lời chúc nhỏ đang đợi bạn ở phía sau.'
  stage.classList.add('pick-stage')
  stage.innerHTML = '<div class="pick-caption">ĐIỀU TỐT ĐẸP NẰM Ở PHÍA SAU</div><div class="pick-cards">' +
    Array.from({ length: PICK_CONFIG.cardCount }, (_, index) =>
      '<button type="button" class="pick-card" aria-label="Lật thẻ số ' + (index + 1) + '"><span>✳</span><small>LUCKY YOU</small></button>').join('') + '</div>'
  controls.innerHTML = '<button type="button" class="spin-button" disabled>Chọn một thẻ bên trái</button><span class="control-note">Tin vào lựa chọn đầu tiên của bạn</span>'
  const reset = controls.querySelector<HTMLButtonElement>('button')!
  const cards = [...stage.querySelectorAll<HTMLButtonElement>('.pick-card')]
  let selected = false
  const onPick = (event: MouseEvent): void => {
    const card = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.pick-card') : null
    if (!card || selected) return
    selected = true
    const reward = PICK_CONFIG.rewards[randomIndex(PICK_CONFIG.rewards.length)]
    cards.forEach(item => { item.disabled = true; item.classList.toggle('not-picked', item !== card) })
    card.classList.add('revealed')
    card.querySelector('span')!.textContent = '✦'
    card.querySelector('small')!.textContent = 'MAY MẮN NÈ!'
    status.textContent = '✦ ' + reward + '!'
    reset.disabled = false
    reset.textContent = 'Chọn lại một điều vui ↗'
  }
  const onReset = (): void => {
    selected = false
    cards.forEach(card => {
      card.disabled = false
      card.classList.remove('revealed', 'not-picked')
      card.querySelector('span')!.textContent = '✳'
      card.querySelector('small')!.textContent = 'LUCKY YOU'
    })
    status.textContent = 'Một lời chúc mới đang chờ bạn!'
    reset.disabled = true
    reset.textContent = 'Chọn một thẻ bên trái'
    cards[0].focus()
  }
  stage.addEventListener('click', onPick)
  reset.addEventListener('click', onReset)
  return () => {
    stage.removeEventListener('click', onPick)
    reset.removeEventListener('click', onReset)
    host.replaceChildren()
  }
}
