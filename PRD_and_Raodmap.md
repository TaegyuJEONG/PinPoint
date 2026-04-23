# PRD + Roadmap — PinPoint (Working Title)
> Find your first 100 paying users through authentic, pinpointed outreach

**Version:** 0.2  
**Author:** Taegyu Jeong  
**Status:** For AI-assisted development  
**Last Updated:** 2026-04-21

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Goals](#2-goals)
3. [Non-Goals](#3-non-goals)
4. [Target Users](#4-target-users)
5. [User Stories](#5-user-stories)
6. [Product Overview](#6-product-overview)
7. [Feature Requirements](#7-feature-requirements)
8. [System Architecture](#8-system-architecture)
9. [Success Metrics](#9-success-metrics)
10. [Open Questions](#10-open-questions)
11. [Roadmap](#11-roadmap)

---

## 1. Problem Statement

Solo builders and indie hackers can now ship products in days using AI-assisted coding tools, but distribution remains unsolved. The gap between "I launched" and "I have 100 paying users" is where most products die — not because the product is bad, but because the builder has no systematic way to find the right people.

Existing tools either require expensive ad spend, broad social media presence, or manual, time-consuming Reddit scouring. There is no tool that helps a builder articulate what makes their product unique, find people who need it *right now*, and engage them authentically at scale.

The cost of not solving this: builders with working products abandon them before finding product-market fit, purely because they cannot reach their first cohort of paying users.

---

## 2. Goals

**User Goals**
- A builder can go from GitHub repo URL to active Reddit monitoring in under 30 minutes
- A builder receives their first qualified Reddit lead within 24 hours of setup
- Comments posted via PinPoint feel authentic and human — not promotional spam
- Builders without marketing experience can run systematic user discovery without learning new skills

**Business Goals**
- Achieve a 14-day trial → paid conversion rate of ≥ 30%
- Keep infrastructure cost per active builder under $3/month
- Reach 500 paying builders within 6 months of launch

---

## 3. Non-Goals

- **Not a content marketing tool (v1).** Multi-platform content scheduling and distribution is explicitly out of scope for v1. It dilutes focus and the ROI for 0→1 builders is unclear. Consider for v2 after retention data.
- **Not a company-account posting tool.** PinPoint never posts on behalf of a shared company account. All Reddit activity comes from the builder's own authenticated account.
- **Not a bulk outreach / spam tool.** PinPoint is not designed to maximize comment volume. It is designed to maximize comment quality and conversion. Rate limits and human confirmation gates are intentional.
- **Not an analytics platform.** Deep engagement analytics, cohort analysis, and A/B testing are out of scope for v1. Basic conversion tracking (comment → paying user) is in scope.
- **Not a competitor monitoring tool.** Tracking what competitors are doing on Reddit is out of scope for v1.

---

## 4. Target Users

**Primary: The Launched-but-Stuck Builder**
- Solo developer or 2-person team
- Has shipped a product (SaaS, tool, API, mobile app)
- Has 0–10 paying users
- Knows how to code but has no marketing background
- Frustrated by the gap between "built it" and "found customers"
- Comfortable connecting GitHub and Reddit OAuth
- Will pay $15/month if they see real leads

**Secondary: The Pre-Launch Validator**
- Has a GitHub repo but hasn't launched yet
- Wants to validate demand before building more
- Uses PinPoint to find potential users to interview, not just to sell

---

## 5. User Stories

### Onboarding (GEO Generation)

- As a builder, I want to connect my GitHub repo so that PinPoint can read my code and README to suggest answers grounded in my actual project.
- As a builder, I want AI-suggested answers presented as selectable tags so that I can pick what fits, remove what doesn't, and add my own — rather than editing a wall of pre-filled text.
- As a builder, I want to provide my key product URLs (website, docs, pricing, API) so that my llms.txt accurately maps where AI agents can find my resources.
- As a builder, I want a generated llms.txt (resource index) and llms-full.txt (product brief) so that AI assistants can discover and recommend my product accurately.
- As a builder, I want to open a GitHub PR with my GEO files in one click so that I don't have to manually copy-paste files into my repo.

### Reddit Monitoring

- As a builder, I want Reddit to be monitored continuously using my 20 keywords so that I never miss a relevant post from the last 24 hours.
- As a builder, I want the system to pre-filter posts so that I only see posts where the author is likely a genuine potential customer, not noise.
- As a builder, I want posts from Reddit users I have already commented to filtered out automatically so that I never contact the same person twice.
- As a builder, I want a draft comment written for each relevant post based on my GEO file so that I don't have to write from scratch every time.
- As a builder, I want to review, edit, and confirm or reject each comment from my dashboard before it is posted so that I stay in control of everything that goes out under my name.
- As a builder, I want comments posted from my own Reddit account so that interactions feel authentic and the relationship is mine to own.

### Dashboard

- As a builder, I want a dashboard showing all pending draft comments awaiting my decision so that I have one place to confirm or reject outreach.
- As a builder, I want a history of confirmed/posted comments with timestamps, subreddit, and post title so that I can track my outreach over time.
- As a builder, I want to see when a Reddit user who received my comment became a paying customer so that I understand what's converting.

### Conversion Tracking

- As a builder, I want to connect my Stripe account so that PinPoint can automatically detect when a Reddit-sourced lead becomes a paying customer.
- As a builder, I want a JavaScript snippet as an alternative to Stripe so that I can track conversions even if I don't use Stripe.

---

## 6. Product Overview

### Core Workflow

```
GitHub Repo URL
    ↓
One-time GitHub read → Initial GEO Draft (internal cache)
    ↓
URL Collection (website, docs, pricing, API)
    ↓
6-Step Onboarding Q&A (tag-based UI, AI-suggested)
    ↓
GEO File Generation
    ├── llms.txt       (resource index — links to pages/docs/API)
    └── llms-full.txt  (product brief — origin, customers, solution, Q&A, use cases, UVP)
    ↓  → Download or GitHub PR
Keyword Extraction (20 keywords from llms-full.txt)
    ↓
Reddit API Monitoring (hourly, last 24 hours)
    ↓
Filter: exclude previously contacted Reddit usernames
    ↓
LLM Filter Pass 1: Title relevance
    ↓
LLM Filter Pass 2: Full post — is author a potential user?
    ↓
LLM Draft Comment (based on llms-full.txt + post context)
    ↓
Dashboard: Review / Edit / Confirm / Reject
    ↓
Post via Builder's Reddit OAuth
    ↓
Store: post URL, comment, timestamp, Reddit username
    ↓
Conversion Attribution (UTM + Stripe webhook or JS snippet)
```

---

### Onboarding: GitHub Optimization

PinPoint reads the GitHub repo **once** at the start of onboarding, generating an **Initial GEO Draft** — a structured internal JSON file containing:

```json
{
  "repo_description": "...",
  "readme_summary": "...",
  "features": ["...", "..."],
  "tech_stack": ["...", "..."],
  "target_audience_hints": ["...", "..."],
  "example_use_cases": ["...", "..."]
}
```

This draft is stored and used as the context for all subsequent question steps. No further GitHub or LLM API calls are made to re-read the repo. Each question step calls the LLM with: Initial GEO Draft + answers from previous steps.

---

### Onboarding: URL Collection (Pre-Step)

Before the Q&A steps, builder inputs their key product URLs. These are used to generate llms.txt only — they are simple text fields, no AI involved.

| Field | Required | Example |
|---|---|---|
| Website | Yes | https://yourproduct.com |
| GitHub repo | Yes (already connected) | https://github.com/user/repo |
| Documentation | No | https://yourproduct.com/docs |
| Pricing page | No | https://yourproduct.com/pricing |
| API reference | No | https://yourproduct.com/api |

---

### Onboarding: Q&A Steps (6 Steps)

**UI Pattern:** Each step presents AI-suggested answers as removable tag chips. Builder clicks to deselect unwanted tags, types to add their own. No pre-filled text walls.

| Step | Question | AI Source (from Initial GEO Draft) |
|---|---|---|
| 1 | What's your origin story? Why did you build this? | readme_summary, repo description, commit messages |
| 2 | Who are your ideal customers? | readme_summary, target_audience_hints, feature descriptions (look for "for", "built for", "designed for") |
| 3 | What problem does your product solve? | readme_summary, features list |
| 4 | What questions do customers typically ask? | LLM-generated Q&A from steps 1–3 answers |
| 5 | What are the key use cases? | LLM-generated from steps 1–3 answers |
| 6 | How do you compare to competitors? | Frontier LLM call using repo + steps 1–5. Output: competitor table (see below). Builder fills UVP column. |

---

### Step 6: Competitor Table (Final Step)

AI generates a competitive comparison table. The UVP column is left blank for the builder to fill in. Builder can add/remove rows.

| | Your Product | Competitor A | Competitor B | Competitor C |
|---|---|---|---|---|
| Core capability | ✓ | ✓ | ✓ | ✗ |
| [Feature X] | ✓ | ✗ | ✓ | ✗ |
| [Feature Y] | ✓ | ✓ | ✗ | ✗ |
| Pricing | $XX/mo | $XX/mo | $XX/mo | Free |
| Target audience | — | — | — | — |
| **Your UVP** | *Builder writes this* | — | — | — |

---

### GEO File Structure

**llms.txt** — Standard resource index for AI agents. Generated from URL Collection step.

```
# [Product Name]

> [One-line product description from Step 3]

## Product

- [Homepage](https://yourproduct.com)
- [Pricing](https://yourproduct.com/pricing)

## Documentation

- [Docs](https://yourproduct.com/docs)

## API

- [API Reference](https://yourproduct.com/api)

## Source

- [GitHub Repository](https://github.com/user/repo)

## Full Context

- [Product Brief](https://raw.githubusercontent.com/user/repo/main/llms-full.txt)
```

---

**llms-full.txt** — Detailed product brief for LLMs. Generated from all 6 Q&A steps.

```
# [Product Name] — Full Product Brief

## Origin Story
[From Step 1]

## Ideal Customers
[From Step 2]

## Problem We Solve
[From Step 3]

## Frequently Asked Questions
Q: [From Step 4]
A: [From Step 4]
...

## Use Cases
- When [situation], [product] helps by [outcome] [From Step 5]
...

## Competitive Position
[Competitor table from Step 6]

## Unique Value Position
[Builder-written UVP from Step 6]
```

---

## 7. Feature Requirements

### P0 — Must Have (MVP cannot ship without these)

#### GEO Onboarding

- [ ] GitHub OAuth — request read access to repos
- [ ] One-time repo reader: fetch README + feature files, generate Initial GEO Draft (max 50K tokens, stored as JSON)
- [ ] URL Collection form (pre-step): website, docs, pricing, API — simple text inputs
- [ ] 6-step Q&A wizard with tag-chip UI
  - AI suggests tags from Initial GEO Draft
  - Tags are removable (click ✕)
  - Builder can type to add custom tags
  - Multi-select supported on all steps
- [ ] Step 6 renders as an editable competitor table; UVP column is a free-text field per product
- [ ] Frontier LLM call for Step 6 competitor identification (use GPT-4o or Claude Sonnet — higher quality justified here)
- [ ] Generate llms.txt from URL Collection step
- [ ] Generate llms-full.txt from all 6 Q&A steps
- [ ] Download button for both GEO files
- [ ] GitHub PR creation for both GEO files (uses existing GitHub OAuth)
- [ ] Keyword extraction from llms-full.txt — output exactly 20 keywords

**Acceptance criteria:**
- Given a valid GitHub URL, when builder connects their repo, then Initial GEO Draft is generated within 30 seconds and stored — no further repo reads occur during Q&A
- Given the URL Collection step, when builder submits URLs, then llms.txt is generated in the correct resource-index format (matching the llms.txt standard)
- Given completed Q&A steps, when builder finishes Step 6, then llms-full.txt is generated with all sections populated
- Given GitHub OAuth connected, when builder clicks "Open PR", then a PR is created in their repo with both GEO files on a new branch `pinpoint/geo-files`

---

#### Reddit Monitoring

- [ ] Reddit OAuth — request `identity`, `read`, `submit` scopes from builder
- [ ] Reddit search API: query per keyword, filtered to last 24 hours, results deduplicated by post_id
- [ ] **Duplicate user filter:** before LLM filtering, exclude any post where the author's Reddit username already exists in the builder's `comments` table (any status)
- [ ] LLM Filter Pass 1: classify post title as relevant/irrelevant (cheapest model — GPT-4o-mini or Gemini Flash)
- [ ] LLM Filter Pass 2: classify full post — is author a genuine potential user? (cheapest model)
- [ ] LLM comment generator: draft comment from llms-full.txt + post content
  - Must open with a direct, useful answer to the post (2–3 sentences minimum)
  - Product mention comes at the end only
  - Must not sound promotional
- [ ] Hourly monitoring cron job (runs continuously while subscription is active)
- [ ] Rate limiting: max 10 comment confirmations per builder per day (Reddit ToS protection)

**Acceptance criteria:**
- Given a Reddit username exists in the builder's comment history, when a new post by that username is fetched, then it is silently excluded before reaching LLM filtering
- Given 20 keywords, when hourly cron runs, then posts from last 24 hours are fetched and deduplicated before filtering
- Given a post passes both LLM filters, then a draft comment appears in the builder's dashboard awaiting action

---

#### Dashboard

The dashboard is the **single place** where builders review and act on all Reddit outreach. Nothing is posted without explicit confirmation here.

- [ ] **Pending tab:** list of draft comments awaiting confirmation. Each card shows:
  - Post title + subreddit + link to original post
  - Reddit author username
  - Draft comment (editable inline)
  - Confirm button → posts comment and moves to Posted tab
  - Reject button → dismisses and archives
- [ ] **Posted tab:** history of confirmed comments with timestamp, subreddit, post title, comment text, Reddit author username
- [ ] **Converted badge:** shown on Posted tab entries where a conversion was tracked
- [ ] Store on confirm: post URL, subreddit, post title, comment text, timestamp, Reddit username, reddit_comment_id

**Acceptance criteria:**
- Given a draft comment is ready, when builder opens dashboard, then it appears in the Pending tab with full post context visible
- Given builder clicks Confirm, then comment is posted to Reddit from builder's account, the entry moves to Posted tab, and the Reddit username is added to the contacted users list
- Given builder clicks Reject, then the post is archived and the author is NOT added to the contacted users list (they may appear again in future searches)

---

#### Auth & Accounts

- [ ] Email/password signup or Google OAuth for PinPoint account
- [ ] GitHub OAuth (read repos + create PRs)
- [ ] Reddit OAuth (read + submit)
- [ ] One project per account in v1

#### Pricing & Trial

- [ ] 14-day free trial, full access, no credit card required
- [ ] Stripe subscription at $15/month after trial
- [ ] Trial expiry notice at day 12 and day 14
- [ ] Graceful degradation after trial ends: monitoring pauses, dashboard read-only

---

### P1 — Nice to Have (high-priority fast follows)

- [ ] Stripe webhook integration for conversion tracking
  - Builder connects Stripe account
  - PinPoint listens for `checkout.session.completed`
  - Matches via UTM tag embedded in comment links (`?ref=pp_[commentID]`)
  - Displays "Converted" badge on Posted tab
- [ ] JavaScript conversion snippet (alternative to Stripe)
  - One-line script for payment confirmation page
  - Reads UTM from sessionStorage → POSTs to `/api/conversions`
- [ ] UTM auto-tagging on all product links in draft comments
- [ ] Subreddit reputation filter — flag subreddits known for banning promotional comments
- [ ] GEO file refresh — re-run onboarding to update GEO files as product evolves
- [ ] Keyword performance view — which keywords surface the most confirmed posts
- [ ] Multiple projects (up to 3 per account)

---

### P2 — Future Considerations (v2+)

- [ ] Hacker News, IndieHackers, specific Slack community monitoring
- [ ] Content creation: GEO-based post suggestions for Twitter/LinkedIn
- [ ] Team seats
- [ ] GEO files hosted on PinPoint subdomain as fallback
- [ ] Higher-tier plan (50–100 keywords)

---

## 8. System Architecture

> For AI-assisted coding reference. Adjust based on your preferred stack.

### Recommended Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js (App Router) | Fast to build, easy to deploy on Vercel |
| Backend | Next.js API Routes or Hono | Co-located with frontend for solo dev speed |
| Database | PostgreSQL via Supabase | Free tier, built-in auth, easy to set up |
| Auth | Supabase Auth | Handles OAuth flows (GitHub, Reddit, Google) |
| Job Queue | Inngest or pg-boss | Cron jobs + reliable background tasks |
| LLM (filtering/generation) | GPT-4o-mini or Gemini Flash | Cheapest capable models |
| LLM (Step 6 competitor analysis) | GPT-4o or Claude Sonnet | Higher quality justified for one-time strategic step |
| Payments | Stripe | Standard, webhook support |
| Hosting | Vercel (frontend) + Supabase (DB) | Free tier viable until ~500 users |

---

### Key Database Tables

```sql
-- Users / Projects
users (id, email, created_at)

projects (
  id, user_id, name,
  github_repo_url,
  product_urls jsonb,       -- website, docs, pricing, api
  initial_geo_draft jsonb,  -- cached from GitHub read
  keywords jsonb,           -- 20 keywords array
  created_at
)

-- GEO
geo_files (
  id, project_id,
  llms_txt text,
  llms_full_txt text,
  onboarding_answers jsonb, -- all 6 steps stored
  created_at
)

-- OAuth Tokens
github_tokens (id, project_id, access_token)
reddit_accounts (id, project_id, reddit_username, access_token, refresh_token)

-- Reddit Monitoring
reddit_posts (
  id, project_id, keyword,
  post_id, subreddit, title, body,
  author_username, post_url, post_created_at, fetched_at
)

-- Comments (outreach)
comments (
  id, project_id, reddit_post_id,
  author_username,          -- denormalized for fast duplicate-user lookup
  draft_text, edited_text,
  status,                   -- pending | confirmed | rejected | posted
  posted_at, reddit_comment_id,
  utm_tag,                  -- e.g. pp_[comment_id]
  confirmed_at, rejected_at
)

-- Conversions
conversions (
  id, project_id, comment_id,
  source,                   -- stripe | js_snippet
  converted_at,
  stripe_payment_intent_id
)
```

---

### Duplicate User Filter (Implementation Note)

Before passing any fetched post to LLM filtering, query:

```sql
SELECT 1 FROM comments
WHERE project_id = $1
  AND author_username = $2
LIMIT 1;
```

If a row exists (regardless of comment status), skip the post entirely. This check runs in memory after fetch, before any LLM API call — no token cost.

---

### LLM Prompt Design

**Filter Pass 1 — Title Relevance**
```
System: You are evaluating Reddit post titles to determine if the author 
might benefit from a specific product. Be strict. Only approve titles 
where the author clearly has the problem the product solves.

Product context: {llms_full_txt_summary}
Post title: {title}
Subreddit: {subreddit}

Reply with JSON: {"relevant": true/false, "reason": "one sentence"}
```

**Filter Pass 2 — Full Post Relevance**
```
System: Evaluate this Reddit post. Is the author a genuine potential user 
of the product? They must be:
1. Experiencing the problem the product solves
2. Actively seeking a solution or asking for advice
3. NOT already solved their problem or committed to a competitor

Product context: {llms_full_txt}
Post: {title}\n{body}
Top comments (if any): {top_comments}

Reply with JSON: {
  "potential_user": true/false, 
  "confidence": "high|medium|low", 
  "reason": "one sentence"
}
Only return potential_user: true for high or medium confidence.
```

**Comment Generation**
```
System: Write a Reddit comment on behalf of a founder who built a 
relevant product. Follow these rules strictly:
1. Open with a direct, genuinely useful answer to the poster's 
   question (2–3 sentences minimum). Prove you understand their problem.
2. Draw on the product's origin story or insight to add credibility.
3. Mention the product naturally in the final sentence only — never at 
   the start. One mention maximum.
4. Sound like a human founder who cares about the problem, not a marketer.
5. Never use: "I'd like to introduce", "check out", "perfect solution", 
   "game-changer", exclamation marks, or emojis.
6. Maximum 150 words.

Product context (llms-full.txt): {llms_full_txt}
Reddit post: {title}\n{body}

Write the comment only. No preamble.
```

---

### Reddit API Notes

- Endpoint: `GET /search.json?q={keyword}&sort=new&t=day`
- Requires OAuth with `read` scope for search, `submit` scope for commenting
- Rate limit: 60 requests/minute per OAuth token
- 20 keywords = 20 API calls per sweep — well within limits
- Run sweep every 60 minutes via cron
- Deduplicate by `post_id` before any filtering

---

### Conversion Tracking Flow

```
Comment posted → UTM tag auto-appended to product URL in comment
    ↓
User clicks link (utm_content = pp_[comment_id])
    ↓
Option A — Stripe webhook:
    Builder connects Stripe OAuth
    On checkout.session.completed → match utm_content from session metadata
    Log conversion with comment_id

Option B — JS snippet:
    <script src="https://pinpoint.app/track.js?pid={project_id}"></script>
    Place on payment confirmation page
    Script reads UTM from sessionStorage
    POSTs {comment_id, project_id} to /api/conversions
```

---

## 9. Success Metrics

### Leading Indicators (measure weekly)

| Metric | Target | Measurement |
|---|---|---|
| Onboarding completion rate | ≥ 70% complete all steps | % of signups who reach dashboard |
| Time to first lead | ≤ 24 hours after setup | Time from dashboard activation to first pending comment |
| Comment confirm rate | ≥ 20% of drafted comments confirmed | confirmed / total drafted |
| Comments posted per active builder/week | ≥ 3 | Average across active users |

### Lagging Indicators (measure monthly)

| Metric | Target | Measurement |
|---|---|---|
| Trial → paid conversion | ≥ 30% | Stripe subscriptions / trial starts |
| Conversion tracked per builder | ≥ 1 paying user in 30 days | Stripe/JS snippet attribution |
| Monthly churn | ≤ 10% | Stripe cancellations |
| Builder-reported first paying user (survey) | ≥ 50% within 60 days | 60-day email survey |

---

## 10. Open Questions

| Question | Owner | Blocking? |
|---|---|---|
| What Reddit ToS limits apply to human-approved automated posting? Is this a violation at scale? | Manual research | **Yes — resolve before launch** |
| Which subreddits regularly ban promotional comments? Should we maintain a blocklist from day one? | Engineering | No — can add post-launch |
| Should rejected posts re-enter the queue if the same author posts again later? Currently: no (rejected author is not added to contacted list, so they can appear again). Is that correct? | Product | No |
| What is the minimum Reddit account age/karma to post reliably? Should we warn builders with new accounts? | Engineering | No |
| Should we support private GitHub repos in v1? Requires more careful token handling. | Engineering | No — public repos only in v1 |
| For Step 6 (competitor table), if AI finds no clear competitors, what do we show? | Design | No |

---

## 11. Roadmap

### Phase 1 — Core MVP (Weeks 1–5)
*Goal: Builder goes from GitHub URL to first Reddit comment confirmed from the dashboard*

**Week 1–2: Foundation + Onboarding**
- [ ] Project setup: Next.js + Supabase + Auth (Google OAuth)
- [ ] GitHub OAuth — read repos
- [ ] GitHub repo parser — fetch README + feature files, generate Initial GEO Draft JSON (max 50K tokens)
- [ ] URL Collection form (pre-step)
- [ ] 6-step onboarding wizard with tag-chip UI
- [ ] LLM integration for tag suggestions (GPT-4o-mini for steps 1–5, GPT-4o for step 6)
- [ ] Step 6: competitor table UI with editable UVP column

**Week 3: GEO Generation**
- [ ] llms.txt generator (resource index format from URL Collection)
- [ ] llms-full.txt generator (product brief from all 6 steps)
- [ ] Download both files
- [ ] GitHub PR creation (`pinpoint/geo-files` branch)
- [ ] Keyword extractor — 20 keywords from llms-full.txt

**Week 4: Reddit Pipeline**
- [ ] Reddit OAuth (identity + read + submit)
- [ ] Reddit search API integration (by keyword, last 24h, deduplicated)
- [ ] Duplicate user filter (pre-LLM, SQL lookup)
- [ ] LLM Filter Pass 1: title relevance
- [ ] LLM Filter Pass 2: full post — potential user classification
- [ ] LLM comment generator (llms-full.txt grounded)
- [ ] Hourly cron job

**Week 5: Dashboard + Posting + Billing**
- [ ] Dashboard: Pending tab (confirm/edit/reject)
- [ ] Dashboard: Posted tab (history)
- [ ] Post comment via builder's Reddit OAuth
- [ ] UTM auto-tagging on product links
- [ ] Stripe trial + subscription ($15/month, 14-day free, no card required)
- [ ] Trial expiry emails (day 12, day 14)

**MVP Launch Criteria:**
- Builder completes full onboarding in < 30 min ✓
- First relevant Reddit post appears in dashboard within 24h ✓
- Builder can confirm and post a comment in < 2 min ✓
- Trial to paid Stripe flow works end-to-end ✓

---

### Phase 2 — Conversion Tracking (Weeks 6–7)
*Goal: Close the attribution loop — know which comments make money*

- [ ] Stripe webhook integration (`checkout.session.completed` → conversion log)
- [ ] JavaScript conversion snippet (hosted, one-line install)
- [ ] "Converted" badge on Posted tab entries
- [ ] Conversion summary: total users acquired via PinPoint

---

### Phase 3 — Quality & Retention (Weeks 8–10)
*Goal: Improve signal quality, reduce churn*

- [ ] Subreddit blocklist (flag known ban-heavy subreddits before builder confirms)
- [ ] Keyword performance view (which keywords yield most confirmed posts)
- [ ] GEO file refresh (re-run onboarding as product evolves)
- [ ] Multiple projects (up to 3 per account)
- [ ] Reddit account health warning (detect shadowban)

---

### Phase 4 — Expansion (Week 11+, based on retention data)
*Do not build until Phase 1–3 metrics are healthy*

- [ ] Hacker News monitoring (Ask HN + Show HN)
- [ ] IndieHackers monitoring
- [ ] Content creation: GEO-based post suggestions for Twitter/LinkedIn
- [ ] Higher-tier plan (50–100 keywords)
- [ ] Team seats

---

## Appendix: Cost Model

| Item | Per builder/month |
|---|---|
| Reddit API | ~$0.50 |
| LLM: title filter (15K posts) | ~$0.40 |
| LLM: full post filter (3K posts) | ~$0.45 |
| LLM: comment generation (600 drafts) | ~$0.25 |
| LLM: onboarding/GEO (one-time, amortized) | ~$0.05 |
| Infrastructure (DB, compute, cron) | ~$0.50 |
| **Total** | **~$2.15–2.50** |

At $15/month: ~6× margin. Healthy unit economics from day one.

---

*This document is the source of truth for v1 development. Anything not listed in P0 requirements is out of scope for the initial build. When in doubt, cut scope and ship.*