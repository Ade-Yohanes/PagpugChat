# Pagpug AI Dashboard

A Next.js application that integrates Puter.ai features for chat, smart search, document analysis, media generation, and user profile management.

## About

Pagpug AI Dashboard is a custom AI workspace built on top of the Puter SDK and local utilities. This app enables users to:

- Chat with selected AI models
- Use smart search combining web search and LLM synthesis
- Upload documents for local analysis (RAG)
- Generate text-to-image and text-to-video content
- View Puter account profile and usage
- Manage default model selection in settings

> Note: each user must log in with their own Puter account to access authenticated features.

## Key Features

- `AI Chat` with dynamic models and stop/cancel controls
- `Model selector` with search and keyboard support
- `Smart search` to fetch and synthesize web data
- `Document RAG` for answering questions from uploaded files
- `Text-to-Image` and `Text-to-Video` using Puter multimodal features
- `Puter Profile` to view account details and usage stats
- `Settings` to save the default model

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Ade-Yohanes/PagpugChat.git
cd PagpugChat
```

2. Install dependencies:

```bash
npm install
```

3. Configure `.env` as needed. If you use a SearXNG search engine, add its base URL here:

```env
NEXT_PUBLIC_SEARXNG_URL=https://your-searxng-instance.example.com
```

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Login

To use this app, sign in with your **[Puter account](https://puter.com)** :

- Click the login button on the main page
- Complete the Puter authentication flow
- After login, your profile appears and chat/usage features become available

## Important Files

- `hooks/useDashboardApp.ts` — main app logic and chat workflow
- `components/chat/ModelSelector.tsx` — AI model selector with search
- `components/user/Profile.tsx` — profile and usage display
- `utils/search/smart-search.ts` — smart search pipeline and web proxy
- `lib/puter-models.ts` — AI model list and vision detection
- `app/api/search/route.ts` — search proxy to SearXNG

## Deployment Notes

- Ensure environment variables for Puter and SearXNG are configured
- If you use a search engine, set `NEXT_PUBLIC_SEARXNG_URL` to your SearXNG instance URL
- Deploy on a platform that supports Next.js App Router

## Hashtags

#PuterAI #NextJS #AIChat #SmartSearch #RAG #TextToImage #TextToVideo #Dashboard #WebApp
