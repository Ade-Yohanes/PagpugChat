/**
 * Smart Search Pipeline
 * Flow: Query Rewriting → Auto-decide → SearXNG → RAG + Summarize
 * Semua LLM call via puter.ai (model bisa dikonfigurasi)
 */

import puter from "@heyputer/puter.js";

// ─── Config ────────────────────────────────────────────────────────────────

export interface SmartSearchConfig {
  /**
   * Model puter.ai untuk semua LLM call di pipeline ini.
   * Contoh: "google/gemma-3-27b-it", "meta-llama/llama-3.1-8b-instruct",
   *         "mistralai/mistral-7b-instruct", "gpt-4o-mini"
   * Default: "google/gemma-3-27b-it"
   */
  model?: string;
  /** Jumlah hasil search yang dipakai untuk RAG (default: 5) */
  topK?: number;
  /** Bahasa jawaban LLM (default: "Indonesia") */
  language?: string;
  /** AbortSignal untuk membatalkan pipeline search */
  signal?: AbortSignal;
}

const DEFAULT_CONFIG: Required<SmartSearchConfig> = {
  model: "mixtral/mistral-8x22B-instruct", // gpt-4o-mini terlalu mahal untuk pipeline multi-step
  topK: 5,
  language: "Indonesia",
};

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface SmartSearchResult {
  searchPerformed: boolean;
  rewrittenQuery: string;
  searchDecisionReason: string;
  rawResults: SearchResult[];
  answer: string;
}

export interface SearchDecision {
  needsSearch: boolean;
  reason: string;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function extractText(response: any, fallback = ""): string {
  if (typeof response === "string") return response;
  if (typeof response?.message?.content === "string")
    return response.message.content;
  return fallback;
}

// ─── Step 1: Query Rewriting ─────────────────────────────────────────────

export async function rewriteQuery(
  userQuery: string,
  config: Required<SmartSearchConfig>
): Promise<string> {
  const prompt = `Kamu adalah query optimizer untuk mesin pencari web.

Tugasmu: Ubah query pengguna menjadi query pencarian web yang lebih efektif.

Aturan:
- Tambahkan kata kunci yang relevan
- Perjelas konteks jika ambigu
- Untuk berita/info terkini, tambahkan tahun/bulan/tanggal saat ini 
- Jika query sudah baik, kembalikan apa adanya
- Jawab HANYA dengan query yang sudah diperbaiki, tanpa penjelasan apapun
- Maksimal 10 kata

Query pengguna: "${userQuery}"

Query yang dioptimalkan:`;

  try {
    const response = await puter.ai.chat(prompt, {
      model: config.model,
      stream: false,
      signal: config.signal,
    });
    const raw = extractText(response, userQuery);
    const cleaned = raw.trim().replace(/^["']|["']$/g, "").split("\n")[0].trim();
    console.log(`[SmartSearch] Query rewritten: "${userQuery}" → "${cleaned}"`);
    return cleaned || userQuery;
  } catch (err) {
    console.warn("[SmartSearch] Query rewriting gagal, pakai query asli:", err);
    return userQuery;
  }
}

// ─── Step 2: Auto-decide ─────────────────────────────────────────────────

export async function decideIfSearchNeeded(
  userQuery: string,
  config: Required<SmartSearchConfig>
): Promise<SearchDecision> {
  const prompt = `Kamu adalah router cerdas yang memutuskan apakah suatu pertanyaan perlu pencarian internet.

PERLU SEARCH jika pertanyaan tentang:
- Berita terkini, kejadian hari ini/minggu ini
- Harga, kurs, saham saat ini
- Cuaca, ramalan cuaca
- Jadwal (film, pertandingan, acara)
- Info yang cepat berubah (lowongan kerja, promo, produk baru)
- Orang/perusahaan/produk spesifik yang mungkin berubah
- Data statistik terbaru

TIDAK PERLU SEARCH jika pertanyaan tentang:
- Konsep umum, definisi, penjelasan ilmiah
- Sejarah, fakta statis
- Matematika, logika, koding
- Kreativitas (cerpen, puisi, email, desain)
- Opini atau brainstorming

Pertanyaan: "${userQuery}"

Jawab HANYA dalam format JSON berikut, tanpa teks lain:
{"needsSearch": true, "reason": "alasan singkat 1 kalimat"}

JSON:`;

  try {
    const response = await puter.ai.chat(prompt, {
      model: config.model,
      stream: false,
      signal: config.signal,
    });
    const text = extractText(response, "");
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`[SmartSearch] Decision:`, parsed);
      return {
        needsSearch: Boolean(parsed.needsSearch),
        reason: String(parsed.reason ?? ""),
      };
    }
  } catch (err) {
    console.warn("[SmartSearch] Decision parsing gagal, default ke search:", err);
  }
  return { needsSearch: true, reason: "Gagal menentukan, default ke search" };
}

// ─── Step 3: Fetch SearXNG ────────────────────────────────────────────────
// Fetch langsung ke /api/search proxy — tidak import dari webSearch.ts
// untuk menghindari circular dependency

async function fetchResults(
  query: string,
  topK: number,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  try {
    // Add timeout to prevent hanging (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener(
          "abort",
          () => controller.abort(),
          { once: true }
        );
      }
    }
    
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`SearXNG error: ${response.status}`);
    const data = await response.json();
    const raw: any[] = Array.isArray(data.results) ? data.results : [];
    return raw
      .slice(0, topK)
      .map((r) => ({
        title: String(r.title ?? ""),
        url: String(r.url ?? ""),
        content: String(r.content ?? r.snippet ?? ""),
      }))
      .filter((r) => r.title || r.content);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error("[SmartSearch] Fetch timeout - SearXNG took too long");
    } else {
      console.error("[SmartSearch] Fetch SearXNG gagal:", err);
    }
    return [];
  }
}

// ─── Step 4: RAG + Summarize ─────────────────────────────────────────────

export async function synthesizeAnswer(
  userQuery: string,
  results: SearchResult[],
  config: Required<SmartSearchConfig>
): Promise<string> {
  const safeResults = Array.isArray(results) ? results : [];
  if (safeResults.length === 0) {
    return "Tidak ditemukan hasil pencarian yang relevan untuk menjawab pertanyaan ini.";
  }

  const context = safeResults
    .map(
      (r, i) =>
        `[Sumber ${i + 1}] ${r.title}\nURL: ${r.url}\nIsi: ${r.content}`
    )
    .join("\n\n---\n\n");

  const prompt = `Kamu adalah asisten AI yang menjawab pertanyaan berdasarkan hasil pencarian web terkini.

PERTANYAAN PENGGUNA:
"${userQuery}"

HASIL PENCARIAN WEB:
---
${context}
---

INSTRUKSI:
1. Jawab secara komprehensif berdasarkan hasil pencarian di atas
2. Sintetiskan informasi dari beberapa sumber jika relevan
3. Sebutkan sumber (nomor) saat mengutip fakta spesifik, contoh: "(Sumber 1)"
4. Jika informasi dari sumber bertentangan, sebutkan perbedaannya
5. Jika hasil pencarian tidak relevan, katakan dengan jujur
6. Gunakan bahasa ${config.language} yang natural
7. Jangan mengarang informasi yang tidak ada di hasil pencarian

JAWABAN:`;

  try {
    const response = await puter.ai.chat(prompt, {
      model: config.model,
      stream: false,
      signal: config.signal,
    });
    const answer = extractText(response, "").trim();
    return answer || "Gagal menghasilkan jawaban dari hasil pencarian.";
  } catch (err) {
    console.error("[SmartSearch] Synthesis gagal, fallback ke format manual:", err);
    return safeResults
      .map((r, i) => `**${i + 1}. ${r.title}**\n${r.content}\n🔗 ${r.url}`)
      .join("\n\n");
  }
}

// ─── Main Pipeline ────────────────────────────────────────────────────────

export async function smartSearch(
  userQuery: string,
  config: SmartSearchConfig = {}
): Promise<SmartSearchResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  console.log(`[SmartSearch] Start: "${userQuery}" | model: ${cfg.model}`);

  // Step 1 & 2 paralel karena tidak saling depend
  const [rewrittenQuery, decision] = await Promise.all([
    rewriteQuery(userQuery, cfg),
    decideIfSearchNeeded(userQuery, cfg),
  ]);

  if (!decision.needsSearch) {
    console.log(`[SmartSearch] Skipped: ${decision.reason}`);
    return {
      searchPerformed: false,
      rewrittenQuery,
      searchDecisionReason: decision.reason,
      rawResults: [],
      answer: "",
    };
  }

  console.log(`[SmartSearch] Fetching: "${rewrittenQuery}"`);
  const rawResults = await fetchResults(rewrittenQuery, cfg.topK, cfg.signal);
  console.log(`[SmartSearch] Got ${rawResults.length} results`);

  const answer = await synthesizeAnswer(userQuery, rawResults, cfg);

  return {
    searchPerformed: true,
    rewrittenQuery,
    searchDecisionReason: decision.reason,
    rawResults,
    answer,
  };
}

// ─── Public helper untuk useDashboardApp ─────────────────────────────────

export async function performSmartSearch(
  userQuery: string,
  config: SmartSearchConfig = {}
): Promise<{ context: string; skipped: boolean; reason: string }> {
  const result = await smartSearch(userQuery, config);

  if (!result.searchPerformed) {
    return { context: "", skipped: true, reason: result.searchDecisionReason };
  }

  const safeRawResults = Array.isArray(result.rawResults) ? result.rawResults : [];
  if (safeRawResults.length === 0) {
    return {
      context: "Pencarian web tidak menghasilkan data yang relevan.",
      skipped: false,
      reason: result.searchDecisionReason,
    };
  }

  const sourcesFooter = safeRawResults
    .map((r, i) => `[${i + 1}] ${r.title} — ${r.url}`)
    .join("\n");

  const context =
    `${result.answer}\n\n` +
    `---\n📌 Query yang dicari: "${result.rewrittenQuery}"\n` +
    `📚 Sumber:\n${sourcesFooter}`;

  return { context, skipped: false, reason: result.searchDecisionReason };
}