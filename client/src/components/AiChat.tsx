/*
 * AI Chat — Nexus Networks
 * ────────────────────────
 * AI chatbot powered by Google Gemini (free tier)
 * Messenger-style conversation with AI assistant
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Sparkles, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AiConversation {
  id: string;
  title: string;
  messages: AiMessage[];
  createdAt: string;
}

// Gemini API configuration (free tier)
const GEMINI_API_KEY = "AIzaSyBMVEBOhfOuVvnhxNf3LCz3B0MYMEF8mFo";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export default function AiChat({ fullScreen }: { fullScreen?: boolean } = {}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AiConversation[]>(() => {
    const saved = localStorage.getItem("nexus-ai-conversations");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeConversation, setActiveConversation] = useState<AiConversation | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem("nexus-ai-conversations", JSON.stringify(conversations));
  }, [conversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const createNewConversation = () => {
    const newConv: AiConversation = {
      id: `ai-${Date.now()}`,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv);
    setShowConversationList(false);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
      setShowConversationList(true);
    }
  };

  const sendToGemini = useCallback(async (messages: AiMessage[]) => {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
    } catch (error: any) {
      console.error("Gemini API error:", error);
      return "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AiMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    let conv = activeConversation;
    if (!conv) {
      conv = {
        id: `ai-${Date.now()}`,
        title: input.trim().slice(0, 40),
        messages: [],
        createdAt: new Date().toISOString(),
      };
      setConversations((prev) => [conv!, ...prev]);
    }

    const updatedMessages = [...conv.messages, userMessage];
    const updatedConv = {
      ...conv,
      messages: updatedMessages,
      title: conv.messages.length === 0 ? input.trim().slice(0, 40) : conv.title,
    };

    setActiveConversation(updatedConv);
    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
    );
    setInput("");
    setIsLoading(true);
    setShowConversationList(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Call Gemini API
    const aiResponse = await sendToGemini(updatedMessages);

    const assistantMessage: AiMessage = {
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };

    const finalMessages = [...updatedMessages, assistantMessage];
    const finalConv = { ...updatedConv, messages: finalMessages };

    setActiveConversation(finalConv);
    setConversations((prev) =>
      prev.map((c) => (c.id === finalConv.id ? finalConv : c))
    );
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Render conversation list
  const renderConversationList = () => (
    <div className="h-full flex flex-col bg-white dark:bg-[#0D1117]">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-[#E6EDF3]">AI Chats</h1>
          <button
            onClick={createNewConversation}
            className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[13px] text-gray-500 dark:text-[#8B949E] mb-3">
          Chat with AI powered by Google Gemini
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-[15px] font-medium text-gray-700 dark:text-[#C9D1D9] mb-1">
                Start a conversation
              </p>
              <p className="text-[13px] text-gray-500 dark:text-[#8B949E]">
                Ask anything — coding, writing, ideas, or just chat!
              </p>
              <button
                onClick={createNewConversation}
                className="mt-4 px-5 py-2.5 bg-blue-500 text-white rounded-full text-[14px] font-medium hover:bg-blue-600 transition-colors"
              >
                New Chat
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#161B22] transition-colors cursor-pointer group"
                onClick={() => {
                  setActiveConversation(conv);
                  setShowConversationList(false);
                }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-gray-900 dark:text-[#E6EDF3] truncate">
                    {conv.title}
                  </p>
                  <p className="text-[13px] text-gray-500 dark:text-[#8B949E] truncate">
                    {conv.messages.length > 0
                      ? conv.messages[conv.messages.length - 1].content.slice(0, 40)
                      : "No messages yet"}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Render active chat
  const renderActiveChat = () => {
    if (!activeConversation) return renderConversationList();

    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#0D1117]">
        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-gray-100 dark:border-[#21262D] flex items-center gap-3">
          <button
            onClick={() => setShowConversationList(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-[#8B949E] hover:bg-gray-100 dark:hover:bg-[#161B22] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-gray-900 dark:text-[#E6EDF3] truncate">
              Gemini AI
            </p>
            <p className="text-[12px] text-green-500">Online</p>
          </div>
          <button
            onClick={createNewConversation}
            className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="px-3 py-4 space-y-3">
            {activeConversation.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <p className="text-[15px] font-medium text-gray-700 dark:text-[#C9D1D9] mb-1">
                  How can I help you today?
                </p>
                <p className="text-[13px] text-gray-500 dark:text-[#8B949E] max-w-xs">
                  I can help with coding, writing, research, brainstorming, and much more!
                </p>
              </div>
            )}

            {activeConversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-gray-100 dark:bg-[#161B22] text-gray-900 dark:text-[#E6EDF3] rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={cn(
                    "text-[11px] mt-1",
                    msg.role === "user" ? "text-blue-100" : "text-gray-400 dark:text-[#484F58]"
                  )}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-[#161B22] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="shrink-0 border-t border-gray-100 dark:border-[#21262D] bg-white dark:bg-[#0D1117] px-3 py-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemini anything..."
                rows={1}
                className="w-full resize-none bg-gray-100 dark:bg-[#161B22] rounded-[20px] px-4 py-2.5 text-[15px] text-gray-900 dark:text-[#E6EDF3] placeholder:text-gray-400 dark:placeholder:text-[#6E7681] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all max-h-[120px] leading-[1.35]"
                style={{ height: "auto", minHeight: "40px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors shrink-0 mb-0.5 disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return showConversationList ? renderConversationList() : renderActiveChat();
}
