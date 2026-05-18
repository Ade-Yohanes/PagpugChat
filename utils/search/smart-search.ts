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
   * Default: "gpt-4o-mini"
   */
  model?: string;
  /** Jika false, smart search hanya melakukan fetch hasil web tanpa memanggil model */
  useModel?: boolean;
  /** Jumlah hasil search yang dipakai untuk RAG (default: 5) */
  topK?: number;
  /** Bahasa jawaban LLM (default: "Indonesia") */
  language?: string;
  /** AbortSignal untuk membatalkan pipeline search */
  signal?: AbortSignal;
}

type ChatOptionsWithSignal = {
  model?: string;
  stream?: boolean;
  signal?: AbortSignal;
};

const DEFAULT_CONFIG: SmartSearchConfig = {
  model: "ministral-3-3B-mistral", // gpt-4o-mini terlalu mahal untuk pipeline multi-step
  useModel: true,
  topK: 5,
  language: "Indonesia",
  signal: undefined,
};

// Maximum time (ms) to wait for a single LLM call before falling back to search-only mode
const LLM_TIMEOUT_MS = 2500;

async function chatWithTimeout(
  prompt: string,
  options: ChatOptionsWithSignal,
  timeoutMs: number = LLM_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // If caller provided a signal, wire it to abort our controller too
  if (options.signal) {
    const parent = options.signal;
    if (parent.aborted) {
      controller.abort();
    } else {
      const onAbort = () => controller.abort();
      parent.addEventListener("abort", onAbort, { once: true });
    }
  }

  try {
    const merged: ChatOptionsWithSignal = { ...options, signal: controller.signal };
    const started = Date.now();
    const res = await puter.ai.chat(prompt, merged as ChatOptionsWithSignal);
    const duration = Date.now() - started;
    console.log(`[SmartSearch][LLM] call duration: ${duration}ms`);
    return res;
  } catch (err) {
    if (controller.signal.aborted) {
      console.warn(`[SmartSearch][LLM] call aborted after ${timeoutMs}ms`);
    } else {
      console.error(`[SmartSearch][LLM] call error:`, err);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

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

function extractText(response: unknown, fallback = ""): string {
  if (typeof response === "string") return response;
  if (typeof response === "object" && response !== null) {
    const responseObject = response as Record<string, unknown>;
    if (
      "message" in responseObject &&
      typeof responseObject.message === "object" &&
      responseObject.message !== null
    ) {
      const messageObject = responseObject.message as Record<string, unknown>;
      if (
        "content" in messageObject &&
        typeof messageObject.content === "string"
      ) {
        return messageObject.content;
      }
    }
  }
  return fallback;
}

// ─── Step 1: Query Rewriting ─────────────────────────────────────────────

export async function rewriteQuery(
  userQuery: string,
  config: Required<SmartSearchConfig>
): Promise<string> {
  if (!config.useModel || !config.model) {
    console.log(`[SmartSearch] Rewrite skipped because model is disabled or unavailable`);
    return userQuery;
  }

  // Skip rewriting for direct time/day queries — LLM rewrite adds unwanted year/date
  if (/\b(hari ini|hari apa|sekarang|tanggal|jam berapa|what day|what time|current date|today)\b/i.test(userQuery)) {
    console.log(`[SmartSearch] Rewrite skipped for time/day query: "${userQuery}"`);
    return userQuery;
  }

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
    const started = Date.now();
    const response = await chatWithTimeout(prompt, {
      model: config.model,
      stream: false,
      signal: config.signal,
    });
    const took = Date.now() - started;
    console.log(`[SmartSearch] rewriteQuery LLM took ${took}ms`);
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
  if (!config.useModel || !config.model) {
    console.log(`[SmartSearch] Search decision skipped because model is disabled or unavailable`);
    return { needsSearch: true, reason: "Search-only mode" };
  }

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
    const started = Date.now();
    const response = await chatWithTimeout(prompt, {
      model: config.model,
      stream: false,
      signal: config.signal,
    });
    const took = Date.now() - started;
    console.log(`[SmartSearch] decideIfSearchNeeded LLM took ${took}ms`);
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
    const data: unknown = await response.json();
    const raw: unknown[] =
      typeof data === "object" &&
      data !== null &&
      "results" in data &&
      Array.isArray((data as Record<string, unknown>).results)
        ? ((data as Record<string, unknown>).results as unknown[])
        : [];
    return raw
      .slice(0, topK)
      .map((r) => {
        const item = typeof r === "object" && r !== null ? (r as Record<string, unknown>) : {};
        return {
          title: String(item.title ?? ""),
          url: String(item.url ?? ""),
          content: String(item.content ?? item.snippet ?? ""),
        };
      })
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

  if (!config.useModel || !config.model) {
    console.log(`[SmartSearch] Synthesis skipped because model is disabled or unavailable`);
    return safeResults
      .map((r, i) => `**${i + 1}. ${r.title}**\n${r.content}\n🔗 ${r.url}`)
      .join("\n\n");
  }

  const context = safeResults
    .map(
      (r, i) =>
        `[Sumber ${i + 1}] ${r.title}\nURL: ${r.url}\nIsi: ${r.content}`
    )
    .join("\n\n---\n\n");

  const prompt = `Kamu adalah asisten AI yang Smart yang menjawab pertanyaan berdasarkan hasil pencarian web terkini.

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
    const started = Date.now();
    const response = await chatWithTimeout(prompt, {
      model: config.model,
      stream: false,
      signal: config.signal,
    });
    const took = Date.now() - started;
    console.log(`[SmartSearch] synthesizeAnswer LLM took ${took}ms`);
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
  const cfg = { ...DEFAULT_CONFIG, ...config } as Required<SmartSearchConfig>;
  console.log(`[SmartSearch] Start: "${userQuery}" | model: ${cfg.model} | useModel: ${cfg.useModel}`);

  let rewrittenQuery = userQuery;
  let decision: SearchDecision = { needsSearch: true, reason: "Search-only mode" };

  if (cfg.useModel && cfg.model) {
    // Step 1 & 2 paralel karena tidak saling depend
    [rewrittenQuery, decision] = await Promise.all([
      rewriteQuery(userQuery, cfg),
      decideIfSearchNeeded(userQuery, cfg),
    ]);
  }

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