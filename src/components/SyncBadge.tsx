import { Cloud, CloudOff, LoaderCircle, TriangleAlert } from 'lucide-react'
import type { SyncStatus } from '../types'

interface SyncBadgeProps {
  status: SyncStatus
  error: string | null
  username?: string
  onClick: () => void
}

const STYLES: Record<SyncStatus, { label: string; className: string }> = {
  synced: { label: 'Synced', className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  syncing: { label: 'Syncing…', className: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
  offline: { label: 'Offline / Local', className: 'bg-slate-500/15 text-slate-300 ring-slate-500/30' },
  error: { label: 'Sync error', className: 'bg-rose-500/15 text-rose-300 ring-rose-500/30' },
}

export function SyncBadge({ status, error, username, onClick }: SyncBadgeProps) {
  const { label, className } = STYLES[status]
  const Icon =
    status === 'synced' ? Cloud : status === 'syncing' ? LoaderCircle : status === 'error' ? TriangleAlert : CloudOff
  const title =
    status === 'error'
      ? `${error ?? 'Sync failed'} – click to retry`
      : status === 'offline'
        ? 'Saved in this browser only – click to connect GitHub'
        : username
          ? `Synced to a private gist for @${username}`
          : label

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition hover:brightness-125 ${className}`}
    >
      <Icon className={`size-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
      {label}
    </button>
  )
}
