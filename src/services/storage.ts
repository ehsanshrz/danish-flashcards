import { createStarterDeck } from '../data/starterDeck'
import type { Flashcard, GitHubConfig } from '../types'
import { normalizeCards } from '../utils/validation'

export const CARDS_KEY = 'danish-flashcards:cards'
export const GITHUB_CONFIG_KEY = 'danish-flashcards:github'

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be full or unavailable (e.g. private mode); the app keeps working in memory.
  }
}

export function loadCards(): Flashcard[] {
  const stored = read(CARDS_KEY)
  if (stored === null) return createStarterDeck()
  return normalizeCards(stored)
}

/** Parses a raw localStorage value (e.g. from a cross-tab `storage` event) into cards. */
export function parseStoredCards(raw: string | null): Flashcard[] {
  if (!raw) return []
  try {
    return normalizeCards(JSON.parse(raw))
  } catch {
    return []
  }
}

export function saveCards(cards: Flashcard[]): void {
  write(CARDS_KEY, cards)
}

export function loadGitHubConfig(): GitHubConfig | null {
  const stored = read(GITHUB_CONFIG_KEY) as Partial<GitHubConfig> | null
  if (!stored || typeof stored.token !== 'string' || !stored.token || typeof stored.username !== 'string') {
    return null
  }
  return {
    token: stored.token,
    username: stored.username,
    gistId: typeof stored.gistId === 'string' && stored.gistId ? stored.gistId : undefined,
  }
}

export function saveGitHubConfig(config: GitHubConfig): void {
  write(GITHUB_CONFIG_KEY, config)
}

export function clearGitHubConfig(): void {
  try {
    localStorage.removeItem(GITHUB_CONFIG_KEY)
  } catch {
    // ignore
  }
}
