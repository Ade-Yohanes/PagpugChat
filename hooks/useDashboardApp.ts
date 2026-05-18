"use client";

import { useEffect, useRef, useState } from "react";
import puter from "@heyputer/puter.js";
import { useTheme } from "next-themes";
import { useToast } from "@/lib/use-toast";
// ✅ Ganti import lama dengan smart search
import { performSmartSearch } from "@/utils/search";

import { modelSupportsVision } from "@/lib/puter-models";
import { processDocumentRAG, searchRelevantChunks } from "@/utils/localRAG";
import type { ChatHistoryItem } from "@/types";
import type { AIFilePayload } from "@/components/files/DocumentUploader";

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  displayContent?: string;
};

export type UserType = {
  uuid?: string;
  id?: string;
  username?: string;
  email?: string;
  email_confirmed?: boolean;
  actual_free_storage?: number;
  app_name?: string;
  is_temp?: boolean;
  last_activity_ts?: number;
  paid_storage?: number;
  referral_code?: string;
  requires_email_confirmation?: boolean;
  subscribed?: boolean;
  [key: string]: unknown;
};

const getCurrentDateTime = () => {
  const now = new Date();
  return now.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSystemPrompt = () => `
Kamu adalah asisten AI yang helpful.

INFORMASI WAKTU SAAT INI:
- Tanggal & Waktu: ${getCurrentDateTime()}
- Timezone: WIB (Asia/Jakarta, UTC+7)

Gunakan informasi waktu di atas ketika user bertanya tentang tanggal, hari, atau waktu sekarang.
`.trim();

const validMenuIds = [
  "chat",
  "workers",
  "files",
  "text2image",
  "text2video",
  "text2video-test",
  "profile",
  "settings",
];

export function useDashboardApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState<UserType | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [selectedModel, setSelectedModel] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { theme, setTheme } = useTheme();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (validMenuIds.includes(hash)) {
      setActiveMenu(hash);
    } else if (!window.location.hash) {
      window.history.replaceState(null, "", "#chat");
    }

    const handleHashChange = () => {
      const currentHash = window.location.hash.replace("#", "");
      if (validMenuIds.includes(currentHash)) {
        setActiveMenu(currentHash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const savedModel = localStorage.getItem("puter_default_model");
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof puter !== "undefined" && puter.auth.isSignedIn()) {
        const currentUser = await puter.auth.getUser();
        setUser(currentUser as unknown as UserType);
      }
      setIsAuthChecking(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        // Use requestAnimationFrame to prevent blocking the main thread
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        });
      }
    }
  }, [messages]);

  const handleMenuChange = (menu: string) => {
    if (!validMenuIds.includes(menu)) return;
    setActiveMenu(menu);
    window.history.pushState(null, "", `#${menu}`);
  };

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const awaitWithAbort = async <T>(promise: Promise<T>, signal: AbortSignal) => {
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true }
        );
      }),
    ]);
  };

  const handleLogin = async () => {
    try {
      await puter.auth.signIn();
      const currentUser = await puter.auth.getUser();
      setUser(currentUser as unknown as UserType);
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login gagal",
        description: "Gagal masuk ke Puter. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    puter.auth.signOut();
    setUser(null);
    setMessages([]);
    setSelectedModel("");
    handleMenuChange("chat");
  };

  const handleNewChat = () => {
    setMessages((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      if (safePrev.length > 0) {
        const firstMsg = safePrev[0];
        const title =
          (firstMsg?.displayContent || firstMsg?.content || "Chat baru")
            .substring(0, 20)
            .trim() + "...";
        const newHistoryItem: ChatHistoryItem = {
          id: Date.now(),
          title,
          messages: [...safePrev] as any,
        };
        setChatHistory((prevHistory) => {
          const safeHistory = Array.isArray(prevHistory) ? prevHistory : [];
          return [newHistoryItem, ...safeHistory];
        });
      }
      return [];
    });

    if (!selectedModel || selectedModel.trim() === "") {
      const defaultModel = localStorage.getItem("puter_default_model");
      if (defaultModel) setSelectedModel(defaultModel);
    }

    handleMenuChange("chat");
  };

  const handleSelectHistory = (historyMessages: Message[]) => {
    setMessages(historyMessages);
    handleMenuChange("chat");
  };

  const handleSubmit = async (
    textInput: string,
    currentAttachment: AIFilePayload | null,
    isWebSearchEnabled: boolean
  ) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    let finalContent = textInput;
    let displayContent = textInput;
    let mediaFile: File | Blob | string | null = null;

    // ─── Smart Search Pipeline ────────────────────────────────────────────
    if (isWebSearchEnabled && textInput.trim() !== "") {
      setIsLoading(true);

      // Tampilkan status sementara ke user
      setMessages((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [
          ...safePrev,
          {
            role: "assistant",
            content:
              "🔍 Menganalisis pertanyaan dan mencari informasi terkini...",
          },
        ];
      });

      const searchResult = await performSmartSearch(textInput, {
        // Pakai model hanya jika user memilih model secara eksplisit.
        model:
          selectedModel && selectedModel.trim() !== ""
            ? selectedModel
            : undefined,
        useModel: Boolean(selectedModel && selectedModel.trim() !== ""),
        topK: 5,
        language: "Indonesia",
        signal,
      });

      // Hapus pesan status
      setMessages((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.slice(0, -1);
      });

      if (searchResult.skipped) {
        // LLM memutuskan tidak perlu search
        console.log(`[SmartSearch] Skipped: ${searchResult.reason}`);
        finalContent = `${textInput}\n\n[Catatan sistem: Pertanyaan ini tidak memerlukan pencarian internet. ${searchResult.reason}]`;
      } else if (searchResult.context) {
        // Ada hasil search → inject sebagai konteks ke LLM utama
        finalContent = `Kamu adalah asisten AI yang membantu pengguna.

Pengguna bertanya: "${textInput}"

Berikut adalah ringkasan dan data dari internet yang sudah dianalisis:
---
${searchResult.context}
---

Berikan jawaban yang natural dan langsung menjawab pertanyaan pengguna. Kamu boleh memperluas jawaban dengan pengetahuanmu sendiri selama tetap akurat.`;
      }
    }

    // ─── Document RAG ─────────────────────────────────────────────────────
    if (currentAttachment) {
      if (currentAttachment.type === "text") {
        setIsLoading(true);
        if (typeof currentAttachment.content !== "string" || currentAttachment.content.length === 0) {
          throw new Error("Konten dokumen tidak valid untuk RAG lokal.");
        }
        try {
          setMessages((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return [
              ...safePrev,
              {
                role: "assistant",
                content:
                  "📄 Sedang membaca dan menganalisis dokumen menggunakan AI Lokal...",
              },
            ];
          });
          await processDocumentRAG(
            currentAttachment.content,
            currentAttachment.fileName,
            undefined,
            signal
          );
          const relevantContext = await searchRelevantChunks(textInput, 3, signal);
          setMessages((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.slice(0, -1);
          });
          finalContent = `Pengguna bertanya: "${textInput}".\n\nBerdasarkan potongan dokumen berjudul "${currentAttachment.fileName}" berikut ini:\n\n---\n${relevantContext}\n---\n\nBerikan jawaban yang akurat berdasarkan dokumen di atas.`;
          displayContent = `📄 [File Terlampir: ${currentAttachment.fileName}]\n\n${textInput}`;
        } catch (err) {
          console.error("Gagal menjalankan RAG Lokal:", err);
          setMessages((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.slice(0, -1);
          });
          const safeTextContent =
              typeof currentAttachment.content === "string"
                ? currentAttachment.content
                : String(currentAttachment.content ?? "[Konten dokumen tidak tersedia]");
          finalContent = `${textInput}\n\n[Mode Fallback: Gagal analisis RAG lokal]\n\nBerikut sebagian isi file "${currentAttachment.fileName}":\n\n---\n${safeTextContent.substring(0, 3000)}\n---`;
          displayContent = `📄 [File Terlampir: ${currentAttachment.fileName}]\n\n${textInput}`;
        }
      } else if (currentAttachment.type === "file") {
        mediaFile = currentAttachment.content;
        finalContent = `${finalContent}\n\nFile "${currentAttachment.fileName}" telah di-upload. File ini berisi ${
          currentAttachment.mediaCategory === "image"
            ? "gambar"
            : currentAttachment.mediaCategory === "video"
            ? "video"
            : currentAttachment.mediaCategory === "audio"
            ? "audio"
            : "dokumen"
        }.`;
        displayContent = `${
          currentAttachment.mediaCategory === "image"
            ? "🖼️"
            : currentAttachment.mediaCategory === "video"
            ? "🎬"
            : currentAttachment.mediaCategory === "audio"
            ? "🎵"
            : "📎"
        } [File Terlampir: ${currentAttachment.fileName}]\n\n${textInput}`;
      }
    }

    // ─── Send ke puter.ai ─────────────────────────────────────────────────
    const userMessage: Message = {
      role: "user",
      content: finalContent,
      displayContent,
    };

    const newMessages = [...(Array.isArray(messages) ? messages : []), userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let response: any;
      const aiOptions = {
        stream: true,
        model:
          selectedModel && selectedModel.trim() !== ""
            ? selectedModel
            : undefined,
        signal,
      };

      if (mediaFile) {
        const currentAttachmentPayload = currentAttachment as AIFilePayload;
        const modelSupportsVisionCapability =
          modelSupportsVision(selectedModel);

        if (!modelSupportsVisionCapability) {
          finalContent = `File "${currentAttachmentPayload.fileName}" telah di-upload, namun model yang dipilih (${selectedModel}) tidak mendukung analisis media.\n\nPertanyaan saya: ${
            textInput ||
            `Tolong jelaskan isi file ${currentAttachmentPayload.fileName}.`
          }`;
          mediaFile = null;
        }
      }

      if (mediaFile) {
        response = await awaitWithAbort(
          puter.ai.chat(finalContent, mediaFile, aiOptions),
          signal
        );
      } else {
        const safeChatHistory = [
          { role: "system", content: getSystemPrompt() },
          ...newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ];
        response = await awaitWithAbort(
          puter.ai.chat(safeChatHistory, aiOptions),
          signal
        );
      }

      if (response == null) {
        throw new Error("Tidak ada respons dari AI. Coba lagi.");
      }

      setMessages((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [...safePrev, { role: "assistant", content: "" }];
      });
      let fullResponse = "";

      if (typeof response[Symbol.asyncIterator] === "function") {
        let lastUpdateTime = Date.now();
        const UPDATE_INTERVAL = 50; // Update UI every 50ms max
        
        for await (const part of response) {
          if (signal.aborted) break;
          if (part == null) continue;

          const text =
            typeof part?.text === "string"
              ? part.text
              : typeof part?.message?.content === "string"
              ? part.message.content
              : typeof part?.choices?.[0]?.delta?.content === "string"
              ? part.choices[0].delta.content
              : null;

          if (text) {
            fullResponse += text;
            const now = Date.now();
            // Throttle UI updates to prevent excessive re-renders
            if (now - lastUpdateTime >= UPDATE_INTERVAL) {
              lastUpdateTime = now;
              setMessages((prev) => {
                if (signal.aborted) return prev;
                const safePrev = Array.isArray(prev) ? prev : [];
                const updated = [...safePrev];
                if (updated.length > 0) {
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullResponse,
                  };
                }
                return updated;
              });
            }
          }
        }
        // Final update to ensure all content is shown
        if (!signal.aborted) {
          setMessages((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const updated = [...safePrev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: fullResponse,
              };
            }
            return updated;
          });
        }
      } else if (typeof response?.message?.content === "string") {
        fullResponse = response.message.content;
        setMessages((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const updated = [...safePrev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: fullResponse,
            };
          }
          return updated;
        });
      } else if (typeof response === "string") {
        fullResponse = response;
        setMessages((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const updated = [...safePrev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: fullResponse,
            };
          }
          return updated;
        });
      }

      if (!fullResponse.trim()) {
        setMessages((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const updated = [...safePrev];
          if (
            updated.length > 0 &&
            updated[updated.length - 1].role === "assistant"
          ) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: "_(Tidak ada respons dari model. Coba lagi.)_",
            };
          }
          return updated;
        });
      }
    } catch (error: any) {
      const isAbortError =
        error instanceof Error && error.name === "AbortError";
      const errorMessage = isAbortError
        ? "Permintaan dibatalkan."
        : error instanceof Error
        ? error.message
        : error?.message
        ? error.message
        : error?.error?.message
        ? error.error.message
        : typeof error === "string"
        ? error
        : JSON.stringify(error);

      console.error("[handleSubmit] Error:", errorMessage);

      setMessages((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const lastMessage = safePrev[safePrev.length - 1];
        if (
          lastMessage &&
          lastMessage.role === "assistant" &&
          lastMessage.content === ""
        ) {
          const updated = [...safePrev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: isAbortError
                ? "🛑 Permintaan dibatalkan."
                : `❌ Error: ${errorMessage}`,
            };
          }
          return updated;
        }
        return [
          ...safePrev,
          {
            role: "assistant",
            content: isAbortError
              ? "🛑 Permintaan dibatalkan."
              : `❌ Error: ${errorMessage}`,
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    chatHistory,
    isLoading,
    user,
    isAuthChecking,
    selectedModel,
    activeMenu,
    sidebarOpen,
    theme,
    setTheme,
    scrollAreaRef,
    toggleSidebar,
    handleMenuChange,
    handleModelChange,
    handleLogin,
    handleLogout,
    handleNewChat,
    handleSelectHistory,
    handleSubmit,
    handleCancel,
  };
}