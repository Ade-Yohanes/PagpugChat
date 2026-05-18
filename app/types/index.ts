export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type ChatHistoryItem = {
  id: number;
  title: string;
  messages: Message[];
};