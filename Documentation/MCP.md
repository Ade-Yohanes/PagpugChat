# MCP (Model Context Protocol) untuk own-puter

Dokumen ini menjelaskan cara menambahkan dukungan Model Context Protocol (MCP) ke proyek Next.js `own-puter` dan bagaimana menggunakan MCP untuk memberi kemampuan AI agent akses ke konteks aplikasi selama pengembangan.

## Apa itu MCP?

[MCP (Model Context Protocol)](https://modelcontextprotocol.io) adalah standar terbuka yang memungkinkan agen AI dan coding assistant berinteraksi dengan aplikasi melalui antarmuka standar. Untuk Next.js, MCP memungkinkan agen membaca informasi runtime, error, rute, metadata halaman, dan komponen langsung dari server pengembangan.

## Mengapa ini relevan untuk `own-puter`

Folder `Documentation` sudah berisi beberapa catatan tentang integrasi AI dan Next.js, termasuk:

- dukungan Next.js MCP (`Documentation/llm_nextjs.txt`)
- referensi MCP pada dokumentasi UI/shadcn (`Documentation/llm_shadcn.txt` dan `Documentation/llm_shadcnui.txt`)

Menambahkan file MCP membantu merangkum langkah konfigurasi dan penggunaan yang spesifik untuk proyek ini, sehingga memudahkan pengembang lain untuk mengaktifkan agen berbasis darah konteks.

## Persyaratan

- Next.js 16 atau lebih tinggi
- `next-devtools-mcp` untuk menghubungkan kode dengan server MCP Next.js

## Konfigurasi MCP di `own-puter`

Tambahkan file `.mcp.json` di root proyek jika belum ada, dengan konten seperti berikut:

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

Setelah konfigurasi ini, jalankan server pengembangan Next.js seperti biasa:

```bash
npm run dev
```

atau

```bash
pnpm dev
```

atau

```bash
yarn dev
```

`next-devtools-mcp` akan secara otomatis menemukan dan terhubung ke instance Next.js yang berjalan.

## Kemampuan yang didapat

Dengan `next-devtools-mcp`, agen AI dapat melakukan hal-hal berikut pada proyek Next.js ini:

- mendeteksi error build dan runtime
- membaca metadata halaman, rute, dan halaman dinamis
- mengakses struktur proyek dan konfigurasi
- memeriksa hasil rendering, komponen, dan Server Actions
- menampilkan log pengembangan

## Penggunaan dengan agen AI

Agen yang kompatibel MCP bisa langsung menemukan server pengembangan dan memberi saran berdasarkan konteks aplikasi yang berjalan.

Contoh prompt untuk agen:

- "Apa error yang muncul di aplikasi saya saat ini?"
- "Tampilkan semua route yang tersedia di `app/` dan `pages/`"
- "Cari komponen yang menggunakan `useState` atau `useEffect` di proyek ini"

## Referensi tambahan

- [Next.js MCP Server](https://nextjs.org/docs/app/guides/mcp)
- [next-devtools-mcp GitHub](https://github.com/vercel/next-devtools-mcp)
- `Documentation/llm_nextjs.txt`
- `Documentation/llm_shadcn.txt`
- `Documentation/llm_shadcnui.txt`

## Catatan khusus untuk own-puter

Jika proyek `own-puter` menggunakan fitur Next.js khusus seperti Server Actions, `app/` router, dan integrasi UI shadcn, MCP dapat membantu agen memahami bagaimana modul tersebut tersusun dan memberikan rekomendasi yang lebih tepat.

Gunakan dokumentasi ini sebagai titik awal untuk mengaktifkan MCP di lingkungan pengembangan dan menghubungkan agen AI berbasis MCP dengan aplikasi `own-puter`.