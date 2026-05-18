"use client";

import { useState, useEffect } from "react";
import { Settings, Cpu, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAIModels, type AIModel } from "@/lib/puter-models";

interface SettingsPanelProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function SettingsPanel({ selectedModel, onModelChange }: SettingsPanelProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load model default dari localStorage
    const savedDefault = localStorage.getItem("puter_default_model");
    if (savedDefault) {
      setDefaultModel(savedDefault);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAIModels();
        if (!cancelled) {
          setModels(list);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal memuat daftar model");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDefaultModelChange = (newModel: string) => {
    setDefaultModel(newModel);
    localStorage.setItem("puter_default_model", newModel);
    onModelChange(newModel);
  };

  const safeModels = Array.isArray(models) ? models : [];
  const current = safeModels.find((m) => m.id === defaultModel);
  const orphanSelection =
    Boolean(defaultModel) && !safeModels.some((m) => m.id === defaultModel);

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary shrink-0" />
            Pengaturan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atur preferensi aplikasi, termasuk model AI default untuk obrolan.
          </p>
        </div>

        <Card className="shadow-sm border-muted/50">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1 min-w-0">
                <CardTitle>Model AI default</CardTitle>
                <CardDescription>
                  Model default ini akan digunakan saat Anda memulai chat baru atau ketika belum ada model yang dipilih.
                  Model yang dipilih di halaman Chat adalah terpisah dari pengaturan default ini.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                Memuat daftar model...
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <>
                <div className="space-y-2 max-w-xl">
                  <label htmlFor="settings-default-model" className="text-sm font-medium">
                    Pilih model default
                  </label>
                  <select
                    id="settings-default-model"
                    value={safeModels.some((m) => m.id === defaultModel) ? defaultModel : orphanSelection ? defaultModel : ""}
                    onChange={(e) => handleDefaultModelChange(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2.5 bg-background text-foreground border-input outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    {safeModels.length === 0 && !orphanSelection ? (
                      <option value="">Tidak ada model tersedia</option>
                    ) : null}
                    {orphanSelection ? (
                      <option value={defaultModel}>{defaultModel} (tersimpan)</option>
                    ) : null}
                    {safeModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.provider}
                      </option>
                    ))}
                  </select>
                </div>

                {current && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-md bg-muted/50 px-3 py-2 border max-w-xl">
                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-500 shrink-0" />
                    <span>
                      Model default:{" "}
                      <span className="font-medium text-foreground">{current.name}</span>{" "}
                      <span className="text-muted-foreground">({current.provider})</span>
                    </span>
                  </div>
                )}

                {orphanSelection && (
                  <p className="text-xs text-amber-600 dark:text-amber-500 max-w-xl">
                    ID tersimpan tidak ada di daftar terbaru. Pilih ulang atau simpan lagi setelah daftar
                    dimuat.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
