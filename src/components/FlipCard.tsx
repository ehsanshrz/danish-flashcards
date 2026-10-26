import { Volume2 } from 'lucide-react'
import type { Flashcard } from '../types'
import { StatusBadge, WordTypeBadge } from './Badges'

interface FlipCardProps {
  card: Flashcard
  flipped: boolean
  onFlip: () => void
  onSpeak: () => void
  speechSupported: boolean
}

export function FlipCard({ card, flipped, onFlip, onSpeak, speechSupported }: FlipCardProps) {
  const speakButton = (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onSpeak()
      }}
      disabled={!speechSupported}
      title={speechSupported ? 'Pronounce in Danish (↑)' : 'Speech synthesis is not supported in this browser'}
      aria-label={`Pronounce ${card.danish} in Danish`}
      className="inline-flex size-11 items-center justify-center rounded-full bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Volume2 className="size-5" />
    </button>
  )

  return (
    <div className="flip-scene h-80 w-full sm:h-96">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? `Show Danish side of ${card.danish}` : `Show translation of ${card.danish}`}
        onClick={onFlip}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onFlip()
          }
        }}
        className={`flip-card relative h-full w-full cursor-pointer rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${flipped ? 'is-flipped' : ''}`}
      >
        {/* Front */}
        <div
          className="flip-face absolute inset-0 flex flex-col rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl shadow-black/40 sm:p-8"
          aria-hidden={flipped}
        >
          <div className="flex items-start justify-between gap-3">
            <WordTypeBadge type={card.gender} />
            <span className="text-xs font-medium text-slate-500">{card.category}</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p lang="da" className="text-4xl font-bold break-words text-slate-50 sm:text-5xl">
              {card.danish}
            </p>
            {card.phonetic && <p className="font-mono text-base text-slate-400">/{card.phonetic}/</p>}
            <div className="mt-2">{speakButton}</div>
          </div>
          <p className="text-center text-xs text-slate-500">Click or press Space to flip</p>
        </div>

        {/* Back */}
        <div
          className="flip-face flip-face-back absolute inset-0 flex flex-col rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl shadow-black/40 sm:p-8"
          aria-hidden={!flipped}
        >
          <div className="flex items-start justify-between gap-3">
            <StatusBadge status={card.status} />
            <span lang="da" className="text-sm font-medium text-slate-400">
              {card.danish}
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-3xl font-semibold break-words text-slate-50 sm:text-4xl">{card.english}</p>
            {card.persian && (
              <p dir="rtl" lang="fa" className="text-2xl text-sky-300 sm:text-3xl">
                {card.persian}
              </p>
            )}
            {card.example && (
              <blockquote
                lang="da"
                className="max-w-md rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 italic"
              >
                “{card.example}”
              </blockquote>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
