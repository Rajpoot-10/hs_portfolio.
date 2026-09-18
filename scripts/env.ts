import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
export function loadEnvironment() {
  // Existing process/Vercel values win; local overrides take precedence over .env.
  if (existsSync('.env.local')) loadEnvFile('.env.local');
  if (existsSync('.env')) loadEnvFile('.env');
}
