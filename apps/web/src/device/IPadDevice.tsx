import type { ReactNode } from 'react';

/** iPad bezel used for the tablet preview on wide screens. Content area is `width` x `height`. */
export function IPadDevice({
  children,
  width = 1194,
  height = 834,
  dark = false,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  dark?: boolean;
}) {
  const B = 16;
  return (
    <div
      style={{
        width: width + B * 2,
        height: height + B * 2,
        borderRadius: 34,
        background: dark ? '#0b0b0d' : '#1c1c1e',
        padding: B,
        boxShadow: '0 40px 90px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.14)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* camera */}
      <div
        style={{
          position: 'absolute',
          top: B / 2 + 2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 7,
          height: 7,
          borderRadius: 5,
          background: '#2a2a2e',
          boxShadow: 'inset 0 0 2px rgba(0,0,0,0.6)',
        }}
      />
      <div
        style={{
          width,
          height,
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          background: dark ? '#000' : '#fff',
        }}
      >
        {children}
        {/* home indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 7,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 220,
            height: 5,
            borderRadius: 3,
            background: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.28)',
            zIndex: 60,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
