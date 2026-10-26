import type { CardStatus, WordType } from '../types'

const WORD_TYPE_STYLES: Record<WordType, string> = {
  en: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  et: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  verb: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  phrase: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
}

const STATUS_STYLES: Record<CardStatus, string> = {
  new: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  learning: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  mastered: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
}

const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset'

export function WordTypeBadge({ type }: { type: WordType }) {
  return <span className={`${base} ${WORD_TYPE_STYLES[type]}`}>{type}</span>
}

export function StatusBadge({ status }: { status: CardStatus }) {
  return <span className={`${base} ${STATUS_STYLES[status]}`}>{status}</span>
}
