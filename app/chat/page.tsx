"use client";

import React, { useState } from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const chatId = "my-unique-chat-id";

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: "user", content: input }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          chat_id: chatId,
        }),
      });

      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const submitYoutube = async () => {
    if (!youtubeUrl.trim()) return;

    setSummary("");
    setSummaryLoading(true);

    try {
      const res = await fetch("http://localhost:5000/process-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
      } else if (data.error) {
        setSummary(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Error:", err);
      setSummary("An error occurred.");
    } finally {
      setSummaryLoading(false);
    }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 flex flex-col space-y-6">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Sparky Chat & Summarizer
        </h1>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span className="text-indigo-600">💬</span> Chat
          </h2>
          <div className="flex-1 flex flex-col space-y-4 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-xl">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message-animate max-w-[80%] ${
                  msg.role === "user" ? "self-end" : "self-start"
                }`}
              >
                <div
                  className={`p-4 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none shadow-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1 block">
                  {msg.role === "user" ? "You" : "Sparky"}
                </span>
              </div>
            ))}
            {loading && (
              <div className="self-start">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              className="flex-1 p-3 border text-black border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <span>Send</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-6"></div>

        {/* YouTube Summarizer Section */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span className="text-indigo-600">🎥</span> YouTube Video Summarizer
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="flex-1 p-3 border text-black border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL..."
              onKeyDown={(e) => {
                if (e.key === "Enter") submitYoutube();
              }}
            />
            <button
              onClick={submitYoutube}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              disabled={summaryLoading}
            >
              <span>Summarize</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {summaryLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}

          {summary && (
            <div className="p-6 bg-white rounded-xl shadow-md message-animate">
              <h3 className="text-lg font-semibold mb-3 text-indigo-600">Summary</h3>
              <div className="prose prose-indigo max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
