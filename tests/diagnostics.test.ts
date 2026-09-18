import test from 'node:test';
import assert from 'node:assert/strict';
import { providerFailureHint } from '../server/diagnostics.ts';
test('operator diagnostics classify nested connection failures without exposing credentials or URLs', () => {
  const error = { name: 'PineconeConnectionError', message: 'https://provider.example?api_key=private-test-key',
    cause: { name: 'FetchError', cause: { name: 'TypeError', cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } } } };
  const hint = providerFailureHint(error);
  assert.match(hint, /could not be reached/);
  assert.doesNotMatch(hint, /private-test-key|https:|provider.example/);
});
test('operator diagnostics keep access, quota and unknown provider errors safe', () => {
  assert.match(providerFailureHint({ status: 403, message: 'secret-token' }), /rejected access/);
  assert.match(providerFailureHint({ status: 429 }), /quota/);
  assert.match(providerFailureHint({ cause: { code: 'ENOTFOUND' } }), /DNS/);
  assert.doesNotMatch(providerFailureHint(new Error('secret-token')), /secret-token/);
});
