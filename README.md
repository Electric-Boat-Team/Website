# Terrapin Works Electric Boat Team — Website

Content and build for the team website.

## Live

- Production: https://website.vcasado.workers.dev
- Every branch and pull request gets a preview: `https://<branch>-website.vcasado.workers.dev`

This is a Cloudflare Worker serving static assets. It is **not** GitHub Pages; there is no Jekyll build and no `github.io` URL.

## Layout

```
content/                 HTML fragments, shared by both deployments
site/template.html       page shell (head, nav, footer)
site/styles.css          static-site styling
public/assets/           images (logo.svg, etc.)
scripts/build-site.mjs   wraps content/ -> dist/
scripts/deploy-campuspress.mjs  pushes content/ to the WordPress REST API
campuspress.json         maps source file -> route -> WordPress page id
wrangler.toml            Cloudflare Worker config
```

## Adding content

Edit the files in `content/`. They are Gutenberg block markup and plain HTML at once — the `<!-- wp:... -->` markers are comments to a browser, so the same file feeds both Cloudflare and CampusPress.

Stick to native blocks (groups, headings, paragraphs, lists, tables, images) so the content renders on both. The WordPress theme controls its own styling, so the exact look differs between the two.

Add or move a page by editing `campuspress.json`: `source`, `route`, `title`, and `wordpressId`.

## Build

```bash
npm run build      # writes dist/
npm run preview    # build and serve dist/ locally
```

## Deploy

**Cloudflare** is connected to this repo through Workers Builds:

- Production branch: `main` → `npx wrangler deploy`
- All other branches → `npx wrangler preview`, and the preview URL is posted on the PR
- Build command: `npm run build`, root directory `/`

`wrangler preview` needs the empty `[previews]` block in `wrangler.toml` and `wrangler >= 4.135.0` (pinned in `package.json`).

**CampusPress** deploys on push to `main` via `.github/workflows/deploy-campuspress.yml`:

```bash
npm run deploy:wp        # push content to WordPress
npm run deploy:wp:dry    # dry run, no requests
```

It needs `CAMPUSPRESS_BASE_URL` (repository variable) and `CAMPUSPRESS_USERNAME` / `CAMPUSPRESS_APP_PASSWORD` (secrets). Pages are skipped until their `wordpressId` is filled in.
