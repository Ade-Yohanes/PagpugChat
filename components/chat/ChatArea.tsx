import { Bot, User, Send } from "lucide-react";
import { Message } from "@/types";

interface ChatAreaProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
}

export default function ChatArea({ messages, input, setInput, onSendMessage }: ChatAreaProps) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  return (
    <div className="flex-1 flex flex-col relative bg-gray-100">

      {/* Daftar Pesan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {safeMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Mulai percakapan baru...
          </div>
        ) : (
          safeMessages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && <Bot className="bg-blue-100 p-1 rounded-full text-blue-600" />}
              <div className={`p-3 rounded-lg max-w-lg ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800 shadow"}`}>
                {msg.content}
              </div>
              {msg.role === "user" && <User className="bg-gray-200 p-1 rounded-full text-gray-600" />}
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
            className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ketik pesan..."
          />
          <button 
            onClick={onSendMessage} 
            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

    </div>
  );
}