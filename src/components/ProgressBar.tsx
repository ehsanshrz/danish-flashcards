import type { Flashcard } from '../types'

export function ProgressBar({ cards }: { cards: Flashcard[] }) {
  const total = cards.length
  const mastered = cards.filter((card) => card.status === 'mastered').length
  const learning = cards.filter((card) => card.status === 'learning').length
  const unseen = total - mastered - learning
  const pct = (count: number) => (total ? (count / total) * 100 : 0)

  return (
    <section aria-label="Study progress" className="w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Mastered {mastered}
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="size-2.5 rounded-full bg-amber-500" /> Needs practice {learning}
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="size-2.5 rounded-full bg-slate-700" /> New {unseen}
          </span>
        </div>
        <span className="font-medium text-slate-300">{total} cards</span>
      </div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={mastered}
        aria-valuetext={`${mastered} mastered, ${learning} need practice, ${total} total`}
      >
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct(mastered)}%` }} />
        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${pct(learning)}%` }} />
      </div>
    </section>
  )
}
