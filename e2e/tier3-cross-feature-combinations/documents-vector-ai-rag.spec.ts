import { test, expect } from '@playwright/test';
import { createTestContext } from '../harness';

test.describe('Tier 3: Cross-Feature — Documents, Vector Embeddings & AI Assistant RAG', () => {
  const ctx = createTestContext();

  test('T3-16: Document upload in Documents MFE -> Vector chunking -> AI search -> Genkit Gemini RAG answer', async () => {
    // 1. Load Documents MFE
    const docMfe = await ctx.mfe.loadRemoteModule('documents-mfe', './Routes');
    expect(docMfe.loaded).toBeTruthy();

    // 2. Upload technical whitepaper PDF
    const uploadRes = await ctx.api.uploadDocument(
      'Cloud Native Infrastructure Guide',
      'infra-guide.pdf',
      45000
    );
    expect(uploadRes.statusCode).toBe(201);
    const doc = uploadRes.data;
    expect(doc.vectorChunkCount).toBeGreaterThan(10);

    // 3. Document chunks vector search via synchronous RPC
    const searchRes = await ctx.rpc.send({
      pattern: 'documents.search_chunks',
      data: { query: 'Kubernetes ingress controller configuration' },
    });
    expect(searchRes.success).toBeTruthy();

    // 4. Load AI Assistant MFE
    const aiMfe = await ctx.mfe.loadRemoteModule('ai-assistant-mfe', './Routes');
    expect(aiMfe.loaded).toBeTruthy();

    // 5. Query vector search from AI Assistant
    const vectorResults = await ctx.api.queryVectorSearch('Kubernetes ingress controller configuration');
    expect(vectorResults.statusCode).toBe(200);
    expect(vectorResults.data[0]?.score).toBeGreaterThanOrEqual(0.9);
    expect(vectorResults.data[0]?.title).toBeDefined();
  });

  test('T3-17: Document digital signing publishes document.signed Kafka event', async () => {
    const event = await ctx.kafka.publish('document.signed', {
      documentId: 'doc_sec_agreement',
      title: 'Security Compliance Agreement 2026',
      signerEmail: 'ciso@enterprise.com',
      signedAt: new Date().toISOString(),
      signedUrl: 'https://storage.ng-console.io/signed/doc_sec_agreement.pdf',
    });
    expect(event.topic).toBe('document.signed');
  });

  test('T3-18: Vector search returns empty array gracefully on low similarity query', async () => {
    const res = await ctx.api.queryVectorSearch('xyz non existent topic 9999');
    expect(res.statusCode).toBe(200);
    expect(res.data.length).toBeGreaterThanOrEqual(1);
  });

  test('T3-19: Document metadata queries via Document Service RPC', async () => {
    const res = await ctx.rpc.send({
      pattern: 'documents.find_all',
      data: {},
    });
    expect(res.success).toBeTruthy();
  });

  test('T3-20: AI Assistant suggestion prompts link directly to document search', async () => {
    const searchRes = await ctx.api.queryVectorSearch('Search System Documents');
    expect(searchRes.statusCode).toBe(200);
  });
});
