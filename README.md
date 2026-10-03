# Terrapin Works Electric Boat Team — Website

Content and build for the team website.

## Experimental Independent Site (`no-campuspress`)

This branch builds a standalone site about the UFO conversion for PEP East 2027 rather than fetching the CampusPress theme. `npm run build` runs `scripts/build-independent.mjs`, copies `standalone/index.html`, `styles.css`, and `script.js` into `dist/`, and copies only its explicit image allowlist from `public/independent/` into `dist/assets/`. Unused source images are not shipped. The build makes no network requests and leaves the existing Wrangler configuration serving `dist/` unchanged. The CampusPress scripts and content are retained but are not used by this build. The CampusPress documentation below describes the original workflow, not this branch's default build.

The preview includes `noindex, nofollow`. Its social image URL points to `https://no-campuspress-website.vcasado.workers.dev/assets/workshop-detail.jpg`; update that metadata before publishing at a different address. Google Fonts supplies Manrope and Barlow Condensed at runtime, with system font fallbacks if unavailable. All page content and images are local and remain readable without JavaScript. Each engineering photograph and its description pin together on desktop, with a scroll-linked progress line, and stack normally on mobile. JavaScript also adds a mobile menu and a subtle scroll-linked hero pan. Reduced-motion preferences disable the hero movement.

Required assets in `public/independent/`:

| File | Source / subject |
| --- | --- |
| `logo.png` | Official team logo |
| `workshop.jpg` | IMG_9444, team around the white boat |
| `workshop-detail.jpg` | IMG_9445, UFO workshop hero |
| `boat.jpg` | Whole UFO on grass, 960 x 723; displayed without upscaling |
| `mount.jpg` | Mast socket and adjacent front strut opening with measuring tape |
| `foil-detail.jpg` | Front strut cross-section, not a foil cross-section |

Asset provenance: [provided team Drive folder](https://drive.google.com/drive/u/0/folders/1_S-kUNB81nEOsZ3k1AI9-FXeU9Zkqt-x). Keep those filenames when preparing the supplied photographs. The builder validates all required inputs before replacing `dist/` and reports missing files explicitly.

```bash
node --check standalone/script.js
node --check scripts/build-independent.mjs
npm run build
npm run preview
```

Edit the independent page in `standalone/`. Image references use `assets/<filename>` relative to the page. The story follows the UFO, the planned motor leg through the mast socket, and the independently retained stock foil system. Cooling, cabling, and clearance are under study; the page makes no measured performance or race-result claims. The unrelated outdoor catamaran restoration and whiteboard photographs remain in the source directory but are not emitted.

Engineering provenance: the provided Drive document **Systems for UFO hydrofoil conversion - PEP2027**. Competition dates, location, and Maryland's crewed displacement listing are from [ASNE's PEP page](https://www.navalengineers.org/Education/Promoting-Electric-Propulsion-PEP): PEP East, Portsmouth, Virginia, April 13-16, 2027. Recheck the organizer's schedule before publication. Sponsorship prices and benefits come from `content/sponsors.html`: Bronze $1,500 (boat and website name), Silver $3,000 (apparel logo), Program $6,000 (decal and regatta hospitality), Autonomy $8,500 (autonomy-suite naming), with cumulative benefits. The Autonomy sponsorship level is not a claim of entry into the autonomy racing division. Joining uses the team's actual interest form. Sponsorship inquiries link to the official team website rather than publishing internal contact information.

## Live

- Production: https://website.vcasado.workers.dev
- Every branch and pull request gets a preview: `https://<branch>-website.vcasado.workers.dev`

This is a Cloudflare Worker serving static assets. It is **not** GitHub Pages; there is no Jekyll build and no `github.io` URL.

## Layout

```
content/                 HTML fragments, shared by both deployments
scripts/build-site.mjs   inserts content/ into the public CampusPress theme -> dist/
scripts/deploy-campuspress.mjs  pushes content/ to the WordPress REST API
campuspress.json         CampusPress URL and optional page title overrides
wrangler.toml            Cloudflare Worker config
```

## Adding content

Edit the files in `content/`. They are Gutenberg block markup and plain HTML at once — the `<!-- wp:... -->` markers are comments to a browser, so the same file feeds both Cloudflare and CampusPress.

Stick to native blocks (groups, headings, paragraphs, lists, tables, images) so the content renders on both. The Cloudflare build fetches the published standard-page shell from `electricboat.umd.edu/join-the-team/` and uses its public theme CSS, header, sidebar, footer, and UMD banner script. The build fails if that page is unavailable or its required shell markers or UMD script are missing; other theme changes may still affect the preview. WordPress-only features such as its editor bar and dynamic widgets may also differ.

Add a lowercase, hyphenated `content/<slug>.html` file. The build automatically serves it at `/<slug>/` (except `home.html`, served at `/`). The manual CampusPress sync creates or updates a draft at `draft-<slug>`. Add an optional title override under `pageMetadata` in `campuspress.json`; there are no WordPress IDs to maintain. Removing a source file does not delete any WordPress page.

## Build

```bash
npm run build      # writes dist/
npm run preview    # build and serve dist/ locally
```

## Deploy

**Cloudflare** is connected to this repo through Workers Builds:

- Production branch: `main` → `npx wrangler deploy`
- All other branches → `npx wrangler preview`, and the preview URL is posted on the PR
- Build command: `npm run build`, root directory `/` (requires access to `electricboat.umd.edu`)

`wrangler preview` needs the empty `[previews]` block in `wrangler.toml` and `wrangler >= 4.135.0` (pinned in `package.json`).

**CampusPress** is manual-only. After the workflow is on `main`, Victor-Casado can open the repo's **Actions → Deploy to CampusPress → Run workflow**, select `main`, and run it. The workflow skips the deploy job for other users' dispatches or reruns. GitHub does not hide the Run workflow button from other collaborators with write access.

```bash
npm run deploy:wp        # push content to WordPress
npm run deploy:wp:dry    # dry run, no requests
```

It uses the `baseUrl` in `campuspress.json` (or an optional `CAMPUSPRESS_BASE_URL` repository variable) and the `CAMPUSPRESS_USERNAME` / `CAMPUSPRESS_APP_PASSWORD` repository secrets. For each HTML fragment it finds or creates a draft with slug `draft-<slug>`. It refuses non-drafts or ambiguous slug matches at lookup time. Existing drafts get content-only updates; new drafts get the derived title and slug. It does not publish pages. Use `npm run deploy:wp:dry` to list the slugs without writing to WordPress.

The draft check and update are separate WordPress API requests. If someone publishes a draft between them, the update could change its newly published content. Avoid publishing these placeholder pages while a manual sync is running; this is not an atomic draft-only guarantee.
