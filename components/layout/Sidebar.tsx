"use client";

import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  LogOut,
  Plus,
  User,
  Cpu,
  Folder,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatHistoryItem, Message } from "@/types";

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  user: any;
  handleLogout: () => void;
  chatHistory?: ChatHistoryItem[];
  onNewChat?: () => void;
  onSelectHistory?: (messages: Message[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  theme,
  setTheme,
  user,
  handleLogout,
  chatHistory = [],
  onNewChat,
  onSelectHistory,
  isOpen,
  onToggle,
}: SidebarProps) {
  const safeChatHistory = Array.isArray(chatHistory) ? chatHistory : [];
  const hasChatHistory = safeChatHistory.length > 0;
  const navItems = [
    { id: "chat", label: "Chat AI", icon: MessageSquare },
    { id: "workers", label: "Workers", icon: Cpu },
    { id: "files", label: "Files", icon: Folder },
    { id: "text2image", label: "Text2Image", icon: Cpu },
    { id: "text2video", label: "Text2Video", icon: Cpu },
    { id: "text2video-test", label: "Text2Video Test", icon: Cpu },
    { id: "profile", label: "Profil Saya", icon: User },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <>
      {/* ── Overlay Mobile ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside
        className={`
          fixed md:relative z-30 md:z-auto
          h-screen flex flex-col
          bg-muted/30 border-r
          transition-[width] duration-300 ease-in-out
          overflow-hidden shrink-0
          ${isOpen ? "w-64" : "w-0 md:w-[60px]"}
        `}
      >
        {/* ─── HEADER ─── */}
        <div className="h-16 flex items-center border-b shrink-0 px-2">
          {isOpen ? (
            /* EXPANDED: logo + tombol tutup */
            <>
              <div className="flex items-center gap-2 font-bold text-base text-foreground flex-1 pl-2 overflow-hidden">
                <LayoutDashboard className="w-5 h-5 text-primary shrink-0" />
                <span className="whitespace-nowrap truncate">Pagpug AI</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                title="Sembunyikan sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </Button>
            </>
          ) : (
            /* COLLAPSED: hanya tombol buka (tengah) */
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="mx-auto text-muted-foreground hover:text-foreground"
              title="Tampilkan sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* ─── NAVIGASI ─── */}
        <nav className="p-2 flex flex-col gap-1 shrink-0">
          {navItems.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeMenu === id ? "secondary" : "ghost"}
              className={`w-full gap-3 ${isOpen ? "justify-start px-3" : "justify-center px-0"}`}
              onClick={() => setActiveMenu(id)}
              title={label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {isOpen && (
                <span className="whitespace-nowrap overflow-hidden text-sm">{label}</span>
              )}
            </Button>
            
          ))}
        </nav>

        {/* ─── RIWAYAT CHAT (hanya saat open) ─── */}
        {isOpen && (
          <div className="flex-1 flex flex-col overflow-hidden border-t px-2 py-3 min-h-0">
            <Button
              onClick={onNewChat}
              className="w-full justify-start gap-2 mb-3"
              size="sm"
            >
              <Plus size={15} />
              <span>New Chat</span>
            </Button>

            <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-wider px-1 shrink-0">
              Recent Chats
            </p>

            <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
              {!hasChatHistory ? (
                <div className="text-xs text-muted-foreground italic px-1">Belum ada riwayat...</div>
              ) : (
                safeChatHistory.map((chat: ChatHistoryItem) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    onClick={() => onSelectHistory && onSelectHistory(chat.messages)}
                    className="w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground font-normal text-sm h-auto py-1.5"
                  >
                    <MessageSquare size={13} className="shrink-0" />
                    <span className="truncate text-left leading-snug">{chat.title}</span>
                  </Button>
                ))
              )}
            </div>
          </div>
        )}

        {/* spacer collapsed mode */}
        {!isOpen && <div className="flex-1" />}

        {/* ─── BAGIAN BAWAH: Tema & User ─── */}
        <div className="border-t p-2 flex flex-col gap-2 shrink-0">
          {/* Toggle Tema */}
          <div className={`flex items-center gap-2 ${isOpen ? "justify-between px-1" : "justify-center"}`}>
            {isOpen && (
              <span className="text-xs font-medium text-muted-foreground">Tema</span>
            )}
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 shrink-0 relative"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle tema"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          {/* User Info */}
          <div className={`flex items-center bg-card rounded-lg border shadow-sm ${isOpen ? "p-2 gap-2" : "p-1.5 justify-center"}`}>
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            {isOpen && (
              <>
                <span className="text-xs font-medium truncate flex-1">
                  {user?.username}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 w-7 h-7"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}