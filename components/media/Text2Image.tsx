
"use client";

import { useState } from "react";
import { Loader2, Image as ImageIcon, Download, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import puter from "@heyputer/puter.js";
import { useToast } from "@/lib/use-toast";

export default function Text2Image({ user }: { user: any }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk pengaturan gambar
  const [size, setSize] = useState("1024x1024");
  const [model, setModel] = useState("dall-e-3"); // Standar Puter/OpenAI
  const [quality, setQuality] = useState("standard");

  const txt2imgWithTimeout = (prompt: string, options: any, timeoutMs = 120000) => {
    return Promise.race([
      puter.ai.txt2img(prompt, options),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Permintaan ke server tidak mendapat respons (timeout).")), timeoutMs)
      ),
    ]);
  };

  const extractImageUrl = (imageElement: any): string | null => {
    if (imageElement instanceof HTMLImageElement && imageElement.src) {
      return imageElement.src;
    }
    if (typeof imageElement === 'string') {
      return imageElement;
    }
    if (imageElement?.src) {
      return imageElement.src;
    }
    return null;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setImageUrl(null);

    try {
      const finalQuality = (size === "256x256" || size === "512x512") ? "standard" : quality;

      const imageElement = await txt2imgWithTimeout(prompt, {
        model: model,
        quality: finalQuality,
        size: size,
      });

      const url = extractImageUrl(imageElement);
      if (url) {
        setImageUrl(url);
        toast({
          title: "Gambar Berhasil Dibuat!",
          description: "Karya visual Anda siap diunduh.",
          variant: "success",
        });
      } else {
        throw new Error("Gagal mengekstrak URL gambar dari server.");
      }
    } catch (error: any) {
      console.error("Gagal membuat gambar:", error);
      toast({
        title: "Pembuatan Gagal",
        description: error.message || "Terjadi kesalahan saat memproses gambar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      // Fetch gambar untuk menghindari masalah CORS saat download
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PuterAI-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Unduhan Selesai",
        description: "Gambar Anda berhasil disimpan.",
        variant: "success", // atau 'default'
      });
    } catch (error) {
      console.error("Gagal mendownload:", error);
      toast({
        title: "Peringatan Unduhan",
        description: "Membuka gambar di tab baru karena masalah keamanan browser.",
        variant: "destructive", // diganti dari warning jika shadcn default tidak punya warning
      });
      // Fallback jika fetch diblokir CORS: buka di tab baru
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-8 bg-background overflow-y-auto">
      
      {/* Header Halaman */}
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <div className="p-3 bg-primary/10 rounded-xl">
          <ImageIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Image Studio</h1>
          <p className="text-sm text-muted-foreground">Ubah imajinasi (teks) Anda menjadi karya visual.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-0">
        
        {/* KOLOM KIRI: PANEL KONTROL */}
        <div className="col-span-1 flex flex-col gap-6 shrink-0">
          <Card className="shadow-sm border-muted/50">
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleGenerate} className="space-y-6">
                
                {/* Input Prompt */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> 
                    Deskripsi Gambar (Prompt)
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Contoh: Seekor kucing lucu sedang bermain piano di atas panggung konser megah, gaya cyberpunk..."
                    className="w-full h-32 p-3 bg-muted/50 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    disabled={isLoading}
                  />
                </div>

                {/* Pengaturan Model */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Model AI</label>
                  <select 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={isLoading}
                  >
                    <option value="dall-e-3">DALL-E 3 (Kualitas Tinggi)</option>
                    <option value="dall-e-2">DALL-E 2 (Lebih Cepat)</option>
                    <option value="gpt-image-1.5">GPT Image 1.5</option>
                  </select>
                </div>

                {/* Pengaturan Ukuran */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Ukuran</label>
                  <select 
                    value={size} 
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full p-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={isLoading}
                  >
                    <option value="256x256">Kecil (256x256)</option>
                    <option value="512x512">Sedang (512x512)</option>
                    <option value="1024x1024">Besar (1024x1024)</option>
                  </select>
                </div>

                {/* Pengaturan Kualitas */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Kualitas Resolusi</label>
                  <select 
                    value={quality} 
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full p-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    disabled={isLoading || size !== "1024x1024"}
                  >
                    <option value="standard">Standard (Cepat & Seimbang)</option>
                    <option value="hd">HD (Resolusi Tertinggi)</option>
                    <option value="low">Low (Paling Cepat)</option>
                  </select>
                  {size !== "1024x1024" && (
                    <p className="text-[10px] text-amber-500 mt-1">*HD hanya tersedia di ukuran 1024x1024.</p>
                  )}
                </div>

                {/* Tombol Buat */}
                <Button 
                  type="submit" 
                  disabled={!prompt.trim() || isLoading} 
                  className="w-full gap-2 font-semibold py-6 shadow-md"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                  ) : (
                    <><Wand2 className="w-5 h-5" /> Buat Gambar</>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: HASIL GAMBAR */}
        <div className="col-span-1 lg:col-span-2 flex flex-col h-full min-h-[400px]">
          <div className="flex-1 bg-muted/20 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden group">
            
            {isLoading ? (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="animate-pulse font-medium">Sedang melukis mahakarya Anda...</p>
              </div>
            ) : imageUrl ? (
              <>
                <img 
                  src={imageUrl} 
                  alt={prompt} 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]" 
                />
                <Button 
                  onClick={handleDownload}
                  className="absolute bottom-6 right-6 gap-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <Download className="w-4 h-4" /> Unduh Gambar
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground flex flex-col items-center gap-3">
                <ImageIcon className="w-16 h-16 opacity-20" />
                <p>Area kanvas. Gambar Anda akan muncul di sini.</p>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}