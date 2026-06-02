import type { GitActionResult, GitBranch, GitCommit, GitStatus } from '@sawadev/shared';
import { apiGet, apiPost } from './client';

const base = (id: string) => `/api/workspaces/${id}/git`;

export function gitStatus(id: string): Promise<GitStatus> {
  return apiGet<GitStatus>(`${base(id)}/status`);
}
export function gitBranches(id: string): Promise<GitBranch[]> {
  return apiGet<GitBranch[]>(`${base(id)}/branches`);
}
export function gitLog(id: string): Promise<GitCommit[]> {
  return apiGet<GitCommit[]>(`${base(id)}/log`);
}
export function gitDiff(id: string, path: string, staged: boolean): Promise<{ diff: string }> {
  const q = new URLSearchParams({ path, staged: staged ? '1' : '0' });
  return apiGet<{ diff: string }>(`${base(id)}/diff?${q}`);
}
export function gitStage(id: string, path?: string): Promise<GitActionResult> {
  return apiPost<GitActionResult>(`${base(id)}/stage`, { path });
}
export function gitUnstage(id: string, path?: string): Promise<GitActionResult> {
  return apiPost<GitActionResult>(`${base(id)}/unstage`, { path });
}
export function gitCommit(id: string, message: string): Promise<GitActionResult> {
  return apiPost<GitActionResult>(`${base(id)}/commit`, { message });
}
export function gitCheckout(id: string, branch: string): Promise<GitActionResult> {
  return apiPost<GitActionResult>(`${base(id)}/checkout`, { branch });
}
export function gitInit(id: string): Promise<GitActionResult> {
  return apiPost<GitActionResult>(`${base(id)}/init`);
}
