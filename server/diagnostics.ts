// Operator-facing hints only. Never include exception messages, URLs, headers, or keys.
export function providerFailureHint(error: unknown): string {
  const chain: Record<string, unknown>[] = [];
  let current = error;
  for (let i = 0; i < 6 && current && typeof current === 'object'; i++) {
    const item = current as Record<string, unknown>;
    chain.push(item);
    current = item.cause;
  }
  const names = chain.map(item => item.name);
  const codes = chain.map(item => item.code);
  if (codes.some(code => ['UND_ERR_CONNECT_TIMEOUT', 'ETIMEDOUT', 'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH'].includes(String(code))))
    return 'The provider endpoint could not be reached. Check internet connectivity and retry from a connection that can reach the service.';
  if (codes.some(code => ['ENOTFOUND', 'EAI_AGAIN'].includes(String(code))))
    return 'The provider hostname could not be resolved. Check DNS and internet connectivity.';
  if (names.includes('PineconeAuthorizationError') || chain.some(item => [401, 403].includes(Number(item.status))))
    return 'The provider rejected access. Check the server API key and its permissions.';
  if (names.includes('PineconeNotFoundError') || chain.some(item => Number(item.status) === 404))
    return 'The requested index, namespace, or model was not found. Check its name and availability.';
  if (names.includes('PineconePaymentRequiredError') || chain.some(item => [402, 429].includes(Number(item.status))))
    return 'The provider reported a quota, billing, or rate limit. Check the provider dashboard before retrying.';
  if (names.some(name => ['TimeoutError', 'AbortError', 'PineconeTimeoutError', 'PineconeConnectionError'].includes(String(name))))
    return 'The provider connection failed or timed out. Check service connectivity and status, then retry.';
  return 'Check the server configuration, provider access, and service status. Detailed provider errors are withheld to protect credentials.';
}
