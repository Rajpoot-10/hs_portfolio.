import { providerFailureHint } from '../server/diagnostics.ts';
import { readFile } from 'node:fs/promises';
import { chunkKnowledge, staleIds } from '../server/chunking.ts';
import { ID_PREFIX } from '../server/config.ts';
import { getProviders } from '../server/providers.ts';
import { loadEnvironment } from './env.ts';
loadEnvironment();
let stage = 'reading and validating the knowledge file';
async function ingest() {
  const document = await readFile(new URL('../knowledge/hassam_ali_portfolio_rag_knowledge_base.txt', import.meta.url), 'utf8');
  const chunks = chunkKnowledge(document);
  if (process.argv.includes('--dry-run')) {
    console.table(chunks.map(({ metadata }) => ({ type: metadata.type, title: metadata.title, characters: metadata.text.length })));
    console.info(chunks.length + ' chunks validated; no external calls made.');
    return;
  }
  stage = 'checking server environment variables';
  const { index, config, checkIndex, embed } = getProviders();
  stage = 'checking Pinecone index access, readiness, metric and dimensions';
  await checkIndex(); // Create the dedicated cosine index once in Pinecone, not during chat requests.
  stage = 'listing existing Pinecone vectors';
  const existing: string[] = [];
  let paginationToken: string | undefined;
  do {
    const page = await index.listPaginated({ prefix: ID_PREFIX, limit: 100, paginationToken });
    existing.push(...(page.vectors || []).flatMap(vector => vector.id ? [vector.id] : []));
    paginationToken = page.pagination?.next;
  } while (paginationToken);
  const records = [];
  // Finish ALL embeddings before changing stored vectors. No deletion on embedding failures.
  for (const chunk of chunks) {
    stage = 'embedding knowledge chunks with Gemini';
    const values = await embed(chunk.metadata.text, 'document', 'Hassam Ali ? ' + chunk.metadata.section + ' ? ' + chunk.metadata.title, AbortSignal.timeout(30000));
    records.push({ id: chunk.id, values, metadata: { ...chunk.metadata,
      embeddingModel: config.embeddingModel, embeddingDimension: config.dimension } });
    console.info('Embedded: ' + chunk.metadata.title);
  }
  stage = 'upserting vectors to Pinecone';
  for (let offset = 0; offset < records.length; offset += 50) await index.upsert({ records: records.slice(offset, offset + 50) });
  stage = 'removing stale source vectors';
  const stale = staleIds(existing, chunks);
  for (let offset = 0; offset < stale.length; offset += 100) await index.deleteMany({ ids: stale.slice(offset, offset + 100) });
  console.info('Ingested ' + records.length + ' chunks; removed ' + stale.length + ' stale source vectors. Namespace: ' + config.namespace + '. Pinecone is eventually consistent; allow a short delay before evaluation.');
}
ingest().catch((error: unknown) => {
  if (error instanceof Error && /^Missing server configuration: (GEMINI_API_KEY|PINECONE_API_KEY|PINECONE_INDEX_NAME)$/.test(error.message)) console.error(error.message);
  console.error(providerFailureHint(error));
  console.error('Ingestion failed while ' + stage + '. Check the knowledge file, server environment, model access, and a ready cosine Pinecone index with the configured dimension. Run ingest:check to validate the document. Provider errors are withheld to avoid leaking credentials.');
  process.exitCode = 1;
});
