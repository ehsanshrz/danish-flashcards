import { DECK_CATEGORIES, type CategoryFilter as Filter, type Flashcard } from '../types'

interface CategoryFilterProps {
  value: Filter
  onChange: (value: Filter) => void
  cards: Flashcard[]
}

const FILTERS: Filter[] = ['All', ...DECK_CATEGORIES]

export function CategoryFilter({ value, onChange, cards }: CategoryFilterProps) {
  return (
    <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const count = filter === 'All' ? cards.length : cards.filter((card) => card.category === filter).length
        const active = filter === value
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            aria-pressed={active}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition ${
              active
                ? 'bg-sky-500 text-slate-950 ring-sky-400'
                : 'bg-slate-900 text-slate-300 ring-slate-800 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            {filter}
            <span className={`ml-1.5 text-xs ${active ? 'text-slate-900/70' : 'text-slate-500'}`}>{count}</span>
          </button>
        )
      })}
    </nav>
  )
}
