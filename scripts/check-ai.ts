import { loadEnvironment } from './env.ts';
import { getProviders } from '../server/providers.ts';
import { providerFailureHint } from '../server/diagnostics.ts';
loadEnvironment();
async function main() {
  const providers = getProviders();
  const checks: [string, () => Promise<string>][] = [
    ['Pinecone index configuration', async () => {
      await providers.checkIndex();
      return providers.config.dimension + ' dimensions, cosine, ready';
    }],
    ['Pinecone vector service', async () => {
      const stats = await providers.index.describeIndexStats();
      const count = stats.namespaces?.[providers.config.namespace]?.recordCount || 0;
      return count + ' vectors in the configured namespace';
    }],
    ['Gemini embeddings', async () => {
      const vector = await providers.embed('Portfolio connection check', 'query', undefined, AbortSignal.timeout(30000));
      return providers.config.embeddingModel + ', ' + vector.length + ' dimensions';
    }],
    ['Gemini generation', async () => {
      const result = await providers.google.models.generateContent({
        model: providers.config.generationModel, contents: 'Reply with OK.',
        config: { maxOutputTokens: 16, abortSignal: AbortSignal.timeout(30000) },
      });
      if (!result.text?.trim()) throw new Error('No generated text');
      return providers.config.generationModel + ' responded';
    }],
  ];
  await Promise.all(checks.map(async ([label, run]) => {
    try { console.info('PASS — ' + label + ': ' + await run()); }
    catch (error) { console.error('FAIL — ' + label + ': ' + providerFailureHint(error)); process.exitCode = 1; }
  }));
}
main().catch(() => {
  console.error('AI checks could not start. Configure the required server variables in .env.local using .env.example.');
  process.exitCode = 1;
});
