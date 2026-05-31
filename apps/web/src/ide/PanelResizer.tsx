import { useEffect, useRef } from 'react';

type Side = 'left' | 'right' | 'top' | 'bottom';

/**
 * Poignée de redimensionnement réutilisable, avec languette visible et zone de
 * préhension élargie au tactile. `side` = bord où elle s'ancre (gauche/droite →
 * largeur ; haut/bas → hauteur). `onResize` reçoit la coordonnée du pointeur sur
 * l'axe concerné (X pour gauche/droite, Y pour haut/bas) ; le parent en déduit la taille.
 */
export function PanelResizer({
  side,
  onResize,
  ariaLabel = 'Resize panel',
}: {
  side: Side;
  onResize: (coord: number) => void;
  ariaLabel?: string;
}) {
  const horizontal = side === 'left' || side === 'right';
  const dragging = useRef(false);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) onResizeRef.current(horizontal ? e.clientX : e.clientY);
    };
    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [horizontal]);

  return (
    <div
      className={`panel-resize panel-resize-${side}`}
      role="separator"
      aria-orientation={horizontal ? 'vertical' : 'horizontal'}
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.preventDefault();
        dragging.current = true;
        document.body.style.cursor = horizontal ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
      }}
    >
      <span className="panel-grip" />
    </div>
  );
}
