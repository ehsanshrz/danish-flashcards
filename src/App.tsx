import {
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Keyboard,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { AddCardModal } from './components/AddCardModal'
import { CategoryFilter } from './components/CategoryFilter'
import { ConnectGitHubModal } from './components/ConnectGitHubModal'
import { FlipCard } from './components/FlipCard'
import { ProgressBar } from './components/ProgressBar'
import { SyncBadge } from './components/SyncBadge'
import { useDeck } from './hooks/useDeck'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { CardStatus, CategoryFilter as Filter } from './types'
import { isSpeechSupported, speakDanish } from './utils/speech'
import type { CardFormValues } from './utils/validation'

type OpenModal = 'connect' | 'add' | null

const SHORTCUTS: [string, string][] = [
  ['Space', 'Flip card'],
  ['←', 'Previous'],
  ['→', 'Next'],
  ['↑', 'Pronounce'],
  ['1', 'Still learning'],
  ['2', 'Mastered'],
]

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="min-w-6 rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-center font-mono text-xs text-slate-200">
      {children}
    </kbd>
  )
}

export default function App() {
  const { cards, config, syncStatus, syncError, connect, disconnect, syncNow, setCardStatus, addCard } = useDeck()
  const [filter, setFilter] = useState<Filter>('All')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [modal, setModal] = useState<OpenModal>(null)
  const speechSupported = useMemo(() => isSpeechSupported(), [])

  const filtered = useMemo(
    () => (filter === 'All' ? cards : cards.filter((card) => card.category === filter)),
    [cards, filter],
  )
  const foundIndex = filtered.findIndex((card) => card.id === currentId)
  const index = foundIndex === -1 ? 0 : foundIndex
  const current = filtered[index]

  const goTo = useCallback(
    (offset: number) => {
      if (filtered.length === 0) return
      const nextIndex = (index + offset + filtered.length) % filtered.length
      setCurrentId(filtered[nextIndex].id)
      setFlipped(false)
    },
    [filtered, index],
  )

  const flip = useCallback(() => {
    if (current) setFlipped((value) => !value)
  }, [current])

  const pronounce = useCallback(() => {
    if (current) speakDanish(current.danish)
  }, [current])

  const mark = useCallback(
    (status: CardStatus) => {
      if (!current) return
      setCardStatus(current.id, status)
      goTo(1)
    },
    [current, goTo, setCardStatus],
  )

  const shortcuts = useMemo(
    () => ({
      next: () => goTo(1),
      previous: () => goTo(-1),
      flip,
      pronounce,
      learning: () => mark('learning'),
      mastered: () => mark('mastered'),
    }),
    [flip, goTo, mark, pronounce],
  )
  useKeyboardShortcuts(shortcuts, modal === null)

  const changeFilter = (next: Filter) => {
    setFilter(next)
    setCurrentId(null)
    setFlipped(false)
  }

  const handleAdd = (values: CardFormValues) => {
    const card = addCard(values)
    if (filter !== 'All' && filter !== card.category) setFilter(card.category)
    setCurrentId(card.id)
    setFlipped(false)
  }

  const closeModal = useCallback(() => setModal(null), [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-900/40">
              <BookOpen className="size-5" />
            </span>
            <div>
              <h1 className="text-base leading-tight font-bold text-slate-50">Danish Flashcards</h1>
              <p className="text-xs text-slate-400">Lær dansk · English · فارسی</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SyncBadge
              status={syncStatus}
              error={syncError}
              username={config?.username}
              onClick={() => (syncStatus === 'error' ? syncNow() : setModal('connect'))}
            />
            <button
              type="button"
              onClick={() => setModal('connect')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
            >
              <KeyRound className="size-4" />
              <span className="hidden sm:inline">{config ? `@${config.username}` : 'Connect GitHub'}</span>
            </button>
            <button
              type="button"
              onClick={() => setModal('add')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add card</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:py-8">
        <CategoryFilter value={filter} onChange={changeFilter} cards={cards} />
        <ProgressBar cards={filtered} />

        {current ? (
          <>
            <div className="mx-auto w-full max-w-2xl">
              <FlipCard
                card={current}
                flipped={flipped}
                onFlip={flip}
                onSpeak={pronounce}
                speechSupported={speechSupported}
              />
            </div>

            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goTo(-1)}
                aria-label="Previous card"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => mark('learning')}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25"
                >
                  <Brain className="size-4" /> Still learning <Kbd>1</Kbd>
                </button>
                <button
                  type="button"
                  onClick={() => mark('mastered')}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
                >
                  <Check className="size-4" /> Mastered <Kbd>2</Kbd>
                </button>
              </div>
              <button
                type="button"
                onClick={() => goTo(1)}
                aria-label="Next card"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            <p className="text-center text-sm text-slate-400" aria-live="polite">
              Card {index + 1} of {filtered.length}
              <button
                type="button"
                onClick={flip}
                className="ml-3 inline-flex items-center gap-1 text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="size-3.5" /> Flip
              </button>
            </p>
          </>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-800 p-10 text-center">
            <p className="text-slate-300">No cards in this category yet.</p>
            <button
              type="button"
              onClick={() => setModal('add')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              <Plus className="size-4" /> Add a card
            </button>
          </div>
        )}

        <section
          aria-label="Keyboard shortcuts"
          className="mx-auto hidden w-full max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500 sm:flex"
        >
          <Keyboard className="size-4" />
          {SHORTCUTS.map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5">
              <Kbd>{key}</Kbd> {label}
            </span>
          ))}
        </section>
      </main>

      {modal === 'connect' && (
        <ConnectGitHubModal config={config} onConnect={connect} onDisconnect={disconnect} onClose={closeModal} />
      )}
      {modal === 'add' && (
        <AddCardModal
          existingCards={cards}
          defaultCategory={filter === 'All' ? undefined : filter}
          onAdd={handleAdd}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
