# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two readers, one page.

- **The fictional buyer** YAAT addresses: founders, VPs of Engineering, platform leads, and investors shopping for "AI-native" products. Every word of copy is written to them, from inside YAAT.
- **The real visitor**: technically literate people who recognize AI-startup conventions (agents, orchestration layers, proprietary scores, trust centers, usage-based pricing). They arrive from the creator's collection of satirical SaaS products, explore the Factory, and share what they built.

## Product Purpose

Yet Another AI Tool™ (YAAT) is a fictional AI-native platform that manufactures perceived innovation out of existing technology. It takes an established capability and turns it into a complete, venture-backable AI-native startup.

The substrate can be any existing capability, for example:

- an open-source library (a date parser, a PDF renderer, a diff algorithm)
- a public or commodity API (weather, geocoding, payments, email delivery)
- an established tool (a linter, a static analyzer, browser automation, a cron scheduler)
- an algorithm (cosine similarity, Levenshtein distance, a regex, a sort)
- a managed service or protocol (object storage, SMTP, a health check)
- a CLI utility (one category among many, never the defining one)

Examples of the transformation: a conventional static-analysis tool becomes an autonomous code intelligence platform; a weather API becomes predictive environmental intelligence; existing browser automation becomes an agentic testing ecosystem.

The wrapper may add genuine convenience or integration. The joke is the disproportion: claims of novelty, intelligence, differentiation, and value far beyond what the wrapper adds.

The site has two experiences:

1. A marketing site for YAAT the company.
2. The Factory: a fully interactive workspace where visitors create and evolve multiple independent ventures from a varied catalog of existing technologies, inspect their architecture and artifacts, and watch valuation, intelligence scores, and pricing grow while the underlying technology never changes.

The distinction between the underlying technology and the manufactured AI-native product is central to the experience: every venture always carries a truthful record of what it is built on.

Success: a visitor first reads a credible, well-funded AI platform; they build one startup, then want to build another; the absurdity surfaces through mechanics and inspection, never through commentary.

## Positioning

YAAT sells packaging as product. Its unique mechanism: every enhancement (agents, orchestration, governance, proprietary metrics) measurably raises perceived sophistication and commercial value while the underlying technology (the substrate: what it is, what it does, its license, its real capability) stays identical. This invariant is real, enforced in code, and discoverable by inspection.

The satire targets AI wrappers, unnecessary agentification, fabricated innovation, overengineering, and the commercialization of capabilities that already exist. It does not claim AI is useless. No real company or project is named or parodied.

## Operating Context

- Static site on GitHub Pages under the `/yet-another-ai-tool` base path.
- No accounts. The Factory's state lives in the visitor's browser (localStorage) and survives refreshes.
- Visitors arrive on desktop and mobile; the Factory is used at desk width but must work on phones.
- Sibling products in the collection: legacy-as-a-service, endless-buzzwords (same creator, separate identities).

## Capabilities and Constraints

- Astro + TypeScript + Tailwind CSS 4, built with Bun, tested with Vitest.
- No backend, database, auth provider, or AI API. Generation is curated content plus deterministic, seeded combination.
- Domain logic, content generation, persistence, and UI stay separate.
- Fictional metrics derive from the product model; user actions have testable consequences.
- The substrate invariant (underlying technology unchanged by any enhancement) is enforced and tested, but not announced in the UI.
- Substrates are fictional-generic or genuinely generic (e.g. "an open-source date parsing library", "a commodity weather API"), never named real products or companies.
- Ventures must differ by substrate type, market, voice, and architecture, not only by name. A terminal command is shown only when the substrate actually is one.

## Brand Commitments

- Name: Yet Another AI Tool™, abbreviated YAAT.
- YAAT genuinely believes in what it sells. It never winks, never explains the joke, never leaks design rationale or brief language into the interface.
- Functional UI copy is concise and useful. Marketing and generated artifacts are credible, specific, confidently ambitious.
- YAAT is the company; generated startups are examples of its output, never replacements for its brand.
- Language: English.

## Evidence on Hand

None real. All customers, testimonials, logos, metrics, and funding are fictional and must read as fictional-within-the-fiction (invented company names, no real brands). No real benchmarks or certifications are claimed as fact outside the fiction.

## Product Principles

1. The joke lives in behavior. Mechanics, numbers, and inspection reveal it; copy never states it.
2. Every number has a source. Scores, valuation, and price are functions of venture state.
3. Every venture feels like a different product: its own name, category, voice, architecture, and artifacts.
4. Exploration is rewarded: more depth to inspect, more reasons to build the next one.
5. The real application stays simple while the fictional one grows elaborate.

## Accessibility & Inclusion

WCAG 2.2 AA: keyboard operable, visible focus, reduced motion respected, sufficient contrast, semantic structure, live regions for generated changes.
