# Arc

**Conversation design before code.** Arc is a Next.js app where **Ori** interviews you in turns, captures **intent taxonomy**, **escalation flows**, **entity schema**, and **tone guide** into a live **conversation architecture** you can export as Markdown.

## Stack

- **Next.js** 16 (App Router, Turbopack in dev)
- **React** 19 · **TypeScript**
- **Anthropic** (`@anthropic-ai/sdk`) for `/api/chat`
- **Supabase** (`@supabase/supabase-js`) for saved sessions (`/api/session`, `arc_sessions` table)
- **Tailwind** 4 (PostCSS) · global tokens in `app/globals.css` (Space Grotesk + DM Mono)

## Routes

| Path | Purpose |
|------|--------|
| `/` | Marketing landing (scroll narrative + Ori-style canvas hero) |
| `/design` | Design workspace: chat with Ori, architecture panel, mobile architecture sheet |
| `/session/[slug]` | Read-only shared session from Supabase |
| `POST /api/chat` | Ori turn: messages in → structured `OriTurn` (message + `architectureDelta` + progress) |
| `POST /api/session` | Persist completed session → returns `shareUrl` when configured |

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment** — create `.env.local` in the project root:

   ```bash
   # Required for Ori (design page + API)
   ANTHROPIC_API_KEY=sk-ant-...

   # Required for session save + share links (optional for local chat-only testing)
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

   Supabase expects a table such as **`arc_sessions`** (see `app/api/session/route.ts` for columns). Without Supabase, chat still works; **session complete** may not persist or return a share URL.

3. **Run dev**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the landing page and [http://localhost:3000/design](http://localhost:3000/design) for the Ori session UI.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next dev server (default port **3000**) |
| `npm run build` | Production build |
| `npm run start` | Start production server (after `build`) |
| `npm run lint` | ESLint (`eslint-config-next`) |

## Project layout (high level)

- `app/page.tsx` — Landing
- `app/design/page.tsx` — Design session UI + atmospheric background canvas
- `app/api/chat/route.ts` — Anthropic + Ori system prompt / JSON turn
- `app/api/session/route.ts` — Supabase insert for completed sessions
- `components/OriAvatar.tsx` — Reusable stateful Ori canvas
- `components/ArchitecturePanel.tsx` — Four architecture cards + progress
- `lib/oriSystemPrompt.ts`, `lib/types.ts`, `lib/oriMessage.ts` — Prompts and shared types

## Deploy

Any Node host that supports Next.js 16 works (e.g. [Vercel](https://vercel.com)). Set the same environment variables in the hosting dashboard.

---

Built with Next.js. Product copy and flows evolve in `app/` and `components/`.
