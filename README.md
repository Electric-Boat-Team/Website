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
campuspress.json         CampusPress URL and optional page titles/nav metadata
wrangler.toml            Cloudflare Worker config
```

## Adding content

Edit the files in `content/`. They are Gutenberg block markup and plain HTML at once — the `<!-- wp:... -->` markers are comments to a browser, so the same file feeds both Cloudflare and CampusPress.

Stick to native blocks (groups, headings, paragraphs, lists, tables, images) so the content renders on both. The WordPress theme controls its own styling, so the exact look differs between the two.

Add a lowercase, hyphenated `content/<slug>.html` file. The build automatically serves it at `/<slug>/` (except `home.html`, served at `/`). The manual CampusPress sync creates or updates a draft at `draft-<slug>`. Add optional title, nav label, or description under `pageMetadata` in `campuspress.json`; there are no WordPress IDs to maintain. Removing a source file does not delete any WordPress page.

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

**CampusPress** is manual-only. After the workflow is on `main`, Victor-Casado can open the repo's **Actions → Deploy to CampusPress → Run workflow**, select `main`, and run it. The workflow skips the deploy job for other users' dispatches or reruns. GitHub does not hide the Run workflow button from other collaborators with write access.

```bash
npm run deploy:wp        # push content to WordPress
npm run deploy:wp:dry    # dry run, no requests
```

It uses the `baseUrl` in `campuspress.json` (or an optional `CAMPUSPRESS_BASE_URL` repository variable) and the `CAMPUSPRESS_USERNAME` / `CAMPUSPRESS_APP_PASSWORD` repository secrets. For each HTML fragment it finds or creates a draft with slug `draft-<slug>`. It refuses to modify non-drafts or ambiguous slug matches. Existing drafts get content-only updates; new drafts get the derived title and slug. This does not publish pages or touch the earlier test page (ID 54). Use `npm run deploy:wp:dry` to list the slugs without writing to WordPress.
