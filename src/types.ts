export type CardStatus = 'new' | 'learning' | 'mastered'

export type WordType = 'en' | 'et' | 'verb' | 'phrase'

export type DeckCategory = 'Greetings' | 'Food' | 'Verbs' | 'Daily Life' | 'Travel'

export type CategoryFilter = DeckCategory | 'All'

export interface Flashcard {
  id: string
  danish: string
  gender: WordType
  phonetic: string
  english: string
  persian: string
  example: string
  category: DeckCategory
  status: CardStatus
  /** Epoch milliseconds of the last local modification; used to merge local and remote decks. */
  updatedAt: number
}

export interface GitHubConfig {
  token: string
  username: string
  gistId?: string
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error'

export interface DeckData {
  version: 1
  updatedAt: string
  cards: Flashcard[]
}

export const DECK_CATEGORIES: DeckCategory[] = ['Greetings', 'Food', 'Verbs', 'Daily Life', 'Travel']

export const WORD_TYPES: WordType[] = ['en', 'et', 'verb', 'phrase']

export const CARD_STATUSES: CardStatus[] = ['new', 'learning', 'mastered']
