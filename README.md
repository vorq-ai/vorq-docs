# VORQ Docs

Source of [docs.vorq.co](https://docs.vorq.co) — the documentation for the VORQ async inference exchange.

The site is built with [Fumadocs](https://fumadocs.dev) as a static Next.js export. Each VORQ repository owns its documentation in its own `docs/` folder; this repository pulls those folders together at build time and publishes one site.

| Section | Source |
|---|---|
| `/docs/python` | [vorq-client-sdk-python](https://github.com/vorq-ai/vorq-client-sdk-python/tree/main/docs) |
| `/docs/js` | [vorq-client-sdk-js](https://github.com/vorq-ai/vorq-client-sdk-js/tree/main/docs) |
| `/docs/provider` | [vorq-provider-sdk](https://github.com/vorq-ai/vorq-provider-sdk/tree/main/docs) |
| `/docs/coordinator` | [vorq-coordinator-node](https://github.com/vorq-ai/vorq-coordinator-node/tree/main/docs) |
| `/docs/contracts` | [vorq-evm-contracts](https://github.com/vorq-ai/vorq-evm-contracts/tree/main/docs) |
| `/docs/overview` | this repository, `content/docs/overview/` |

Each section is a root folder, picked from the section switcher, so readers see one product's navigation at a time.

## Docs layout

Every repository uses the same layout, following [Diátaxis](https://diataxis.fr):

```
docs/
  meta.json       Section title, icon and page order
  index.md        Overview — what it is, who it's for, where to go next
  quickstart.md   Tutorial — from zero to a first working result
  guides/         How-to guides — one task per page
  concepts/       Explanation — how and why it works
  reference/      Reference — API, configuration, CLI, errors
```

`meta.json`, `index.md` and `quickstart.md` are required; the three folders are optional and flat, each with a `meta.json` listing its pages in order. The build fails on a file outside this layout.

## Editing docs

Edit the Markdown in the owning repository's `docs/` folder. Every page needs frontmatter:

```md
---
title: Quickstart
description: One sentence shown in search and link previews.
---
```

The root `docs/meta.json` marks the section (`"root": true`) and names it; a folder's `meta.json` lists its pages in sidebar order ([Fumadocs page conventions](https://fumadocs.dev/docs/page-conventions)):

```json
{ "title": "Guides", "pages": ["submit-a-batch", "cancel-a-job"] }
```

Link to other docs pages with relative paths starting with `./` or `../` (`./client.md`, `../reference/client.md#submit`), to another section with its site path (`/docs/python`), and to anything else in the repository with a full GitHub URL. A push to `main` that touches `docs/` redeploys the site.

## Building locally

```sh
npm ci
GITHUB_TOKEN=<token with read access> BANNED_TERMS=<comma-separated> npm run dev
```

`npm run build` writes the static site to `out/` and fails on broken links.
