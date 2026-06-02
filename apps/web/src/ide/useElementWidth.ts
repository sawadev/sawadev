import { useEffect, useRef, useState } from 'react';

/** Largeurs de bascule communes aux modules du dock (panneau de largeur variable). */
export const COMPACT = 340;
export const WIDE = 560;

/**
 * Mesure la largeur courante d'un élément via ResizeObserver. Les media-queries ne
 * captent pas le redimensionnement du panneau de droite → on observe le conteneur.
 */
export function useElementWidth<T extends HTMLElement = HTMLDivElement>(): [
  React.RefObject<T>,
  number,
] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}
