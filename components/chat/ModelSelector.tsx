"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAIModels, type AIModel, modelSupportsVision } from "@/lib/puter-models";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const hasFetchedModels = useRef(false);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => {
        try {
          searchInputRef.current?.focus({ preventScroll: true });
        } catch {
          searchInputRef.current?.focus();
        }
      }, 0);
    }
  }, [open]);

  useEffect(() => {
    if (hasFetchedModels.current) return;
    hasFetchedModels.current = true;

    const fetchModels = async () => {
      try {
        const availableModels = await fetchAIModels();
        const safeModels = Array.isArray(availableModels) ? availableModels : [];

        setModels(safeModels);

        // Jika belum ada model yang dipilih dari parent, gunakan model default atau model pertama
        if (!selectedModel && safeModels.length > 0) {
          const defaultModel = localStorage.getItem("puter_default_model");
          if (defaultModel && safeModels.some(m => m.id === defaultModel)) {
            onModelChange(defaultModel);
          } else {
            onModelChange(safeModels[0].id);
          }
        }
      } catch (error) {
        console.error("Gagal memuat daftar model:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [selectedModel, onModelChange]);

  const filteredModels = useMemo(
    () => {
      const safeModels = Array.isArray(models) ? models : [];
      return safeModels.filter((model) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return [model.name, model.provider, model.id].some((value) => value?.toLowerCase().includes(query));
      });
    },
    [models, searchQuery]
  );

  const safeFilteredModels = Array.isArray(filteredModels) ? filteredModels : [];
  const safeModels = Array.isArray(models) ? models : [];
  const selectedModelItem = safeModels.find((model) => model.id === selectedModel);
  const displayedModels = searchQuery.trim()
    ? safeFilteredModels
    : selectedModelItem && !safeFilteredModels.some((model) => model.id === selectedModel)
    ? [selectedModelItem, ...safeFilteredModels]
    : safeFilteredModels;
  const safeDisplayedModels = Array.isArray(displayedModels) ? displayedModels : [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat model...
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <Select
        value={selectedModel}
        onValueChange={(value) => onModelChange(value)}
        onOpenChange={(open) => {
          setOpen(open);
          if (open) {
            window.setTimeout(() => {
              searchInputRef.current?.focus();
            }, 0);
          } else {
            setSearchQuery("");
          }
        }}
      >
        <SelectTrigger className="w-full text-sm border rounded-md px-3 py-1.5 bg-background text-foreground border-input outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
          <SelectValue placeholder="Pilih model AI..." />
        </SelectTrigger>
        <SelectContent
          className="w-full min-w-[18rem] min-h-[16rem] max-h-[24rem]"
          position="popper"
          header={
            <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur-sm px-0 py-0">
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari model atau provider..."
                className="w-full text-sm border rounded-md px-3 py-2 bg-background text-foreground border-input outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                autoComplete="off"
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            </div>
          }
        >
          {safeDisplayedModels.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Tidak ada model cocok</div>
          ) : (
            safeDisplayedModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {`${model.name} — ${model.provider}${modelSupportsVision(model.id) ? " 👁️" : ""}`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}