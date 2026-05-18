/**
 * Modul untuk melakukan pencarian web menggunakan SearXNG (Self-Hosted)
 * Melalui API Proxy Next.js untuk menghindari CORS issues
 */

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export const performWebSearch = async (query: string): Promise<string> => {
  if (!query.trim()) {
    return "Query pencarian tidak boleh kosong.";
  }

  try {
    console.log(`[WebSearch] Mencari informasi tentang: "${query}" via API proxy...`);
    
    // Panggil API proxy Next.js di /api/search (sama domain, tidak ada CORS issue)
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    
    const results = Array.isArray(data.results) ? data.results : [];
    if (data.results && !Array.isArray(data.results)) {
      console.warn("[WebSearch] Response data.results bukan array:", data.results);
    }
    const topResults: SearchResult[] = results.slice(0, 5);
    
    if (topResults.length === 0) {
      return "Tidak ditemukan hasil pencarian web yang relevan.";
    }

    let contextString = "BERIKUT ADALAH HASIL PENCARIAN WEB TERKINI:\n\n";
    topResults.forEach((result, index) => {
      contextString += `[Sumber ${index + 1}]: ${result.title}\n`;
      contextString += `URL: ${result.url}\n`;
      contextString += `Informasi: ${result.content}\n\n`;
    });

    return contextString;

  } catch (error) {
    console.error("[WebSearch] Gagal melakukan pencarian:", error);
    return "Terjadi kesalahan saat mencoba mencari informasi di internet.";
  }
};