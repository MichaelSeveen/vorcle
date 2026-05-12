# Vorcle

An AI meeting assistant that joins your calls, generates transcripts, surfaces key decisions, and keeps your team aligned — without anyone taking notes.

**Live**: [vorcle.vercel.app](https://vorcle.vercel.app)

---

## What it does

Vorcle sends a bot into your Zoom or Google Meet calls via [MeetingBaas](https://meetingbaas.com). After the call, it produces a transcript, a structured summary, extracted action items, and identified blockers. You can then search across your entire meeting history through a RAG-powered chat interface.

### Core workflow

1. Connect your Google Calendar
2. Vorcle detects upcoming meetings with video links
3. A bot joins the call automatically (or you send one manually)
4. Post-meeting: transcript, summary, action items, and decisions are generated
5. Results are emailed to you and optionally pushed to Slack, Trello, Asana, or Jira

---

## Features

- **Transcription and summarization** — powered by Google Gemini through the Vercel AI SDK
- **Action item extraction** — decisions, blockers, and next steps pulled from each meeting
- **Calendar sync** — reads your Google Calendar every 5 minutes, auto-schedules bots for upcoming calls
- **RAG chat** — ask questions about a single meeting or across your full meeting history; backed by pgvector embeddings
- **Integrations** — push action items to Slack channels, Trello boards, Asana projects, or Jira
- **Email reports** — automatic post-meeting email with the full summary, sent via Brevo/Nodemailer
- **Subscription management** — tiered plans (Free, Pro, Business, Enterprise) with per-cycle usage tracking, handled through Polar
- **Zoom credential health monitoring** — daily checks that MeetingBaas credentials are valid
- **Recording storage** — meeting audio stored in S3-compatible storage with presigned download URLs

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | HeroUI v3, Tailwind CSS v4 |
| Database | PostgreSQL (Neon), Drizzle ORM |
| Vector search | pgvector |
| Auth | Better Auth + Google OAuth |
| Payments | Polar |
| AI | Google Gemini via Vercel AI SDK |
| Background jobs | Inngest |
| Meeting bots | MeetingBaas SDK |
| Email | Brevo + Nodemailer |
| File storage | AWS S3 |
| Integrations | Slack Bolt, Trello, Asana, Jira |
| Deployment | Vercel |

---

## Project structure

```
src/
├── app/
│   ├── (workspace)/       # Authenticated dashboard
│   │   ├── home/          # Meeting history, upcoming events
│   │   ├── chat/          # RAG-powered meeting search
│   │   ├── calendar/      # Synced Google Calendar view
│   │   ├── meeting/       # Individual meeting detail (transcript, summary, recording)
│   │   ├── integrations/  # Connect Slack, Trello, Asana, Jira
│   │   ├── settings/      # Account, bot customization
│   │   └── pricing/       # Plan selection
│   ├── api/
│   │   ├── auth/          # Better Auth handlers
│   │   ├── inngest/       # Inngest function serving endpoint
│   │   ├── rag/           # Chat endpoints (per-meeting and cross-meeting)
│   │   ├── webhooks/      # MeetingBaas + Polar webhooks
│   │   ├── slack/         # Slack OAuth and events
│   │   └── meetings/      # Meeting CRUD
│   └── auth/              # Sign-in page
├── components/
│   ├── chat/              # Chat UI
│   ├── event-calendar/    # Calendar component
│   ├── meetings/          # Meeting cards, transcript viewer, media player
│   ├── landing-page/      # Marketing site sections
│   └── pricing/           # Pricing cards
├── db/schema/             # Drizzle schema (users, meetings, subscriptions, integrations, events)
├── helpers/               # Business logic (meetings, subscriptions, RAG, calendar, prompts)
├── inngest/               # Background functions (calendar sync, bot scheduling, usage reset)
└── lib/                   # Auth config, MeetingBaas client, email, utilities
```

---

## Background jobs (Inngest)

| Function | Trigger | What it does |
| --- | --- | --- |
| `calendar-sync` | Every 5 minutes | Syncs all connected Google Calendars |
| `meeting-bot-scheduler` | Every 5 minutes | Schedules MeetingBaas bots for upcoming meetings |
| `subscription-usage-maintenance` | Daily at midnight (Africa/Lagos) | Reconciles subscription usage windows |
| `zoom-credential-health` | Daily at 9 AM (Africa/Lagos) | Checks MeetingBaas Zoom credential validity |
| `meeting-baas-webhook-processor` | Event-driven | Processes incoming MeetingBaas webhook payloads (idempotent, 8 retries) |

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL with pgvector extension
- Accounts: Google Cloud (OAuth + Calendar API), MeetingBaas, Polar, Brevo, AWS S3

### Setup

```bash
git clone https://github.com/MichaelSeveen/vorcle.git
cd vorcle
bun install
```

Copy `.env.example` to `.env` and fill in the required values, then push the database schema:

```bash
bunx drizzle-kit push
```

### Development

```bash
bun run dev
```

### Linting

```bash
bun run lint
```

---

## License

Private.
