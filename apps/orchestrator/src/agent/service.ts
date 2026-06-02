import type { AgentMessage, AgentProvider, AgentRole, KeyProvider } from '@sawadev/shared';
import { getConfig } from '../config';
import { getDb } from '../db';
import { buildMessages, ensureGemma, gemmaChat } from '../gemma/service';
import { getOrCreateToken } from '../mcp/tokens';
import { PROVIDER_ENV, getDecryptedKey } from '../secrets/keys';
import { runInWorkspace } from '../terminal/exec-run';

/** Timeout d'une réponse d'agent en mode print (peut être long). */
const CHAT_TIMEOUT_MS = 120_000;

/**
 * Commande **print** (non interactive) par fournisseur — le prompt est lu dans
 * `$SAWA_PROMPT`. Les drapeaux de confiance/auto donnent à l'agent l'accès au dossier
 * `/workspace` sans invite interactive (sinon il s'arrête sur « Workspace Trust Required »).
 * Surchargeable globalement par `AGENT_PRINT_CMD`.
 */
const PRINT_CMD: Record<KeyProvider, string> = {
  anthropic: 'claude -p --dangerously-skip-permissions "$SAWA_PROMPT"',
  openai: 'codex exec --full-auto "$SAWA_PROMPT"',
  cursor: 'cursor-agent -p -f "$SAWA_PROMPT"',
};

function printCommand(provider: KeyProvider): string {
  return Bun.env.AGENT_PRINT_CMD || PRINT_CMD[provider];
}

// Séquences ANSI (couleurs, curseur…) émises par les agents CLI → retirées pour un rendu propre.
// RegExp construite via fromCharCode pour ne pas écrire l'octet ESC (0x1b) en dur dans la source.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[ -/]*[@-~]`, 'g');
function stripAnsi(s: string): string {
  return s.replace(ANSI, '').replace(/\r/g, '');
}

/**
 * Le mode print est **sans mémoire** : on injecte un court historique en préambule pour
 * garder la continuité de conversation entre les tours.
 */
function buildPrompt(history: AgentMessage[], prompt: string): string {
  if (history.length === 0) return prompt;
  const ctx = history
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n\n');
  return `Previous conversation:\n${ctx}\n\nUser: ${prompt}`;
}

interface MsgRow {
  id: string;
  role: AgentRole;
  text: string;
  created_at: number;
  provider: AgentProvider | null;
}

export function listMessages(workspaceId: string): AgentMessage[] {
  return getDb()
    .query<MsgRow, [string]>(
      'SELECT id, role, text, created_at, provider FROM agent_messages WHERE workspace_id = ? ORDER BY created_at',
    )
    .all(workspaceId)
    .map((r) => ({
      id: r.id,
      role: r.role,
      text: r.text,
      createdAt: r.created_at,
      provider: r.provider,
    }));
}

export function clearMessages(workspaceId: string): void {
  getDb().run('DELETE FROM agent_messages WHERE workspace_id = ?', [workspaceId]);
}

function append(
  workspaceId: string,
  role: AgentRole,
  text: string,
  provider: AgentProvider | null = null,
): AgentMessage {
  const msg: AgentMessage = {
    id: crypto.randomUUID(),
    role,
    text,
    createdAt: Date.now(),
    provider,
  };
  getDb().run(
    'INSERT INTO agent_messages (id, workspace_id, role, text, created_at, provider) VALUES (?, ?, ?, ?, ?, ?)',
    [msg.id, workspaceId, role, text, msg.createdAt, provider],
  );
  return msg;
}

/**
 * Envoie un prompt à l'agent CLI en mode print (clé injectée par env, jamais loggée),
 * persiste le tour user+assistant et renvoie la réponse (ANSI nettoyé).
 */
export async function chat(
  workspaceId: string,
  provider: AgentProvider,
  prompt: string,
): Promise<AgentMessage> {
  const history = listMessages(workspaceId);
  append(workspaceId, 'user', prompt);

  // Gemma : modèle local partagé (Ollama), sans clé, en HTTP requête/réponse.
  if (provider === 'gemma') {
    await ensureGemma();
    const reply = (await gemmaChat(buildMessages(history, prompt))).trim();
    return append(workspaceId, 'assistant', reply || '(no output)', 'gemma');
  }

  const key = getDecryptedKey(provider);
  if (!key) {
    return append(workspaceId, 'assistant', `No API key configured for ${provider}.`, provider);
  }

  const env = [
    `${PROVIDER_ENV[provider]}=${key}`,
    `SAWA_PROMPT=${buildPrompt(history, prompt)}`,
    // Autorise `claude --dangerously-skip-permissions` à tourner en root (le conteneur EST un bac à sable).
    'IS_SANDBOX=1',
    // Donne accès au serveur MCP du workspace (mêmes capacités que l'utilisateur).
    `SAWA_MCP_URL=${getConfig().mcpSelfUrl}`,
    `SAWA_MCP_TOKEN=${getOrCreateToken(workspaceId)}`,
  ];
  const raw = await runInWorkspace(
    workspaceId,
    ['/bin/sh', '-lc', printCommand(provider)],
    env,
    CHAT_TIMEOUT_MS,
  );
  const reply = stripAnsi(raw).trim() || '(no output)';
  return append(workspaceId, 'assistant', reply, provider);
}
