import { useWorkspaceStats } from '../api/hooks';

function fmtMem(bytes: number): string {
  if (bytes <= 0) return '0';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}

/** Petit indicateur CPU / mémoire du workspace (sonde toutes les 4 s). */
export function StatsChip({ workspaceId }: { workspaceId: string }) {
  const { data } = useWorkspaceStats(workspaceId);
  if (!data) return null;
  return (
    <span className="chip chip-sm mono" title="CPU · mémoire" style={{ gap: 8 }}>
      <span>CPU {data.cpuPct.toFixed(0)}%</span>
      <span style={{ color: 'var(--faint)' }}>·</span>
      <span>{fmtMem(data.memBytes)}</span>
    </span>
  );
}
