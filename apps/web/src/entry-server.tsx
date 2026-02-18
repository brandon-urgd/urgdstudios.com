/**
 * urgdstudios.com — SSR Entry Point
 *
 * Used exclusively by scripts/prerender.mjs to generate static HTML per route.
 * Not bundled into the client build. Not imported by main.tsx.
 *
 * Renders the full React app to an HTML string using StaticRouter so that
 * each route's index.html contains rendered content (not an empty <div id="root">).
 * The client bundle then hydrates the pre-rendered HTML via hydrateRoot.
 */

import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';

export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
}
