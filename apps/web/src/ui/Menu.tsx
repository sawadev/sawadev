import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** Cible du portal : la racine `.sawa` (pour hériter du thème + --accent), sinon body. */
function menuRoot(): HTMLElement {
  return (document.querySelector('.sawa') as HTMLElement | null) ?? document.body;
}

/**
 * Menu flottant générique (dropdown ou menu contextuel). Positionné à `anchor`
 * (coordonnées viewport), recadré dans la fenêtre, fermé au clic extérieur / Échap / scroll.
 */
export function Menu({
  anchor,
  items,
  onClose,
}: {
  anchor: { x: number; y: number };
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(anchor);

  // Recadre dans la fenêtre une fois la taille connue.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let x = anchor.x;
    let y = anchor.y;
    if (x + r.width > window.innerWidth - 8) x = window.innerWidth - r.width - 8;
    if (y + r.height > window.innerHeight - 8) y = window.innerHeight - r.height - 8;
    setPos({ x: Math.max(8, x), y: Math.max(8, y) });
  }, [anchor]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', onClose, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="menu fade"
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 1000 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          className="menu-item"
          disabled={it.disabled}
          data-danger={it.danger ? '' : undefined}
          onClick={() => {
            onClose();
            it.onClick();
          }}
        >
          {it.icon && <span className="menu-ic">{it.icon}</span>}
          {it.label}
        </button>
      ))}
    </div>,
    menuRoot(),
  );
}
