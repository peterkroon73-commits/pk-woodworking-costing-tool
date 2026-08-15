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
- **Bill of materials panel** — pick quantities against a per-unit price list
  (palings, castors, screws, brads, glue by default; add your own line items
  or custom one-off items per quote). In-progress quotes always track the
  current Settings price list; once a quote is saved, its prices lock in as
  a historical record.
- **Documents tab** — pick a product template and generate a printable
  workshop build pack: the same cut list + paling/offcut calculation, plus a
  blank "Build Record" (planned vs. actual cutting time, assembly time,
  total labour, and a space for design-change notes) to fill in by hand.
  Print or save as PDF the same way as a quote. Build packs aren't saved in
  the app — print or export the PDF to keep a copy.
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
  quote #, date, valid-until date, client details, itemised parts and
  labour, and the total price only) that prints or saves to PDF straight
  from the phone or desktop browser's print dialog. Internal costs and
  profit margin are deliberately excluded from this view.
- **Saved quotes** — every saved quote is stored on-device (localStorage) and
  searchable by quote number, client name, or status. Open, duplicate, or
  delete past quotes at any time.
- **Works on mobile** — responsive layout, large touch targets, and a
  sticky tabbed header for quick access to Quote / Saved Quotes / Documents /
  Settings.

## How data is stored

This is a static, offline-capable web app with **no server and no
database**. All settings and quotes are saved in the browser's
`localStorage` on the device you're using. That means:

- Quotes persist across visits/sessions on the *same device and browser*
  (not just in-session).
- Quotes do **not** sync between devices (e.g. phone and laptop) on their
  own.
- Use **Settings → Backup → Export backup (JSON)** regularly, and especially
  before clearing browser data, switching phones, or reinstalling the
  browser. **Import backup** restores everything (settings + quotes) from
  a previously exported file — useful for moving to a new device too.

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
index.html            App shell: quote form, saved quotes, settings
css/styles.css         Styling, responsive layout, print stylesheet
js/app.js               All app logic (state, calculations, persistence)
.github/workflows/      GitHub Pages deploy workflow
```

## Customising defaults

Open the **Settings** tab to change:

- Default labour rate, overhead %, markup %, and quote validity (days)
- The material price list (add, edit, or remove materials)
- The quote number prefix and next quote number

These are stored per-device alongside your quotes.
