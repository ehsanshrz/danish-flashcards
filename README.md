# Danish Flashcards 🇩🇰

A responsive, dark-themed flashcard app for learning Danish with English and Persian (فارسی) translations.
Progress is stored in `localStorage` and can optionally be synced across devices to a **private GitHub Gist**
using your own Personal Access Token.

Built with Vite, React, TypeScript, Tailwind CSS and lucide-react.

## Features

- **3D flip cards** – Danish word, word type (`en` / `et` / `verb` / `phrase`), phonetic guide and pronunciation on the
  front; English, Persian (RTL), an example sentence and mastery status on the back.
- **Pronunciation** – Web Speech API (`da-DK`, rate `0.9`). Install a Danish voice in your OS/browser for best results.
- **Study flow** – mark cards as *Still learning* or *Mastered*, filter by category, and track progress with a
  mastered / needs-practice bar.
- **Custom cards** – add your own cards with a validated form.
- **GitHub Gist sync** – connect with a PAT that has the `gist` scope. The app finds (or creates) a private gist
  containing `danish-flashcards-data.json`, pulls it, merges it with local progress (newest change per card wins) and
  pushes updates automatically after you add cards or change mastery status.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Flip card |
| `←` / `→` | Previous / next card |
| `↑` | Pronounce |
| `1` | Still learning |
| `2` | Mastered |

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm test         # run unit tests (Vitest)
npm run lint     # lint (oxlint)
npm run build    # type-check and build for production
```

## GitHub sync

1. Create a token at <https://github.com/settings/tokens/new?scopes=gist> (classic token with the `gist` scope, or a
   fine-grained token with *Gists: read & write*).
2. Click **Connect GitHub** and paste the token.

The token and username are stored in this browser's `localStorage` and are only sent to `api.github.com`.
Use a token limited to the `gist` scope, and disconnect on shared computers.

## Project structure

```
src/
  types.ts                 Flashcard, DeckCategory, GitHubConfig, CardStatus, …
  data/starterDeck.ts      Starter vocabulary
  services/gistService.ts  GitHub Gist find / fetch / create / update + merge logic
  services/storage.ts      localStorage persistence
  hooks/useDeck.ts         Deck state and sync orchestration
  hooks/useKeyboardShortcuts.ts
  components/              FlipCard, ProgressBar, CategoryFilter, SyncBadge, modals
  utils/                   Form validation, speech synthesis
```
