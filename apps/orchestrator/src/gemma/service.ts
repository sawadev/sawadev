import type { AgentMessage } from '@sawadev/shared';
import { getConfig } from '../config';
import { MANAGED_LABEL, ensureNetwork, getDocker } from '../workspaces/docker';
import { ensureImage } from '../workspaces/service';

/**
 * Conteneur **partagé** servant un petit modèle Gemma via Ollama (API OpenAI-compatible).
 * Singleton (label `sawadev.role=gemma`), **démarrage paresseux** à la 1re utilisation,
 * modèle persisté dans un volume nommé. Aucun secret, aucune clé.
 */
const OLLAMA_IMAGE = 'ollama/ollama';
const CONTAINER = 'sawadev-gemma';
const ROLE_LABEL = 'sawadev.role';
const VOLUME = 'sawadev-gemma-models';
/** Le 1er pull d'un modèle peut être long ; on laisse large. */
const LONG_TIMEOUT_MS = 15 * 60 * 1000;

let ready: Promise<void> | null = null;

/** Provisionne (idempotent + dédupliqué) le conteneur Gemma + le modèle. */
export function ensureGemma(): Promise<void> {
  if (!ready) {
    ready = provision().catch((err) => {
      ready = null; // permet un nouvel essai au prochain message
      throw err;
    });
  }
  return ready;
}

async function findContainer() {
  const list = await getDocker().listContainers({
    all: true,
    filters: { label: [`${ROLE_LABEL}=gemma`] },
  });
  const info = list[0];
  return info ? getDocker().getContainer(info.Id) : null;
}

async function provision(): Promise<void> {
  const { dockerNetwork, domain } = getConfig();
  await ensureNetwork();

  let container = await findContainer();
  if (!container) {
    await ensureImage(OLLAMA_IMAGE);
    const publish = domain === 'localhost'; // dev : orchestrateur sur l'hôte
    container = await getDocker().createContainer({
      Image: OLLAMA_IMAGE,
      name: CONTAINER,
      Labels: { [MANAGED_LABEL]: 'true', [ROLE_LABEL]: 'gemma' },
      ...(publish ? { ExposedPorts: { '11434/tcp': {} } } : {}),
      HostConfig: {
        NetworkMode: dockerNetwork,
        RestartPolicy: { Name: 'unless-stopped' },
        Binds: [`${VOLUME}:/root/.ollama`],
        ...(publish ? { PortBindings: { '11434/tcp': [{ HostPort: '11434' }] } } : {}),
      },
    });
  }

  const info = await container.inspect();
  if (!info.State.Running) await container.start();

  await waitForOllama();
  await ensureModel();
}

async function waitForOllama(): Promise<void> {
  const { gemmaUrl } = getConfig();
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${gemmaUrl}/api/version`)).ok) return;
    } catch {
      // pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('gemma (ollama) did not become ready');
}

async function ensureModel(): Promise<void> {
  const { gemmaUrl, gemmaModel } = getConfig();
  const tags = (await fetch(`${gemmaUrl}/api/tags`)
    .then((r) => r.json())
    .catch(() => ({ models: [] }))) as { models?: { name: string }[] };
  if ((tags.models ?? []).some((m) => m.name === gemmaModel)) return;
  const res = await fetch(`${gemmaUrl}/api/pull`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: gemmaModel, stream: false }),
    signal: AbortSignal.timeout(LONG_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`gemma model pull failed: HTTP ${res.status}`);
}

export interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Messages OpenAI (system + historique récent + nouveau prompt). Pur (testable). */
export function buildMessages(history: AgentMessage[], prompt: string): ChatMsg[] {
  const msgs: ChatMsg[] = [
    {
      role: 'system',
      content:
        'You are a helpful coding assistant running locally inside a developer workspace. Be concise and use Markdown.',
    },
  ];
  for (const m of history.slice(-10)) {
    msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
  }
  msgs.push({ role: 'user', content: prompt });
  return msgs;
}

/** Appelle l'API OpenAI-compatible d'Ollama et renvoie le texte de réponse. */
export async function gemmaChat(messages: ChatMsg[]): Promise<string> {
  const { gemmaUrl, gemmaModel } = getConfig();
  const res = await fetch(`${gemmaUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: gemmaModel, messages, stream: false }),
    signal: AbortSignal.timeout(LONG_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`gemma chat failed: HTTP ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}
