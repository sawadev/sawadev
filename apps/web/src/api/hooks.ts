import type { CreateWorkspaceRequest } from '@sawadev/shared';
import type { KeyProvider, WorkspaceUiState } from '@sawadev/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deletePasskey,
  getAuthState,
  listPasskeys,
  login,
  loginWithPasskey,
  logout,
  registerPasskey,
  setup,
} from './auth';
import {
  createDir,
  deletePath,
  getUiState,
  listFiles,
  moveFile,
  putUiState,
  readFile,
  writeFile,
} from './files';
import { addPort, listPorts, removePort } from './ports';
import { deleteKey, getVersion, listKeys, setKey, startUpdate } from './settings';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceStats,
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

export function usePasskeys() {
  return useQuery({ queryKey: ['passkeys'], queryFn: listPasskeys });
}

export function useDeletePasskey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePasskey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passkeys'] });
      qc.invalidateQueries({ queryKey: AUTH_KEY });
    },
  });
}

// ── Workspaces ───────────────────────────────────────────────────────────────

export function useWorkspaces() {
  return useQuery({
    queryKey: WS_KEY,
    queryFn: listWorkspaces,
    // Statut runtime (running/stopped) sondé en direct : re-fetch périodique +
    // au retour sur l'onglet, pour refléter les changements (idle-stop, start/stop…).
    refetchInterval: 6000,
    refetchOnWindowFocus: true,
  });
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

/** Stats CPU/mémoire du workspace (sondées périodiquement). */
export function useWorkspaceStats(id: string, enabled = true) {
  return useQuery({
    queryKey: ['workspace-stats', id],
    queryFn: () => getWorkspaceStats(id),
    enabled: enabled && !!id,
    refetchInterval: 4000,
    retry: false,
  });
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      writeFile(workspaceId, path, content),
    // Synchronise le cache avec le contenu sauvegardé → l'état « modifié » retombe.
    onSuccess: (_res, { path, content }) => {
      qc.setQueryData(['file', workspaceId, path], { content });
    },
  });
}

/** Contexte IDE persistant du workspace (chargé à l'ouverture, synchronisé entre appareils). */
export function useUiState(workspaceId: string) {
  return useQuery({
    queryKey: ['ui-state', workspaceId],
    queryFn: () => getUiState(workspaceId),
    staleTime: Number.POSITIVE_INFINITY, // chargé une fois ; le provider tient l'état de travail
  });
}

export function useSaveUiState(workspaceId: string) {
  return useMutation({
    mutationFn: (state: WorkspaceUiState) => putUiState(workspaceId, state),
  });
}

/** Mutations d'arborescence (création/renommage/suppression) + invalidation de l'arbre. */
export function useFileTreeActions(workspaceId: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['files', workspaceId] });
  return {
    newFile: useMutation({
      mutationFn: (path: string) => writeFile(workspaceId, path, ''),
      onSuccess: refresh,
    }),
    newDir: useMutation({
      mutationFn: (path: string) => createDir(workspaceId, path),
      onSuccess: refresh,
    }),
    rename: useMutation({
      mutationFn: ({ from, to }: { from: string; to: string }) => moveFile(workspaceId, from, to),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (path: string) => deletePath(workspaceId, path),
      onSuccess: refresh,
    }),
  };
}

// ── Ports / preview ──────────────────────────────────────────────────────────

export function usePorts(workspaceId: string) {
  return useQuery({ queryKey: ['ports', workspaceId], queryFn: () => listPorts(workspaceId) });
}

export function useAddPort(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (port: number) => addPort(workspaceId, port),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ports', workspaceId] }),
  });
}

export function useRemovePort(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (port: number) => removePort(workspaceId, port),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ports', workspaceId] }),
  });
}

// ── Réglages : clés API + système ────────────────────────────────────────────

const KEYS_KEY = ['settings', 'keys'] as const;

export function useVersion() {
  return useQuery({ queryKey: ['system', 'version'], queryFn: getVersion });
}

export function useApiKeys() {
  return useQuery({ queryKey: KEYS_KEY, queryFn: listKeys });
}

export function useSetApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, key }: { provider: KeyProvider; key: string }) =>
      setKey(provider, key),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS_KEY }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: KeyProvider) => deleteKey(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS_KEY }),
  });
}

export function useStartUpdate() {
  return useMutation({ mutationFn: startUpdate });
}
