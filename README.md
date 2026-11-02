# RemoteReady

**A career dashboard for remote developers: find roles, price the salary, time the follow-up, track the application.**

Built for **API Blitz 2026**. Five live public APIs and one Neon Postgres database in a single Next.js app.

**Live demo:** https://remoteready-api-blitz.vercel.app

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Neon PostgreSQL (`@neondatabase/serverless`) · Vercel

---

## The problem

Landing a remote role as a student, fresher or international engineer is scattered across tools:

- **Fragmented discovery:** listings live on separate boards, with duplicates and different formats.
- **Salary opacity:** pay is quoted in USD, EUR or GBP, and the real value in your own currency is unclear.
- **Bad follow-up timing:** emails sent on the employer's public holiday or a weekend get buried.
- **No industry signal:** it is hard to know what the community is discussing or who is hiring right now.
- **Lost progress:** spreadsheets and notes do not hold up across dozens of applications.

## The solution

RemoteReady answers four questions in one workflow:

| Question | Feature | API |
|:--|:--|:--|
| Where are the roles? | Unified remote job feed with search, filters and dedupe | Remotive, Arbeitnow |
| What is it really worth? | Salary converter with annual, monthly and hourly views | Frankfurter |
| When should I follow up? | Holiday-aware follow-up planner and date clash auditor | Nager.Date |
| What should I learn, who is hiring? | Developer tech radar | Hacker News |
| Where am I in the process? | Persistent Kanban application tracker | Neon PostgreSQL |

---

## API integrations

Every API contributes to a core feature. Remove any one and a different user question goes unanswered.

| API | Endpoint | What it powers |
|:--|:--|:--|
| **Remotive** | `remotive.com/api/remote-jobs` | Remote tech job listings |
| **Arbeitnow** | `arbeitnow.com/api/job-board-api` | European and remote listings, merged with Remotive |
| **Frankfurter** | `api.frankfurter.dev/v1/latest` | European Central Bank reference exchange rates for salary conversion |
| **Nager.Date** | `date.nager.at/api/v3/PublicHolidays` | Public holidays for 100+ countries, used by the clash auditor |
| **Hacker News** | `hacker-news.firebaseio.com/v0/` | Top stories and job stories, classified into four categories |

All third-party calls run **server-side** through proxy routes, which avoids CORS issues, keeps upstream details out of the browser, and gives one place to normalize, cache and handle failures.

| Route | Purpose |
|:--|:--|
| `/api/jobs` | Fetches Remotive and Arbeitnow in parallel, normalizes, dedupes |
| `/api/rates?base=USD` | Frankfurter exchange rates |
| `/api/holidays?country=US&year=2026` | Nager.Date public holidays |
| `/api/news` | Hacker News stories, categorized |
| `/api/db/status` | Neon connection check and schema auto-migration |

## Architecture

```mermaid
flowchart TD
    UI["Next.js UI<br/>Job Feed · Salary Converter · Planner · Tech Radar · Tracker"]
    UI --> J["/api/jobs"]
    UI --> R["/api/rates"]
    UI --> H["/api/holidays"]
    UI --> N["/api/news"]
    UI --> DB["src/lib/db.ts"]
    J --> Remotive[(Remotive)]
    J --> Arbeitnow[(Arbeitnow)]
    R --> Frankfurter[(Frankfurter)]
    H --> Nager[(Nager.Date)]
    N --> HN[(Hacker News)]
    DB --> Neon[("Neon PostgreSQL<br/>applications · saved_jobs · user_preferences")]
```

### Engineering highlights

- **Partial-failure tolerance:** job sources are fetched with `Promise.allSettled`, so one slow or failing API never blanks the page.
- **Rate-limit protection:** responses are cached for 300 seconds in the proxy layer.
- **Normalization and dedupe:** two different JSON shapes become one `Job` model; duplicates are removed using a hash of lowercase company name plus normalized title.
- **Hacker News access pattern:** story IDs first, then item details fetched in parallel, then classified into Hiring and Jobs, AI and Models, Tech and Stack, and Career.
- **Database resilience:** serverless Neon driver, environment-based config, schema auto-migration, and a local-storage fallback if the database is unreachable.
- **Honest data:** the UI distinguishes market exchange rates from employer-stated salaries.

---

## Features

**Remote job feed** (`/jobs`): unified listings from two sources, instant search, filters by source and job type, sorting, bookmarks, and one-click add to the tracker.

**Salary converter** (`/salary-calculator`): convert between USD, EUR, GBP, INR, CAD, AUD, SGD, CHF, JPY and more, with annual, monthly and hourly (40 h/week) breakdowns and a multi-currency comparison matrix.

**Follow-up planner** (`/planner`): pick an employer country and year, see its public holidays, and test any follow-up date. The auditor flags clashes and suggests the next business day.

**Tech radar** (`/tech-radar`): live Hacker News discussions with score, comment count, author, time and links to the thread and article.

**Application tracker** (`/tracker`): five-stage Kanban board (Interested, Applied, Interview, Offer, Rejected) plus list view, follow-up dates, and full create, update and delete, persisted in Neon.

---

## Database (Neon PostgreSQL)

Three tables, defined in [`database/schema.sql`](database/schema.sql):

| Table | Purpose |
|:--|:--|
| `applications` | Application funnel: company, role, status, application and follow-up dates, salary, currency, link, source, notes, location |
| `saved_jobs` | Bookmarked jobs with a unique `job_id` and tags stored as JSONB |
| `user_preferences` | Preferred currency, country and target roles (single default user for now) |

### Neon evidence

The deployed app reports a live connection at [`/api/db/status`](https://remoteready-api-blitz.vercel.app/api/db/status):

```json
{
  "connected": true,
  "message": "Successfully connected to Neon PostgreSQL.",
  "tables": { "applications": true, "saved_jobs": true, "user_preferences": true },
  "counts": { "applications": 2, "saved_jobs": 4 }
}
```

The same route creates the tables with `CREATE TABLE IF NOT EXISTS` when they do not exist, so a fresh database needs no manual setup. You can also run `database/schema.sql` in the Neon SQL Editor.

---

## Run locally

Requires Node.js 18 or newer.

```bash
git clone https://github.com/MestaMist/remoteready-api-blitz.git
cd remoteready-api-blitz
npm install
cp .env.example .env.local
```

Set your Neon connection string in `.env.local`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

Without `DATABASE_URL` the tracker falls back to browser local storage, so the rest of the app still works.

## Deploy

Import the repository into Vercel, add `DATABASE_URL` under **Settings, Environment Variables**, and deploy.

## Project structure

```
database/        SQL schema for Neon
src/
  app/           Pages and API routes (App Router)
  lib/db.ts      Neon client and schema migration
.env.example     Environment variable template
```

## Known limitations

- **Remotive:** public endpoint is rate limited, which is why responses are cached.
- **Arbeitnow:** salary is often missing, and some listings are in other languages.
- **Frankfurter:** reference rates updated on ECB working days, not real-time trading quotes.
- **Nager.Date:** national public holidays only; regional or company holidays are not included.
- **Hacker News:** the Firebase API has no search endpoint, so stories are classified locally from top and job stories.
- **Accounts:** single-user for now. Authentication and per-user data are the next step.

## Roadmap

Authentication and per-user data, email reminders before follow-up dates, automatic holiday-aware scheduling, and saved-search alerts.

## Credits

Data courtesy of [Remotive](https://remotive.com), [Arbeitnow](https://www.arbeitnow.com), [Frankfurter](https://frankfurter.dev), [Nager.Date](https://date.nager.at) and [Hacker News](https://news.ycombinator.com).
