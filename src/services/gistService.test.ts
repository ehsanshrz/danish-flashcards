import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStarterDeck } from '../data/starterDeck'
import type { Flashcard } from '../types'
import {
  GIST_FILENAME,
  GistServiceError,
  createDeckGist,
  fetchDeck,
  findDeckGist,
  mergeDecks,
  parseDeck,
  serializeDeck,
  syncDeck,
  updateDeckGist,
} from './gistService'

const TOKEN = 'test-token'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function gistWith(id: string, cards: Flashcard[]) {
  return { id, files: { [GIST_FILENAME]: { filename: GIST_FILENAME, content: serializeDeck(cards) } } }
}

const card = (overrides: Partial<Flashcard> = {}): Flashcard => ({
  ...createStarterDeck()[0],
  ...overrides,
})

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('findDeckGist', () => {
  it('returns the id of the gist containing the data file and sends auth headers', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        { id: 'other', files: { 'notes.md': {} } },
        { id: 'deck', files: { [GIST_FILENAME]: {} } },
      ]),
    )

    await expect(findDeckGist(TOKEN)).resolves.toBe('deck')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/gists?per_page=100&page=1')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer ' + TOKEN)
  })

  it('paginates and returns null when no gist matches', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: `g${i}`, files: { 'x.txt': {} } }))
    fetchMock.mockResolvedValueOnce(jsonResponse(fullPage)).mockResolvedValueOnce(jsonResponse([]))

    await expect(findDeckGist(TOKEN)).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toContain('page=2')
  })

  it('throws a descriptive error for invalid tokens', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Bad credentials' }, 401))
    await expect(findDeckGist(TOKEN)).rejects.toMatchObject({ status: 401, message: 'Invalid or expired GitHub token.' })
  })
})

describe('createDeckGist / updateDeckGist / fetchDeck', () => {
  it('creates a private gist with the deck file', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'new-gist', files: {} }, 201))
    const cards = createStarterDeck()

    await expect(createDeckGist(TOKEN, cards)).resolves.toBe('new-gist')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/gists')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body as string)
    expect(body.public).toBe(false)
    expect(parseDeck(body.files[GIST_FILENAME].content)).toEqual(cards)
  })

  it('patches the gist with the updated deck', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'abc', files: {} }))
    const cards = [card({ status: 'mastered' })]

    await updateDeckGist(TOKEN, 'abc', cards)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.github.com/gists/abc')
    expect(init.method).toBe('PATCH')
    expect(parseDeck(JSON.parse(init.body as string).files[GIST_FILENAME].content)).toEqual(cards)
  })

  it('pulls and validates the deck from a gist', async () => {
    const cards = [card({ status: 'learning' })]
    fetchMock.mockResolvedValueOnce(jsonResponse(gistWith('abc', cards)))
    await expect(fetchDeck(TOKEN, 'abc')).resolves.toEqual(cards)
  })

  it('downloads truncated files from raw_url', async () => {
    const cards = [card()]
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ id: 'abc', files: { [GIST_FILENAME]: { truncated: true, content: '', raw_url: 'https://raw/x' } } }),
      )
      .mockResolvedValueOnce(new Response(serializeDeck(cards)))
    await expect(fetchDeck(TOKEN, 'abc')).resolves.toEqual(cards)
    expect(fetchMock.mock.calls[1][0]).toBe('https://raw/x')
  })

  it('maps network failures to GistServiceError', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(fetchDeck(TOKEN, 'abc')).rejects.toBeInstanceOf(GistServiceError)
  })
})

describe('mergeDecks', () => {
  it('keeps the most recently updated version of each card and appends local-only cards', () => {
    const remote = [card({ id: 'a', status: 'mastered', updatedAt: 10 }), card({ id: 'b', status: 'new', updatedAt: 5 })]
    const local = [
      card({ id: 'a', status: 'learning', updatedAt: 1 }),
      card({ id: 'b', status: 'learning', updatedAt: 20 }),
      card({ id: 'c', danish: 'ny', updatedAt: 30 }),
    ]

    const merged = mergeDecks(local, remote)
    expect(merged.map((c) => [c.id, c.status])).toEqual([
      ['a', 'mastered'],
      ['b', 'learning'],
      ['c', 'new'],
    ])
  })
})

describe('syncDeck', () => {
  it('creates a new gist when none exists', async () => {
    const local = createStarterDeck()
    fetchMock.mockResolvedValueOnce(jsonResponse([])).mockResolvedValueOnce(jsonResponse({ id: 'created', files: {} }))

    await expect(syncDeck(TOKEN, local)).resolves.toEqual({ gistId: 'created', cards: local, created: true })
    expect(fetchMock.mock.calls[1][1].method).toBe('POST')
  })

  it('pulls an existing gist and does not push when nothing changed locally', async () => {
    const remote = [card({ id: 'a', status: 'mastered', updatedAt: 10 })]
    fetchMock
      .mockResolvedValueOnce(jsonResponse([{ id: 'deck', files: { [GIST_FILENAME]: {} } }]))
      .mockResolvedValueOnce(jsonResponse(gistWith('deck', remote)))

    await expect(syncDeck(TOKEN, [card({ id: 'a', updatedAt: 0 })])).resolves.toEqual({
      gistId: 'deck',
      cards: remote,
      created: false,
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('pushes merged changes back when local progress is newer', async () => {
    const remote = [card({ id: 'a', status: 'new', updatedAt: 1 })]
    const local = [card({ id: 'a', status: 'mastered', updatedAt: 5 })]
    fetchMock
      .mockResolvedValueOnce(jsonResponse(gistWith('known', remote)))
      .mockResolvedValueOnce(jsonResponse({ id: 'known', files: {} }))

    const result = await syncDeck(TOKEN, local, 'known')
    expect(result.cards).toEqual(local)
    expect(fetchMock.mock.calls[1][1].method).toBe('PATCH')
  })

  it('falls back to searching when the remembered gist was deleted', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'Not Found' }, 404))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'fresh', files: {} }, 201))

    await expect(syncDeck(TOKEN, [], 'gone')).resolves.toMatchObject({ gistId: 'fresh', created: true })
  })
})
