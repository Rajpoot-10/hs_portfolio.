export function getConfig() {
  const required = (key: string) => {
    const value = process.env[key]?.trim();
    if (!value || /^(your_|replace_)/i.test(value)) throw new Error('Missing server configuration: ' + key);
    return value;
  };
  const dimension = Number(process.env.GEMINI_EMBEDDING_DIMENSION || 768);
  if (![768, 1536, 3072].includes(dimension)) throw new Error('Use an embedding dimension of 768, 1536, or 3072.');
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
  if (!['gemini-embedding-2', 'gemini-embedding-001'].includes(embeddingModel)) throw new Error('Unsupported embedding model; update the embedding adapter before changing model families.');
  const topK = Number(process.env.RAG_TOP_K || 5);
  if (!Number.isInteger(topK) || topK < 3 || topK > 5) throw new Error('RAG_TOP_K must be 3–5.');
  const rawScore = process.env.RAG_MIN_SCORE;
  const minScore = rawScore ? Number(rawScore) : undefined;
  if (minScore !== undefined && (!Number.isFinite(minScore) || minScore < -1 || minScore > 1)) throw new Error('RAG_MIN_SCORE must be a cosine score.');
  return {
    geminiKey: required('GEMINI_API_KEY'), pineconeKey: required('PINECONE_API_KEY'),
    indexName: required('PINECONE_INDEX_NAME'), namespace: process.env.PINECONE_NAMESPACE || 'portfolio',
    generationModel: process.env.GEMINI_GENERATION_MODEL || 'gemini-3.5-flash-lite',
    embeddingModel, dimension, topK, minScore,
  };
}
export type Config = ReturnType<typeof getConfig>;
export const SOURCE = 'hassam-portfolio';
export const ID_PREFIX = SOURCE + ':';
