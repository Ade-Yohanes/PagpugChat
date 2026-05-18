# own-puter — Agent Guide

## Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript strict
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix Nova) + `tw-animate-css`
- **Runtime SDK**: `@heyputer/puter.js` (auth, AI chat, FS, workers)
- **Client-side AI**: `@xenova/transformers` (local RAG embeddings in browser)
- **No test framework** configured

## Commands
```sh
npm run dev      # next dev --webpack (uses webpack despite turbopack config)
npm run build    # next build
npm run lint     # eslint (next/core-web-vitals + typescript)
```
No `typecheck` script — use `npx tsc --noEmit`. Order: `lint -> tsc --noEmit -> build`.

## Project Structure
```
app/page.tsx                    → DashboardApp (client component)
app/layout.tsx                  → Root layout with ThemeProvider
app/api/search/route.ts         → SearXNG proxy (see env below)
hooks/useDashboardApp.ts        → Single central hook: state, AI chat, search, RAG
lib/puter-fs.ts                 → Puter FS wrapper (readdir, mkdir, delete, move, write)
lib/puter-models.ts             → List models, vision check
lib/puter-workers.ts            → Puter workers API
utils/search/smart-search.ts    → 4-step AI search pipeline (rewrite → decide → SearXNG → synthesize)
utils/localRAG.ts               → Client-side RAG via Transformers.js (all-MiniLM-L6-v2)
components/ui/                  → 19 shadcn/ui primitives
```

## Key Conventions
- **Hash routing**: `#chat`, `#files`, `#workers`, `#text2image`, `#text2video`, `#profile`, `#settings`
- **Path alias**: `@/*` → root (`./*`)
- **Imports**: `@/components/...`, `@/lib/...`, `@/hooks/...`, `@/types`, `@/utils/...`
- **All app state lives in** `useDashboardApp()` hook, consumed by `DashboardApp.tsx`
- **Every component file** in `components/` is `"use client"` implicitly (routed via DashboardApp)

## Setup & Environment
- Copy `.env` (already present) or `env.example` — **key**: `NEXT_PUBLIC_WEB_SEARXNG_URL` (your SearXNG instance). The env file uses `NEXT_PUBLIC_` prefix (browser-accessible); the example file uses `WEB_` prefix (server-only) — API route reads the `NEXT_PUBLIC_` version.
- `.env*` is gitignored by default. The `.env.example` is the safe template.
- `.gitignore` ignores `.next/`, `node_modules/`, `out/`, `build/`, `.env*`

## Framework Quirks
- `next.config.ts` has both `turbopack: {}` and a webpack config; dev command uses `--webpack` flag
- Webpack fallbacks: `sharp$`, `onnxruntime-node$` → false; `fs`, `path`, `crypto` → false (browser compat)
- `tsconfig.json include` array has a dangling `"components/ChatInputArea.tsx"` entry (legacy)
- `puter.ai.chat()` can accept `(string, File, options)` for multimodal or `(Message[], options)` for text
- Smart search pipeline calls `puter.ai.chat()` 3× per query (rewrite, decide, synthesize)

## Files & Workers (Puter.js)
- All FS operations check `typeof window === 'undefined' || !window.puter` and throw
- Path normalization strips leading `/` and ensures `./` prefix
- `lib/puter-fs-diagnostic.ts` auto-exposes `PuterTestTools` on `window` for browser console debugging
- Workers API: `puter.workers.list()`, `.get()`, `.create()`, `.delete()`, `.exec()`

## Existing Instruction Sources
- `.github/agents/puter-feature-builder.agent.md` (GitHub Agents config)
- `Documentation/` directory has reference files (`llm_nextjs.txt`, `llm_puterjs.txt`, `llm_shadcn.txt`)
