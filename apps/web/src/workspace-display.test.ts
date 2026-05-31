import { describe, expect, it } from 'vitest';
import { stackLabel, workspaceIcon } from './workspace-display';

describe('stackLabel', () => {
  it("déduit une étiquette lisible depuis l'image", () => {
    expect(stackLabel('node:20-bookworm-slim')).toBe('Node');
    expect(stackLabel('python:3.12')).toBe('Python');
    expect(stackLabel('ghcr.io/acme/next-app:latest')).toBe('Next.js');
  });

  it('retombe sur le nom de base si inconnu', () => {
    expect(stackLabel('busybox')).toBe('busybox');
    expect(stackLabel('redis:7')).toBe('redis');
  });
});

describe('workspaceIcon', () => {
  it("associe une icône au type d'image", () => {
    expect(workspaceIcon('node:20')).toBe('cpu');
    expect(workspaceIcon('python:3.12')).toBe('bolt');
    expect(workspaceIcon('something/next:1')).toBe('layers');
    expect(workspaceIcon('busybox')).toBe('cpu');
  });
});
