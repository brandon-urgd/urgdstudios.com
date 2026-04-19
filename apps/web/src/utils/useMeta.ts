import { useEffect } from 'react';

interface UseMetaProps {
  title: string;
  description: string;
  /** Canonical URL for this page, e.g. 'https://urgdstudios.com/applications/' */
  ogUrl?: string;
  /** Path to a favicon SVG to use for this page (reverts on unmount) */
  favicon?: string;
}

/**
 * Custom hook for managing page metadata.
 *
 * Sets document.title, meta description, and Open Graph / Twitter Card meta tags.
 * og:type, og:site_name, og:image, and twitter:card are set as static defaults
 * in index.html and do not change per-page. This hook manages the per-page values.
 *
 * Safe to call during SSR — all DOM access is inside useEffect (browser-only).
 */
export function useMeta({ title, description, ogUrl, favicon }: UseMetaProps) {
  useEffect(() => {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    if (ogUrl) {
      setMeta('property', 'og:url', ogUrl);
    }

    // Swap favicon if provided, revert on unmount.
    // Hide competing ICO/PNG links so the browser uses the SVG.
    let originalHref: string | null = null;
    const hiddenLinks: { el: HTMLLinkElement; display: string }[] = [];
    if (favicon) {
      const svgLink = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
      if (svgLink) {
        originalHref = svgLink.getAttribute('href');
        svgLink.setAttribute('href', favicon);
      }

      // Hide non-SVG favicon links so the browser doesn't prefer them
      document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]:not([type="image/svg+xml"])').forEach((el) => {
        hiddenLinks.push({ el, display: el.style.display });
        el.setAttribute('data-hidden-by-meta', '');
        el.remove();
      });
    }

    return () => {
      if (originalHref !== null) {
        const svgLink = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
        if (svgLink) svgLink.setAttribute('href', originalHref);
      }
      // Restore removed favicon links
      for (const { el } of hiddenLinks) {
        el.removeAttribute('data-hidden-by-meta');
        document.head.appendChild(el);
      }
    };
  }, [title, description, ogUrl, favicon]);
}

/** Create or update a <meta> tag by its attribute selector. */
function setMeta(attrName: string, attrValue: string, content: string) {
  let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}
