import { createHash, randomBytes } from 'node:crypto';
// Per-instance guard only. Add a Vercel Firewall rate-limit rule before a public launch.
const salt = randomBytes(16).toString('hex');
export class RateLimiter {
  entries = new Map<string, { count: number; reset: number }>();
  take(address: string, now = Date.now()) {
    const key = createHash('sha256').update(salt + address).digest('hex');
    for (const [id, value] of this.entries) if (value.reset <= now) this.entries.delete(id);
    const value = this.entries.get(key);
    if (value && value.count >= 10) return false;
    if (!value && this.entries.size >= 5000) return false;
    this.entries.set(key, { count: (value?.count || 0) + 1, reset: value?.reset || now + 60000 });
    return true;
  }
}
