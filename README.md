# urgdstudios.com

The public website for **ur/gd Studios LLC** — a creative technology studio building calm, respectful tools for people navigating complexity.

**Production:** [urgdstudios.com](https://urgdstudios.com)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript (strict), Vite |
| Routing | React Router v7 |
| Styling | CSS Modules, CSS custom properties (Style Dictionary tokens) |
| Fonts | Archivo (body), Rubik (display) — self-hosted |
| Pre-rendering | Custom Vite SSR build + `ReactDOMServer.renderToString` |
| Hosting | AWS S3 + CloudFront |
| Auth / Backend | AWS Lambda (Node.js 22), API Gateway (contact form intake) |
| CI/CD | GitHub Actions |
| Security scanning | Semgrep, `npm audit` |

---

## Repository Structure

```
urgdstudios.com/
├── apps/
│   └── web/                     # React application (Vite)
│       ├── src/
│       │   ├── components/      # Shared UI components
│       │   ├── pages/           # Route-level page components
│       │   └── utils/           # Hooks and utilities
│       ├── public/              # Static assets (favicons, robots.txt, sitemap.xml)
│       ├── scripts/
│       │   ├── prerender.mjs    # SSG post-build script
│       │   └── generate-favicons.mjs
│       ├── index.html           # HTML template
│       └── package.json
├── cloudformation/              # IaC templates (S3, CloudFront, Lambda, API Gateway)
├── lambdas/
│   └── urgd-urgdstudios-intake/ # Contact form Lambda
├── .github/workflows/           # CI/CD (deploy-urgdstudios-com.yml)
└── README.md
```

---

## Local Development

```bash
cd apps/web
npm install
npm run dev       # Vite dev server at http://localhost:5173
```

## Build

The build runs in three sequential steps:

```bash
npm run build
# 1. build:client  — Vite client bundle → dist/
# 2. build:server  — Vite SSR bundle   → dist-server/
# 3. prerender     — Renders each route and writes dist/{route}/index.html
```

To regenerate favicons from `public/favicon.svg`:

```bash
npm run favicons
```

## Deploy

Deployments are handled by GitHub Actions:

| Trigger | Environment |
|---|---|
| Push to `main` | Dev (automatic) |
| Manual workflow dispatch | Staging / Production |

The pipeline runs: `npm ci` → `npm audit` → Semgrep → `npm run build` → CloudFormation deploy → S3 sync → CloudFront invalidation → smoke test.

---

## Routes

| Path | Page |
|---|---|
| `/` | Home |
| `/applications/` | Applications |
| `/contact/` | Contact |
| `/privacy/` | Privacy Policy |
| `/terms/` | Terms of Use |
| `/legal/` | Legal |

All routes are pre-rendered to static HTML at build time. React hydrates on the client for SPA navigation.

---

## Contact

**ur/gd Studios**
[urgdstudios.com](https://urgdstudios.com) · [admin@urgdstudios.com](mailto:admin@urgdstudios.com)
