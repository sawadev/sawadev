import { createApp } from './app';

const PORT = Number(Bun.env.PORT ?? 8787);

const server = Bun.serve({
  port: PORT,
  fetch: createApp().fetch,
});

console.log(`orchestrator listening on http://localhost:${server.port}`);
