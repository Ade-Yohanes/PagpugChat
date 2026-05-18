"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";
import { LayoutDashboard, Bot, LogIn, Loader2, PanelLeftOpen } from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import ModelSelector from "@/components/chat/ModelSelector";
import SettingsPanel from "@/components/user/SettingsPanel";
import Profile from "@/components/user/Profile";
import WorkersDashboard from "@/components/dashboard/WorkersDashboard";
import FileSystemBrowser from "@/components/files/FileSystemBrowser";
import Text2Video from "@/components/media/Text2VideoWithOption";
import Text2VideoTest from "@/components/media/Text2VideoTest";
import Text2Image from "@/components/media/Text2Image";
import ChatInputArea from "@/components/chat/ChatInputArea";
import ChatMessages from "@/components/chat/ChatMessages";

import { useDashboardApp } from "@/hooks/useDashboardApp";

export default function DashboardApp() {
  const {
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
  } = useDashboardApp();

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md bg-card border rounded-xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <LayoutDashboard className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Pagpug AI</h1>
            <p className="text-muted-foreground mt-2">Silakan login dengan akun Pagpug AI Anda.</p>
          </div>
          <Button onClick={handleLogin} className="w-full gap-2">
            <LogIn className="w-4 h-4" /> Login dengan Pagpug AI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Toaster />
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={handleMenuChange}
        theme={theme}
        setTheme={setTheme as (theme: string) => void}
        user={user}
        handleLogout={handleLogout}
        chatHistory={chatHistory}
        onNewChat={handleNewChat}
        onSelectHistory={handleSelectHistory}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      <main className="flex-1 flex flex-col h-full min-h-0 relative">
        {activeMenu === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0 w-full bg-background">
            <header className="flex items-center justify-between border-b px-4 md:px-6 py-3 bg-background/80 backdrop-blur-md z-10 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={toggleSidebar}
                  title={sidebarOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"}
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </Button>
                <Bot className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold m-0">Sesi Chat</h2>
              </div>
              <ModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} />
            </header>

            <div className="flex-1 overflow-hidden bg-background">
              <ScrollArea ref={scrollAreaRef} className="h-full">
                <ChatMessages messages={messages} />
              </ScrollArea>
            </div>

            <ChatInputArea
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
              selectedModel={selectedModel}
            />
          </div>
        ) : activeMenu === "workers" ? (
          <WorkersDashboard user={user} onToggleSidebar={toggleSidebar} />
        ) : activeMenu === "files" ? (
          <FileSystemBrowser user={user} isAuthChecking={isAuthChecking} />
        ) : activeMenu === "text2image" ? (
          <Text2Image user={user} />
        ) : activeMenu === "text2video" ? (
          <Text2Video user={user} />
        ) : activeMenu === "text2video-test" ? (
          <Text2VideoTest user={user} />
        ) : activeMenu === "profile" ? (
          <Profile user={user} onLogout={handleLogout} />
        ) : (
          <SettingsPanel selectedModel={selectedModel} onModelChange={handleModelChange} />
        )}
      </main>
    </div>
  );
}
