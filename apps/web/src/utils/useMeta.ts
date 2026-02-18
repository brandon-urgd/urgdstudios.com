import { useEffect } from 'react';

interface UseMetaProps {
  title: string;
  description: string;
  /** Canonical URL for this page, e.g. 'https://urgdstudios.com/applications/' */
  ogUrl?: string;
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
export function useMeta({ title, description, ogUrl }: UseMetaProps) {
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
  }, [title, description, ogUrl]);
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
