import { describe, expect, it } from 'vitest'
import { createStarterDeck } from '../data/starterDeck'
import { normalizeCards, validateCardForm, type CardFormValues } from './validation'

const valid: CardFormValues = {
  danish: 'en hund',
  gender: 'en',
  phonetic: 'hoon',
  category: 'Daily Life',
  english: 'a dog',
  persian: 'سگ',
  example: 'Vi har en hund.',
}

describe('validateCardForm', () => {
  it('accepts a complete card', () => {
    expect(validateCardForm(valid)).toEqual({})
  })

  it('requires danish, english, persian and example', () => {
    const errors = validateCardForm({ ...valid, danish: ' ', english: '', persian: '', example: '' })
    expect(Object.keys(errors).sort()).toEqual(['danish', 'english', 'example', 'persian'])
  })

  it('rejects non-Persian script in the Persian field', () => {
    expect(validateCardForm({ ...valid, persian: 'dog' }).persian).toMatch(/Persian/)
  })

  it('rejects duplicates already in the deck (case-insensitive)', () => {
    expect(validateCardForm({ ...valid, danish: 'HEJ' }, createStarterDeck()).danish).toMatch(/already/)
  })
})

describe('normalizeCards', () => {
  it('drops invalid entries and duplicate ids, and fills defaults', () => {
    const cards = normalizeCards([
      { id: 'a', danish: 'hej', english: 'hi', gender: 'bogus', status: 'bogus' },
      { id: 'a', danish: 'dup', english: 'dup' },
      { danish: 'no id', english: 'x' },
      null,
    ])
    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({ id: 'a', gender: 'phrase', status: 'new', category: 'Daily Life', updatedAt: 0 })
  })
})

describe('starter deck', () => {
  it('has at least 8 complete cards', () => {
    const deck = createStarterDeck()
    expect(deck.length).toBeGreaterThanOrEqual(8)
    for (const card of deck) {
      for (const key of ['danish', 'gender', 'phonetic', 'english', 'persian', 'example', 'category', 'status'] as const) {
        expect(card[key]).toBeTruthy()
      }
    }
  })
})
