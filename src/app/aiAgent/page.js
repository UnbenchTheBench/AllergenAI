"use client";

import { useState } from "react";

export default function AIAgentPage() {
  const [messages, setMessages] = useState([
    { sender: "agent", text: "Hi there 👋 I’m your AI Agent. I have access to your allergy and symptom details, as well as real-time weather and allergy conditions. What would you like me to help you with today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call your Gemini backend route (to hide API key from frontend!)
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: data.reply || "Hmm, I couldn’t generate a response." }
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "agent", text: "⚠️ Sorry, something went wrong." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full h-[85vh] max-w-5xl bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 text-lg font-semibold">
          🤖 AI Agent
        </div>
  
        
        {/* Messages */}
<div className="flex-1 overflow-hidden flex flex-col justify-end">
  <div className="p-6 overflow-y-auto">
    {messages.map((msg, idx) => (
      <div
        key={idx}
        className={`flex ${
          msg.sender === "user" ? "justify-end" : "justify-start"
        } mb-4`}
      >
        <div
          className={`max-w-xs px-4 py-2 rounded-2xl shadow ${
            msg.sender === "user"
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-gray-100 text-gray-800 rounded-bl-none"
          }`}
        >
          {msg.text}
        </div>
      </div>
    ))}

    {loading && (
      <div className="text-gray-500 text-sm animate-pulse mb-4">
        AI Agent is typing...
      </div>
    )}
  </div>
</div>
           
      {/* Input */}
        <div className="border-t p-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
