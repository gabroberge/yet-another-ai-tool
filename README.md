# Yet Another AI Tool™

A satirical AI startup factory. Pick a technology that already works (an API, a library, an algorithm, a service, a developer tool, a command-line utility) and YAAT manufactures a company around it: name, mark, category, positioning, agents, governance, pricing, valuation, and launch materials.

The site never explains the joke. The invariant lives in the code and the tests: every module raises perceived value, and the technology underneath is never modified.

Live: https://gabroberge.github.io/yet-another-ai-tool/

## What is in it

- **Landing page** (`/`): the YAAT marketing site, with a working manufacture demo in the hero.
- **Factory** (`/app/`): manufacture several independent companies, install and remove modules, rebrand, spin out, inspect the architecture, read generated artifacts, and run requests through the console.
- **Portfolio** (`/app/portfolio/`): every company as a carton on a shelf, or as a sortable table. Delete one, or clear everything.
- **Telemetry** (`/app/telemetry/`): portfolio-wide figures, valuation, stages, request latency, technology mix, and an activity feed.

Everything runs in the browser. There is no backend and no AI API. The portfolio is stored in `localStorage`.

## Stack

Astro 7, TypeScript (strict), Tailwind CSS 4, Vitest. Deployed as a static site to GitHub Pages under the `/yet-another-ai-tool` base path.

## Layout

```
src/lib/domain/       Pure domain: technologies, modules, venture view, portfolio, telemetry
src/lib/generation/   Deterministic generation: names, identities, agents, artifacts, showcase data
src/lib/persistence/  Versioned localStorage storage and a subscribable store
src/lib/ui/           HTML renderers (carton, labels, panels, charts) and small DOM helpers
src/components/       Astro components for the landing page and app shell
src/pages/            Routes
src/scripts/          Client controllers for the Factory and Portfolio
```

Generation is seeded (`Rng.for(seed, label)`), so the same technology and seed always produce the same company.

## Development

```sh
bun install
bun run dev        # or: astro dev --background
bun run check      # astro check
bun run test       # vitest
bun run build      # static output in dist/
```

## License

MIT
