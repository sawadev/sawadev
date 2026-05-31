import type { CreateWorkspaceRequest } from '@sawadev/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthState, login, loginWithPasskey, logout, registerPasskey, setup } from './auth';
import { listFiles, readFile, writeFile } from './files';
import {
  createWorkspace,
  deleteWorkspace,
  listWorkspaces,
  startWorkspace,
  stopWorkspace,
} from './workspaces';

const AUTH_KEY = ['auth', 'state'] as const;
const WS_KEY = ['workspaces'] as const;

export function useAuthState() {
  return useQuery({ queryKey: AUTH_KEY, queryFn: getAuthState });
}

/** Invalide l'état d'auth après une mutation (login/logout/setup). */
function useInvalidateAuth() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: AUTH_KEY });
}

export function useLogin() {
  const invalidate = useInvalidateAuth();
  return useMutation({ mutationFn: (password: string) => login(password), onSuccess: invalidate });
}

export function useSetup() {
  const invalidate = useInvalidateAuth();
  return useMutation({ mutationFn: (password: string) => setup(password), onSuccess: invalidate });
}

export function useLoginWithPasskey() {
  const invalidate = useInvalidateAuth();
  return useMutation({ mutationFn: loginWithPasskey, onSuccess: invalidate });
}

export function useRegisterPasskey() {
  const invalidate = useInvalidateAuth();
  return useMutation({
    mutationFn: (label?: string) => registerPasskey(label),
    onSuccess: invalidate,
  });
}

export function useLogout() {
  const invalidate = useInvalidateAuth();
  return useMutation({ mutationFn: logout, onSuccess: invalidate });
}

// ── Workspaces ───────────────────────────────────────────────────────────────

export function useWorkspaces() {
  return useQuery({ queryKey: WS_KEY, queryFn: listWorkspaces });
}

function useInvalidateWorkspaces() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: WS_KEY });
}

export function useCreateWorkspace() {
  const invalidate = useInvalidateWorkspaces();
  return useMutation({
    mutationFn: (req: CreateWorkspaceRequest) => createWorkspace(req),
    onSuccess: invalidate,
  });
}

export function useStartWorkspace() {
  const invalidate = useInvalidateWorkspaces();
  return useMutation({ mutationFn: (id: string) => startWorkspace(id), onSuccess: invalidate });
}

export function useStopWorkspace() {
  const invalidate = useInvalidateWorkspaces();
  return useMutation({ mutationFn: (id: string) => stopWorkspace(id), onSuccess: invalidate });
}

export function useDeleteWorkspace() {
  const invalidate = useInvalidateWorkspaces();
  return useMutation({ mutationFn: (id: string) => deleteWorkspace(id), onSuccess: invalidate });
}

// ── Fichiers ─────────────────────────────────────────────────────────────────

export function useFiles(workspaceId: string, path: string) {
  return useQuery({
    queryKey: ['files', workspaceId, path],
    queryFn: () => listFiles(workspaceId, path),
  });
}

export function useFileContent(workspaceId: string, path: string | null) {
  return useQuery({
    queryKey: ['file', workspaceId, path],
    queryFn: () => readFile(workspaceId, path as string),
    enabled: path !== null,
  });
}

export function useSaveFile(workspaceId: string) {
  return useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      writeFile(workspaceId, path, content),
  });
}
