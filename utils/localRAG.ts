/**
 * Modul Local RAG (Retrieval-Augmented Generation) menggunakan Transformers.js
 * 100% berjalan di Browser secara lokal!
 */

export interface DocumentChunk {
  text: string;
  embedding: number[];
}

let pipelineInstance: any = null;
let currentDocumentChunks: DocumentChunk[] = [];
let currentDocumentName: string = "";

// Rumus Matematika: Cosine Similarity (Mencari kemiripan antara 2 kalimat)
function cosineSimilarity(vecA: number[], vecB: number[]) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  if (vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Memotong teks panjang menjadi potongan (chunk) per ~1000 karakter
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

// Inisialisasi Model AI di Browser
export const initRAG = async () => {
  if (!pipelineInstance) {
    // Dynamic import untuk menghindari SSR error di Next.js
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false; // Memaksa ambil dari web/cache, bukan harddisk server
    
    console.log("[LocalRAG] Memuat model embedding: Xenova/all-MiniLM-L6-v2...");
    pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log("[LocalRAG] Model berhasil dimuat ke memori browser!");
  }
  return pipelineInstance;
}

// Fungsi untuk membaca dan mengubah dokumen menjadi Vektor
export const processDocumentRAG = async (
  text: string,
  fileName: string,
  onProgress?: (msg: string) => void,
  signal?: AbortSignal
) => {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  // Jika dokumen yang sama sudah diproses, lewati agar hemat waktu
  if (currentDocumentName === fileName && currentDocumentChunks.length > 0) {
    return; 
  }

  onProgress?.("Menyiapkan model AI Lokal (Bisa memakan waktu saat pertama kali)...");
  const extractor = await initRAG();

  onProgress?.("Memotong dokumen dan menganalisis makna...");
  const textChunks = chunkText(text);
  currentDocumentChunks = [];

  let processed = 0;
  for (const chunk of textChunks) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    // Ubah teks menjadi deretan angka (vektor 384 dimensi)
    const output = await extractor(chunk, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data) as number[];
    
    currentDocumentChunks.push({ text: chunk, embedding });
    processed++;
    if (processed % 5 === 0 || processed === textChunks.length) {
      onProgress?.(`Menganalisis dokumen: ${processed}/${textChunks.length} bagian...`);
    }
  }

  currentDocumentName = fileName;
  onProgress?.("Dokumen siap ditanyakan!");
}

// Fungsi untuk mencari potongan dokumen yang paling cocok dengan pertanyaan
export const searchRelevantChunks = async (
  query: string,
  topK: number = 3,
  signal?: AbortSignal
): Promise<string> => {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (!Array.isArray(currentDocumentChunks) || currentDocumentChunks.length === 0) return "";

  const extractor = await initRAG();
  
  // Ubah pertanyaan pengguna menjadi vektor juga
  const output = await extractor(query, { pooling: 'mean', normalize: true });
  const queryEmbedding = Array.from(output.data) as number[];

  // Hitung skor kemiripan (0 sampai 1)
  const scoredChunks = currentDocumentChunks.map(chunk => ({
    text: chunk.text,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  // Urutkan dari yang skornya paling tinggi (paling relevan)
  scoredChunks.sort((a, b) => b.score - a.score);

  // Ambil beberapa hasil teratas saja (topK)
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const topChunks = scoredChunks.slice(0, topK);

  // Gabungkan teksnya
  return topChunks.map((c, i) => `[Potongan Dokumen Relevan ${i+1}]:\n${c.text}`).join('\n\n');
}