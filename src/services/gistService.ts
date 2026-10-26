import type { DeckData, Flashcard } from '../types'
import { normalizeCards } from '../utils/validation'

export const GITHUB_API = 'https://api.github.com'
export const GIST_FILENAME = 'danish-flashcards-data.json'
export const GIST_DESCRIPTION = 'Danish Flashcards – deck & mastery progress'

const MAX_GIST_PAGES = 10
const GIST_PAGE_SIZE = 100

export class GistServiceError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GistServiceError'
    this.status = status
  }
}

interface GistFile {
  filename?: string
  content?: string
  truncated?: boolean
  raw_url?: string
}

interface GistResponse {
  id: string
  files: Record<string, GistFile | null>
}

function headers(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer ' + token,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${GITHUB_API}${path}`, {
      ...init,
      headers: {
        ...headers(token),
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new GistServiceError('Network error – could not reach GitHub.', 0)
  }

  if (!response.ok) {
    let detail = ''
    try {
      const body = (await response.json()) as { message?: string }
      detail = body.message ?? ''
    } catch {
      // ignore unparsable error bodies
    }
    const message =
      response.status === 401
        ? 'Invalid or expired GitHub token.'
        : response.status === 403 || response.status === 404
          ? `GitHub denied access${detail ? `: ${detail}` : ''}. Make sure the token has the "gist" scope.`
          : `GitHub API error (${response.status})${detail ? `: ${detail}` : ''}`
    throw new GistServiceError(message, response.status)
  }

  return (await response.json()) as T
}

export function serializeDeck(cards: Flashcard[]): string {
  const data: DeckData = { version: 1, updatedAt: new Date().toISOString(), cards }
  return JSON.stringify(data, null, 2)
}

export function parseDeck(content: string): Flashcard[] {
  try {
    const parsed = JSON.parse(content) as Partial<DeckData> | Flashcard[]
    return normalizeCards(Array.isArray(parsed) ? parsed : parsed.cards)
  } catch {
    return []
  }
}

/**
 * Merges two decks by card id. When a card exists in both, the most recently updated
 * version wins (ties favour the remote copy). Card order follows the remote deck, with
 * local-only cards appended.
 */
export function mergeDecks(local: Flashcard[], remote: Flashcard[]): Flashcard[] {
  const localById = new Map(local.map((card) => [card.id, card]))
  const merged: Flashcard[] = remote.map((remoteCard) => {
    const localCard = localById.get(remoteCard.id)
    localById.delete(remoteCard.id)
    return localCard && localCard.updatedAt > remoteCard.updatedAt ? localCard : remoteCard
  })
  return [...merged, ...localById.values()]
}

export function decksEqual(a: Flashcard[], b: Flashcard[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Validates the token and returns the GitHub login it belongs to. */
export async function getAuthenticatedUser(token: string): Promise<string> {
  const user = await request<{ login: string }>(token, '/user')
  return user.login
}

/** Searches the user's gists (GET /gists) for one containing the flashcard data file. */
export async function findDeckGist(token: string): Promise<string | null> {
  for (let page = 1; page <= MAX_GIST_PAGES; page++) {
    const gists = await request<GistResponse[]>(token, `/gists?per_page=${GIST_PAGE_SIZE}&page=${page}`)
    const match = gists.find((gist) => gist.files && GIST_FILENAME in gist.files)
    if (match) return match.id
    if (gists.length < GIST_PAGE_SIZE) break
  }
  return null
}

/** Pulls the deck stored in the gist (GET /gists/{id}). */
export async function fetchDeck(token: string, gistId: string): Promise<Flashcard[]> {
  const gist = await request<GistResponse>(token, `/gists/${encodeURIComponent(gistId)}`)
  const file = gist.files[GIST_FILENAME]
  if (!file) {
    throw new GistServiceError(`Gist does not contain ${GIST_FILENAME}.`, 404)
  }

  let content = file.content ?? ''
  if (file.truncated && file.raw_url) {
    const raw = await fetch(file.raw_url)
    if (!raw.ok) throw new GistServiceError('Could not download the full gist file.', raw.status)
    content = await raw.text()
  }
  return parseDeck(content)
}

/** Creates a new private gist holding the deck (POST /gists). Returns the gist id. */
export async function createDeckGist(token: string, cards: Flashcard[]): Promise<string> {
  const gist = await request<GistResponse>(token, '/gists', {
    method: 'POST',
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: serializeDeck(cards) } },
    }),
  })
  return gist.id
}

/** Overwrites the deck stored in the gist (PATCH /gists/{id}). */
export async function updateDeckGist(token: string, gistId: string, cards: Flashcard[]): Promise<void> {
  await request<GistResponse>(token, `/gists/${encodeURIComponent(gistId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: serializeDeck(cards) } },
    }),
  })
}

/**
 * Safely pushes local changes: pulls the current remote deck, merges it with the local one
 * and only PATCHes when the merge differs from what is stored remotely. Returns the merged deck.
 */
export async function pushDeck(token: string, gistId: string, localCards: Flashcard[]): Promise<Flashcard[]> {
  const remote = await fetchDeck(token, gistId)
  const merged = mergeDecks(localCards, remote)
  if (!decksEqual(merged, remote)) {
    await updateDeckGist(token, gistId, merged)
  }
  return merged
}

export interface SyncResult {
  gistId: string
  cards: Flashcard[]
  created: boolean
}

/**
 * Full connection workflow: find (or create) the deck gist, pull the remote deck,
 * merge it with local progress, and push back if the merge produced changes.
 */
export async function syncDeck(token: string, localCards: Flashcard[], knownGistId?: string): Promise<SyncResult> {
  let gistId = knownGistId ?? null
  let remote: Flashcard[] | null = null

  if (gistId) {
    try {
      remote = await fetchDeck(token, gistId)
    } catch (error) {
      // The remembered gist may have been deleted – fall back to searching.
      if (!(error instanceof GistServiceError) || error.status !== 404) throw error
      gistId = null
    }
  }

  if (!gistId) {
    gistId = await findDeckGist(token)
    if (gistId) remote = await fetchDeck(token, gistId)
  }

  if (!gistId || remote === null) {
    const newId = await createDeckGist(token, localCards)
    return { gistId: newId, cards: localCards, created: true }
  }

  const merged = mergeDecks(localCards, remote)
  if (!decksEqual(merged, remote)) {
    await updateDeckGist(token, gistId, merged)
  }
  return { gistId, cards: merged, created: false }
}
