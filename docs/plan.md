# Implementation Plan

**Status:** implemented. This document describes the plan the application was built from, updated to match the final code. Requirement IDs (FR-x, TG-x, NFR-x) refer to [requirements.md](requirements.md). The testing approach is in [test.md](test.md).

## 1. Approach

- **React and TypeScript in a single-page app**, built with Vite, with no backend of its own (TG-1).
- **Three sources:** The Guardian, The New York Times and NewsAPI.org (TG-2).
- **One adapter per source.** Each adapter translates a shared search query into that API's parameters and turns its response into a shared `Article` shape. The UI never handles source-specific data.
- **A small proxy holds the API keys.** The Vite dev server does this in development and nginx does it in Docker. The browser only calls same-origin `/api/<source>/…` paths (NFR-1).
- **Search state lives in the URL; preferences live in the browser** (`localStorage`). Server data is fetched and cached with TanStack Query.
- **A newspaper-style UI** that adapts from phone to desktop (FR-3, NFR-6).

## 2. Tech stack

| Concern               | Choice                                                             | Why                                                                  |
| --------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Framework             | React 19 + TypeScript 6 (strict)                                   | Required by the brief                                                |
| Build and dev server  | Vite 8                                                             | Fast builds, and its dev proxy keeps API keys out of the browser     |
| Routing               | React Router 7 (`createBrowserRouter`)                              | Search state in the URL, scroll restoration                         |
| Server data           | TanStack Query 5 (`useInfiniteQuery`)                              | Caching, deduplication, retries, paging, keeping old results visible |
| Preferences state     | Zustand 5 with the `persist` middleware                            | Small, and saves to `localStorage` with no extra code                |
| Styling               | Tailwind CSS 4, plus a few component classes in `src/index.css`    | Fast mobile-first responsive work                                    |
| Fonts                 | Fontsource (self-hosted): UnifrakturMaguntia, Playfair Display, Source Serif 4 | Newspaper look without calling a third-party font CDN    |
| Tests                 | Vitest 5, jsdom, Testing Library, user-event, jest-dom             | See [test.md](test.md)                                               |
| Container             | Multi-stage Docker build: Node 22 builds, nginx serves              | Small image; nginx also runs the API proxy                           |

## 3. Architecture

### 3.1 Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│ Pages        FeedPage · SearchPage · PreferencesPage · NotFoundPage  │
│ Components   ArticleResults · ArticleGrid · ArticleCard · FilterPanel│
├──────────────────────────────────────────────────────────────────────┤
│ State        useArticles (TanStack Query)   useSearchFilters (URL)   │
│              usePreferences (Zustand + localStorage)                 │
├──────────────────────────────────────────────────────────────────────┤
│ Service      NewsService (aggregator), provided via React context    │
│ Adapters     Guardian · NYT · NewsAPI   (all implement NewsProvider) │
│ HTTP         fetchJson · buildUrl · ApiError                         │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ GET /api/<source>/…  (same origin)
                    ┌───────────▼────────────┐
                    │ Proxy: Vite dev server │  adds the API key
                    │   or nginx (Docker)    │
                    └───────────┬────────────┘
                                ▼
          content.guardianapis.com · api.nytimes.com · newsapi.org
```

### 3.2 Folder structure

```
src/
  app/                 App, router, query client, NewsService context, 404 page
  services/news/       Data layer with no React code
    types.ts             Article, ArticleQuery, ProviderPage, NewsProvider
    labels.ts            Display names for sources and categories
    http.ts              fetchJson, buildUrl, ApiError, readable error messages
    normalize.ts         Byline splitting, HTML stripping, dedupe, sort, date checks
    aggregator.ts        Parallel fetch, merge, dedupe, sort, failure reporting
    providers/           guardian.ts · nyt.ts · newsapi.ts (+ tests)
    index.ts             Public API, and the registry of providers
  hooks/               useArticles, useDebouncedCallback
  features/
    feed/                FeedPage, followed-author ranking
    search/              SearchPage, SearchBox, FilterPanel, ActiveFilters, URL filter state
    preferences/         PreferencesPage, preferences store
  components/
    articles/            ArticleResults, ArticleGrid, ArticleCard, Byline, ArticleImage, skeleton, notices
    filters/             SourcePicker (shared by search and preferences)
    layout/              Layout, Masthead, NavBar
    ui/                  Button, Chip, Drawer, EmptyState, Fieldset, PageHeading
  utils/               Date formatting, "all or a subset" selection helper, list formatting
  test/                Test setup, fixtures, render helper
docker/                nginx config template and shared proxy settings
docs/                  requirements.md · plan.md · test.md
```

### 3.3 What happens when a list loads

1. A page builds an `ArticleQuery` (keyword, dates, categories, sources), either from the URL or from saved preferences.
2. `useArticles` normalizes the query into a stable cache key and calls `NewsService.fetchPage(query, page, sources)`.
3. The aggregator calls every requested provider in parallel with `Promise.allSettled`.
4. Each provider builds its request URL, calls `/api/<source>/…`, and maps the response into `Article` objects.
5. The aggregator merges the results, removes duplicates, sorts newest first, and returns three things: the articles, any sources that failed, and the sources that have more pages.
6. "More stories" asks only the sources that had more pages for the next page.

## 4. Data layer

### 4.1 Shared types (`types.ts`)

- **`Article`:** `id`, `url`, `title`, `description`, `imageUrl?`, `publishedAt` (ISO date), `authors[]`, `section?`, `sourceId` (which API), and `publisher` (the actual publication, e.g. "BBC News" for a story that came through NewsAPI).
  - IDs are prefixed with the source: `guardian:<content id>`, `nyt:<document id>`, `newsapi:<url>`.
- **`ArticleQuery`:** `keyword?`, `from?`, `to?` (`YYYY-MM-DD`, both inclusive), `categories[]`, `sources[]`. An empty list means *all*.
- **`NewsProvider`:** `fetchArticles(query, page, signal) → { articles, hasMore }`. Pages start at 1; each provider converts to its own numbering.

### 4.2 Categories

There are six shared categories, matching what NewsAPI supports. Each provider maps them in its own table (typed as `Record<Category, …>`, so adding a category won't compile until every provider maps it).

| Category      | The Guardian (`tag`, combined with `\|` for OR) | NYT (`fq=section.name:(…)`)  | NewsAPI (`category`) |
| ------------- | ------------------------------------------------ | ---------------------------- | -------------------- |
| Business      | `business/business`                              | Business                     | `business`           |
| Entertainment | `culture/culture`                                | Arts, Movies, Theater        | `entertainment`      |
| Health        | `society/health`                                 | Health, Well                 | `health`             |
| Science       | `science/science`                                | Science                      | `science`            |
| Sports        | `sport/sport`                                    | Sports                       | `sports`             |
| Technology    | `technology/technology`                          | Technology                   | `technology`         |

The Guardian uses tags rather than sections because it has no Health section.

### 4.3 Provider adapters

All adapters ask for 10 results per page.

**The Guardian** (`/search`)
- Parameters: `q`, `tag`, `from-date`, `to-date`, `order-by=newest`, `page`, `page-size`, `show-fields=trailText,thumbnail,byline`, `show-tags=contributor`.
- Authors come from contributor tags, falling back to the byline field.
- HTML is stripped from the trail text.
- The 500px thumbnail is swapped for the same image at 1000px.
- More pages exist while `currentPage < pages`.

**New York Times** (`/articlesearch.json`)
- Parameters: `q`, `fq=section.name:("A" "B")`, `begin_date` and `end_date` (`YYYYMMDD`), `sort=newest`, and `page` (which starts at 0).
- Bylines such as "By A, B and C" are split into separate names.
- The image is `multimedia.default.url`.
- Paging stops after 1,000 hits, the API's limit.

**NewsAPI**
- **Which endpoint:**
  - A category is selected, or there's no keyword → `/top-headlines` (`country=us`). This endpoint takes **one category per request**, so several categories mean several parallel requests. Each article is labelled with the category it came from.
  - A keyword and no category → `/everything` (`q`, `from`, `to`, `language=en`, `sortBy=publishedAt`).
- `/top-headlines` ignores dates, so the date range is applied to its results in the app.
- Clean-up:
  - Removed stories (titled `[Removed]`) are dropped.
  - A trailing " - Publisher" is cut from titles, even when the name is written slightly differently (e.g. "TechPowerUp" vs "Techpowerup.com").
  - Author entries that are URLs, or just the publisher's name, are dropped.
- Paging stops after 100 results, the free plan's limit.

### 4.4 Aggregator (`aggregator.ts`)

- **Registry:** providers are registered by ID, and only the requested sources are called.
- **Partial failure:** a source that fails is added to `failures` and the rest still render. Only if **every** requested source fails does the call reject, with a message that lists each source's error (NFR-2).
- **Duplicates:** stories are matched by a normalized URL (no protocol, `www.`, query string, fragment or trailing slash). Sources are processed in the order they were requested, and the first copy found is kept.
- **Order:** newest first, by parsed timestamp.
- **Paging:** `pendingSources` lists the sources that reported more pages.

### 4.5 HTTP (`http.ts`)

- `buildUrl` leaves out empty parameters, so adapters can pass optional filters through without checks.
- `fetchJson` turns failures into an `ApiError` with a readable message:
  - 429 → "Rate limit reached…"
  - 401 or 403 → "The API key was rejected."
  - Otherwise, the error message from the response body (each API puts it in a different place).
  - Network failures → "Network error…"
  - Cancelled requests are passed through unchanged.

## 5. API key proxy (NFR-1)

| Source       | Upstream                                      | How the key is attached     |
| ------------ | --------------------------------------------- | --------------------------- |
| The Guardian | `https://content.guardianapis.com/`           | `api-key` query parameter   |
| NYT          | `https://api.nytimes.com/svc/search/v2/`      | `api-key` query parameter   |
| NewsAPI      | `https://newsapi.org/v2/`                     | `X-Api-Key` header          |

- **Development:** `vite.config.ts` reads `GUARDIAN_API_KEY`, `NYT_API_KEY` and `NEWS_API_KEY` from `.env` (inside the config only, so they never reach the browser) and proxies `/api/*`. It also removes the `Origin` and `Referer` headers.
- **Docker:** `docker/nginx.conf.template` is filled in from environment variables when the container starts. Each proxy location includes `docker/news-api-proxy.conf`, which:
  - sends the upstream hostname for TLS (SNI),
  - clears the `Origin`, `Referer` and `Cookie` headers and hides `Set-Cookie`,
  - sets timeouts (5s to connect, 15s to read).
- Removing `Origin` is what lets NewsAPI's free plan work outside localhost.

## 6. State and data fetching

### 6.1 Articles (`useArticles`)

- **Stable cache keys:** the keyword is trimmed, the category and source lists are sorted, and an empty source list becomes all sources. Equivalent queries therefore share one cache entry.
- **Paging:** each page request carries `{ page, sources }`. Sources that ran out of results drop out of later pages.
- **Smooth updates:** `placeholderData: keepPreviousData` keeps the previous results on screen, dimmed, while a new search loads.
- **Results:** all loaded pages are combined and deduplicated, along with the latest failure for each source.
- **Query client defaults:** results are treated as fresh for 5 minutes and kept for 30, failed requests are retried once, and there's no refetch when the window regains focus (NFR-3).

### 6.2 Search state in the URL (`searchFilters.ts`, `useSearchFilters`)

| Parameter  | Meaning                                    | Validation                                 |
| ---------- | ------------------------------------------ | ------------------------------------------ |
| `q`        | Keyword                                    | Trimmed; left out when empty               |
| `from`     | Start date, inclusive                      | Must be `YYYY-MM-DD`                       |
| `to`       | End date, inclusive                        | Must be `YYYY-MM-DD`                       |
| `category` | One category                               | Must be a known category                   |
| `sources`  | Comma-separated subset of sources          | Unknown values dropped; all three = no filter |

Values that fail validation are ignored, so hand-edited URLs can't break the page.

### 6.3 Preferences (`preferencesStore.ts`)

- Stored under `daily-news:preferences` in `localStorage` (version 1).
- **Sources:** empty means all. You can't untick the last remaining source, and ticking all three again goes back to "all". This logic (`toggleSubset`) is shared with the search filters.
- **Categories:** a plain on/off toggle; none selected means every topic.
- **Authors:** whitespace is trimmed, and matching ignores case and accents (`sameAuthor`), so the same author can't be added twice.

### 6.4 Swapping the service in tests

Components get the `NewsService` from `NewsServiceContext`; by default it's the real aggregator. Tests provide a fake through the same context, so no global `fetch` mocking is needed.

## 7. Pages and features

### 7.1 "For You" feed, `/` (FR-2)

- Built from the saved preferred sources and categories.
- A summary line describes the current edition ("Technology from every source. …") and links to the preferences page.
- Stories by followed authors are moved to the top, keeping each group in date order.
- **"Only authors I follow"** filters the feed to those stories. It only appears when you follow at least one author.
- **Front-page layout:** a large lead story with two secondary stories beside it, then the ruled column grid.

### 7.2 Search, `/search` (FR-1)

- **Search box (in the header on every page):**
  - On other pages, pressing Enter opens `/search?q=…`.
  - On the search page, results update as you type, after a 500ms pause (NFR-3).
  - The box stays in sync with the URL, e.g. when using the back button.
- **Filter panel:**
  - Date presets (Any time, Today, Past week, Past month) plus From/To date pickers, limited to valid ranges.
  - Category as radio buttons, including "All categories".
  - Sources as checkboxes, shared with the preferences page.
  - "Clear filters".
- **Active filters:** shown as removable chips with a "Clear all" link. On small screens this is the only place they're visible.
- **Layout:** a sticky sidebar from 1024px wide. Below that, a "Filters (n)" button opens a slide-over drawer built on the native `<dialog>` element.

### 7.3 Preferences, `/preferences` (FR-2)

- Sources (checkboxes), topics (toggle chips), and authors (add by name, remove with ×).
- Changes save immediately, and **"Reset all"** clears everything.
- Authors can also be followed from any byline: each name has a **+ / ✓** button.

### 7.4 States shared by all lists (`ArticleResults`)

| State              | Behaviour                                                                     |
| ------------------ | ----------------------------------------------------------------------------- |
| Loading            | A grid of placeholder cards                                                   |
| Updating           | Previous results stay visible but dimmed                                      |
| Some sources fail  | A "Wire trouble" notice names each failed source; the other stories show      |
| Every source fails | "Stop the presses!" with the error message and a **Try again** button         |
| No results         | An empty-state message tailored to the page                                   |
| More pages         | A **More stories** button (shows "Fetching more…" while loading)              |
| End of results     | The journalist's `-30-` end mark                                              |
| Screen readers     | A polite live region announces "*n* stories shown"                            |

### 7.5 Article cards

- Each card shows: a photo, the section and publisher, the headline, a summary of up to 3 lines, the byline with follow buttons, and a relative time ("5 hours ago", with the full date on hover).
- The headline link covers the whole card and **opens the original story on the publisher's site in a new tab**. The follow buttons sit above that link, so they stay clickable.
- Images load lazily, are sent without a referrer, and are hidden if they fail to load.

### 7.6 Not found

Unknown URLs show a "page not found" message with a link back to the front page.

## 8. Visual design and responsiveness

### 8.1 Newspaper styling (NFR-6)

- **Masthead:**
  - "The Daily News" in a blackletter font.
  - A top line with "Vol. I · No. ⟨day of year⟩", today's date and "Free edition".
  - A tagline naming the three sources.
- **Navigation bar:** between double rules, with the active page in red and underlined.
- **Typography:** Playfair Display for headlines, Source Serif 4 for body text, and small capitals for labels (`.kicker`).
- **Colours:** a white background (`paper`), near-black text (`ink`) with softer and fainter tones, thin rule lines, and a deep red accent.
- **Front page:** the lead story has a drop cap; double rules separate the sections.
- **Column rules:** thin vertical and horizontal lines between cards, at any number of columns (`.ruled-columns`).
  - How: every cell draws its own top and left line, the list is shifted up and left, and the outer lines are clipped.
- **Photos:** full colour, with a slow 4% zoom when the card is hovered or focused. The zoom stays inside the image frame and is only applied when:
  - the device has a real pointer (touch screens keep the hover state after a tap),
  - the user hasn't asked for reduced motion.
- **Plain white background:** an earlier rough paper texture and greyscale photos were replaced by this decision.

### 8.2 Responsive behaviour (FR-3)

| Width            | Layout                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Under 768px      | One column; the date moves below the masthead; centred nav; full-width search; filter drawer |
| 768px and up     | Two columns of cards                                                                       |
| 1024px and up    | Three columns; the front page sits beside the lead story; the search sidebar is visible    |
| Up to 1280px     | Page content stops widening here                                                           |

- The masthead text scales with the viewport (`clamp`).
- The date inputs stack when the filter panel is narrow, using a container query.

### 8.3 Accessibility (NFR-4)

- Landmarks (`banner`, `navigation`, `search`, `main`, `complementary`, `contentinfo`) and a "Skip to content" link.
- Accessible names on every control: "Follow ⟨name⟩" with `aria-pressed`, "Remove filter: …", search input labels.
- A visible focus outline in the accent colour.
- The drawer is a native `<dialog>`: focus is trapped inside it and Escape closes it.
- Headline links say "(opens in a new tab)" for screen readers. Decorative images have empty `alt` text.
- Result counts are announced through a live region; motion is reduced when requested.

## 9. Docker (TG-3)

- **`Dockerfile`:**
  - Stage 1 (`node:22-alpine`): `npm ci`, then `npm run build` (type-check and bundle).
  - Stage 2 (`nginx:stable-alpine`): serves `dist/`.
  - Also: the config template is copied to `/etc/nginx/templates/`, a health check is included, and port 80 is exposed.
- **nginx:**
  - Every app route falls back to `index.html`.
  - Hashed files in `/assets/` are cached for a year (`immutable`); `index.html` is always revalidated (`no-cache`).
  - gzip compression is on, and the three `/api/*` proxies are defined here.
- **`docker-compose.yml`:** builds the image, maps `8080:80`, reads the keys from `.env`, and restarts unless stopped.
- **Runtime keys:** keys are read when the container **starts**, so changing one only needs a restart.

## 10. Design principles

| Principle             | Where it shows                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Single responsibility | Adapters only translate; the aggregator only combines; `http.ts` only handles requests and errors; hooks own state; components render. |
| Open/closed           | A new source is one new adapter plus one line in `services/news/index.ts`. The aggregator and UI don't change.                     |
| Liskov substitution   | Any `NewsProvider` (including test fakes) works with the aggregator; any `NewsService` works with the UI.                          |
| Interface segregation | Providers only implement `fetchArticles`. The UI depends on the one-method `NewsService`, not on the providers.                    |
| Dependency inversion  | Components get `NewsService` through context; adapters receive their `fetchJson` function as a parameter.                         |
| DRY                   | `ArticleResults` handles every loading/error/paging state; `SourcePicker`, `Fieldset`, `Chip`, `buttonClass` and `toggleSubset` are shared. |
| KISS                  | No backend beyond a config-only proxy; URL and `localStorage` instead of a state framework; native `<dialog>`; one-click "More stories" instead of infinite scroll. |

## 11. Delivery phases

| # | Phase                | Work                                                                                                   | Status |
| - | -------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| 1 | Tooling              | Dependencies, Tailwind, `@/` import alias, strict TypeScript, Vite proxy, `.env.example`               | Done   |
| 2 | Data layer           | Types, category maps, the three adapters, aggregator, HTTP helpers, with unit tests                    | Done   |
| 3 | State                | `useArticles`, URL filter state, preferences store, service context                                    | Done   |
| 4 | UI                   | Layout and masthead, cards and grid, feed, search and filters, preferences, all list states            | Done   |
| 5 | Responsive and a11y  | Breakpoints, drawer, container query, landmarks and labels, reduced motion                             | Done   |
| 6 | Docker and docs      | Dockerfile, nginx template, compose file, README, `docs/`                                              | Done   |
| 7 | Verification         | Lint, type check, tests, build, browser checks at 1440px and 390px, container checks                   | Done   |

## 12. Decisions log

| Decision                                                                       | Reason                                                                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Use The Guardian, NYT and NewsAPI                                               | The only listed sources with public, usable article APIs                                    |
| Keep API keys behind a proxy instead of in the bundle                          | Security, and NewsAPI's free plan only works from localhost otherwise                       |
| Match followed authors in the app                                              | The three APIs have no shared way to query by author                                        |
| Show NewsAPI categories via `/top-headlines`, filtering dates in the app       | `/everything` has no category filter, and `/top-headlines` has no date filter              |
| Order results newest first across all sources                                  | Relevance scores from different APIs can't be compared                                      |
| Plain white background and full-colour photos with a hover zoom               | Replaced the original paper texture and greyscale photos at the product owner's request     |
| No in-app article page; headlines open the original story                      | Only The Guardian provides full article text                                                |
| No dark mode yet                                                                | Deferred by the product owner                                                               |

## 13. Known limitations

- **Rate limits:** NYT allows 5 requests per minute; NewsAPI's free plan allows 100 per day, covers about the last month, and returns at most 100 results per query. Fast, repeated searching can hit a limit; the affected source is then reported as unavailable.
- **Followed authors** only match stories that are already loaded.
- **NewsAPI `/top-headlines`** covers US headlines only (`country=us`).
- **Preferences** are stored per browser.
