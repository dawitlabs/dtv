import type { Action } from 'svelte/action'

export const spatialNav: Action<HTMLElement, { enabled?: boolean } | undefined> = (node, options) => {
  let enabled = options?.enabled !== false

  const getFocusables = () =>
    Array.from(node.querySelectorAll<HTMLElement>('button, a, [tabindex="0"]')).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    )

  function center(el: HTMLElement): { x: number; y: number } {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  function nearest(from: HTMLElement, dx: number, dy: number): HTMLElement | null {
    const focusables = getFocusables()
    const fc = center(from)
    let best: HTMLElement | null = null
    let bestScore = Infinity
    for (const el of focusables) {
      if (el === from) continue
      const ec = center(el)
      const ddx = ec.x - fc.x
      const ddy = ec.y - fc.y
      if (dx !== 0 && Math.sign(ddx) !== Math.sign(dx)) continue
      if (dy !== 0 && Math.sign(ddy) !== Math.sign(dy)) continue
      if (dx === 0 && Math.abs(ddx) > Math.abs(ddy) * 3) continue
      if (dy === 0 && Math.abs(ddy) > Math.abs(ddx) * 3) continue
      const dist = Math.hypot(ddx, ddy)
      if (dist < bestScore) {
        bestScore = dist
        best = el
      }
    }
    return best
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!enabled) return
    const active = document.activeElement as HTMLElement
    if (!node.contains(active)) return

    const dirs: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }
    const dir = dirs[e.key]
    if (!dir) return
    e.preventDefault()
    e.stopPropagation()

    const target = nearest(active, dir[0], dir[1])
    if (target) {
      target.focus()
      target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    }
  }

  node.addEventListener('keydown', handleKeydown)

  return {
    update(newOptions) {
      enabled = newOptions?.enabled !== false
    },
    destroy() {
      node.removeEventListener('keydown', handleKeydown)
    },
  }
}
