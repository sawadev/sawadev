import { createContext, useContext } from 'react';
import type { Device, Theme } from './types';

export interface UICtx {
  theme: Theme;
  toggleTheme: () => void;
  accent: string;
  setAccent: (hex: string) => void;
  /** Active layout: phone, tablet, or desktop. */
  device: Device;
  /** Convenience flag: device === 'mobile'. */
  isMobile: boolean;
}

export const UIContext = createContext<UICtx | null>(null);

export function useUI(): UICtx {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIContext');
  return ctx;
}
