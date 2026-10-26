import { useEffect, useRef } from 'react'

export type ShortcutHandlers = Partial<Record<'next' | 'previous' | 'flip' | 'pronounce' | 'learning' | 'mastered', () => void>>

const KEY_MAP: Record<string, keyof ShortcutHandlers> = {
  ArrowRight: 'next',
  ArrowLeft: 'previous',
  ' ': 'flip',
  ArrowUp: 'pronounce',
  '1': 'learning',
  '2': 'mastered',
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** Registers global study shortcuts. Ignored while `enabled` is false or when typing in a form field. */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true): void {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
      const action = KEY_MAP[event.key]
      if (!action) return
      if (isEditableTarget(event.target)) return
      const handler = handlersRef.current[action]
      if (!handler) return
      event.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
