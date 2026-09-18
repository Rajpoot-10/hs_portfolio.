import type { IncomingMessage, ServerResponse } from 'node:http';
import { RequestError, UNAVAILABLE, validateInput } from '../server/contracts.ts';
import { providerFailureHint } from '../server/diagnostics.ts';
import { answerQuestion } from '../server/rag.ts';
import { RateLimiter } from '../server/rate-limit.ts';
export const config = { maxDuration: 60 };
async function readBody(req: IncomingMessage & { body?: unknown }) {
  if (Number(req.headers['content-length'] || 0) > 24000) throw new RequestError(413, 'Request is too large.');
  if (req.body !== undefined) {
    if (Buffer.byteLength(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) > 24000) throw new RequestError(413, 'Request is too large.');
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const part of req) {
    const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part);
    bytes += chunk.length;
    if (bytes > 24000) throw new RequestError(413, 'Request is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function createChatHandler(answer = answerQuestion, timeoutMs = 40000) {
  const limiter = new RateLimiter();
  let active = 0;
  return async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status: number, data: object) => { if (!res.destroyed && !res.writableEnded) { res.statusCode = status; res.end(JSON.stringify(data)); } };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); send(405, { success: false, error: 'Use POST.' }); return; }
    if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') { send(415, { success: false, error: 'Send application/json.' }); return; }
    if (req.headers['sec-fetch-site'] === 'cross-site') { send(403, { success: false, error: 'Cross-site requests are not allowed.' }); return; }
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) { send(403, { success: false, error: 'Cross-site requests are not allowed.' }); return; }
      } catch { send(403, { success: false, error: 'Invalid origin.' }); return; }
    }
    // Trust only the platform-overwritten Vercel header on Vercel; never arbitrary forwarded IPs locally.
    const platformIp = process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] : undefined;
    const address = (typeof platformIp === 'string' ? platformIp.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
    if (!limiter.take(address)) { res.setHeader('Retry-After', '60'); send(429, { success: false, error: 'Too many questions. Please try again in a minute.' }); return; }
    if (active >= 8) { res.setHeader('Retry-After', '10'); send(503, { success: false, error: UNAVAILABLE }); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
    const disconnected = () => { if (!res.writableEnded) controller.abort(new Error('disconnected')); };
    res.on('close', disconnected);
    active++;
    try {
      const abort = new Promise<never>((_, reject) => {
        if (controller.signal.aborted) reject(new RequestError(504, UNAVAILABLE));
        else controller.signal.addEventListener('abort', () => reject(new RequestError(504, UNAVAILABLE)), { once: true });
      });
      const result = await Promise.race([(async () => { const input = validateInput(await readBody(req)); controller.signal.throwIfAborted(); return answer(input, controller.signal); })(), abort]);
      send(200, { success: true, answer: result });
    } catch (error) {
      const status = error instanceof RequestError ? error.status : error instanceof SyntaxError ? 400 : 503;
      const message = error instanceof RequestError ? error.message : error instanceof SyntaxError ? 'Invalid JSON.' : UNAVAILABLE;
      if (status >= 500) console.error('[chat provider]', providerFailureHint(error));
      send(status, { success: false, error: message });
    } finally { active--; clearTimeout(timer); res.off('close', disconnected); }
  }

}
export default createChatHandler();
