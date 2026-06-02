import type { CreateWorkspaceRequest } from '@sawadev/shared';
import type { AgentProvider, KeyProvider, WorkspaceUiState } from '@sawadev/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAction,
  deleteAction,
  getActionRun,
  listActions,
  runAction,
  updateAction,
} from './actions';
import { agentChat, agentClear, agentMessages } from './agent';
import {
  changePassword,
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
  copyFile,
  createDir,
  deletePath,
  getUiState,
  listFiles,
  moveFile,
  putUiState,
  readFile,
  writeFile,
} from './files';
import {
  gitBranches,
  gitCheckout,
  gitCommit,
  gitDiff,
  gitInit,
  gitLog,
  gitStage,
  gitStatus,
  gitUnstage,
} from './git';
import { addPort, listPorts, removePort } from './ports';
import {
  deleteKey,
  getDockerOverview,
  getVersion,
  listKeys,
  setKey,
  startUpdate,
} from './settings';
import { killTerminal, listTerminals } from './terminal';
import {
  addTool,
  deleteTool,
  listCatalog,
  listTools,
  startTool,
  stopTool,
  toolLogs,
} from './tools';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceStats,
  listWorkspaces,
  renameWorkspace,
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

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      changePassword(body.currentPassword, body.newPassword),
  });
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

export function useRenameWorkspace() {
  const invalidate = useInvalidateWorkspaces();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameWorkspace(id, name),
    onSuccess: invalidate,
  });
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
    duplicate: useMutation({
      mutationFn: ({ from, to }: { from: string; to: string }) => copyFile(workspaceId, from, to),
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

// ── Terminaux (sessions tmux) ────────────────────────────────────────────────

/** Sessions terminal vivantes (pour rouvrir une session orpheline). */
export function useTerminals(workspaceId: string) {
  return useQuery({
    queryKey: ['terminals', workspaceId],
    queryFn: () => listTerminals(workspaceId),
    enabled: !!workspaceId,
    refetchInterval: 8000,
    retry: false,
  });
}

export function useKillTerminal(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (termId: string) => killTerminal(workspaceId, termId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['terminals', workspaceId] }),
  });
}

// ── Quick Actions ────────────────────────────────────────────────────────────

const actionsKey = (id: string) => ['actions', id] as const;

export function useActions(workspaceId: string) {
  return useQuery({
    queryKey: actionsKey(workspaceId),
    queryFn: () => listActions(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateAction(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { label: string; command: string }) => createAction(workspaceId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: actionsKey(workspaceId) }),
  });
}

export function useUpdateAction(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; label: string; command: string }) =>
      updateAction(workspaceId, id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: actionsKey(workspaceId) }),
  });
}

export function useDeleteAction(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAction(workspaceId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: actionsKey(workspaceId) }),
  });
}

export function useRunAction(workspaceId: string) {
  return useMutation({ mutationFn: (id: string) => runAction(workspaceId, id) });
}

/** Poll d'un run tant qu'il est actif (l'invalidation de la liste se fait côté composant). */
export function useActionRun(workspaceId: string, runId: string | null) {
  return useQuery({
    queryKey: ['action-run', workspaceId, runId],
    queryFn: () => getActionRun(workspaceId, runId as string),
    enabled: !!runId,
    refetchInterval: (q) => (q.state.data?.status === 'active' ? 800 : false),
  });
}

/** Invalide la liste d'actions (rafraîchit le badge « dernier run »). */
export function useInvalidateActions(workspaceId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: actionsKey(workspaceId) });
}

// ── Git ──────────────────────────────────────────────────────────────────────

export function useGitStatus(workspaceId: string) {
  return useQuery({
    queryKey: ['git-status', workspaceId],
    queryFn: () => gitStatus(workspaceId),
    enabled: !!workspaceId,
    refetchInterval: 5000,
    retry: false,
  });
}

export function useGitBranches(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: ['git-branches', workspaceId],
    queryFn: () => gitBranches(workspaceId),
    enabled: enabled && !!workspaceId,
    retry: false,
  });
}

export function useGitLog(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: ['git-log', workspaceId],
    queryFn: () => gitLog(workspaceId),
    enabled: enabled && !!workspaceId,
    retry: false,
  });
}

export function useGitDiff(workspaceId: string, path: string | null, staged: boolean) {
  return useQuery({
    queryKey: ['git-diff', workspaceId, path, staged],
    queryFn: () => gitDiff(workspaceId, path as string, staged),
    enabled: !!path,
    retry: false,
  });
}

/** Mutations git → invalident statut/branches/log. */
export function useGitActions(workspaceId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['git-status', workspaceId] });
    qc.invalidateQueries({ queryKey: ['git-branches', workspaceId] });
    qc.invalidateQueries({ queryKey: ['git-log', workspaceId] });
  };
  return {
    stage: useMutation({
      mutationFn: (path?: string) => gitStage(workspaceId, path),
      onSuccess: refresh,
    }),
    unstage: useMutation({
      mutationFn: (path?: string) => gitUnstage(workspaceId, path),
      onSuccess: refresh,
    }),
    commit: useMutation({
      mutationFn: (message: string) => gitCommit(workspaceId, message),
      onSuccess: refresh,
    }),
    checkout: useMutation({
      mutationFn: (branch: string) => gitCheckout(workspaceId, branch),
      onSuccess: refresh,
    }),
    init: useMutation({ mutationFn: () => gitInit(workspaceId), onSuccess: refresh }),
  };
}

// ── Services (tools) ─────────────────────────────────────────────────────────

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog', 'tools'],
    queryFn: listCatalog,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useTools(workspaceId: string) {
  return useQuery({
    queryKey: ['tools', workspaceId],
    queryFn: () => listTools(workspaceId),
    enabled: !!workspaceId,
  });
}

/** Mutations service (add/start/stop/delete) → invalident la liste. */
export function useToolActions(workspaceId: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['tools', workspaceId] });
  return {
    add: useMutation({
      mutationFn: (type: string) => addTool(workspaceId, type),
      onSuccess: refresh,
    }),
    start: useMutation({
      mutationFn: (toolId: string) => startTool(workspaceId, toolId),
      onSuccess: refresh,
    }),
    stop: useMutation({
      mutationFn: (toolId: string) => stopTool(workspaceId, toolId),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (toolId: string) => deleteTool(workspaceId, toolId),
      onSuccess: refresh,
    }),
  };
}

export function useToolLogs(workspaceId: string, toolId: string | null) {
  return useQuery({
    queryKey: ['tool-logs', workspaceId, toolId],
    queryFn: () => toolLogs(workspaceId, toolId as string),
    enabled: !!toolId,
  });
}

// ── AI Agent (chat) ──────────────────────────────────────────────────────────

const agentKey = (id: string) => ['agent-messages', id] as const;

export function useAgentMessages(workspaceId: string) {
  return useQuery({
    queryKey: agentKey(workspaceId),
    queryFn: () => agentMessages(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useSendChat(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, prompt }: { provider: AgentProvider; prompt: string }) =>
      agentChat(workspaceId, provider, prompt),
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKey(workspaceId) }),
  });
}

export function useClearChat(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => agentClear(workspaceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKey(workspaceId) }),
  });
}

// ── Réglages : clés API + système ────────────────────────────────────────────

const KEYS_KEY = ['settings', 'keys'] as const;

export function useVersion() {
  return useQuery({ queryKey: ['system', 'version'], queryFn: getVersion });
}

/** Aperçu Docker de l'écosystème (lecture seule), rafraîchi en direct. */
export function useDockerOverview() {
  return useQuery({
    queryKey: ['system', 'docker'],
    queryFn: getDockerOverview,
    refetchInterval: 5000,
    retry: false,
  });
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
