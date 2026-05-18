/**
 * src/lib/cloud-storage.ts
 * Definisi tipe data dan konfigurasi untuk cloud storage (Puter.js)
 */

export interface StorageConfig {
  directory?: string;
  maxSizeBytes?: number;
  allowedFileTypes?: string[];
}

export interface UploadProgress {
  progress: number;       // Persentase (0 - 100)
  loaded: number;         // Byte yang sudah terupload
  total: number;          // Total byte file
  status: 'idle' | 'uploading' | 'success' | 'error';
}

// Catatan: Jika use-cloud-storage.ts Anda juga mengimpor fungsi-fungsi 
// (bukan hanya tipe data), kami menyediakan dummy function di bawah ini 
// agar TypeScript tidak protes.
export const uploadToCloud = async () => {};
export const deleteFromCloud = async () => {};
export const listCloudFiles = async () => {};