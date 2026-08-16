# PK Woodworking — Quote & Costing Tool

A phone-friendly quoting tool for costing and quoting custom woodworking jobs
(e.g. bin/paling screens with castors). No build step, no backend — a single
static web app that runs entirely in the browser.

## Features

- **Cut list & paling calculator** — list the parts you need to cut (name,
  length, quantity) and it packs them into 1800mm palings (largest pieces
  first, 3mm saw-kerf allowance) to work out how many palings you need and
  what offcuts you'll have left over. Load a preset product from **Load
  template** to skip manual entry, or build a custom list from scratch.
  The calculated paling count auto-fills into the Bill of Materials below.
  Parts named with a "K" code (e.g. "K1 (...)") are treated as 70×35mm
  framing stock and packed separately against 2400mm lengths instead of
  1800mm palings — shown as its own "X lengths of 2400mm 70×35mm framing
  required" line, never mixed into the palings figure. Currently used by
  PKP-003 (Planter Bench). The same total also auto-fills a "70×35mm
  framing" line in the Bill of Materials below (so it's correctly included
  in direct materials cost) and shows on the Shopping List as "framing to
  buy" — but framing stock isn't yet tracked in the Stock tab, so there's no
  "from stock" split for it the way there is for palings.
- **Bill of materials panel** — pick quantities against a per-unit price list
  (palings, castors, screws, brads, glue, and 70×35mm framing by default; add
  your own line items or custom one-off items per quote). The Palings and
  70×35mm framing quantities auto-fill (greyed out, "from cut list") from the
  Cut List's calculations whenever a cut list is present — framing only when
  it actually has K-series parts, otherwise it stays at zero. In-progress
  quotes always track the current Settings price list; once a quote is
  saved, its prices lock in as a historical record.
- **Documents tab** — pick a product template, or link an accepted quote to
  pull its own custom cut list and materials, and generate a printable
  workshop build pack: the cut list + paling/offcut calculation, a
  stock-aware **Shopping List** (see below), a Quality Inspection checklist,
  and a blank "Build Record" (planned vs. actual cutting time, assembly
  time, total labour, and a space for design-change notes) to fill in by
  hand. Print or save as PDF the same way as a quote. Build packs aren't
  saved in the app — print or export the PDF to keep a copy.
- **Mark as built** — once you've actually cut and assembled a build, click
  "Mark as built — deduct stock" on its build pack to deduct exactly what it
  used from Stock (same part-by-part matching as the Shopping List/"What Can
  I Build?"). Shows a confirmation summary of what's about to be deducted
  before committing. Only Stock quantities change — the quote and build
  pack are never touched.
- **Labour & overhead** — labour hours × hourly rate, plus a configurable
  workshop overhead percentage applied on top of direct costs (materials +
  labour).
- **Client details** — name, contact, order notes per quote.
- **Auto-incrementing quote numbers** in the format `PKW-Q-0001`, `PKW-Q-0002`, ...
  (prefix and next number configurable in Settings).
- **Cost summary** — direct materials, labour, overhead, total true cost,
  selling price (auto-suggested from a markup %, or override manually), and
  profit/margin. This internal breakdown is never shown on the printed
  customer quote.
- **Print / Save as PDF** — a clean, customer-facing quote (business name,
  quote #, date, valid-until date, client details, a single item description,
  and the total price only) that prints or saves to PDF straight from the
  phone or desktop browser's print dialog. It shows one simple line — like an
  invoice — not the itemised materials list; see **Customer Quote
  Description** below for where that line comes from. Internal costs and
  profit margin are deliberately excluded from this view.
- **Customer Quote Description** — the Quote tab has an "Item description"
  field that's what the customer actually sees — on the printed quote and
  in Email Quote — instead of the itemised Bill of Materials below it.
  Loading a Cut List template auto-fills it (e.g. "Standard Raised Planter
  — 1170 x 650 x 530mm — handmade treated pine, on castors") from that
  product's real size/feature data; edit freely, or type your own for a
  custom build. An optional "Note for customer" field adds one extra line
  underneath (e.g. delivery timing) — left blank, it shows nothing. If it's
  empty when you Print or Email, you'll get a warning first rather than
  silently sending generic placeholder text.
- **Email Quote** — opens your device's email app with a pre-filled message
  to the client: the same single-line description and total as the printed
  quote, plus a clear "reply ACCEPT or DECLINE" section so their reply is
  their confirmation. Auto-fills the "To" field if the client's Contact
  field is a valid email address; otherwise you just add it before hitting
  send.
- **Saved quotes** — every saved quote syncs to your account and is
  searchable by quote number, client name, or status. Open, duplicate, or
  delete past quotes at any time.
- **Passcode-locked, synced across devices** — a passcode screen protects the
  app and unlocks the same quotes, stock, and settings on any device you
  enter it on (phone, laptop, wherever). See **Cross-device sync** below for
  one-time setup.
- **Stock tab** — log stock on hand for any material in your Price List
  (palings/offcuts by length and quantity, or simple countable items like
  castors and screws), with auto-calculated total pieces, total linear
  metres, estimated value, and days in stock for each entry. **What Can I
  Build?** checks a product template (or a pasted cut list) against current
  paling stock — using the same bin-packing engine as the Cut List — to
  show what's covered and how many fresh palings you'd need to buy for the
  rest. A **Waste Log** tracks offcuts that ended up as scrap, with a
  running dollar total.
- **Stock-aware Shopping List** — a simple materials-only list: what to put
  in the trolley, not a part-by-part cutting breakdown (that's the Cut List
  above it). For palings, every cut list part is still checked individually
  against Stock behind the scenes (same matching logic as "What Can I
  Build?" — an offcut can fully cover a specific small part without being
  treated as a whole paling), but only the final total shows: a single
  "Palings to buy" line, from the still-uncovered parts re-packed together.
  Products with framing parts (see below) get their own "70×35mm framing to
  buy" line the same way. Castors, screws, and any other material you've
  logged in Stock get a simpler "from stock" / "buy new" split, since those
  are consumed one-for-one; if nothing's in stock for an item, it just shows
  the full quantity needed (or "Use workshop stock" for items with no
  per-product quantity data, like screws/brads/glue on a template build).
- **Works on mobile** — responsive layout, large touch targets, and a
  sticky tabbed header for quick access to Quote / Saved Quotes / Documents /
  Stock / Settings.

## How data is stored

This is a static web app — no custom server, but it does use
[Supabase](https://supabase.com) as a small cloud database so your data
follows you across devices.

- Settings, quotes, stock, and the waste log sync to your Supabase project
  automatically every time you save something, and pull down fresh whenever
  you open the app.
- A copy is also kept in the browser's `localStorage` on each device, so the
  app still works (read-only-ish, until the connection comes back) if you
  briefly lose signal — changes made while offline sync as soon as you're
  back online and reopen the app.
- A single passcode screen protects everything: the passcode doubles as the
  password for one Supabase Auth account, and database rules (Row Level
  Security) only let that signed-in account read or write your data. See
  **Cross-device sync setup** below to wire this up the first time.
- **Settings → Backup → Export backup (JSON)** is still there as a manual,
  offline copy — handy before clearing browser data, or if you ever want
  your data outside the app. It's no longer how you move data between
  devices day-to-day, since sync handles that automatically.

## Cross-device sync setup

The app is already pointed at a Supabase project (URL and anon/publishable
key are baked into `js/app.js` — see `SUPABASE_URL` / `SUPABASE_ANON_KEY`
near the top of the "Cloud sync" section). Two one-time steps are needed in
the [Supabase dashboard](https://supabase.com/dashboard) before the passcode
screen will work:

1. **Create the database tables.** Open your project → **SQL Editor** → New
   query → paste the entire contents of `supabase/schema.sql` → **Run**.
   This creates the `app_settings`, `quotes`, `stock_entries`, and
   `waste_entries` tables and locks each row to your account via Row Level
   Security. Safe to re-run if needed.
2. **Turn off "Confirm email".** Open your project → **Authentication →
   Providers → Email** → turn off **Confirm email**. Since this is a
   single-user tool signing in with a passcode (not a real inbox-based
   signup flow), this lets the very first "Create your passcode" step work
   immediately instead of waiting on a confirmation link.

After that, open the app, tap **First time on this device? Set up your
passcode**, and choose a passcode (6+ characters). On every other device,
open the app and enter the same passcode under **Enter your passcode** to
unlock the same data. Use **Settings → Sync → Lock app** to sign out of a
device (e.g. before handing off a shared computer).

If you ever forget the passcode, there's no in-app reset — change the
account's password from the Supabase dashboard (**Authentication → Users**)
instead.

## Running it

No install or build required.

### Option 1 — GitHub Pages (recommended for phone use)

This repo includes a GitHub Actions workflow
(`.github/workflows/deploy-pages.yml`) that publishes the site to GitHub
Pages on every push to `main`. After merging to `main`, enable it once:

1. Go to the repository's **Settings → Pages**.
2. Under "Build and deployment", set **Source** to **GitHub Actions**.
3. Push to `main` (or re-run the workflow) — the site will be published at
   `https://<your-username>.github.io/<repo-name>/`.

Open that URL on your phone and (optionally) "Add to Home Screen" for
quick access on site visits.

### Option 2 — Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in a browser
```

To use it from your phone while developing, run the server on your
computer and open `http://<your-computer's-LAN-IP>:8000` from your phone,
as long as both are on the same network.

## Project structure

```
index.html            App shell: passcode screen, quote form, saved quotes, settings
css/styles.css         Styling, responsive layout, print stylesheet
js/app.js               All app logic (state, calculations, cloud sync, persistence)
js/vendor/supabase.js   Vendored @supabase/supabase-js client (no CDN dependency)
supabase/schema.sql     One-time database setup - run in the Supabase SQL Editor
.github/workflows/      GitHub Pages deploy workflow
```

## Customising defaults

Open the **Settings** tab to change:

- Default labour rate, overhead %, markup %, and quote validity (days)
- The material price list (add, edit, or remove materials)
- The quote number prefix and next quote number

These sync to your account alongside your quotes, so they're the same on
every device you unlock the app with your passcode on.
