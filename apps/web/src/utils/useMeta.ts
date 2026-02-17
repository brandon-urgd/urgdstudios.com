import { useEffect } from 'react';

interface UseMetaProps {
  title: string;
  description: string;
}

/**
 * Custom hook for managing page metadata.
 *
 * Sets document.title and creates/updates meta description tag.
 * Cleanup handled on unmount.
 *
 * Used by content pages to set unique, accurate meta descriptions
 * without relying on App.tsx's RouteChangeManager.
 */
export function useMeta({ title, description }: UseMetaProps) {
  useEffect(() => {
    document.title = title;

    let metaDescription = document.querySelector('meta[name="description"]');

    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }

    metaDescription.setAttribute('content', description);

    return () => {
      // Cleanup: restore to default or remove if needed
      // For now, we leave it in place since RouteChangeManager also manages this
    };
  }, [title, description]);
}
