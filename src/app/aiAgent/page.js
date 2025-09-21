"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function AIAgent() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (sender, text) => {
    const newMessage = {
      id: Date.now(),
      sender,
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = inputValue.trim();
    if (!question) return;

    // Add user message
    addMessage('user', question);
    setInputValue('');
    setIsLoading(true);

    try {
      // Replace with your Gemini API key
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: question }] }]
        })
      });

      const data = await response.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't understand that.";
      addMessage('bot', answer);

    } catch (error) {
      addMessage('bot', "Error: Could not connect to AI Agent.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message) => {
    if (message.sender === 'user') {
      return (
        <div key={message.id} className="flex justify-end">
          <div className="inline-block px-3 py-2 rounded-lg shadow-md bg-blue-600 text-white max-w-xs lg:max-w-md">
            {message.text}
          </div>
        </div>
      );
    } else {
      return (
        <div key={message.id} className="flex items-start space-x-2">
          <Image 
            src="https://i.imgur.com/L2yyiST.png" 
            alt="Agent Icon" 
            width={32}
            height={32}
            className="w-8 h-8 rounded-full shadow"
          />
          <div className="inline-block px-3 py-2 rounded-lg shadow-md bg-white text-gray-800 max-w-xs lg:max-w-md">
            {message.text}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center min-h-screen p-4">
      {/* AI Agent Card */}
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header with Icon */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-center space-x-2 font-bold text-lg">
          <Image 
            src="https://i.imgur.com/L2yyiST.png" 
            alt="Agent Icon" 
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-white"
          />
          <span>AI Agent</span>
        </div>
        
        {/* Chat Window */}
        <div 
          ref={chatWindowRef}
          className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50"
        >
          {messages.map(renderMessage)}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start space-x-2 text-gray-400 italic">
              <Image 
                src="https://i.imgur.com/L2yyiST.png" 
                alt="Agent Icon" 
                width={32}
                height={32}
                className="w-8 h-8 rounded-full shadow"
              />
              <div className="flex items-center space-x-1">
                <span>Thinking</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-4xl mb-2">🤖</div>
              <p>Hello! I'm your AI assistant.</p>
              <p className="text-sm">Ask me anything to get started!</p>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-3 border-t flex bg-white">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..." 
            className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}