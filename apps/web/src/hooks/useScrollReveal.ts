import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

interface UseScrollRevealReturn {
  ref: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
}

/**
 * Custom hook for scroll-triggered visibility using Intersection Observer.
 *
 * Returns a ref and visibility boolean. Attach the ref to the element you want to observe.
 * When the element enters the viewport (at the specified threshold), isVisible becomes true.
 *
 * Reveals are one-time — sections do not re-hide when scrolled past.
 *
 * Default rootMargin of '-100px' triggers reveals slightly before content enters viewport,
 * allowing the animation to complete as content becomes visible (just-in-time reveal).
 *
 * Fallback: If IntersectionObserver is not supported, isVisible is always true (sections visible immediately).
 */
export function useScrollReveal(
  options: UseScrollRevealOptions = {}
): UseScrollRevealReturn {
  const { threshold = 0.1, rootMargin = '0px 0px -100px 0px' } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fallback for browsers without IntersectionObserver support
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Once visible, stay visible (one-time reveal)
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing after first intersection
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}
