import { useCallback, useEffect, useRef, useState } from 'react'
import {
  decksEqual,
  getAuthenticatedUser,
  mergeDecks,
  syncDeck,
  updateDeckGist,
} from '../services/gistService'
import {
  clearGitHubConfig,
  loadCards,
  loadGitHubConfig,
  saveCards,
  saveGitHubConfig,
} from '../services/storage'
import type { CardStatus, Flashcard, GitHubConfig, SyncStatus } from '../types'
import type { CardFormValues } from '../utils/validation'

const PUSH_DEBOUNCE_MS = 800

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown sync error.'
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function useDeck() {
  const [cards, setCards] = useState<Flashcard[]>(loadCards)
  const [config, setConfig] = useState<GitHubConfig | null>(loadGitHubConfig)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => (config ? 'syncing' : 'offline'))
  const [syncError, setSyncError] = useState<string | null>(null)

  const cardsRef = useRef(cards)
  const configRef = useRef(config)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pushQueue = useRef<Promise<void>>(Promise.resolve())
  const initialSyncStarted = useRef(false)

  useEffect(() => {
    cardsRef.current = cards
    saveCards(cards)
  }, [cards])

  const updateConfig = useCallback((next: GitHubConfig | null) => {
    configRef.current = next
    setConfig(next)
    if (next) saveGitHubConfig(next)
    else clearGitHubConfig()
  }, [])

  const push = useCallback(() => {
    pushQueue.current = pushQueue.current.then(async () => {
      const current = configRef.current
      if (!current?.gistId) return
      setSyncStatus('syncing')
      try {
        await updateDeckGist(current.token, current.gistId, cardsRef.current)
        if (configRef.current === current) {
          setSyncStatus('synced')
          setSyncError(null)
        }
      } catch (error) {
        if (configRef.current === current) {
          setSyncStatus('error')
          setSyncError(errorMessage(error))
        }
      }
    })
    return pushQueue.current
  }, [])

  const schedulePush = useCallback(() => {
    if (!configRef.current?.gistId) return
    setSyncStatus('syncing')
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      pushTimer.current = null
      void push()
    }, PUSH_DEBOUNCE_MS)
  }, [push])

  /** Applies the result of a full sync while preserving any edits made during the request. */
  const applySyncedCards = useCallback(
    (synced: Flashcard[]) => {
      const merged = mergeDecks(cardsRef.current, synced)
      cardsRef.current = merged
      setCards(merged)
      if (!decksEqual(merged, synced)) schedulePush()
    },
    [schedulePush],
  )

  const runSync = useCallback(
    async (current: GitHubConfig) => {
      setSyncStatus('syncing')
      setSyncError(null)
      try {
        const result = await syncDeck(current.token, cardsRef.current, current.gistId)
        if (configRef.current?.token !== current.token) return
        updateConfig({ ...current, gistId: result.gistId })
        setSyncStatus('synced')
        applySyncedCards(result.cards)
      } catch (error) {
        if (configRef.current?.token !== current.token) return
        setSyncStatus('error')
        setSyncError(errorMessage(error))
      }
    },
    [applySyncedCards, updateConfig],
  )

  // Pull the latest remote state once on startup if a token is already stored.
  useEffect(() => {
    if (initialSyncStarted.current) return
    initialSyncStarted.current = true
    if (configRef.current) void runSync(configRef.current)
  }, [runSync])

  // Retry when the browser comes back online.
  useEffect(() => {
    const handleOnline = () => {
      if (configRef.current) void runSync(configRef.current)
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [runSync])

  useEffect(
    () => () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    },
    [],
  )

  /** Validates the token, then finds/creates the deck gist and syncs. Throws on failure. */
  const connect = useCallback(
    async (token: string) => {
      const previous = configRef.current
      setSyncStatus('syncing')
      setSyncError(null)
      try {
        const username = await getAuthenticatedUser(token)
        const result = await syncDeck(token, cardsRef.current)
        updateConfig({ token, username, gistId: result.gistId })
        setSyncStatus('synced')
        applySyncedCards(result.cards)
      } catch (error) {
        setSyncStatus(previous ? 'error' : 'offline')
        throw error
      }
    },
    [applySyncedCards, updateConfig],
  )

  const disconnect = useCallback(() => {
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = null
    updateConfig(null)
    setSyncStatus('offline')
    setSyncError(null)
  }, [updateConfig])

  const syncNow = useCallback(() => {
    if (configRef.current) void runSync(configRef.current)
  }, [runSync])

  const setCardStatus = useCallback(
    (id: string, status: CardStatus) => {
      const target = cardsRef.current.find((card) => card.id === id)
      if (!target || target.status === status) return
      const next = cardsRef.current.map((card) =>
        card.id === id ? { ...card, status, updatedAt: Date.now() } : card,
      )
      cardsRef.current = next
      setCards(next)
      schedulePush()
    },
    [schedulePush],
  )

  const addCard = useCallback(
    (values: CardFormValues): Flashcard => {
      const card: Flashcard = {
        id: createId(),
        danish: values.danish.trim(),
        gender: values.gender,
        phonetic: values.phonetic.trim(),
        english: values.english.trim(),
        persian: values.persian.trim(),
        example: values.example.trim(),
        category: values.category,
        status: 'new',
        updatedAt: Date.now(),
      }
      const next = [...cardsRef.current, card]
      cardsRef.current = next
      setCards(next)
      schedulePush()
      return card
    },
    [schedulePush],
  )

  return {
    cards,
    config,
    syncStatus,
    syncError,
    connect,
    disconnect,
    syncNow,
    setCardStatus,
    addCard,
  }
}
