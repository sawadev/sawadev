import type { ContainerRole, DockerContainer, DockerNetwork } from '@sawadev/shared';
import { useNavigate } from 'react-router-dom';
import { useDockerOverview, useWorkspaces } from '../api/hooks';
import { BOTPAD, TOPPAD } from '../data';
import { DeskFrame } from '../desktop/DesktopShell';
import { HIcon } from '../icons';
import { StatusDot } from '../ui';

const ROLE_ORDER: Record<ContainerRole, number> = {
  infra: 0,
  dev: 1,
  gemma: 2,
  updater: 3,
  other: 4,
};
const ROLE_LABEL: Record<ContainerRole, string> = {
  dev: 'Workspace',
  gemma: 'Gemma',
  updater: 'Updater',
  infra: 'Infra',
  other: 'Container',
};

const SECTION_LABEL = {
  fontSize: 12.5,
  fontWeight: 700,
  color: 'var(--muted)',
  margin: '24px 2px 10px',
  letterSpacing: 0.3,
} as const;

/** Garde repo:tag (retire le registre/chemin). */
function shortImage(img: string): string {
  return img.replace(/^.*\//, '');
}

function byRole(a: DockerContainer, b: DockerContainer): number {
  return ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name);
}

function ContainerCard({ c, wsName }: { c: DockerContainer; wsName: (id: string) => string }) {
  const running = c.state === 'running';
  const title = c.role === 'dev' && c.workspaceId ? wsName(c.workspaceId) : c.name;
  return (
    <div
      className="card"
      style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusDot on={running} live={running} />
        <span
          style={{
            fontWeight: 600,
            fontSize: 13.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        {c.role === 'dev' && c.workspaceId && (
          <span className="mono id-tag" style={{ alignSelf: 'center' }}>
            {c.workspaceId}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span className="chip chip-sm">{ROLE_LABEL[c.role]}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11.5,
          color: 'var(--muted)',
          minWidth: 0,
        }}
      >
        <span
          className="mono"
          title={c.image}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {shortImage(c.image)}
        </span>
        <span style={{ color: 'var(--faint)', flexShrink: 0 }}>·</span>
        <span style={{ flexShrink: 0 }}>{c.status || c.state}</span>
      </div>
      {c.ports.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {c.ports.map((p) => (
            <span key={p.private} className="chip chip-sm mono">
              :{p.private}
              {p.public ? ` → host :${p.public}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function NetworkSection({
  net,
  containers,
  wsName,
}: {
  net: DockerNetwork;
  containers: DockerContainer[];
  wsName: (id: string) => string;
}) {
  const inNet = containers.filter((c) => c.networks.includes(net.name)).sort(byRole);
  return (
    <div>
      <div style={{ ...SECTION_LABEL, display: 'flex', alignItems: 'center', gap: 8 }}>
        <HIcon name="grid" size={13} color="var(--muted)" />
        <span style={{ textTransform: 'none', fontSize: 13 }} className="mono">
          {net.name}
        </span>
        <span style={{ color: 'var(--faint)', fontWeight: 600 }}>
          {net.driver} · {inNet.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {inNet.map((c) => (
          <ContainerCard key={c.id} c={c} wsName={wsName} />
        ))}
      </div>
    </div>
  );
}

function DockerOverviewBody() {
  const { data, isLoading } = useDockerOverview();
  const { data: workspaces = [] } = useWorkspaces();
  const wsName = (id: string) => workspaces.find((w) => w.id === id)?.name ?? id;

  const containers = data?.containers ?? [];
  const networks = data?.networks ?? [];
  const running = containers.filter((c) => c.state === 'running').length;
  const orphans = containers.filter((c) => c.networks.length === 0).sort(byRole);

  return (
    <>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 8 }}>
        Docker
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
        Your sawadev ecosystem. Containers on the same network reach each other by name.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <span className="chip chip-sm">
          <StatusDot on={running > 0} live={running > 0} />
          {running} / {containers.length} running
        </span>
        <span className="chip chip-sm">
          <HIcon name="grid" size={12} color="var(--muted)" />
          {networks.length} network{networks.length > 1 ? 's' : ''}
        </span>
      </div>

      {!isLoading && containers.length === 0 ? (
        <div
          style={{
            marginTop: 28,
            padding: 28,
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 13.5,
          }}
        >
          Docker is unavailable, or no sawadev containers are running yet.
        </div>
      ) : (
        <>
          {networks.map((net) => (
            <NetworkSection key={net.id} net={net} containers={containers} wsName={wsName} />
          ))}
          {orphans.length > 0 && (
            <div>
              <div style={SECTION_LABEL}>OTHER</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {orphans.map((c) => (
                  <ContainerCard key={c.id} c={c} wsName={wsName} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export function DesktopDocker() {
  return (
    <DeskFrame>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 60px' }}>
        <DockerOverviewBody />
      </div>
    </DeskFrame>
  );
}

export function MobileDocker() {
  const nav = useNavigate();
  return (
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}
    >
      <div
        style={{
          paddingTop: TOPPAD,
          flexShrink: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: `${TOPPAD + 6}px 14px 10px`,
        }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Back"
          onClick={() => nav(-1)}
          style={{ width: 34, height: 34 }}
        >
          <HIcon name="back" size={18} color="var(--text-2)" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700 }}>Docker</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: `8px 18px ${BOTPAD + 16}px` }}>
        <DockerOverviewBody />
      </div>
    </div>
  );
}
