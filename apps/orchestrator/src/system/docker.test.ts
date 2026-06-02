import { describe, expect, it } from 'bun:test';
import { type ContainerSummary, type NetworkSummary, buildOverview } from './docker';

const NET: NetworkSummary[] = [
  { Id: 'n1', Name: 'sawadev_net', Driver: 'bridge' },
  { Id: 'n2', Name: 'bridge', Driver: 'bridge' },
];

const C = (over: Partial<ContainerSummary>): ContainerSummary => ({
  Id: 'id',
  Names: ['/c'],
  Image: 'img',
  State: 'running',
  Status: 'Up 1 hour',
  NetworkSettings: { Networks: { sawadev_net: {} } },
  ...over,
});

describe('buildOverview', () => {
  it('classe les rôles et garde l’écosystème sawadev', () => {
    const containers: ContainerSummary[] = [
      C({
        Id: 'ws',
        Names: ['/sawadev-ws-abc'],
        Labels: { 'sawadev.managed': 'true', 'sawadev.workspace': 'abc' },
      }),
      C({
        Id: 'gm',
        Names: ['/sawadev-gemma'],
        Labels: { 'sawadev.managed': 'true', 'sawadev.role': 'gemma' },
      }),
      C({ Id: 'cad', Names: ['/sawadev-caddy-1'] }), // sur le réseau, sans label → infra
      C({ Id: 'rnd', Names: ['/random'], NetworkSettings: { Networks: { bridge: {} } } }), // hors écosystème
    ];
    const { containers: cs, networks } = buildOverview(containers, NET, 'sawadev_net');
    expect(cs.map((c) => [c.name, c.role, c.workspaceId])).toEqual([
      ['sawadev-ws-abc', 'dev', 'abc'],
      ['sawadev-gemma', 'gemma', null],
      ['sawadev-caddy-1', 'infra', null],
    ]);
    // un seul réseau sawadev, 3 conteneurs attachés
    expect(networks).toEqual([{ id: 'n1', name: 'sawadev_net', driver: 'bridge', containers: 3 }]);
  });

  it('déduplique les ports et garde le mapping hôte', () => {
    const [c] = buildOverview(
      [
        C({
          Ports: [
            { PrivatePort: 5432, Type: 'tcp' },
            { PrivatePort: 5432, PublicPort: 5432, Type: 'tcp' },
            { PrivatePort: 80, Type: 'tcp' },
          ],
        }),
      ],
      NET,
      'sawadev_net',
    ).containers;
    expect(c.ports).toEqual([
      { private: 80, public: undefined },
      { private: 5432, public: 5432 },
    ]);
  });

  it('inclut un conteneur managed même hors réseau sawadev', () => {
    const { containers } = buildOverview(
      [
        C({
          Id: 'up',
          Names: ['/upd'],
          Labels: { 'sawadev.managed': 'true', 'sawadev.role': 'updater' },
          NetworkSettings: { Networks: { bridge: {} } },
        }),
      ],
      NET,
      'sawadev_net',
    );
    expect(containers).toHaveLength(1);
    expect(containers[0].role).toBe('updater');
    expect(containers[0].networks).toEqual([]);
  });
});
