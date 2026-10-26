import {
  CARD_STATUSES,
  DECK_CATEGORIES,
  WORD_TYPES,
  type CardStatus,
  type DeckCategory,
  type Flashcard,
  type WordType,
} from '../types'

export interface CardFormValues {
  danish: string
  gender: WordType
  phonetic: string
  category: DeckCategory
  english: string
  persian: string
  example: string
}

export type CardFormErrors = Partial<Record<keyof CardFormValues, string>>

export const FIELD_MAX_LENGTH = {
  danish: 80,
  phonetic: 80,
  english: 120,
  persian: 120,
  example: 240,
} as const

const PERSIAN_SCRIPT = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/

export function validateCardForm(values: CardFormValues, existing: Flashcard[] = []): CardFormErrors {
  const errors: CardFormErrors = {}
  const danish = values.danish.trim()
  const english = values.english.trim()
  const persian = values.persian.trim()
  const example = values.example.trim()
  const phonetic = values.phonetic.trim()

  if (!danish) {
    errors.danish = 'Danish word or phrase is required.'
  } else if (danish.length > FIELD_MAX_LENGTH.danish) {
    errors.danish = `Keep it under ${FIELD_MAX_LENGTH.danish} characters.`
  } else if (existing.some((card) => card.danish.trim().toLowerCase() === danish.toLowerCase())) {
    errors.danish = 'This word is already in your deck.'
  }

  if (!WORD_TYPES.includes(values.gender)) {
    errors.gender = 'Choose a word type.'
  }

  if (!DECK_CATEGORIES.includes(values.category)) {
    errors.category = 'Choose a category.'
  }

  if (phonetic.length > FIELD_MAX_LENGTH.phonetic) {
    errors.phonetic = `Keep it under ${FIELD_MAX_LENGTH.phonetic} characters.`
  }

  if (!english) {
    errors.english = 'English translation is required.'
  } else if (english.length > FIELD_MAX_LENGTH.english) {
    errors.english = `Keep it under ${FIELD_MAX_LENGTH.english} characters.`
  }

  if (!persian) {
    errors.persian = 'Persian translation is required.'
  } else if (!PERSIAN_SCRIPT.test(persian)) {
    errors.persian = 'Use Persian (Farsi) script for this field.'
  } else if (persian.length > FIELD_MAX_LENGTH.persian) {
    errors.persian = `Keep it under ${FIELD_MAX_LENGTH.persian} characters.`
  }

  if (!example) {
    errors.example = 'An example sentence is required.'
  } else if (example.length > FIELD_MAX_LENGTH.example) {
    errors.example = `Keep it under ${FIELD_MAX_LENGTH.example} characters.`
  }

  return errors
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/** Coerces untrusted data (e.g. from localStorage or a Gist) into a valid Flashcard, or returns null. */
export function normalizeCard(raw: unknown): Flashcard | null {
  if (!raw || typeof raw !== 'object') return null
  const card = raw as Record<string, unknown>
  if (!isString(card.id) || !card.id || !isString(card.danish) || !card.danish.trim()) return null
  if (!isString(card.english)) return null

  const gender = WORD_TYPES.includes(card.gender as WordType) ? (card.gender as WordType) : 'phrase'
  const category = DECK_CATEGORIES.includes(card.category as DeckCategory)
    ? (card.category as DeckCategory)
    : 'Daily Life'
  const status = CARD_STATUSES.includes(card.status as CardStatus) ? (card.status as CardStatus) : 'new'
  const updatedAt = typeof card.updatedAt === 'number' && Number.isFinite(card.updatedAt) ? card.updatedAt : 0

  return {
    id: card.id,
    danish: card.danish,
    gender,
    phonetic: isString(card.phonetic) ? card.phonetic : '',
    english: card.english,
    persian: isString(card.persian) ? card.persian : '',
    example: isString(card.example) ? card.example : '',
    category,
    status,
    updatedAt,
  }
}

export function normalizeCards(raw: unknown): Flashcard[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const cards: Flashcard[] = []
  for (const item of raw) {
    const card = normalizeCard(item)
    if (card && !seen.has(card.id)) {
      seen.add(card.id)
      cards.push(card)
    }
  }
  return cards
}
