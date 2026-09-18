import { createServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import handler from '../api/chat.ts';
import { loadEnvironment } from './env.ts';
loadEnvironment();
const api = createServer((req, res) => {
  if (req.url?.split('?')[0] !== '/api/chat') { res.statusCode = 404; res.end(); return; }
  void handler(req, res);
});
api.requestTimeout = 45000;
api.headersTimeout = 10000;
api.on('error', () => { console.error('Could not start the local API on 127.0.0.1:3001. Check whether the port is already in use.'); process.exit(1); });
api.listen(3001, '127.0.0.1');
const vite = await createViteServer({ server: { host: '127.0.0.1' } });
await vite.listen();
vite.printUrls();
console.info('Local /api/chat is available through the Vite proxy.');
const close = async () => { api.close(); await vite.close(); process.exit(0); };
process.on('SIGINT', close);
process.on('SIGTERM', close);
