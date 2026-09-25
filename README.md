# VORQ Docs

Source of [docs.vorq.co](https://docs.vorq.co) — the documentation for the VORQ async inference exchange.

The site is built with [Astro Starlight](https://starlight.astro.build). Each VORQ repository owns its documentation in its own `docs/` folder; this repository pulls those folders together at build time and publishes one site.

| Section | Source |
|---|---|
| `/python/` | [vorq-client-sdk-python](https://github.com/vorq-ai/vorq-client-sdk-python/tree/main/docs) |
| `/js/` | [vorq-client-sdk-js](https://github.com/vorq-ai/vorq-client-sdk-js/tree/main/docs) |
| `/provider/` | [vorq-provider-sdk](https://github.com/vorq-ai/vorq-provider-sdk/tree/main/docs) |
| `/coordinator/` | [vorq-coordinator-node](https://github.com/vorq-ai/vorq-coordinator-node/tree/main/docs) |
| `/contracts/` | [vorq-evm-contracts](https://github.com/vorq-ai/vorq-evm-contracts/tree/main/docs) |
| `/overview/` | this repository, `src/content/docs/overview/` |

Each section is its own sidebar topic, so readers see one product's navigation at a time.

## Docs layout

Every repository uses the same layout, following [Diátaxis](https://diataxis.fr):

```
docs/
  index.md        Overview — what it is, who it's for, where to go next
  quickstart.md   Tutorial — from zero to a first working result
  guides/         How-to guides — one task per page
  concepts/       Explanation — how and why it works
  reference/      Reference — API, configuration, CLI, errors
```

`index.md` and `quickstart.md` are required; the three folders are optional and flat. The build fails on a page outside this layout.

## Editing docs

Edit the Markdown in the owning repository's `docs/` folder. Every page needs frontmatter (`order` sorts pages within their folder):

```md
---
title: Quickstart
description: One sentence shown in search and link previews.
sidebar:
  order: 1
---
```

Link to other docs pages with relative `.md` paths (`../reference/client.md#submit`); link to anything else in the repository with a full GitHub URL. A push to `main` that touches `docs/` redeploys the site.

## Building locally

```sh
npm ci
GITHUB_TOKEN=<token with read access> BANNED_TERMS=<comma-separated> npm run dev
```

`npm run build` writes the static site to `dist/` and fails on broken links.
