"use client";

import { useRef, useState, memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  displayContent?: string;
};

const PreBlock = ({ children, ...props }: any) => {
  let language = "text";
  let text = "";

  if (children && typeof children === "object" && "props" in children) {
    const childProps = children.props;
    const className = childProps.className || "";
    const match = /language-(\w+)/.exec(className);
    if (match) {
      language = match[1];
    }

    if (typeof childProps.children === "string") {
      text = childProps.children;
    } else if (Array.isArray(childProps.children)) {
      text = childProps.children.join("");
    } else {
      text = String(childProps.children || "");
    }
  } else {
    text = String(children || "");
  }

  text = text.replace(/\n$/, "");

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="my-4 w-full border border-zinc-800 rounded-md overflow-hidden shadow-sm bg-[#1E1E1E]">
      <div className="flex justify-between items-center bg-black/40 px-4 py-2 border-b border-white/10">
        <span className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-2">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 border border-white/10 shadow-sm px-2 py-1 rounded-md transition-colors"
        >
          {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {isCopied ? <span className="text-green-500">Tersalin!</span> : "Salin"}
        </button>
      </div>
      <div className="text-sm font-mono overflow-x-auto">
        <SyntaxHighlighter
          language={language === "text" ? "javascript" : language}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: "1rem", background: "transparent" }}
          PreTag="div"
        >
          {text}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const TableWrapper = ({ children, ...props }: any) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!tableRef.current) return;
    const rows = Array.from(tableRef.current.querySelectorAll("tr"));
    const tsv = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        return cells.map((cell) => cell.textContent?.trim().replace(/\t/g, " ")).join("\t");
      })
      .join("\n");

    navigator.clipboard.writeText(tsv);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="my-4 w-full border rounded-md bg-card overflow-hidden shadow-sm">
      <div className="flex justify-between items-center bg-muted/30 px-4 py-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
          Data Tabel
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-background border shadow-sm px-2 py-1 rounded-md transition-colors"
        >
          {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {isCopied ? <span className="text-green-500">Tersalin!</span> : "Salin Tabel"}
        </button>
      </div>
      <div className="overflow-x-auto p-0">
        <table ref={tableRef} className="w-full divide-y divide-border m-0 text-sm" {...props}>
          {children}
        </table>
      </div>
    </div>
  );
};

const MarkdownComponents = {
  pre: PreBlock,
  code: ({ children, ...props }: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-foreground" {...props}>
      {children}
    </code>
  ),
  table: TableWrapper,
  thead: ({ children }: any) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left text-sm font-bold text-foreground border-b">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 text-sm text-muted-foreground border-b">{children}</td>
  ),
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
  a: ({ children, href }: any) => (
    <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-4 bg-muted/20 py-2 rounded-r-md">
      {children}
    </blockquote>
  ),
};

const ChatMessages = memo(function ChatMessages({ messages }: { messages?: Message[] }) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  return (
    <div className="max-w-4xl mx-auto w-full px-4 md:px-6 flex flex-col gap-8 py-8">
      {safeMessages.length === 0 ? (
        <div className="text-center text-muted-foreground mt-20 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-2xl mb-2">Apa yang bisa saya bantu hari ini?</h3>
          <p className="text-sm">Pilih model di kanan atas dan ketikkan pertanyaan Anda.</p>
        </div>
      ) : (
        safeMessages.map((m, index) => (
          <div key={index} className={`flex gap-4 w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role !== "user" && (
              <Avatar className="w-8 h-8 shrink-0 mt-1 border shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary"><Bot className="w-4 h-4" /></AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[85%] rounded-3xl px-5 py-3 text-sm md:text-base overflow-x-auto ${
                m.role === "user" ? "bg-muted text-foreground" : "bg-transparent text-foreground px-0"
              }`}
            >
              {m.role === "assistant" && m.content === "" ? (
                <span className="flex gap-1.5 items-center h-6">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-150"></span>
                </span>
              ) : m.role === "assistant" ? (
                <div className="break-words w-full">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{m.displayContent || m.content}</div>
              )}
            </div>

            {m.role === "user" && (
              <Avatar className="w-8 h-8 shrink-0 mt-1 border shadow-sm">
                <AvatarFallback className="bg-muted text-foreground"><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))
      )}
    </div>
  );
});

ChatMessages.displayName = "ChatMessages";
export default ChatMessages;
