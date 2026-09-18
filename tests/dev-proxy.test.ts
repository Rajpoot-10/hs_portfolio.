import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createServer as createViteServer } from 'vite';
import viteConfig from '../vite.config.ts';
import { createChatHandler } from '../api/chat.ts';
test('the configured dev proxy preserves same-origin browser requests and rejects foreign origins', async () => {
  const handler = createChatHandler(async () => 'A grounded test answer.');
  const api = createServer((req, res) => { void handler(req, res); });
  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  const configuredProxy = viteConfig.server?.proxy?.['/api'];
  assert.ok(configuredProxy && typeof configuredProxy === 'object');
  const vite = await createViteServer({ configFile: false, logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0, proxy: { '/api': {
      ...configuredProxy, target: 'http://127.0.0.1:' + (api.address() as AddressInfo).port,
    } } } });
  try {
    await vite.listen();
    const origin = 'http://127.0.0.1:' + (vite.httpServer!.address() as AddressInfo).port;
    const post = (from: string) => ({ method: 'POST', headers: {
      'Content-Type': 'application/json', Origin: from, 'Sec-Fetch-Site': 'same-origin',
    }, body: JSON.stringify({ message: 'Portfolio skills?' }) });
    const response = await fetch(origin + '/api/chat', post(origin));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, answer: 'A grounded test answer.' });
    assert.equal((await fetch(origin + '/api/chat', post('https://unrelated.example'))).status, 403);
  } finally {
    await vite.close();
    api.closeAllConnections();
    await new Promise<void>(resolve => api.close(() => resolve()));
  }
});
