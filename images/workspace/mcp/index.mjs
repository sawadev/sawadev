#!/usr/bin/env node
/**
 * Serveur MCP stdio de sawadev. Donne aux agents CLI (Claude Code, Cursor, Codex)
 * les mêmes capacités managées que l'utilisateur dans son workspace, en relayant
 * vers l'API orchestrateur `/mcp-api` (auth = token du workspace).
 *
 * Configuration par variables d'environnement (injectées par l'orchestrateur au
 * lancement de l'agent) :
 *   SAWA_MCP_URL    base de l'orchestrateur joignable depuis le conteneur
 *   SAWA_MCP_TOKEN  token de capacité du workspace (Bearer)
 *
 * Surface volontairement **non destructive** (aucun delete/stop/remove).
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const BASE = (process.env.SAWA_MCP_URL || '').replace(/\/$/, '');
const TOKEN = process.env.SAWA_MCP_TOKEN || '';

const STR = { type: 'string' };
const tool = (name, description, properties = {}, required = []) => ({
  name,
  description,
  inputSchema: { type: 'object', properties, required },
});

/** Catalogue des outils exposés à l'agent. */
const TOOLS = [
  tool('sawadev_workspace_info', 'Get the current workspace (id, name, status).'),
  // Quick Actions
  tool('sawadev_actions_list', 'List saved quick actions (shell command shortcuts).'),
  tool(
    'sawadev_action_create',
    'Create a quick action (a named shell command runnable in the workspace).',
    { label: STR, command: STR },
    ['label', 'command'],
  ),
  tool('sawadev_action_run', 'Run a quick action by id. Returns a runId to poll.', { id: STR }, [
    'id',
  ]),
  tool(
    'sawadev_action_run_output',
    'Get the status and output of an action run by runId.',
    { runId: STR },
    ['runId'],
  ),
  // Services (managed Docker tools)
  tool('sawadev_services_catalog', 'List available managed services (postgres, redis, mongo…).'),
  tool('sawadev_services_list', 'List services currently attached to the workspace.'),
  tool('sawadev_service_add', 'Add a managed service to the workspace by type.', { type: STR }, [
    'type',
  ]),
  tool('sawadev_service_start', 'Start a service by id.', { id: STR }, ['id']),
  tool('sawadev_service_logs', 'Get a service logs by id.', { id: STR }, ['id']),
  // Ports / preview
  tool('sawadev_ports_list', 'List exposed ports and their preview URLs.'),
  tool(
    'sawadev_port_expose',
    'Expose a workspace port and get a public preview URL.',
    { port: { type: 'number' } },
    ['port'],
  ),
  // Git
  tool('sawadev_git_status', 'Get git status (branch, staged/unstaged/untracked).'),
  tool('sawadev_git_branches', 'List git branches.'),
  tool('sawadev_git_log', 'Get recent git commits.'),
  tool('sawadev_git_diff', 'Get a git diff (optionally for a path / staged).', {
    path: STR,
    staged: { type: 'boolean' },
  }),
  tool('sawadev_git_stage', 'Stage a path (or everything if omitted).', { path: STR }),
  tool('sawadev_git_unstage', 'Unstage a path (or everything if omitted).', { path: STR }),
  tool('sawadev_git_commit', 'Commit staged changes with a message.', { message: STR }, [
    'message',
  ]),
  tool('sawadev_git_checkout', 'Checkout a branch.', { branch: STR }, ['branch']),
  tool('sawadev_git_init', 'Initialize a git repository in the workspace.'),
];

/** Construit (méthode, chemin, corps) d'un appel `/mcp-api` à partir des arguments. */
const ROUTE = {
  sawadev_workspace_info: () => ['GET', '/workspace'],
  sawadev_actions_list: () => ['GET', '/actions'],
  sawadev_action_create: (a) => ['POST', '/actions', { label: a.label, command: a.command }],
  sawadev_action_run: (a) => ['POST', `/actions/${encodeURIComponent(a.id)}/run`],
  sawadev_action_run_output: (a) => ['GET', `/runs/${encodeURIComponent(a.runId)}`],
  sawadev_services_catalog: () => ['GET', '/catalog'],
  sawadev_services_list: () => ['GET', '/tools'],
  sawadev_service_add: (a) => ['POST', '/tools', { type: a.type }],
  sawadev_service_start: (a) => ['POST', `/tools/${encodeURIComponent(a.id)}/start`],
  sawadev_service_logs: (a) => ['GET', `/tools/${encodeURIComponent(a.id)}/logs`],
  sawadev_ports_list: () => ['GET', '/ports'],
  sawadev_port_expose: (a) => ['POST', '/ports', { port: a.port }],
  sawadev_git_status: () => ['GET', '/git/status'],
  sawadev_git_branches: () => ['GET', '/git/branches'],
  sawadev_git_log: () => ['GET', '/git/log'],
  sawadev_git_diff: (a) => [
    'GET',
    `/git/diff?path=${encodeURIComponent(a.path || '')}&staged=${a.staged ? '1' : '0'}`,
  ],
  sawadev_git_stage: (a) => ['POST', '/git/stage', a.path ? { path: a.path } : {}],
  sawadev_git_unstage: (a) => ['POST', '/git/unstage', a.path ? { path: a.path } : {}],
  sawadev_git_commit: (a) => ['POST', '/git/commit', { message: a.message }],
  sawadev_git_checkout: (a) => ['POST', '/git/checkout', { branch: a.branch }],
  sawadev_git_init: () => ['POST', '/git/init'],
};

async function callApi(method, path, body) {
  if (!BASE || !TOKEN) {
    throw new Error('sawadev MCP not configured (SAWA_MCP_URL / SAWA_MCP_TOKEN missing).');
  }
  const res = await fetch(`${BASE}/mcp-api${path}`, {
    method,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  return text;
}

const server = new Server({ name: 'sawadev', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  const build = ROUTE[name];
  if (!build) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
  try {
    const [method, path, body] = build(args);
    const out = await callApi(method, path, body);
    return { content: [{ type: 'text', text: out }] };
  } catch (err) {
    return { content: [{ type: 'text', text: String(err?.message || err) }], isError: true };
  }
});

await server.connect(new StdioServerTransport());
