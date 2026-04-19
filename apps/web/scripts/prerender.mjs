/**
 * urgdstudios.com — Pre-render Script (S6)
 *
 * Generates a static index.html per route containing pre-rendered React HTML.
 * Run after both client build and SSR build. Called by `npm run build`.
 *
 * Input:
 *   - dist/index.html         — client build template (with asset hashes)
 *   - dist-server/entry-server.js — SSR render function (Vite SSR build)
 *
 * Output:
 *   - dist/index.html                  (Home — overwritten with pre-rendered)
 *   - dist/applications/index.html     (Applications)
 *   - dist/contact/index.html          (Contact)
 *   - dist/privacy/index.html          (Privacy)
 *   - dist/terms/index.html            (Terms)
 *   - dist/legal/index.html            (Legal)
 *   - dist/beta/pulse/index.html       (Beta Pulse)
 *   - dist/403.html                    (Error — empty root for clean createRoot)
 *   - dist/404.html                    (Error — empty root for clean createRoot)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const distServerDir = path.resolve(__dirname, '../dist-server');

// Per-route metadata — matches ROUTE_TITLES/ROUTE_DESCRIPTIONS in App.tsx
// and OG tag specs in SLICE_06_UX.md Section 4.1
const ROUTES = [
  {
    url: '/',
    outDir: distDir,
    title: 'ur/gd Studios',
    description:
      'ur/gd Studios is a creative technology studio building tools for people who need them most. Calm, respectful, quietly powerful.',
    ogUrl: 'https://urgdstudios.com/',
  },
  {
    url: '/applications/',
    outDir: path.join(distDir, 'applications'),
    title: 'Applications — ur/gd Studios',
    description:
      'Applications built by ur/gd Studios. Tools we wish we had — some live, some on the way.',
    ogUrl: 'https://urgdstudios.com/applications/',
  },
  {
    url: '/contact/',
    outDir: path.join(distDir, 'contact'),
    title: 'Contact — ur/gd Studios',
    description:
      'Get in touch with ur/gd Studios. Questions, ideas, bug reports, or anything else.',
    ogUrl: 'https://urgdstudios.com/contact/',
  },
  {
    url: '/privacy/',
    outDir: path.join(distDir, 'privacy'),
    title: 'Privacy — ur/gd Studios',
    description: 'Privacy policy for ur/gd Studios and its applications.',
    ogUrl: 'https://urgdstudios.com/privacy/',
  },
  {
    url: '/terms/',
    outDir: path.join(distDir, 'terms'),
    title: 'Terms of Service — ur/gd Studios',
    description: 'Terms of service for ur/gd Studios and its applications.',
    ogUrl: 'https://urgdstudios.com/terms/',
  },
  {
    url: '/legal/',
    outDir: path.join(distDir, 'legal'),
    title: 'Legal — ur/gd Studios',
    description: 'Legal information for ur/gd Studios LLC.',
    ogUrl: 'https://urgdstudios.com/legal/',
  },
  {
    url: '/beta/pulse/',
    outDir: path.join(distDir, 'beta', 'pulse'),
    title: 'Pulse Beta — ur/gd Studios',
    description:
      'Join the Pulse closed beta. Two sessions, one survey, about 30 minutes of your time.',
    ogUrl: 'https://urgdstudios.com/beta/pulse/',
  },
];

function buildHeadMeta(route) {
  return `    <meta property="og:title" content="${route.title}">
    <meta property="og:description" content="${route.description}">
    <meta property="og:url" content="${route.ogUrl}">
    <meta name="twitter:title" content="${route.title}">
    <meta name="twitter:description" content="${route.description}">`;
}

async function prerender() {
  // Verify build outputs exist
  const templatePath = path.join(distDir, 'index.html');
  const serverEntryPath = path.join(distServerDir, 'entry-server.js');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Client build missing: ${templatePath}\nRun 'npm run build:client' first.`);
  }
  if (!fs.existsSync(serverEntryPath)) {
    throw new Error(`SSR build missing: ${serverEntryPath}\nRun 'npm run build:server' first.`);
  }

  // Load the SSR render function
  const { render } = await import(serverEntryPath);

  // Load the client-built HTML template
  const template = fs.readFileSync(templatePath, 'utf-8');

  let successCount = 0;

  for (const route of ROUTES) {
    try {
      // Render the React app to an HTML string for this route
      const appHtml = render(route.url);

      // Build the per-route <head> meta block
      const headMeta = buildHeadMeta(route);

      let html = template;

      // Replace <title> with route-specific title
      html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${route.title}</title>`
      );

      // Replace generic meta description with route-specific description
      html = html.replace(
        /<meta name="description" content="[^"]*"[^>]*>/,
        `<meta name="description" content="${route.description}">`
      );

      // Inject per-route OG + Twitter meta tags after the meta description
      html = html.replace(
        /(<meta name="description" content="[^"]*"[^>]*>)/,
        `$1\n${headMeta}`
      );

      // Inject pre-rendered HTML into #root
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      );

      // Write the pre-rendered HTML
      fs.mkdirSync(route.outDir, { recursive: true });
      const outputPath = path.join(route.outDir, 'index.html');
      fs.writeFileSync(outputPath, html, 'utf-8');

      console.log(`  ✓ Pre-rendered ${route.url} → ${path.relative(distDir, outputPath)}`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ Failed to pre-render ${route.url}:`, err.message);
      throw err;
    }
  }

  // --- Generate 404.html and 403.html ---
  // CloudFront serves /404.html and /403.html for unknown paths. S3 returns 403
  // (not 404) for missing keys when accessed via OAI, so both are needed.
  // These files keep the same <head> (CSS, JS, fonts) but leave <div id="root">
  // empty so main.tsx takes the createRoot path and React renders NotFoundPage
  // with no flash.
  for (const errorFile of ['404.html', '403.html']) {
    try {
      let htmlError = template;

      htmlError = htmlError.replace(
        /<title>.*?<\/title>/,
        '<title>Page Not Found — ur/gd Studios</title>'
      );

      htmlError = htmlError.replace(
        /<meta name="description" content="[^"]*"[^>]*>/,
        '<meta name="description" content="The page you are looking for does not exist.">'
      );

      // Keep <div id="root"></div> empty — no pre-rendered HTML.
      // main.tsx will see no child nodes and use createRoot.

      const errorPath = path.join(distDir, errorFile);
      fs.writeFileSync(errorPath, htmlError, 'utf-8');
      console.log(`  ✓ Generated ${errorFile}`);
    } catch (err) {
      console.error(`  ✗ Failed to generate ${errorFile}:`, err.message);
      throw err;
    }
  }

  console.log(`\n  Pre-rendering complete: ${successCount}/${ROUTES.length} routes + error pages.`);
}

prerender().catch((err) => {
  console.error('\nPre-rendering failed:', err);
  process.exit(1);
});
