import { ExternalLink, KeyRound, LoaderCircle, LogOut } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { GitHubConfig } from '../types'
import { Modal } from './Modal'

interface ConnectGitHubModalProps {
  config: GitHubConfig | null
  onConnect: (token: string) => Promise<void>
  onDisconnect: () => void
  onClose: () => void
}

const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Danish%20Flashcards'

export function ConnectGitHubModal({ config, onConnect, onDisconnect, onClose }: ConnectGitHubModalProps) {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) {
      setError('Paste a GitHub personal access token.')
      return
    }
    if (/\s/.test(trimmed)) {
      setError('Tokens cannot contain spaces.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConnect(trimmed)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to GitHub.')
    } finally {
      setBusy(false)
    }
  }

  if (config) {
    return (
      <Modal title="GitHub sync" icon={<KeyRound className="size-5 text-sky-400" />} onClose={onClose}>
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            Connected as <strong className="text-slate-100">@{config.username}</strong>. Your deck and mastery progress
            are stored in a private gist.
          </p>
          {config.gistId && (
            <a
              href={`https://gist.github.com/${encodeURIComponent(config.username)}/${encodeURIComponent(config.gistId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300"
            >
              Open gist <ExternalLink className="size-4" />
            </a>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onDisconnect()
                onClose()
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-500/15 px-4 py-2 font-medium text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/25"
            >
              <LogOut className="size-4" /> Disconnect
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Disconnecting removes the token from this browser. Cards stay saved locally and in your gist.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Connect GitHub" icon={<KeyRound className="size-5 text-sky-400" />} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <p className="text-sm text-slate-300">
          Sync your deck across devices using a private GitHub Gist. Create a{' '}
          <a
            href={TOKEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
          >
            personal access token <ExternalLink className="size-3.5" />
          </a>{' '}
          with the <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200">gist</code> scope.
        </p>
        <div>
          <label htmlFor="github-token" className="mb-1.5 block text-sm font-medium text-slate-200">
            Personal access token
          </label>
          <input
            id="github-token"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="ghp_… or github_pat_…"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'github-token-error' : undefined}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
          />
          {error && (
            <p id="github-token-error" role="alert" className="mt-1.5 text-sm text-rose-400">
              {error}
            </p>
          )}
        </div>
        <p className="text-xs text-slate-500">
          The token is stored only in this browser's localStorage and is sent only to api.github.com.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            {busy ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
