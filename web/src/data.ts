import type { CodeLine, Msg, Port, TreeNode, Workspace } from './types';

export const TOPPAD = 50; // clear the status bar / dynamic island
export const BOTPAD = 22; // clear the home indicator

export const WS: Workspace[] = [
  { id: 'storefront-api', stack: 'Node', icon: 'cpu', on: true, last: '2m ago', res: '2 vCPU · 4 GB', branch: 'main' },
  { id: 'marketing-site', stack: 'Next.js', icon: 'layers', on: true, last: '1h ago', res: '1 vCPU · 2 GB', branch: 'redesign' },
  { id: 'ml-pipeline', stack: 'Python', icon: 'bolt', on: false, last: 'yesterday', res: '4 vCPU · 8 GB', branch: 'main' },
];

export const PORTS: Port[] = [
  { name: 'storefront', port: 3000, on: true },
  { name: 'api-docs', port: 8080, on: true },
  { name: 'storybook', port: 6006, on: false },
];

export const SUGGESTIONS: string[] = [
  'Add rate limiting to the API',
  'Write tests for the cart service',
  'Fix the failing CI build',
];

/** Conversation seeded in the AI pane. */
export const SEED_MSGS: Msg[] = [
  { role: 'user', text: 'Add JWT auth middleware and protect the /orders routes' },
  { role: 'agent', text: "I'll add a middleware that verifies the bearer token, then apply it to the orders router." },
  { role: 'tool', kind: 'cmd', icon: 'terminal', title: 'Ran command', meta: 'npm i jsonwebtoken', body: 'out' },
  { role: 'tool', kind: 'edit', icon: 'diff', title: 'Edited', meta: 'auth/middleware.ts', body: 'diff', approve: true },
  { role: 'agent', text: 'Done — the orders routes now reject requests without a valid token. 14 tests pass.' },
];

export const ACCENTS: { name: string; hex: string }[] = [
  { name: 'Violet', hex: '#7C5CF6' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#1F9D5E' },
  { name: 'Amber', hex: '#E0922E' },
];

/** Sample file: auth/middleware.ts (with AI-added lines). */
export const FILE_MIDDLEWARE: CodeLine[] = [
  { t: [['kw', 'import'], ['var', ' jwt '], ['kw', 'from'], ['str', " 'jsonwebtoken'"]] },
  {
    t: [['kw', 'import'], ['p', ' { '], ['var', 'Request, Response, NextFunction'], ['p', ' } '], ['kw', 'from'], ['str', " 'express'"]],
  },
  { gap: true },
  {
    t: [['kw', 'export function'], ['fn', ' requireAuth'], ['p', '('], ['var', 'req'], ['p', ': '], ['type', 'Request'], ['p', ', '], ['var', 'res'], ['p', ': '], ['type', 'Response'], ['p', ', '], ['var', 'next'], ['p', ') {']],
  },
  { ind: 1, t: [['kw', 'const'], ['var', ' header '], ['p', '= '], ['var', 'req'], ['p', '.'], ['var', 'headers'], ['p', '.'], ['var', 'authorization']] },
  { ind: 1, add: true, t: [['kw', 'if'], ['p', ' (!'], ['var', 'header'], ['p', '?.'], ['fn', 'startsWith'], ['p', '('], ['str', "'Bearer '"], ['p', ')) {']] },
  { ind: 2, add: true, t: [['kw', 'return'], ['var', ' res'], ['p', '.'], ['fn', 'status'], ['p', '('], ['num', '401'], ['p', ').'], ['fn', 'json'], ['p', '({ '], ['var', 'error'], ['p', ': '], ['str', "'unauthorized'"], ['p', ' })']] },
  { ind: 1, add: true, t: [['p', '}']] },
  { ind: 1, t: [['kw', 'const'], ['var', ' token '], ['p', '= '], ['var', 'header'], ['p', '.'], ['fn', 'slice'], ['p', '('], ['num', '7'], ['p', ')']] },
  { ind: 1, t: [['kw', 'const'], ['var', ' payload '], ['p', '= '], ['var', 'jwt'], ['p', '.'], ['fn', 'verify'], ['p', '('], ['var', 'token'], ['p', ', '], ['var', 'env'], ['p', '.'], ['var', 'SECRET'], ['p', ')']] },
  { ind: 1, t: [['p', '('], ['var', 'req'], ['kw', ' as any'], ['p', ').'], ['var', 'user'], ['p', ' = '], ['var', 'payload']] },
  { ind: 1, t: [['fn', 'next'], ['p', '()']] },
  { t: [['p', '}']] },
];

/** Diff body shown in the mobile AI tool card. */
export const DIFF_BODY: CodeLine[] = [
  { t: [['var', 'const token = header']] },
  { del: true, t: [['var', 'verify(token)']] },
  { add: true, t: [['kw', 'if'], ['p', ' (!header) '], ['kw', 'return'], ['var', ' res'], ['p', '.'], ['fn', 'status'], ['p', '('], ['num', '401'], ['p', ')']] },
  { add: true, t: [['kw', 'const'], ['var', ' payload = jwt'], ['p', '.'], ['fn', 'verify'], ['p', '('], ['var', 'token'], ['p', ')']] },
];

export const TREE: TreeNode[] = [
  { d: 0, ic: 'folder', n: 'src', open: true },
  { d: 1, ic: 'folder', n: 'auth', open: true },
  { d: 2, ic: 'file', n: 'middleware.ts', cur: true, badge: 'M' },
  { d: 2, ic: 'file', n: 'tokens.ts' },
  { d: 1, ic: 'folder', n: 'routes' },
  { d: 1, ic: 'file', n: 'server.ts' },
  { d: 1, ic: 'file', n: 'db.ts' },
  { d: 0, ic: 'folder', n: 'tests' },
  { d: 0, ic: 'file', n: 'package.json' },
  { d: 0, ic: 'file', n: 'Dockerfile' },
  { d: 0, ic: 'file', n: '.env' },
  { d: 0, ic: 'file', n: 'README.md' },
];

export interface AgentStep {
  delay: number;
  msg: Msg;
}

/** The simulated agent run triggered when the user sends a prompt. */
export function buildAgentRun(_prompt: string): AgentStep[] {
  return [
    { delay: 600, msg: { role: 'agent', text: "Got it — I'll plan the change, edit the relevant files, then run the tests." } },
    { delay: 1100, msg: { role: 'tool', kind: 'cmd', icon: 'search', title: 'Read', meta: '3 files', body: 'out' } },
    { delay: 1300, msg: { role: 'tool', kind: 'edit', icon: 'diff', title: 'Edited', meta: 'src/server.ts', body: 'diff', approve: true } },
    { delay: 1200, msg: { role: 'tool', kind: 'cmd', icon: 'terminal', title: 'Ran command', meta: 'npm test', body: 'out' } },
    { delay: 900, msg: { role: 'agent', muted: true, text: 'All green — 18 tests passing. Want me to open a pull request?' } },
  ];
}
