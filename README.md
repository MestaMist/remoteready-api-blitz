# RemoteReady — Career Platform for Global Developers

> **API Blitz 2026 Hackathon Submission**  
> Target Repository: `remoteready-api-blitz`  
> Live Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Neon PostgreSQL (`@neondatabase/serverless`), Vercel-Ready.

---

## 1. Problem & Product Solution

### The Problem
Finding and landing a remote software development role as a college student, fresher, or international engineer is notoriously fragmented:
- **Scattered discovery:** Job boards have disjointed listings, duplicate postings, and varying geographic restrictions.
- **Currency opacity:** Remote listings advertise in foreign currencies (USD, EUR, GBP), leaving candidates uncertain of local purchasing power and take-home pay.
- **Recruiter outreach blind spots:** International applicants routinely send interview requests and follow-ups on national statutory holidays (e.g., Thanksgiving, Bank Holidays, Diwali) or weekends, causing emails to get buried and hurt response rates.
- **Community disconnect:** Job hunters miss out on real-time discussions, emerging developer tooling trends, and direct "Who is Hiring" threads on Hacker News.
- **Disorganized follow-up:** Spreadsheets and notes easily get lost without structured funnel progression.

### The RemoteReady Solution
**RemoteReady** unifies five authoritative developer and financial APIs alongside a serverless Neon PostgreSQL database into a single, cohesive developer dashboard:
1. **Unified Remote Job Engine:** Aggregates, normalizes, and deduplicates listings from **Remotive** and **Arbeitnow**.
2. **Frankfurter Salary Currency Converter:** Real-time exchange rate conversions between USD, EUR, GBP, INR, CAD, AUD, and more, complete with annual, monthly, and hourly breakdowns.
3. **Application & Follow-Up Planner:** Powered by **Nager.Date**, offering statutory holiday timelines and an interactive date clash auditor that calculates the optimal next business day for outreach.
4. **Developer Tech Radar:** Powered by the official **Hacker News API**, tracking trending developer discussions, frameworks, and active YC hiring posts.
5. **Persistent Application Tracker:** Full Kanban funnel (`Interested` → `Applied` → `Interview` → `Offer` → `Rejected`) with database persistence on **Neon PostgreSQL**.

---

## 2. API Integrations & Architecture

RemoteReady integrates all five APIs displayed in the API Blitz 2026 challenge:

| API | Endpoint & Documentation | Purpose & Meaningful Integration in RemoteReady |
| :--- | :--- | :--- |
| **Remotive** | `https://remotive.com/api/remote-jobs` | Remote engineering job discovery, filtering by keyword, category, and direct applicant URLs. |
| **Arbeitnow** | `https://www.arbeitnow.com/api/job-board-api` | Global remote & European tech roles, normalized into a unified schema alongside Remotive with duplicate elimination. |
| **Frankfurter** | `https://api.frankfurter.dev/v1/latest` | Real-time exchange rates published by the European Central Bank. Powers salary comparisons between USD, INR, EUR, GBP, etc. |
| **Nager.Date** | `https://date.nager.at/api/v3/PublicHolidays` | Official public holidays across 100+ countries. Powers the clash auditor so applicants never schedule follow-ups on bank holidays. |
| **Hacker News** | `https://hacker-news.firebaseio.com/v0/` | Real-time technology radar, developer story trends, scores, comment counts, and official Y Combinator "Who is Hiring" posts. |

### Architecture Overview

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    RemoteReady UI                      │
                               │  (Next.js App Router + Tailwind CSS + Lucide Icons)   │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                    ┌─────────────────────────────────────┼──────────────────────────────────┐
                    ▼                                     ▼                                  ▼
         ┌──────────────────────┐             ┌──────────────────────┐           ┌──────────────────────┐
         │   Client Components  │             │     API Proxies      │           │    Database Layer    │
         │  - Job Explorer      │             │  - /api/jobs         │           │  - src/lib/db.ts     │
         │  - Kanban Tracker    │ ──────────> │  - /api/rates        │           │  - @neondatabase/    │
         │  - Salary Converter  │             │  - /api/holidays     │           │    serverless        │
         │  - Tech Radar        │             │  - /api/news         │           └──────────┬───────────┘
         │  - Holiday Planner   │             └──────────┬───────────┘                      │
         └──────────────────────┘                        │                                  │
                                                         │                                  ▼
                    ┌────────────────────────────────────┼──────────────┐       ┌──────────────────────┐
                    ▼                  ▼                 ▼              ▼       │   Neon PostgreSQL    │
            ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────┐  │ - applications       │
            │ Remotive API  │  │ Arbeitnow API │  │  Frankfurter  │  │ Nager │  │ - saved_jobs         │
            │  Remote Jobs  │  │  Tech Board   │  │   Exchange    │  │ Date  │  │ - user_preferences   │
            └───────────────┘  └───────────────┘  └───────────────┘  └───────┘  └──────────────────────┘
```

---

## 3. Features Breakdown

### 💼 Unified Remote Job Explorer
- Aggregates listings from Remotive and Arbeitnow in parallel (`Promise.allSettled`).
- Normalizes disparate fields into a single `Job` model with company name, title, remote location, tags, salary (where stated), and direct apply links.
- **Smart Deduplication:** Hashes lowercase company names and normalized titles to prevent identical listings across multiple job boards.
- **Instant Search & Multi-Criteria Filtering:** Filter by source, contract type (Full-Time, Contract, Internship), and sorting options (Most Recent, Company A-Z, Title A-Z).
- **One-Click Actions:** Save to bookmarks or directly add to the application funnel.

### 💰 Frankfurter Salary Conversion Calculator
- Connects to the European Central Bank rates via the Frankfurter API.
- Converts salaries dynamically between USD, EUR, GBP, INR, CAD, AUD, SGD, CHF, JPY, and more.
- Provides immediate conversions across **Annual**, **Monthly**, and **Hourly** (40h/week basis).
- Displays a multi-currency matrix comparing the salary across all primary developer regions simultaneously.
- **Compensation Integrity Notice:** Clearly distinguishes real market exchange calculations from employer-stated salaries.

### 📅 Application Follow-Up Planner & Date Clash Auditor
- Connects to Nager.Date API covering statutory holidays for US, UK, India, Germany, Canada, and 100+ countries.
- **Interactive Clash Auditor:** Enter any proposed follow-up date (e.g., Thanksgiving, Bank Holidays, or a Sunday). The planner detects clashes and automatically calculates the next optimal business day.
- Features recruiter outreach timing recommendations (e.g., Tuesday morning inbox arrival advantage).

### 📡 Hacker News Developer Tech Radar
- Uses the official Hacker News Firebase REST API (`topstories.json`, `jobstories.json`, `item/{id}.json`).
- Categorizes stories into **Hiring & Jobs**, **AI & Models**, **Tech & Stack**, and **Career**.
- Displays actual HN scores (points), comment counts, author usernames, publication timestamps, and direct links to the HN discussion thread and destination articles.

### 📋 Persistent Application Tracker
- 5-stage Kanban board and tabular list view:
  - `Interested` → `Applied` → `Interview` → `Offer` → `Rejected`
  - Inline follow-up date countdown with urgency indicators.
  - Full CRUD operations: Create, Read, Update stage, and Delete.
  - Serverless persistence powered by Neon PostgreSQL with graceful local storage fallback if the database URL has not been supplied yet.

---

## 4. Local Setup & Environment Variables

### Prerequisites
- Node.js 18+ or Node.js 20+ (tested on Node v26)
- npm or pnpm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/remoteready-api-blitz.git
cd remoteready-api-blitz

# Install dependencies
npm install

# Copy example environment variables
cp .env.example .env.local
```

### Environment Variables (`.env.local`)

```env
# Neon PostgreSQL Database Connection String
# Get this from https://console.neon.tech
DATABASE_URL="postgresql://neondb_owner:your_password_here@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Optional App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Run Locally

```bash
# Start development server
npm run dev

# Or build and run production server
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Neon PostgreSQL Database Setup

RemoteReady utilizes a serverless PostgreSQL database hosted on **Neon**.

### Executing the Schema

You can execute the schema in one of two ways:

#### Option A: Neon SQL Editor (Recommended)
1. Go to your [Neon Console](https://console.neon.tech) and open your database project.
2. In the left navigation, click **SQL Editor**.
3. Open `database/schema.sql` from this repository, copy its contents, paste them into the editor, and click **Run**.

```sql
-- database/schema.sql

CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(128),
  company_name VARCHAR(255) NOT NULL,
  role_title VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Interested',
  application_date DATE DEFAULT CURRENT_DATE,
  follow_up_date DATE,
  salary VARCHAR(64),
  currency VARCHAR(10) DEFAULT 'USD',
  job_url TEXT,
  source VARCHAR(64) DEFAULT 'Custom',
  notes TEXT,
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  id VARCHAR(64) PRIMARY KEY,
  job_id VARCHAR(128) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  source VARCHAR(64) NOT NULL,
  job_url TEXT NOT NULL,
  location VARCHAR(255),
  salary VARCHAR(128),
  category VARCHAR(128),
  tags JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'default_user',
  preferred_currency VARCHAR(10) DEFAULT 'USD',
  preferred_country VARCHAR(10) DEFAULT 'US',
  target_roles JSONB DEFAULT '["Full-Stack Developer", "Frontend Developer", "Backend Developer"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Option B: Auto-Migration Runner
RemoteReady contains a built-in migration hook in `src/lib/db.ts` and `/api/db/status`. When a valid `DATABASE_URL` is detected, the application automatically verifies table structures and issues `CREATE TABLE IF NOT EXISTS` if the schema is not yet present.

---

## 6. Testing & Verification

RemoteReady underwent comprehensive live verification:

```bash
# 1. Typecheck & Next.js production build
npm run build
# Output: ✓ Compiled successfully. All 9 static routes and dynamic API handlers optimized.

# 2. Test live API integrations
node -e '
async function test() {
  const jobs = await (await fetch("http://localhost:3000/api/jobs")).json();
  const rates = await (await fetch("http://localhost:3000/api/rates?base=USD")).json();
  const holidays = await (await fetch("http://localhost:3000/api/holidays?country=US&year=2026")).json();
  const news = await (await fetch("http://localhost:3000/api/news")).json();
  console.log("Jobs:", jobs.total, "Rates:", rates.data?.date, "Holidays:", holidays.count, "News:", news.count);
}
test();
'
# Result: 271 Jobs normalized, Frankfurter live rates verified, 17 US holidays parsed, 102 HN stories categorized.
```

---

## 7. API Attribution & Known Limitations

- **Remotive API:** Remotive is an independently operated remote job platform. Rate limits apply to unauthenticated public endpoints; listings are cached for 300 seconds.
- **Arbeitnow API:** Arbeitnow aggregates remote and European positions. Some listings may have general descriptions in multiple languages; salary data is not always provided by employers on this board.
- **Frankfurter API:** Tracks reference rates updated around 16:00 CET by the European Central Bank on working days. Does not provide exotic cryptocurrency rates or real-time forex spot execution quotes.
- **Nager.Date API:** Covers statutory and public holidays. Regional, state, or company-specific holidays (e.g. state-level holidays in Germany or India) may vary.
- **Hacker News API:** Firebase REST API endpoints provide story item IDs and object details. Search is not an official endpoint of the Firebase API; RemoteReady uses topstories and jobstories with local classification tags.

---

## 8. Deployment to Vercel

RemoteReady is built natively for Vercel deployment:
1. Push the code to GitHub: `remoteready-api-blitz`.
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. Set the Environment Variable:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
4. Deploy! Next.js App Router edge and serverless functions will automatically handle routing and server-side queries.
