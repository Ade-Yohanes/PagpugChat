"use client";

import { useState, useRef, memo,useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, X, Loader2, Play, Square, Globe } from "lucide-react";
import DocumentUploader, { AIFilePayload, cleanupPuterFile } from "@/components/files/DocumentUploader";

// Interface untuk Props
interface ChatInputAreaProps {
  onSubmit: (text: string, file: AIFilePayload | null, webSearch: boolean) => void;
  onCancel: () => void;
  isLoading: boolean;
  selectedModel: string;
}

const ChatInputArea = memo(({ 
  onSubmit, 
  onCancel,
  isLoading, 
  selectedModel 
}: ChatInputAreaProps) => {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<AIFilePayload | null>(null);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevHeightRef = useRef<number>(0);
  const webSearchUrl = process.env.NEXT_PUBLIC_WEB_SEARXNG_URL || "";
  const webSearchAvailable = Boolean(webSearchUrl);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // ---> TAMBAHAN BARU: Auto-Focus setelah AI selesai membalas <---
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      // Kita gunakan setTimeout kecil agar menunggu DOM selesai merender status 'disabled' menjadi 'false'
      const focusTimer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      
      return () => clearTimeout(focusTimer);
    }
  }, [isLoading]);

  const removeAttachment = () => {
    if (attachment && attachment.type === "file") {
      cleanupPuterFile(attachment.content);
    }
    setAttachment(null);
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;
    onSubmit(input, attachment, webSearchEnabled);
    // Kirim data ke komponen utama (page.tsx)
    // onSubmit(input, attachment);
    
    // Kosongkan form setelah dikirim
    setInput("");
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      prevHeightRef.current = 0;
    }
  };

  return (
    <div className="shrink-0 bg-background pt-2 pb-6 px-4 md:px-6">
      <div className="max-w-4xl mx-auto w-full relative">
        {/* Indikator File Terlampir */}
        {attachment && (
          <div className="mb-2 flex items-center gap-2 bg-muted/50 p-2 pl-3 rounded-lg border w-fit max-w-[200px] md:max-w-[300px]">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium truncate flex-1">{attachment.fileName}</span>
            <button
              onClick={removeAttachment}
              className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors shrink-0"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleLocalSubmit}
          className={`flex w-full items-end gap-2 bg-muted/30 border rounded-[1.5rem] p-2 shadow-sm transition-all ${
            isTextareaFocused ? 'ring-1 ring-primary border-primary' : ''
          }`}
        >
          {/* Komponen Upload */}
          <DocumentUploader
            onFileProcessed={(payload) => setAttachment(payload)}
            disabled={isLoading || attachment !== null}
          />
          {/* Tombol Toggle Web Search */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!webSearchAvailable) return;
              setWebSearchEnabled((prev) => !prev);
            }}
            disabled={!webSearchAvailable || isLoading}
            className={`shrink-0 mb-1 transition-colors ${
              webSearchEnabled
                ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-500/10'
                : webSearchAvailable
                ? 'text-muted-foreground hover:text-foreground'
                : 'text-muted-foreground/50 cursor-not-allowed'
            }`}
            title={webSearchAvailable ? (webSearchEnabled ? "Pencarian Web Aktif" : "Aktifkan Pencarian Web") : "Pencarian web belum dikonfigurasi. Periksa NEXT_PUBLIC_WEB_SEARXNG_URL di .env."}
          >
            <Globe className="w-5 h-5" />
          </Button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const currentHeight = e.target.scrollHeight;
              if (currentHeight !== prevHeightRef.current) {
                e.target.style.height = 'auto';
                e.target.style.height = currentHeight + 'px';
                prevHeightRef.current = currentHeight;
              }
            }}
            onFocus={() => setIsTextareaFocused(true)}
            onBlur={() => setIsTextareaFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if ((input.trim() || attachment) && !isLoading) {
                  handleLocalSubmit(e as unknown as React.FormEvent);
                }
              }
            }}
            placeholder={attachment ? `Ketik instruksi untuk file ${attachment.fileName}...` : `Ketik pesan ke ${selectedModel || 'AI'}...`}
            className="flex-1 min-h-[44px] max-h-[200px] resize-none overflow-y-auto bg-transparent px-2 py-3 text-base placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed"
            disabled={isLoading}
            rows={1}
            autoFocus 
          />

          {isLoading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={onCancel}
              className="h-10 w-10 shrink-0 rounded-full mb-1 mr-1"
              title="Stop"
            >
              <Square className="w-4 h-4" />
            </Button>
          )}

          {/* Tombol Start / Kirim */}
          <Button
            type="submit"
            disabled={isLoading || (!input.trim() && !attachment)}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full mb-1 mr-1"
            title={isLoading ? "Loading" : "Start"}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4" />}
          </Button>
        </form>

        <div className="text-center mt-3 text-xs text-muted-foreground">
          AI dapat membuat kesalahan. Harap periksa kembali informasi penting.
        </div>
        <div className="text-center mt-1 text-[11px] text-muted-foreground/80">
          Powered by <a href="https://pagpug.com" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">pagpug.com</a>
        </div>
        {!webSearchAvailable && (
          <div className="text-center mt-2 text-xs text-amber-400">
            Pencarian web dinonaktifkan. Tambahkan NEXT_PUBLIC_WEB_SEARXNG_URL di file .env.
          </div>
        )}
      </div>
    </div>
  );
});

// Menambahkan displayName agar rapi di React DevTools
ChatInputArea.displayName = "ChatInputArea";
export default ChatInputArea;