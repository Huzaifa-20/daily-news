# The Daily News

A news aggregator styled like a printed broadsheet. It pulls articles from **The Guardian**, **The New York Times** and **News API Org** into one feed and lets readers search, filter and personalize it.

Built with React 19, TypeScript, Vite, TanStack Query, React Router, Zustand and Tailwind CSS.

## Features

- **Search and filtering:** search by keyword, then filter by date (presets or a custom range), category and source. Filters are stored in the URL, so a results page can be bookmarked or shared and the back button works.
- **Personalized feed:** pick preferred sources and topics, and follow authors (from Preferences, or with the **+** next to any byline). Stories by followed authors lead the front page, and a toggle shows only their stories. Preferences are saved in the browser.
- **Mobile-responsive:** a single column on phones, a front-page layout with ruled columns on larger screens, and filters in a slide-over drawer on small screens.
- **Fault tolerant:** sources are queried in parallel. If one fails or is rate-limited, the others still render and a notice names the missing source.

## Documentation

| Document                                     | Contents                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [docs/requirements.md](docs/requirements.md) | Requirements from the brief, added requirements, and where each is implemented and tested |
| [docs/plan.md](docs/plan.md)                 | Architecture, data layer, state, UI, Docker, design principles and decisions              |
| [docs/test.md](docs/test.md)                 | Test approach, the automated test list, manual browser checks and container checks        |

## AI Integrated Workflow

I used Claude Code as a pair programmer. It drafted and wrote the code; I set the direction, reviewed each stage and signed it off before the next one started.

1. **Requirements first.** Before any code, I worked through the brief: which of the listed APIs are actually usable, what "filtering" and a "personalized feed" mean in practice, and what is out of scope. Captured in [docs/requirements.md](docs/requirements.md) by Claude.
2. **Planning Second** I planned the application within the brief's constraints (React with strict TypeScript, Docker, DRY/KISS/SOLID). Set the architecture (one adapter per news source behind a shared interface, API keys kept server-side behind a proxy, filters stored in the URL), added visual direction. Then Claude captured the plan in [docs/plan.md](docs/plan.md) and I approved it.
3. **Testing decided up front.** The plan defined what gets unit tests (the adapters, the aggregator, URL state), what gets component tests (search, feed, article cards) and what gets checked by hand. Captured in [docs/test.md](docs/test.md).
4. **Build, then verify.** Claude implemented the approved plan. I confirmed the test suite passes, then tested the app myself in the browser on desktop and mobile.
5. **Product decisions stayed with me.** After using the app:
   - I replaced the textured "newsprint" background with plain white, and switched photos from greyscale to full colour with a subtle hover zoom, for a better UX.
   - I decided against an in-app article page. Only The Guardian's API returns the full article text, so the reading experience would have been inconsistent across sources.
6. **Independent review.** I ran a separate Claude Code session to review security (no API keys in the bundle or the repository) and code quality (DRY and SOLID).

AI made the work faster. The requirements, architecture, trade-offs and final sign-off were mine.

## Running with Docker

1. Get free API keys:
   - The Guardian: <https://open-platform.theguardian.com/access/>
   - New York Times: <https://developer.nytimes.com/get-started> (enable the **Article Search API**)
   - NewsAPI: <https://newsapi.org/register>
2. Create `.env` from the template and fill in the keys:
   ```sh
   cp .env.example .env
   ```
3. Build and start the container:
   ```sh
   docker compose up --build
   ```
4. Open <http://localhost:8080>.

Stop it with `docker compose down`.

Without Compose:

```sh
docker build -t daily-news .
docker run --rm -p 8080:80 --env-file .env daily-news
```

The keys are read when the container **starts**, not when the image is built. To change a key, restart the container; no rebuild is needed.

## Local development

Requires Node 22+.

```sh
npm ci
cp .env.example .env   # then add your keys
npm run dev            # http://localhost:5173
```

| Script              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Dev server with hot reload and API proxy  |
| `npm run build`     | Type-check and build to `dist/`           |
| `npm test`          | Run the unit and component tests (Vitest) |
| `npm run lint`      | ESLint                                    |
| `npm run typecheck` | TypeScript only                           |

## How it works

### API keys never reach the browser

The app only calls same-origin paths: `/api/guardian/*`, `/api/nyt/*` and `/api/newsapi/*`. A proxy forwards each request upstream and attaches the key:

```
Browser ──/api/nyt/...──▶ proxy (adds api-key) ──▶ api.nytimes.com
```

- **In development**, the proxy is the Vite dev server (`vite.config.ts`).
- **In Docker**, it is nginx (`docker/nginx.conf.template`). The nginx image fills the keys into its config from environment variables at startup.

This keeps the keys out of the JavaScript bundle. It also works around NewsAPI's free plan, which refuses browser requests from any origin other than localhost.

### Architecture

```
src/
  services/news/        Framework-free data layer
    types.ts              Article, ArticleQuery and the NewsProvider interface
    providers/            One adapter per API: guardian.ts, nyt.ts, newsapi.ts
    aggregator.ts         Queries providers in parallel, then merges, dedupes and sorts
    http.ts, normalize.ts Shared fetch/error handling and text helpers
  hooks/useArticles.ts  Infinite query over the aggregator (caching, paging)
  features/
    feed/                 Personalized front page
    search/               Search page, filter panel, URL-backed filter state
    preferences/          Preferences page and persisted store
  components/           Layout, article cards and grid, shared UI
  app/                  Router, query client, service context
docker/                 nginx config template and shared proxy settings
docs/                   Requirements, implementation plan and test plan
```

See [docs/plan.md](docs/plan.md) for the full design.

- **Providers:** each provider translates the shared `ArticleQuery` into its own API's parameters and turns the response into the common `Article` shape. The UI never sees provider-specific data.
- **Aggregator:** fetches a page from every selected provider with `Promise.allSettled`, so one failure can't break the page. It also reports which providers have more results, and "More stories" only asks those providers again.
- **Adding a source:** write one adapter that implements `NewsProvider` and register it in `src/services/news/index.ts`. Nothing else changes.
- **Design principles:**
  - Single responsibility: adapters, the aggregator, the hooks and the components each do one job.
  - Dependency inversion: components get the `NewsService` abstraction through React context, which lets tests inject a fake.
  - Shared building blocks (`SourcePicker`, `Fieldset`, `Chip`, `ArticleResults`) keep the pages free of duplicated markup and state handling.

### How filters map to each API

| Filter   | The Guardian                         | New York Times            | NewsAPI                                                           |
| -------- | ------------------------------------ | ------------------------- | ----------------------------------------------------------------- |
| Keyword  | `q`                                  | `q`                       | `q`                                                               |
| Date     | `from-date` / `to-date`              | `begin_date` / `end_date` | `from` / `to` on `/everything`; filtered in the app for headlines |
| Category | `tag` (e.g. `technology/technology`) | `fq=section.name:(...)`   | `category` on `/top-headlines` (one request per category)         |

NewsAPI only supports categories on `/top-headlines`, and that endpoint ignores dates. So when a category is selected, its date range is applied to the results in the app.

The other APIs on the challenge list were not usable: NewsCred has shut down, OpenNews is not an article API, and the BBC has no public news API. BBC News stories still appear through NewsAPI.

## Known limitations

- **Rate limits.** NYT allows 5 requests per minute; NewsAPI's free plan allows 100 per day, covers about the last month, and stops after 100 results per query. Responses are cached for 5 minutes and typing in search is debounced, but fast, repeated searching can still hit a limit. When it does, the affected source is reported and the others keep working.
- **Authors** are matched in the app against the stories already loaded, because the three APIs offer no shared way to query by author.
- **Ordering** is newest first across all sources. Relevance scores from different APIs can't be compared.
- **Preferences** are stored per browser (`localStorage`); there are no user accounts.
