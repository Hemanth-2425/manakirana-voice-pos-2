# ManaKirana

Offline-first, voice-driven billing, live 25 kg drum inventory, customer Udhaar credit ledger, wholesale refill list, and daily profit analytics built for Indian Kirana shopkeepers.

## Quick Start (Docker)

Run the full application with a single command — **no `.env` file or API keys required**:

```bash
docker compose up
```

Then open **http://localhost:3000** in your browser.

## Local Development (Without Docker)

```bash
npm install
npm run dev
```

Run the unit test suite:

```bash
npx tsx --test src/engine/voiceParser.test.ts
```

## Optional API Keys

ManaKirana starts and works completely offline out of the box using browser speech APIs, local Telugu/Hindi/English NLP parsing, and browser storage (`localStorage` + `IndexedDB`).

To optionally enable cloud neural voice synthesis or Direct AI Mic transcription, copy `.env.example` to `.env` and add your keys:

```bash
cp .env.example .env
```

- `GEMINI_API_KEY` — optional Gemini neural TTS & Direct AI Mic transcription
- `SARVAM_API_KEY` — optional Sarvam AI Indian-language STT/TTS/translation
- `PORT` — server port (default `3000`)
- `APP_URL` — optional public app URL (default `http://localhost:3000`)

When keys are not set, cloud-only controls gracefully show an **"API key not set"** notice and fall back to offline browser voice and typed commands.

## Key Capabilities

- **Voice-First Counter & Dynamic Island**: Continuous Telugu, Hindi, and English code-mixed billing (loose weights, rupee orders, packets, mid-sentence self-corrections, and low-clarity disambiguation).
- **Live 25 kg Drum Stock & 1.5% Tarugu Math**: Tracks bulk drum stock, wholesale vs. selling margins, and automatic spillage deductions.
- **Refill List & Udhaar Ledger**: Flags low drums, tracks missing customer demand, manages customer credit tabs, and logs cash/UPI repayments.
- **Profit Dash & Localized Voice Output**: Real-time net profit analytics with native Telugu, Hindi, Tamil, Kannada, Marathi, and Indian English voice readbacks.
