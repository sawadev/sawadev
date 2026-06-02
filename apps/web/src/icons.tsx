import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Command,
  Container,
  Copy,
  Cpu,
  EllipsisVertical,
  ExternalLink,
  Eye,
  File,
  Fingerprint,
  Folder,
  GitBranch,
  GitCompare,
  Globe,
  History,
  KeyRound,
  Layers,
  LayoutGrid,
  Lock,
  LogOut,
  type LucideIcon,
  Mic,
  Moon,
  PanelBottom,
  PanelLeft,
  Paperclip,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Terminal,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react';
import type { CSSProperties } from 'react';

/**
 * Correspondance des noms d'icônes historiques de l'app → composants Lucide.
 * Conserver l'API `HIcon` (et les noms dynamiques : workspaceIcon, PANES, data…).
 */
const ICONS: Record<string, LucideIcon> = {
  file: File,
  folder: Folder,
  terminal: Terminal,
  sparkle: Sparkles,
  sparkleSm: Sparkles,
  play: Play,
  stop: Square,
  gear: Settings,
  search: Search,
  plus: Plus,
  chevR: ChevronRight,
  chevD: ChevronDown,
  chevL: ChevronLeft,
  chevU: ChevronUp,
  dotsV: EllipsisVertical,
  x: X,
  check: Check,
  copy: Copy,
  external: ExternalLink,
  lock: Lock,
  finger: Fingerprint,
  user: User,
  globe: Globe,
  sun: Sun,
  moon: Moon,
  key: KeyRound,
  branch: GitBranch,
  diff: GitCompare,
  refresh: RefreshCw,
  send: Send,
  attach: Paperclip,
  mic: Mic,
  cpu: Cpu,
  docker: Container,
  layers: Layers,
  eye: Eye,
  back: ArrowLeft,
  shield: ShieldCheck,
  bell: Bell,
  dock: PanelBottom,
  panel: PanelLeft,
  command: Command,
  history: History,
  grid: LayoutGrid,
  bolt: Zap,
  trash: Trash2,
  arrowR: ArrowRight,
  logout: LogOut,
};

export interface HIconProps {
  name: string;
  size?: number;
  /** Épaisseur du trait (strokeWidth Lucide). */
  sw?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

/** Icône de l'app, rendue avec Lucide. API conservée (name/size/sw/color). */
export function HIcon({
  name,
  size = 18,
  sw = 1.6,
  color = 'currentColor',
  style,
  className,
}: HIconProps) {
  const Comp = ICONS[name] ?? File;
  return (
    <Comp
      size={size}
      strokeWidth={sw}
      color={color}
      className={className}
      style={{ flexShrink: 0, display: 'block', ...style }}
    />
  );
}
