import { useState, useEffect, useCallback } from "react";
import { User, LogOut, Fingerprint, Activity, Loader2, RefreshCw, TrendingUp, Wallet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import puter from "@heyputer/puter.js";
import type { UserType } from "@/hooks/useDashboardApp";

interface ProfileProps {
  user: UserType;
  onLogout: () => void;
}

export default function Profile({ user, onLogout }: ProfileProps) {
  const [usage, setUsage] = useState<any>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsage = useCallback(async (showRefreshAnim = false) => {
    if (showRefreshAnim) setIsRefreshing(true);
    else setIsLoadingUsage(true);
    try {
      const data = await puter.auth.getMonthlyUsage();
      setUsage(data);
    } catch (error) {
      console.error("Gagal mengambil data penggunaan bulanan:", error);
    } finally {
      setIsLoadingUsage(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchUsage();
  }, [user, fetchUsage]);

  if (!user) return null;

  const displayUserId = user.uuid ?? user.id ?? "N/A";
  const lastActive = user.last_activity_ts ? new Date(user.last_activity_ts * 1000).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : null;
  const emailConfirmed =
    user.email_confirmed === true
      ? "Ya"
      : user.email_confirmed === false
      ? "Tidak"
      : user.requires_email_confirmation === false
      ? "Ya"
      : user.requires_email_confirmation === true
      ? "Tidak"
      : "Tidak tersedia";
  const subscriptionStatus = user.subscribed === true ? "Aktif" : user.subscribed === false ? "Tidak aktif" : "Tidak tersedia";
  const allowance = usage?.allowanceInfo?.monthUsageAllowance ?? 0;
  const remaining = usage?.allowanceInfo?.remaining ?? 0;
  const usedFromQuota = allowance > 0 ? Math.max(0, allowance - remaining) : 0;
  const quotaPercent = allowance > 0 ? Math.min(100, (usedFromQuota / allowance) * 100) : 0;
  const totalCost = typeof usage?.total === "number" ? usage.total : 0;

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profil &amp; Penggunaan</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola akun dan pantau penggunaan API Puter Anda.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsage(true)}
            disabled={isLoadingUsage || isRefreshing}
            className="gap-1.5 text-xs h-9 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Memperbarui..." : "Refresh Data"}
          </Button>
        </div>

        {/* ─── CARD UTAMA (1 TABEL TERPADU) ─── */}
        <Card className="shadow-sm border-muted/50 overflow-hidden">

          {/* ══ BARIS ATAS: PROFIL USER ══ */}
          <CardHeader className="bg-muted/20 border-b pb-0 pt-6 px-4 md:px-6">
            {/* Layout: stack di phone, inline di sm+ */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5">
              {/* Avatar + Info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-background shadow-md shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-3xl font-bold">
                    {user.username?.substring(0, 2).toUpperCase() || <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-bold truncate" title={user.username}>
                    {user.username || "Tidak diketahui"}
                  </h2>
                  <p className="text-xs text-muted-foreground">Autentikasi via Puter.js</p>
                  {/* User ID — tampil di phone di bawah nama */}
                  <div className="flex flex-col gap-1 mt-2 sm:hidden text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono truncate max-w-[180px]" title={displayUserId}>{displayUserId}</span>
                    </div>
                    {user.email && (
                      <div className="truncate">
                        <span className="font-semibold text-foreground">Email:</span> {user.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User ID — tampil di sm+ sebagai pill */}
              <div className="hidden sm:flex items-center gap-2 bg-muted/40 border border-border/60 rounded-lg px-3 py-2 min-w-0 flex-1 max-w-xs">
                <Fingerprint className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">User ID</p>
                  <p className="text-xs font-mono truncate" title={displayUserId}>{displayUserId}</p>
                </div>
              </div>

              {/* Tombol Logout — push ke kanan di sm+ */}
              <Button
                variant="destructive"
                size="sm"
                className="gap-2 font-semibold shadow-sm sm:ml-auto shrink-0"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </Button>
            </div>

            {/* ══ DETAIL AKUN PUTER ══ */}
            <div className="grid gap-3 pb-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Akun Puter</p>
                <div className="space-y-2 text-sm text-foreground">
                  {user.email ? (
                    <div>
                      <span className="font-semibold">Email:</span> {user.email}
                    </div>
                  ) : null}
                  <div>
                    <span className="font-semibold">Aplikasi aktif:</span> {user.app_name || "Tidak tersedia"}
                  </div>
                  <div>
                    <span className="font-semibold">Status konfirmasi email:</span> {emailConfirmed}
                  </div>
                  <div>
                    <span className="font-semibold">Status langganan:</span> {subscriptionStatus}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Aktivitas</p>
                <div className="space-y-2 text-sm text-foreground">
                  <div>
                    <span className="font-semibold">Terakhir aktif:</span> {lastActive || "Tidak tersedia"}
                  </div>
                  <div>
                    <span className="font-semibold">Free storage:</span> {typeof user.actual_free_storage === "number" ? `${user.actual_free_storage} MB` : "Tidak tersedia"}
                  </div>
                  <div>
                    <span className="font-semibold">Paid storage:</span> {typeof user.paid_storage === "number" ? `${user.paid_storage} MB` : "Tidak tersedia"}
                  </div>
                  {user.referral_code ? (
                    <div>
                      <span className="font-semibold">Kode referral:</span> {user.referral_code}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ══ STATISTIK KUOTA ══ */}
            {usage?.allowanceInfo && !isLoadingUsage && (
              <div className="grid grid-cols-3 gap-3 pb-5">
                {/* Total Cost */}
                <div className="flex flex-col items-center sm:flex-row sm:items-center gap-2 bg-background border border-border/50 rounded-xl p-3 shadow-sm">
                  <TrendingUp className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1">Total Biaya</p>
                    <p className="text-base font-bold text-foreground">
                      ${usage.total?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || "0.00"}
                    </p>
                  </div>
                </div>

                {/* Sisa Kuota */}
                <div className="flex flex-col items-center sm:flex-row sm:items-center gap-2 bg-background border border-border/50 rounded-xl p-3 shadow-sm">
                  <Wallet className="w-5 h-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1">Sisa Kuota</p>
                    <p className="text-base font-bold text-green-500">
                      ${usage.allowanceInfo.remaining?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                    </p>
                  </div>
                </div>

                {/* Limit */}
                <div className="flex flex-col items-center sm:flex-row sm:items-center gap-2 bg-background border border-border/50 rounded-xl p-3 shadow-sm">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1">Limit Bulanan</p>
                    <p className="text-base font-bold text-foreground">
                      ${usage.allowanceInfo.monthUsageAllowance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ══ RESOURCE USAGE — progress kuota ══ */}
            {usage?.allowanceInfo && !isLoadingUsage && allowance > 0 && (
              <div className="space-y-3 pb-6 border-t pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Penggunaan sumber daya (kuota bulanan)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Perkiraan terpakai dari limit yang ditetapkan untuk periode ini.
                    </p>
                  </div>
                  <span className="text-sm font-mono font-semibold tabular-nums shrink-0">
                    {quotaPercent.toFixed(1)}% terpakai
                  </span>
                </div>
                <Progress
                  value={quotaPercent}
                  className="h-2.5"
                  indicatorClassName={
                    quotaPercent >= 90
                      ? "bg-destructive"
                      : quotaPercent >= 70
                        ? "bg-amber-500 dark:bg-amber-500"
                        : "bg-primary"
                  }
                />
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Terpakai:{" "}
                    <span className="font-medium text-foreground">
                      ${usedFromQuota.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </span>
                  <span>
                    Sisa:{" "}
                    <span className="font-medium text-foreground">
                      ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </span>
                  <span>
                    Limit:{" "}
                    <span className="font-medium text-foreground">
                      ${allowance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </CardHeader>

          {/* ══ BODY: TABEL RINCIAN PENGGUNAAN ══ */}
          <CardContent className="p-0">
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b bg-muted/10">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Rincian Penggunaan Layanan API</span>
              <span className="text-xs text-muted-foreground ml-auto">Bulan ini</span>
            </div>

            {isLoadingUsage ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                <p className="text-sm animate-pulse">Mengambil data dari server...</p>
              </div>
            ) : usage?.usage && typeof usage.usage === 'object' && Object.keys(usage.usage).length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left border-collapse min-w-[640px]">
                  <thead className="bg-muted/60 text-muted-foreground sticky top-0 z-10">
                    <tr>
                      <th className="px-4 md:px-6 py-3 font-semibold border-b whitespace-nowrap">#</th>
                      <th className="px-4 md:px-6 py-3 font-semibold border-b whitespace-nowrap">Model Service</th>
                      <th className="px-4 md:px-6 py-3 font-semibold border-b text-right whitespace-nowrap">Cost ($)</th>
                      <th className="px-4 md:px-6 py-3 font-semibold border-b min-w-[140px] whitespace-nowrap">
                        Bagian dari total
                      </th>
                      <th className="px-4 md:px-6 py-3 font-semibold border-b text-right whitespace-nowrap">Count</th>
                      <th className="px-4 md:px-6 py-3 font-semibold border-b text-right whitespace-nowrap">Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(usage.usage || {}).map(([serviceName, details]: [string, any], idx) => {
                      const cost = typeof details.cost === "number" ? details.cost : 0;
                      const sharePct =
                        totalCost > 0 ? Math.min(100, Math.max(0, (cost / totalCost) * 100)) : 0;
                      return (
                        <tr key={serviceName} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-4 md:px-6 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-4 md:px-6 py-3 font-mono text-xs md:text-sm text-foreground/90 break-all">
                            {serviceName}
                          </td>
                          <td className="px-4 md:px-6 py-3 text-right font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                            ${details.cost?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td className="px-4 md:px-6 py-3 align-middle">
                            <div className="flex items-center gap-2 max-w-[200px]">
                              <Progress
                                value={sharePct}
                                className="h-1.5 flex-1 min-w-0"
                                indicatorClassName="bg-primary/80"
                              />
                              <span className="text-[10px] text-muted-foreground tabular-nums w-9 text-right shrink-0">
                                {sharePct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 text-right text-muted-foreground group-hover:text-foreground transition-colors">
                            {details.count?.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 md:px-6 py-3 text-right text-muted-foreground group-hover:text-foreground transition-colors">
                            {details.units?.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* ── FOOTER TABEL: Total per App ── */}
                  {usage?.appTotals && typeof usage.appTotals === 'object' && Object.keys(usage.appTotals).length > 0 && (
                    <tfoot className="bg-muted/40 border-t-2 border-border">
                      <tr>
                        <td colSpan={6} className="px-4 md:px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Total per Aplikasi
                        </td>
                      </tr>
                      {Object.entries(usage.appTotals || {}).map(([appId, appData]: [string, any]) => (
                        <tr key={appId} className="border-t border-border/30">
                          <td className="px-4 md:px-6 py-2 text-xs text-muted-foreground" />
                          <td className="px-4 md:px-6 py-2 font-mono text-xs text-muted-foreground truncate max-w-[200px]" title={appId}>
                            {appId === "others" ? "Lainnya (Others)" : appId}
                          </td>
                          <td className="px-4 md:px-6 py-2 text-right font-mono text-xs font-semibold text-foreground">
                            ${appData.total?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td className="px-4 md:px-6 py-2 text-right text-xs text-muted-foreground">
                            {appData.count?.toLocaleString("id-ID")}x
                          </td>
                          <td />
                        </tr>
                      ))}
                    </tfoot>
                  )}
                </table>
              </div>
            ) : !isLoadingUsage ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground bg-muted/50 px-6 py-4 rounded-lg text-center border">
                  Belum ada rincian penggunaan layanan API bulan ini.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          Built with Puter.js. <a href="https://developer.puter.com" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">Powered by Puter</a>.
        </div>
      </div>
    </div>
  );
}