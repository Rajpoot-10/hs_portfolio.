# Hassam Ali · The Intelligence Lab

A complete personal portfolio built with React, TypeScript, Vite, and Tailwind CSS. Data Science is the primary identity; AI Engineering is the complementary discipline. Original SVG/CSS artwork, local fonts, and small interactive components keep the runtime free of visualization and animation engines.

## Run locally

Node.js 24 is used and recommended. This project uses npm and includes package-lock.json.

```powershell
cd D:\hs_portfolio
npm.cmd ci
npm.cmd run dev
```

Open http://127.0.0.1:5173. On this Windows installation, use `npm.cmd` / `npx.cmd` because PowerShell blocks the npm.ps1 shim. In other shells, ordinary `npm` / `npx` work.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

The preview server is at http://127.0.0.1:4173. Build output is `dist/`.

## Content and assets

Edit `src/data/content.ts`:

- `profile`: name, roles, biography, location, GitHub, optional LinkedIn/email/resume/portrait/social image/public site URL.
- `projects`: descriptions, categories, stacks, conceptual architecture, features, technical considerations, proposed next steps, and optional repository/demo/screenshot paths.
- `featuredProjectOrder`: project slugs in the desired featured order. Two featured projects are configured; other projects use compact layouts.
- `expertise` and `education`: skills and learning background.
- `labData` and `labMonths`: explicitly synthetic demonstration values.

Keep missing fields `undefined`. Never use `#`, dummy emails, example repository links, or invented metrics as placeholders. Valid HTTP(S) links are rendered with external-link safety attributes. Email appears as **Open Email App** only with a valid configured address.

Place real files in `public/`, for example `public/images/sales-dashboard.webp`, and configure `/images/sales-dashboard.webp`. Add files before configuring their paths. Real project screenshots replace the concept illustrations automatically. A configured portrait replaces the HA artwork. Images have dimensions and lazy loading. Use optimized WebP/AVIF images with a suitable aspect ratio; check the layout after adding them.

The supplied portrait of Hassam is configured at `public/images/hassam-portrait-charcoal.png`, with an AI-assisted charcoal background replacement.

### Information still needed

- Email address and LinkedIn URL.
- A real resume file and its path.
- Real project screenshots and verified GitHub/live-demo URLs for each project.
- Public deployment URL and a real social-preview image.
- Verified outcomes or personal lessons to replace/extend the technical considerations, if available.

The known GitHub profile is configured as https://github.com/Rajpoot-10. Project-specific URLs have not been guessed. Current case studies document only the supplied project scope; architecture diagrams are labeled conceptual, takeaways are design considerations, and next steps are proposals. No business-impact or production-readiness claims are included.

`profile.siteUrl` and `profile.socialImage` feed runtime canonical/image metadata. Page titles and descriptions update per route. Social crawlers that do not execute JavaScript use the static tags in `index.html`: when adding a real social image and public URL, also add absolute `og:image`/`og:url` and canonical tags there. For route-specific social cards, add static prerendering before launch. No social image is fabricated.

## Structure and design

- `src/App.tsx`: page compositions, semantic navigation, project filters, case-study routes, not-found page, metadata.
- `src/components/Visuals.tsx`: original SVG distribution, clearly labeled concept previews, interactive Data Lab.
- `src/styles.css`: Tailwind integration, shared tokens, responsive compositions, visible focus, reduced-motion behavior.
- `src/data/content.ts`: centralized typed content and safe-link/project helpers.
- `public/favicon.svg`: original HA monogram.
- `tests/`: unit and browser verification.

The mobile menu is a keyboard-accessible disclosure, not a modal. Escape closes it and returns focus; selecting a section closes it. The Data Lab supports mouse, touch, and keyboard input, with values, live tooltip text, and a readable summary. Hero controls switch between surface and point views without continuous rendering. All data artwork and previews are labeled as synthetic/conceptual.

## Browser checks

```powershell
npx.cmd playwright install chromium
npm.cmd run build
npm.cmd run test:browser
```

If browser downloads are unavailable, use an installed Edge browser:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:browser
```

Tests launch a local production preview server. Coverage includes desktop/mobile layouts, 320/768/1024px overflow, keyboard filtering, menu and Escape behavior, all six direct case-study routes and refreshes, titles, synthetic-data interaction, missing actions, external-link safety, reduced motion, and not-found pages. Browser screenshots/traces are ignored by Git in `test-results/`. The missing-link browser checks describe the initial unconfigured profile; update their expectations after adding real contact details.

With the development server running, `node scripts/browser-review.mjs` captures closer screenshots and measures overflow at five sizes. It defaults to installed Edge; override `PLAYWRIGHT_CHANNEL` for another installed Chromium channel.

## Deployment (prepared, not published)

Run `npm ci` and `npm run build`, then deploy `dist/` to a static host.

- **Netlify:** `netlify.toml` sets the build and output directory. `public/_redirects` is copied into `dist/` and provides the SPA fallback for direct project routes.
- **Vercel:** `vercel.json` sets the build command, output directory, and SPA rewrite.
- **Other hosts:** serve real assets normally and rewrite unknown application paths to `/index.html`. Do not redirect all paths to `/`; keep the requested project URL. On nginx, use `try_files $uri $uri/ /index.html;` inside the site location.

After deployment, open and refresh `/projects/sales-inventory-analytics` directly. Check the configured resume, screenshots, social metadata, and external URLs. Hosting rules are supplied but no hosting account has been connected, no live deployment has been verified, and the site has not been deployed by this workflow. GitHub Pages requires additional routing configuration and is not the default target.

This is a client-rendered static site. It needs no database, authentication, server-side API, or secret keys. Browser tests use a local Chromium engine; Safari, Firefox, actual phone hardware, and manual screen-reader testing remain separate checks.

Portrait edit provenance and the exact imagegen prompt are documented in [docs/portrait-edit.md](docs/portrait-edit.md).
