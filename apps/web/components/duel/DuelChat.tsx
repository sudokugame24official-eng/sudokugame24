import React, { useState, useEffect, useRef } from "react";
import { Send, Users } from "lucide-react";
import { PlayerIdentity } from "../PlayerIdentity";
import { cn } from "@/lib/utils";

export interface DuelChatMessage {
  userId: string;
  username: string;
  level: number;
  role: "PLAYER" | "SPECTATOR";
  message: string;
  timestamp: number;
}

interface DuelChatProps {
  messages: DuelChatMessage[];
  onSendMessage: (msg: string) => void;
  player1Id: string;
  player2Id: string;
}

export const DuelChat: React.FC<DuelChatProps> = ({
  messages,
  onSendMessage,
  player1Id,
  player2Id,
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto mt-6 bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col h-64 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="h-10 bg-secondary/30 flex items-center px-4 border-b border-white/5 shrink-0">
        <Users className="w-4 h-4 text-muted-foreground mr-2" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Duel Chat
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col">
        {messages.map((msg, idx) => {
          const isPlayer = msg.role === "PLAYER";
          const isP1 = msg.userId === player1Id;
          const isP2 = msg.userId === player2Id;

          return (
            <div key={idx} className="text-sm">
              <span className="mr-2">
                {isPlayer ? (
                  <span
                    className={cn(
                      "font-bold drop-shadow-md",
                      isP1
                        ? "text-red-400"
                        : isP2
                          ? "text-blue-400"
                          : "text-white",
                    )}
                  >
                    <PlayerIdentity
                      username={msg.username}
                      level={msg.level}
                      size="sm"
                      className="inline-flex"
                    />
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center gap-1 inline-flex">
                    <Users className="w-3 h-3" />
                    <PlayerIdentity
                      username={msg.username}
                      level={msg.level}
                      size="sm"
                      className="inline-flex"
                    />
                  </span>
                )}
              </span>
              <span className="text-gray-200">{msg.message}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-secondary/20 border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Écrire un message..."
            className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
