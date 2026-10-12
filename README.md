# Zerodha Clone

A full-stack educational trading platform inspired by Zerodha’s public website and Kite-style dashboard. It combines a marketing landing app, an authenticated trading dashboard, and an Express/MongoDB API with live Indian-equity market data, paper-trading tournaments, risk controls, and portfolio tools.

This project is **not affiliated with Zerodha**. It is a student/learning clone. It does **not** place real brokerage orders, hold real securities, or move real bank money. Fund deposits and withdrawals in the dashboard update simulated cash balances only.

**Contents:** [Architecture](#architecture) · [Feature inventory](#feature-inventory) · [Screens](#screens-and-user-flows) · [REST endpoints](#rest-endpoints) · [Data models](#data-models) · [Getting started](#getting-started) · [Tests](#tests) · [Troubleshooting](#troubleshooting)

---

## Architecture

Three Node.js packages run as separate apps and talk over HTTP + cookies. CORS and Socket.IO currently allow the two Vite origins on localhost.

| App | Folder | Default URL | Role |
| --- | --- | --- | --- |
| Landing / auth UI | `frontend/` | http://localhost:5173 | Public marketing pages, OTP signup, OTP login |
| Trading dashboard | `dashboard/` | http://localhost:5174 | Authenticated Kite-style app |
| API + Socket.IO | `backend/` | http://localhost:3000 | REST API, JWT cookies, TrueData, Twilio, Gemini |

After a successful signup or login, the landing app redirects to `http://localhost:5174/dashboard`. The dashboard’s `ProtectedRoute` calls `GET /api/auth/me` with credentials; unauthenticated users are sent back to the landing login page.

```
frontend (5173) ── signup / OTP login ──┐
                                        ├──► backend (3000) ── MongoDB
dashboard (5174) ── cookie session ─────┘         │
                                        Socket.IO │ TrueData WS
                                                  │ Twilio Verify
                                                  │ Google Gemini
```

---

## Tech stack

**Backend:** Express 5, Mongoose, JWT in httpOnly cookies, Passport local strategy (email/password), Joi validation, Socket.IO, bcrypt, Twilio Verify, TrueData (`truedata-nodejs` plus native WebSocket), Google Gemini (`@google/genai`).

**Dashboard:** React 19, Vite 8, React Router 7, Axios, Socket.IO client, MUI, Bootstrap, Recharts, react-markdown.

**Landing:** React 19, Vite 8, React Router 7, Axios.

**Tests:** Node.js built-in test runner (`node --test`) in `backend/tests/`.

---

## Repository layout

```
ZERODHA CLONE/
├── backend/          # Express API, models, services, tests
├── dashboard/        # Authenticated trading UI (port 5174)
├── frontend/         # Public site + OTP auth (port 5173)
└── README.md
```

Notable backend areas:

- `routes/` — HTTP surface mounted in `index.js`
- `controller/` — request handlers
- `services/` — orders, TrueData, OTP/SMS, tournaments, risk, backtest, AI
- `models/` + `schemas/` — MongoDB documents
- `middleware/` — JWT auth, Joi user validation, admin role, order validation
- `tests/` — unit/schema/simulation suites
- `scripts/setAdminRole.js` — promote a user to `admin`

---

## Feature inventory

Status meanings used below:

- **Implemented** — backend and/or UI code exists and is wired into a real route.
- **Verified** — covered by the backend test run documented in [Tests](#tests) (160 passed). That is **not** the same as a live browser or TrueData/Twilio end-to-end check.
- **Partial** — some of the workflow exists; a piece is missing, unused, or client-only.
- **Planned** — not built; listed only as a possible next step.

### Authentication and accounts

| Feature | Status | Notes |
| --- | --- | --- |
| Mobile OTP signup (send → verify → profile + password) | Implemented | Landing `SignUp.jsx`; Twilio Verify; registration requires `verificationToken` |
| OTP verification token + single-use challenge | Implemented / Verified | JWT token (15 min); challenge cannot be reused for another signup |
| Auto-login after register | Implemented | Sets `token` cookie; redirects to dashboard |
| OTP login | Implemented | Landing `Login.jsx` → `POST /api/auth/login/otp` |
| Email/password login | Partial | `POST /api/auth/login` + Passport local exist; **landing UI does not call them** |
| JWT httpOnly cookie, 1-day expiry | Implemented | `sameSite: lax`, `secure: false` (local development) |
| `GET /api/auth/me` + dashboard `ProtectedRoute` | Implemented | Unauthenticated users redirected to port 5173 `/login` |
| Logout | Implemented | Clears cookie |
| Logout other sessions (`tokenVersion`) | Implemented | Settings → security; reissues cookie for current session |
| Profile update (name, mobile) | Implemented | Settings |
| Change password | Implemented | Settings; password is stored hashed |
| Delete account | Implemented | Settings; requires current password |
| Unique client ID | Implemented | Generated at registration |
| User `status` (`active` / `blocked`) | Partial | Field exists; `isLoggedIn` does **not** reject blocked users |
| Admin role | Implemented | `role: user \| admin`; server-side `adminOnly` middleware |
| OTP rate limit (3 challenges / 5 minutes) | Implemented | Enforced in `otpService` |
| Twilio trial / error mapping | Implemented / Verified | Helper tests; live SMS depends on Twilio credentials |

### Landing website

| Feature | Status | Notes |
| --- | --- | --- |
| Home, About, Products, Pricing, Support, 404 | Implemented | Static marketing clone of public Zerodha pages |
| Support ticket system | Partial | Category links only; **no ticket API** |
| Coin / IPO / Kite Connect / Varsity as live products | Planned | Marketing copy and outbound links only |

### Market data and watchlists

| Feature | Status | Notes |
| --- | --- | --- |
| Live LTP cache from TrueData WebSocket | Implemented | `trueDataService`; default live port `8086` |
| REST prices: one symbol, all symbols, history | Implemented | `/api/market/price/:symbol`, `/prices`, `/prices/:symbol/history` |
| Dashboard poll every 5 seconds | Implemented | `AppContext` |
| Supported cash-equity symbols | Implemented | RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, ITC, BHARTIARTL, WIPRO, AXISBANK, KOTAKBANK, MARUTI, HINDUNILVR, SUNPHARMA (plus index labels in `marketStocks.js`) |
| Stock search | Implemented | Watchlist search over live `marketPrices` |
| Named watchlists (create, rename, delete, add/remove symbols) | Implemented / Verified (schema/ownership tests) | Max 10 lists/user, 50 symbols/list; cannot delete the last list |
| Legacy single watchlist API `/api/watchlist` | Partial | Still mounted; dashboard uses `/api/watchlists` |
| Price alerts (above/below) | Implemented / Verified (trigger logic tests) | Evaluated on TrueData ticks; in-app notification |
| Stock details popup | Implemented | Dashboard |
| Historical price chart popup | Implemented | Uses market history endpoint |
| `indianMarketService.js` | Partial | Unused duplicate of market-price helpers |

### Simulated trading (main account)

| Feature | Status | Notes |
| --- | --- | --- |
| Buy/sell Market and Limit orders | Implemented | Mongo transactions; live TrueData price for market fills |
| CNC and MIS product types | Implemented | Stored on orders, holdings, positions |
| Limit-order cash/qty reservation | Implemented | Released on fill or cancel |
| Pending limit execution on live ticks | Implemented | `checkPendingLimitOrders` |
| Cancel pending limit | Implemented | `POST /api/orders/cancel-limit` |
| Holdings (avg price, reserved qty, P&L) | Implemented | |
| Positions | Implemented | |
| Pre-trade risk check on order form | Implemented | Optional SL/target used for **risk math**, not as standalone SL/TP orders |
| Stop-loss / target as executable orders | Partial | UI fields exist; order schema has no SL/TP order type |
| Short selling beyond holdings | Partial | Risk helper supports short R:R; main order flow is long holdings/positions |
| Real brokerage / exchange connectivity | Planned | Intentionally not built |

### Funds (simulated)

| Feature | Status | Notes |
| --- | --- | --- |
| Available / used / reserved balances | Implemented | Created at signup with ₹0 |
| Add and withdraw | Implemented | No payment gateway; simulated cash |
| Fund transaction history | Implemented | |

### Notifications and realtime

| Feature | Status | Notes |
| --- | --- | --- |
| In-app notifications (list, unread count, read, delete) | Implemented | REST + Socket.IO room `user:{userId}` |
| Events: orders, funds, security, price alerts, tournaments | Implemented | See `NotificationSchema` enums |
| Notification preferences | Partial | Order/fund/system/security toggles; **no** dedicated price-alert or tournament preference keys |
| Live toast / dropdown | Implemented | Dashboard |
| Socket rooms for tournaments | Implemented | `join-tournament-room` / `tournament-leaderboard-update` |

### Portfolio analytics

| Feature | Status | Notes |
| --- | --- | --- |
| Summary (invested, current, cash, realized/unrealized, day P&L) | Implemented | `/api/analytics/*` |
| Performance over time (1W–ALL) | Implemented | Daily snapshots captured when analytics is requested |
| P&L breakdown and stock rankings | Implemented | |
| Allocation / performance charts | Implemented | Recharts on `/analytics` |

### Risk Guard

| Feature | Status | Notes |
| --- | --- | --- |
| Overview, settings, alerts | Implemented | Warning vs strict enforcement |
| Daily loss guard, position size, single-stock allocation | Implemented / Verified (calculation tests) | Evaluated before orders |
| Risk/reward calculator | Implemented / Verified | Dashboard Risk page |

### Trading journal

| Feature | Status | Notes |
| --- | --- | --- |
| CRUD entries, tags, rating, mistakes, rule-followed | Implemented | `/api/journal` |
| Calendar and journal analytics | Implemented | Dashboard `/journal` |

### Strategy backtest

| Feature | Status | Notes |
| --- | --- | --- |
| SMA crossover strategy | Implemented / Verified (signal + SMA tests) | Only strategy in `backend/strategies/` |
| Run on TrueData historical candles | Implemented | Intervals: 15min, 60min, EOD |
| Metrics (P&L, win rate, drawdown, profit factor) | Implemented / Verified | |
| Save / list / delete history | Implemented | User-scoped |

Journal and backtest **HTTP handlers** are implemented but not covered by HTTP integration tests; helper/strategy tests are verified.

### AI assistant

| Feature | Status | Notes |
| --- | --- | --- |
| Chat with portfolio context | Implemented | Gemini `gemini-3.5-flash-lite`; does not place orders |
| Chat history (list, get, delete) | Implemented | `/api/ai/chats` |
| Markdown rendering | Implemented | Dashboard `/ai-assistant` |

Requires `GEMINI_API_KEY`. Not covered by automated tests.

### Paper-trading tournaments

Isolated from real-account funds and holdings.

| Feature | Status | Notes |
| --- | --- | --- |
| List / filter / join / leave | Implemented / Verified (join-flow simulations) | Daily, weekly, monthly, private |
| Invite codes for private events | Implemented / Verified | |
| Virtual cash, holdings, Market + Limit trades | Implemented / Verified (simulation) | |
| Trading restrictions (symbols, qty, order types, max orders/positions) | Implemented / Verified | |
| Late-join, min-trades eligibility | Implemented / Verified | |
| Live leaderboard (return %, portfolio value, realized P&L) | Implemented / Verified (ranking tests) | Socket updates |
| History with immutable close snapshots | Implemented / Verified | |
| Lifecycle worker every 30s | Implemented | Upcoming → active → completed |
| Admin create / edit / status / seed / participants / orders / disqualify | Implemented / Verified (middleware + lifecycle tests) | `/admin/tournaments`; `adminOnly` |
| Admin audit log | Implemented | Console `[ADMIN AUDIT]` (invite codes redacted) |

### Settings and UX

| Feature | Status | Notes |
| --- | --- | --- |
| Light/dark theme | Implemented | `localStorage` |
| Default product / order type / confirm dialogs | Partial | **localStorage only**, not persisted on the server |
| Order and fund toasts | Implemented | |
| Quick buy/sell from dashboard | Implemented | Opens stock-selection popup then `TradePopup` |
| Orders search, status filters, cancel pending limit | Implemented | `/orders` |
| Holdings search, sort, allocation pie, exit trade | Implemented | `/holdings` |
| Positions search, sort, exit mode | Implemented | `/positions` |
| Notification inbox (category, unread, pagination, detail modal) | Implemented | Categories: all, order, fund, tournament, system — **price_alert is stored but not a dedicated filter tab** |

---

## Screens and user flows

### Landing (`frontend`, :5173)

| Route | What it does |
| --- | --- |
| `/` | Marketing home (hero, stats, pricing teaser, education, open-account CTA) |
| `/signup` | 4-step OTP signup: mobile → OTP → name/email/password → redirect to dashboard |
| `/login` | 2-step OTP login → redirect to dashboard |
| `/about` | Static about / team |
| `/products` | Static product marketing (Kite, Console, Coin, Kite Connect) |
| `/pricing/*` | Static brokerage-style fee tables |
| `/support` | Static help categories (no ticket API) |
| `*` | Not found |

### Dashboard (`dashboard`, :5174)

All routes below sit inside `ProtectedRoute` + `DashboardLayout` (sidebar + top nav).

| Route | Screen |
| --- | --- |
| `/dashboard` | Summary cards, market watchlists, quick actions, trade/chart/details popups |
| `/analytics` | Portfolio summary, performance chart, P&L breakdown, stock rankings, allocation |
| `/risk` | Risk overview, settings, alerts, R:R calculator |
| `/holdings` | CNC/MIS holdings, search/sort, allocation chart, buy/sell |
| `/orders` | Order book, filters, details, cancel pending limits, chart |
| `/positions` | Positions, search/sort, exit trade |
| `/funds` | Simulated add/withdraw + transaction list |
| `/ai-assistant` | Gemini chat with holdings/orders/funds context |
| `/notifications` | Paginated inbox |
| `/journal` | Entries, calendar, analytics |
| `/backtest` | SMA crossover run + saved history |
| `/paper-trading` | Tournaments, join, virtual book, live leaderboard, history |
| `/tournaments` | Redirects to `/paper-trading` |
| `/admin/tournaments` | Admin console (hidden unless `role === admin`) |
| `/settings` | Profile, password, sessions, theme, local trading prefs, delete account |

---

## How the main trading path works

1. User funds the simulated wallet.
2. Dashboard opens a trade popup (watchlist, holdings, positions, or quick actions).
3. Optional `POST /api/risk/check-order` runs Risk Guard (warning vs reject in strict mode).
4. `POST /api/orders` validates with Joi, then `createOrder` runs inside a MongoDB transaction: funds, holdings/positions, order document, notifications.
5. Market orders fill at the current TrueData LTP. Limit orders reserve cash or quantity until the live feed crosses the limit, or until cancelled.
6. Holdings, positions, orders, and funds versions refresh in `AppContext`.

Paper-trading tournament orders use separate models (`Tournament`, `TournamentParticipation`, `TournamentOrder`) and never touch the main `Fund` / `Holding` collections.

---

## Socket.IO events

**Client → server**

- `join-user-room` — `{userId}` → room `user:{userId}`
- `join-tournament-room` / `leave-tournament-room` — `{tournamentId}`

**Server → client**

- `new-notification`, `notification:updated`, `notification:deleted`, `notification:read-all`
- `tournament-leaderboard-update`

Live **quotes** are not pushed over Socket.IO; the dashboard polls HTTP market prices.

---

## API surface

All authenticated routes expect the `token` cookie (`withCredentials: true`). Market price routes are public.

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Register, login, OTP, logout, profile, password, sessions, delete account, `me` |
| `/api/orders` | List, place, cancel limit |
| `/api/holdings` | List |
| `/api/positions` | List |
| `/api/funds` | Balance, add, withdraw, transactions |
| `/api/watchlist` | Legacy single watchlist |
| `/api/watchlists` | Named watchlists |
| `/api/price-alerts` | CRUD alerts |
| `/api/notifications` | Inbox + preferences |
| `/api/ai` | Chat + history |
| `/api/market` | Live and historical prices |
| `/api/analytics` | Portfolio analytics |
| `/api/risk` | Overview, settings, check-order, alerts, calculator |
| `/api/journal` | Journal CRUD, calendar, analytics |
| `/api/backtest` | Strategies, run, save, history |
| `/api/tournaments` | User paper trading + `/admin/*` admin routes |

### REST endpoints

`Auth` = requires `token` cookie. `Admin` = `isLoggedIn` + `adminOnly`.

#### Auth — `/api/auth`

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| POST | `/register` | No | Joi-validated signup; requires mobile `verificationToken`; creates `Fund`; sets cookie |
| POST | `/login` | No | Email/password via Passport (not used by landing UI) |
| POST | `/otp/send` | No | Twilio OTP; `purpose`: `login` \| `signup` |
| POST | `/otp/verify` | No | Generic OTP check |
| POST | `/login/otp` | No | OTP login; sets cookie |
| POST | `/register/verify-mobile` | No | Issues 15-minute verification JWT |
| POST | `/logout` | No | Clears cookie |
| POST | `/logout-other-sessions` | Yes | Bumps `tokenVersion`, reissues current cookie |
| PUT | `/profile` | Yes | Update name/mobile |
| PUT | `/password` | Yes | Change password |
| GET | `/me` | Yes | Current user (`name`, `email`, `mobile`, `clientId`, `status`, `role`) |
| DELETE | `/account` | Yes | Delete account (password required) |

#### Trading and portfolio

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET | `/api/orders` | Yes | User orders |
| POST | `/api/orders` | Yes | Place Market/Limit, CNC/MIS |
| POST | `/api/orders/cancel-limit` | Yes | Cancel pending limit |
| GET | `/api/holdings` | Yes | Holdings |
| GET | `/api/positions` | Yes | Positions |
| GET | `/api/funds` | Yes | Balances |
| POST | `/api/funds/add` | Yes | Simulated credit |
| POST | `/api/funds/withdraw` | Yes | Simulated debit |
| GET | `/api/funds/transactions` | Yes | Add/withdraw history |

#### Watchlists and alerts

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET/POST/DELETE | `/api/watchlist`, `/api/watchlist/:symbol` | Yes | Legacy single list (dashboard does not call this) |
| GET/POST | `/api/watchlists` | Yes | List / create named lists |
| GET/PATCH/DELETE | `/api/watchlists/:listId` | Yes | Get / rename / delete |
| POST | `/api/watchlists/:listId/symbols` | Yes | Add symbol |
| DELETE | `/api/watchlists/:listId/symbols/:symbol` | Yes | Remove symbol |
| GET/POST | `/api/price-alerts` | Yes | List / create |
| PATCH/DELETE | `/api/price-alerts/:alertId` | Yes | Update / delete |

#### Market (public)

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/market/price/:symbol` | Cached TrueData LTP + company name |
| GET | `/api/market/prices` | All cached symbols |
| GET | `/api/market/prices/:symbol/history` | Historical candles |

#### Notifications, AI, analytics, risk, journal, backtest

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/notifications` | Yes (query: `page`, `limit`, `type`, `unread`) |
| GET | `/api/notifications/unread-count` | Yes |
| PATCH | `/api/notifications/read-all`, `/:id/read` | Yes |
| DELETE | `/api/notifications/all`, `/:id` | Yes |
| GET/PATCH | `/api/notifications/preferences` | Yes |
| POST | `/api/ai/chat` | Yes |
| GET | `/api/ai/chats`, `/api/ai/chats/:chatId` | Yes |
| DELETE | `/api/ai/chats/:chatId` | Yes |
| GET | `/api/analytics/summary`, `/performance`, `/pnl-breakdown`, `/stock-rankings` | Yes |
| GET | `/api/risk/overview`, `/settings`, `/alerts` | Yes |
| PUT | `/api/risk/settings` | Yes |
| POST | `/api/risk/check-order`, `/calculate` | Yes |
| PATCH | `/api/risk/alerts/:id/read` | Yes |
| GET/POST | `/api/journal` | Yes |
| GET | `/api/journal/calendar`, `/analytics`, `/:id` | Yes |
| PATCH/DELETE | `/api/journal/:id` | Yes |
| GET | `/api/backtest/strategies`, `/history`, `/history/:id` | Yes |
| POST | `/api/backtest/run`, `/save` | Yes |
| DELETE | `/api/backtest/history/:id` | Yes |

#### Tournaments

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/tournaments` | Yes |
| GET | `/api/tournaments/my-history` | Yes |
| GET | `/api/tournaments/:id`, `/:id/leaderboard`, `/:id/my-participation`, `/:id/orders` | Yes |
| POST | `/api/tournaments/:id/join`, `/:id/trades` | Yes |
| DELETE | `/api/tournaments/:id/leave` | Yes |
| PATCH | `/api/tournaments/:id/orders/:orderId/cancel` | Yes |
| GET | `/api/tournaments/admin/tournaments`, `/admin/tournaments/:id`, `.../participants`, `.../orders` | Admin |
| POST | `/api/tournaments/admin/create`, `/admin/seed` | Admin |
| PUT | `/api/tournaments/admin/tournaments/:id` | Admin |
| PATCH | `/api/tournaments/admin/tournaments/:id/status` | Admin |
| PATCH | `/api/tournaments/admin/tournaments/:id/participants/:participationId/disqualify` | Admin |

---

## Data models

MongoDB collections (Mongoose):

| Model | Role |
| --- | --- |
| `User` | Profile, hashed password, `clientId`, `role`, `tokenVersion`, `status` |
| `OtpChallenge` | OTP attempt tracking / single-use signup verification |
| `Fund` | `availableBalance`, `usedBalance`, `reservedBalance` |
| `FundTransaction` | Simulated add/withdraw (`completed` \| `failed`) |
| `Order` | Market/Limit, CNC/MIS, reservation, realized P&L |
| `Holding` / `Position` | Qty, avg/current price, reserved qty, product |
| `Watchlist` | Legacy single list |
| `WatchlistList` | Named lists |
| `PriceAlert` | Above/below LTP triggers |
| `Notification` / `NotificationPreference` | Inbox + toggles |
| `Chat` | AI threads |
| `PortfolioSnapshot` | Daily valuation for analytics |
| `RiskSettings` / `RiskAlert` | Guards and alert log |
| `Journal` | Trade diary |
| `BacktestHistory` | Saved SMA runs |
| `Tournament` / `TournamentParticipation` / `TournamentOrder` | Isolated paper book |

---

## Getting started

### Prerequisites

- Node.js 20+ (ES modules; backend `"type": "module"`)
- MongoDB (local or Atlas)
- Optional for full behavior: TrueData account, Twilio Verify, Gemini API key

### 1. Clone and install

```bash
cd "ZERODHA CLONE"

cd backend && npm install
cd ../frontend && npm install
cd ../dashboard && npm install
```

### 2. Configure the backend

Copy `backend/.env.example` to `backend/.env` (never commit `.env`). Variable **names** used in source:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/zerodha_clone
JWT_SECRET=replace-with-a-long-random-string

# Live market data
TRUEDATA_USERNAME=
TRUEDATA_PASSWORD=
TRUEDATA_LIVE_PORT=8086

# OTP SMS (Twilio Verify)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=

# AI assistant
GEMINI_API_KEY=
```

Without Twilio credentials, OTP send fails in non-test environments. Without TrueData credentials, live prices and history will not populate. Without `GEMINI_API_KEY`, AI chat will fail.

Frontend and dashboard currently hardcode `http://localhost:3000` (no `VITE_` env files).

### 3. Run the three processes

```bash
# terminal 1
cd backend && npm start

# terminal 2
cd frontend && npm run dev

# terminal 3
cd dashboard && npm run dev
```

Open http://localhost:5173, sign up with a 10-digit Indian mobile number, then use the dashboard on http://localhost:5174.

### 4. Promote an admin (tournaments)

```bash
cd backend
node scripts/setAdminRole.js youremail@example.com
# or
node scripts/setAdminRole.js 9876543210
```

The **Tournament Admin** sidebar link appears when `currentUser.role === "admin"`. Admin APIs still enforce the role on the server.

`backend/data/init.js` and `backend/data/data.js` are **manual** DB helpers, not part of `npm start`. Treat `init.js` carefully: several `deleteMany` helpers exist, and tournament wipe functions may be left uncommented. Do not run that file against a database you care about without reading it first.

---

## Scripts

**Backend** (`backend/package.json`)

| Script | Command |
| --- | --- |
| `npm start` | `nodemon index.js` |
| `npm test` | `node --test tests/*.test.js` |

**Dashboard**

| Script | Command |
| --- | --- |
| `npm run dev` | Vite on **5174** (`strictPort: true`) |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | Oxlint |

**Frontend**

| Script | Command |
| --- | --- |
| `npm run dev` | Vite on **5173** (`strictPort: true`) |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | Declared as `oslint .` (typo; likely unused) |

---

## Tests

Run from `backend/`:

```bash
npm test
```

**Last local run (this audit):** 160 tests, 0 failed.

What those tests actually cover:

- OTP helpers (phone formatting, Twilio error mapping, Joi `verificationToken`)
- Risk score, concentration, R:R, warning vs strict mode
- Watchlist limits, ownership, price-alert trigger rules
- Tournament schemas, virtual P&L, ranking, join rules, admin middleware, isolation from real funds
- SMA indicator, SMA crossover signals, backtest metrics

What they **do not** prove:

- Live TrueData ticks or Twilio SMS delivery
- Browser flows (signup → dashboard → order)
- AI, journal HTTP, funds HTTP, or main `createOrder` transaction against a running server

Do not treat a green `npm test` as verification of the full product.

---

## Environment and security notes (local clone)

- JWT secret and third-party keys belong only in `backend/.env`. Root `.gitignore` ignores `.env` and `.env.*`.
- Cookies are not `secure` and CORS is localhost-only — fine for local learning, not production.
- OTP login avoids account enumeration on unknown mobiles with a generic error.
- Admin actions never take `role` from the request body; `adminOnly` reads `req.user.role` from the JWT + database.
- User `status: blocked` is stored but not enforced on requests.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Dashboard stuck on “Checking authentication…” then jumps to login | Backend down, cookie not set, or CORS/origin mismatch (must use 5173/5174 as configured) |
| “SMS service credentials are not configured” | Missing Twilio vars in `backend/.env` |
| Twilio trial cannot send OTP | Destination number must be a Twilio Verified Caller ID |
| Empty watchlist prices / market `--` | Missing TrueData credentials or feed not connected (`connectTrueData` logs on startup) |
| AI chat errors | Missing `GEMINI_API_KEY` |
| Tournament Admin missing in sidebar | User `role` is not `admin` — run `node scripts/setAdminRole.js` |
| `Admin access required` | Sidebar can be guessed via URL; API still rejects non-admins |
| Ports already in use | Vite `strictPort: true` on 5173 and 5174; Express defaults to `PORT` or 3000 |
| OTP “too many requests” | Max 3 challenges per mobile/purpose in 5 minutes |

---

## Roadmap (not implemented)

Ideas that are **not** in the codebase today, listed so they are not confused with shipping features:

- Production HTTPS cookies, configurable CORS, and env-based API URLs for the two Vite apps
- Enforce `blocked` users in `isLoggedIn`
- Email/password login UI (API already exists)
- Persist trading preferences on the user document
- Server-side stop-loss / target orders
- Notification preference keys for price alerts and tournaments
- Payment-gateway funding, KYC, real brokerage, mutual funds, IPO
- Support ticket backend
- Additional backtest strategies beyond SMA crossover
- Remove or migrate the unused `/api/watchlist` and `indianMarketService.js` paths

---

## License and attribution

Backend `package.json` declares `ISC`. There is no root license file. Zerodha names, logos, and marketing copy are used for educational cloning of a public UI; they remain trademarks of their owners. TrueData, Twilio, and Google Gemini are third-party services with their own terms.
