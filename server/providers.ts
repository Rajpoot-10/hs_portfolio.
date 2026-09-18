import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { getConfig, SOURCE } from './config.ts';
import type { Config } from './config.ts';
let cached: ReturnType<typeof createProviders> | undefined;
export function createProviders(config: Config) {
  const google = new GoogleGenAI({ apiKey: config.geminiKey, httpOptions: { timeout: 25000 } });
  const pinecone = new Pinecone({ apiKey: config.pineconeKey, maxRetries: 1,
    fetchApi: (input, init) => fetch(input, { ...init, signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) }) });
  const index = pinecone.index({ name: config.indexName, namespace: config.namespace });
  let checked: Promise<void> | undefined;
  function checkIndex() {
    checked ??= pinecone.describeIndex(config.indexName).then(info => {
      if (info.dimension !== config.dimension || info.metric !== 'cosine')
        throw new Error('Pinecone index must use cosine and the configured embedding dimension.');
      if (!info.status?.ready) throw new Error('Pinecone index is not ready.');
    }).catch(error => { checked = undefined; throw error; });
    return checked;
  }
  async function embed(text: string, kind: 'query' | 'document', title = 'none', signal?: AbortSignal) {
    const modern = config.embeddingModel === 'gemini-embedding-2';
    const contents = modern ? (kind === 'query' ? 'task: question answering | query: ' + text : 'title: ' + title + ' | text: ' + text) : text;
    const result = await google.models.embedContent({ model: config.embeddingModel, contents,
      config: { outputDimensionality: config.dimension, abortSignal: signal,
        ...(!modern ? { taskType: kind === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT', ...(kind === 'document' ? { title } : {}) } : {}) } });
    const vector = result.embeddings?.[0]?.values;
    if (!vector || vector.length !== config.dimension || vector.some(value => !Number.isFinite(value))) throw new Error('Invalid embedding dimensions or values.');
    const norm = Math.hypot(...vector);
    if (!norm) throw new Error('Empty embedding.');
    return vector.map(value => value / norm);
  }
  async function retrieve(query: string, signal: AbortSignal, types?: string[]) {
    await checkIndex();
    const vector = await embed(query, 'query', undefined, signal);
    signal.throwIfAborted();
    const response = await index.query({ vector, topK: config.topK, includeMetadata: true,
      filter: { source: { $eq: SOURCE }, embeddingModel: { $eq: config.embeddingModel }, embeddingDimension: { $eq: config.dimension }, ...(types ? { type: { $in: types } } : {}) } });
    signal.throwIfAborted();
    return (response.matches || []).flatMap(match => {
      const data = match.metadata;
      if (!data || typeof data.text !== 'string' || typeof data.title !== 'string' || typeof data.section !== 'string' || !Number.isFinite(match.score)) return [];
      if (config.minScore !== undefined && match.score! < config.minScore) return [];
      return [{ id: match.id, title: data.title, section: data.section, text: data.text.slice(0, 8000), score: match.score! }];
    });
  }
  return { config, google, pinecone, index, checkIndex, embed, retrieve };
}
export function getProviders() { return cached ??= createProviders(getConfig()); }
