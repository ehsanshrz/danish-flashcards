import { beforeEach, describe, expect, it } from 'vitest'
import { createStarterDeck } from '../data/starterDeck'
import {
  CARDS_KEY,
  clearGitHubConfig,
  loadCards,
  loadGitHubConfig,
  saveCards,
  saveGitHubConfig,
} from './storage'

beforeEach(() => localStorage.clear())

describe('storage', () => {
  it('falls back to the starter deck when nothing is stored', () => {
    expect(loadCards()).toEqual(createStarterDeck())
  })

  it('round-trips cards', () => {
    const cards = createStarterDeck().slice(0, 2).map((c) => ({ ...c, status: 'mastered' as const }))
    saveCards(cards)
    expect(loadCards()).toEqual(cards)
  })

  it('ignores corrupted JSON', () => {
    localStorage.setItem(CARDS_KEY, '{not json')
    expect(loadCards()).toEqual(createStarterDeck())
  })

  it('stores and clears the GitHub config', () => {
    expect(loadGitHubConfig()).toBeNull()
    saveGitHubConfig({ token: 't', username: 'u', gistId: 'g' })
    expect(loadGitHubConfig()).toEqual({ token: 't', username: 'u', gistId: 'g' })
    clearGitHubConfig()
    expect(loadGitHubConfig()).toBeNull()
  })
})
