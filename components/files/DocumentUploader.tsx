import { useRef, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ==========================================
// TIPE DATA & UTILS
// ==========================================

/** Kategori media yang didukung */
export type MediaCategory = "text" | "image" | "video" | "audio" | "document";

export interface AIFilePayload {
  /** Cara pengiriman ke AI: "text" = embed isi file, "file" = upload ke Puter FS lalu kirim puter_path */
  type: "text" | "file";
  /** Isi teks (jika type="text") atau path Puter FS (jika type="file") */
  content: string;
  /** Nama file asli */
  fileName: string;
  /** Kategori media untuk tampilan UI */
  mediaCategory: MediaCategory;
  /** Blob file untuk dikirim langsung ke AI (jika type="file") */
  blob?: Blob;
}

/** Ekstensi yang didukung per kategori */
const FILE_CATEGORIES: Record<MediaCategory, string[]> = {
  text:     ["txt", "csv", "json", "md", "log", "xml", "yaml", "yml", "toml", "ini", "env"],
  image:    ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"],
  video:    ["mp4", "webm", "mov", "avi", "mkv"],
  audio:    ["mp3", "wav", "ogg", "flac", "m4a", "aac"],
  document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
};

/** Semua ekstensi yang diterima (untuk input accept) */
const ALL_EXTENSIONS = Object.values(FILE_CATEGORIES).flat();
const ACCEPT_STRING = ALL_EXTENSIONS.map(ext => `.${ext}`).join(",");

/** Deteksi kategori dari ekstensi file */
function getMediaCategory(ext: string): MediaCategory {
  for (const [category, exts] of Object.entries(FILE_CATEGORIES)) {
    if (exts.includes(ext)) return category as MediaCategory;
  }
  return "document"; // fallback
}

/** Emoji icon per kategori */
export function getMediaEmoji(category: MediaCategory): string {
  switch (category) {
    case "text":     return "📄";
    case "image":    return "🖼️";
    case "video":    return "🎬";
    case "audio":    return "🎵";
    case "document": return "📎";
  }
}

/**
 * Proses file untuk dikirim ke AI.
 */
export const processFileForAI = async (file: File): Promise<AIFilePayload> => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (!ALL_EXTENSIONS.includes(ext)) {
    throw new Error(`Tipe file .${ext} belum didukung. Format yang didukung: ${ALL_EXTENSIONS.join(", ")}`);
  }

  const category = getMediaCategory(ext);

  // File teks < 500KB → baca langsung
  if (category === "text" && file.size < 500_000) {
    console.log(`[FileParser] Membaca file teks: ${file.name}`);
    const text = await file.text();
    return { type: "text", content: text, fileName: file.name, mediaCategory: category };
  }

  // Upload ke Puter FS menggunakan puter.fs.upload()
  console.log(`[FileParser] Mengunggah ${file.name} (${category}) ke Puter FS...`);
  
  try {
    // Gunakan puter.fs.upload() sesuai dokumentasi Puter
    if (typeof window === 'undefined' || !window.puter?.fs?.upload) {
      throw new Error('Puter FS upload tidak tersedia. Pastikan Anda sudah login.');
    }

    const uploadResult = await window.puter.fs.upload([file]);
    
    console.log(`[FileParser] Upload result:`, uploadResult);
    console.log(`[FileParser] Upload result type:`, typeof uploadResult);
    console.log(`[FileParser] Is array:`, Array.isArray(uploadResult));
    
    // Handle berbagai format response dari puter.fs.upload()
    let puterFile = null;
    
    if (Array.isArray(uploadResult) && uploadResult.length > 0) {
      puterFile = uploadResult[0];
    } else if (uploadResult && typeof uploadResult === 'object' && 'path' in uploadResult) {
      // Jika langsung object, bukan array
      puterFile = uploadResult;
    } else if (uploadResult && (uploadResult as any).file) {
      // Jika wrapped dalam .file property
      puterFile = (uploadResult as any).file;
    }
    
    if (!puterFile || !puterFile.path) {
      throw new Error(`Upload gagal: response tidak valid. Got: ${JSON.stringify(uploadResult)}`);
    }

    console.log(`[FileParser] File berhasil di-upload ke: ${puterFile.path}`);
    
    // Dapatkan URL untuk file agar bisa diakses AI
    let fileUrl: string;
    try {
      if (window.puter?.fs?.getReadURL) {
        fileUrl = await window.puter.fs.getReadURL(puterFile.path);
        console.log(`[FileParser] URL file: ${fileUrl}`);
        
        if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim() === '') {
          throw new Error(`URL tidak valid: ${fileUrl}`);
        }
      } else {
        throw new Error('getReadURL tidak tersedia');
      }
    } catch (urlError) {
      console.error(`[FileParser] Gagal mendapatkan URL:`, urlError);
      // Fallback ke path jika getReadURL gagal
      fileUrl = puterFile.path.startsWith('/') ? puterFile.path : `/${puterFile.path}`;
      console.log(`[FileParser] Menggunakan fallback path: ${fileUrl}`);
    }
    
    return { 
      type: "file", 
      content: fileUrl, 
      fileName: file.name, 
      mediaCategory: category,
      blob: file
    };
  } catch (uploadError) {
    let errorMsg = "Unknown error";
    if (uploadError instanceof Error) {
      errorMsg = uploadError.message;
    } else if (uploadError && typeof uploadError === 'object') {
      if ('message' in uploadError) {
        errorMsg = String((uploadError as any).message);
      } else if ('details' in uploadError) {
        errorMsg = String((uploadError as any).details);
      } else {
        errorMsg = JSON.stringify(uploadError);
      }
    } else {
      errorMsg = String(uploadError);
    }
    console.error('[FileParser] Upload error details:', uploadError);
    throw new Error(`Gagal mengunggah file: ${errorMsg}`);
  }
};

/** Hapus file sementara dari Puter FS */
export const cleanupPuterFile = async (puterPath: string) => {
  try {
    if (typeof window === 'undefined' || !window.puter?.fs?.delete) {
      console.warn('[FileParser] Puter FS tidak tersedia untuk cleanup');
      return;
    }
    await window.puter.fs.delete(puterPath);
    console.log(`[FileParser] File ${puterPath} dihapus dari cloud.`);
  } catch (error) {
    console.error(`[FileParser] Gagal menghapus file ${puterPath}:`, error);
  }
};

// ==========================================
// KOMPONEN UI
// ==========================================
interface DocumentUploaderProps {
  onFileProcessed: (payload: AIFilePayload) => void;
  disabled?: boolean;
}

export default function DocumentUploader({ onFileProcessed, disabled }: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const payload = await processFileForAI(file);
      onFileProcessed(payload);
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses file.";
      alert(message);
      console.error(error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={ACCEPT_STRING}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || isProcessing}
        onClick={() => fileInputRef.current?.click()}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        title="Upload File (Dokumen, Gambar, Video, Audio)"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </Button>
    </>
  );
}