"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  Loader2,
  RefreshCw,
  Plus,
  ExternalLink,
  Copy,
  Info,
  Trash2,
  PanelLeftOpen,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listWorkers,
  getWorker,
  deleteWorker,
  deployWorkerFromSource,
  execWorker,
  type WorkerInfo,
} from "@/lib/puter-workers";

const DEFAULT_ROUTER_CODE = `router.get('/api/hello', async (event) => {
  return 'Hello from worker!';
});
`;

const WORKER_NAME_RE = /^[a-zA-Z0-9_-]+$/;

function safeFilePathForWorker(workerName: string): string {
  const slug = workerName.replace(/[^a-zA-Z0-9_-]/g, "_") || "worker";
  return `workers/${slug}.js`;
}

function joinWorkerUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

interface WorkersDashboardProps {
  user: { username?: string } | null;
  onToggleSidebar?: () => void;
}

export default function WorkersDashboard({ user, onToggleSidebar }: WorkersDashboardProps) {
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState(DEFAULT_ROUTER_CODE);
  const [creating, setCreating] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailWorker, setDetailWorker] = useState<WorkerInfo | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [execOpen, setExecOpen] = useState(false);
  const [execWorkerInfo, setExecWorkerInfo] = useState<WorkerInfo | null>(null);
  const [execPath, setExecPath] = useState("/api/hello");
  const [execResult, setExecResult] = useState<string | null>(null);
  const [execStatus, setExecStatus] = useState<number | null>(null);
  const [execLoading, setExecLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await listWorkers();
      setWorkers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const openDetail = async (name: string) => {
    setDetailOpen(true);
    setDetailWorker(null);
    setDetailLoading(true);
    try {
      const w = await getWorker(name);
      setDetailWorker(w ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!WORKER_NAME_RE.test(trimmed)) {
      setError("Nama worker hanya boleh huruf, angka, tanda hubung, dan garis bawah.");
      return;
    }
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const path = safeFilePathForWorker(trimmed);
      await deployWorkerFromSource(trimmed, newCode, path);
      setSuccess(`Worker "${trimmed}" sedang di-deploy. Propagasi bisa memakan 5–30 detik.`);
      setCreateOpen(false);
      setNewName("");
      setNewCode(DEFAULT_ROUTER_CODE);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteWorker(deleteTarget);
      setSuccess(`Worker "${deleteTarget}" dihapus.`);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Disalin ke clipboard.");
    } catch {
      setError("Gagal menyalin.");
    }
  };

  const openExec = (w: WorkerInfo) => {
    setExecWorkerInfo(w);
    setExecPath("/api/hello");
    setExecResult(null);
    setExecStatus(null);
    setExecOpen(true);
  };

  const runExec = async () => {
    if (!execWorkerInfo) return;
    setExecLoading(true);
    setExecResult(null);
    setExecStatus(null);
    setError(null);
    try {
      const url = joinWorkerUrl(execWorkerInfo.url, execPath);
      const res = await execWorker(url);
      setExecStatus(res.status);
      const text = await res.text();
      setExecResult(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExecLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-background">
      <header className="flex items-center justify-between border-b px-4 md:px-6 py-3 bg-background/80 backdrop-blur-md z-10 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              onClick={onToggleSidebar}
              title="Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </Button>
          )}
          <Cpu className="w-5 h-5 text-primary shrink-0" />
          <h2 className="text-lg font-semibold m-0 truncate">Workers</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => load()}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Muat ulang
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Worker baru
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 h-full min-h-0">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertTitle>Berhasil</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Card className="shadow-sm border-muted/50 flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-base">Daftar worker</CardTitle>
              <CardDescription>
                Deploy dari file di Puter FS. Maks. 10MB per worker; akun memerlukan email
                terverifikasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-0 flex flex-col">
              {loading ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
              ) : (!Array.isArray(workers) || workers.length === 0) ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Belum ada worker. Buat worker baru untuk memulai.
                </p>
              ) : (
                <ScrollArea className="flex-1 min-h-[200px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead className="hidden md:table-cell">URL</TableHead>
                        <TableHead className="hidden lg:table-cell">File</TableHead>
                        <TableHead className="hidden xl:table-cell">Dibuat</TableHead>
                        <TableHead className="text-right w-[200px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workers.map((w) => (
                        <TableRow key={w.name}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col gap-0.5">
                              <span>{w.name}</span>
                              <span className="text-xs text-muted-foreground md:hidden truncate max-w-[200px]">
                                {w.url}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[240px]">
                            <span className="truncate block text-muted-foreground" title={w.url}>
                              {w.url}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                            {w.file_path}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-muted-foreground text-xs whitespace-normal">
                            {w.created_at}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Buka URL"
                                onClick={() => window.open(w.url, "_blank", "noopener,noreferrer")}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Salin URL"
                                onClick={() => copyText(w.url)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Detail"
                                onClick={() => openDetail(w.name)}
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Uji (exec)"
                                onClick={() => openExec(w)}
                              >
                                <FlaskConical className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Hapus"
                                onClick={() => setDeleteTarget(w.name)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!creating}>
          <DialogHeader>
            <DialogTitle>Worker baru</DialogTitle>
            <DialogDescription>
              Kode harus memakai objek <Badge variant="secondary">router</Badge> seperti di dokumentasi
              Puter Workers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="worker-name">Nama worker</Label>
              <Input
                id="worker-name"
                placeholder="my-api"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={creating}
              />
              <p className="text-xs text-muted-foreground">
                File akan disimpan di{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  {newName.trim() ? safeFilePathForWorker(newName.trim()) : "workers/… .js"}
                </code>
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="worker-code">Kode router</Label>
              <Textarea
                id="worker-code"
                className="font-mono text-xs min-h-[180px]"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                disabled={creating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail worker</DialogTitle>
            <DialogDescription>Informasi dari puter.workers.get()</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : detailWorker ? (
            <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-[320px]">
              {JSON.stringify(detailWorker, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">Worker tidak ditemukan.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={execOpen} onOpenChange={setExecOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Uji worker (puter.workers.exec)</DialogTitle>
            <DialogDescription>
              Menyertakan sesi pengguna. Gabungkan URL worker dengan path di bawah.
            </DialogDescription>
          </DialogHeader>
          {execWorkerInfo && (
            <div className="grid gap-3 text-sm">
              <p className="text-muted-foreground break-all">Base: {execWorkerInfo.url}</p>
              <div className="grid gap-2">
                <Label htmlFor="exec-path">Path</Label>
                <Input
                  id="exec-path"
                  value={execPath}
                  onChange={(e) => setExecPath(e.target.value)}
                  disabled={execLoading}
                  placeholder="/api/hello"
                />
              </div>
              {execStatus !== null && (
                <Badge variant={execStatus < 400 ? "default" : "destructive"}>HTTP {execStatus}</Badge>
              )}
              {execResult !== null && (
                <pre className="text-xs bg-muted/50 rounded-lg p-3 max-h-[200px] overflow-auto whitespace-pre-wrap">
                  {execResult}
                </pre>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecOpen(false)} disabled={execLoading}>
              Tutup
            </Button>
            <Button onClick={runExec} disabled={execLoading || !execWorkerInfo}>
              {execLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Jalankan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus worker?</AlertDialogTitle>
            <AlertDialogDescription>
              Worker <strong>{deleteTarget}</strong> akan dihapus dan tidak bisa dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
