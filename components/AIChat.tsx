
import React, { useState, useRef, useEffect } from 'react';
import { Pet, ChatMessage } from '../types';
import { chatWithAssistant, isApiCoolingDown, getRemainingCooldown } from '../services/geminiService';

interface AIChatProps {
  pet: Pet;
  onUpdatePet: (updatedPet: Pet) => void;
}

const AIChat: React.FC<AIChatProps> = ({ pet, onUpdatePet }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(pet.chatHistory || [
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm PawPulse, your pet care assistant. How can I help you with ${pet.name} today?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Persist messages whenever they change
    if (messages.length > 0 && messages !== pet.chatHistory) {
      onUpdatePet({
        ...pet,
        chatHistory: messages
      });
    }

    const timer = setInterval(() => {
      setCooldown(getRemainingCooldown());
    }, 1000);
    return () => clearInterval(timer);
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isApiCoolingDown()) {
      const coolingMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `My AI brain is a bit busy! Give me ${getRemainingCooldown()} seconds to catch my breath.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, coolingMsg]);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass the actual history (excluding the greeting if needed, but SDK handles it)
      const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithAssistant(historyForApi, input, pet);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || "I'm sorry, I'm having trouble thinking right now.",
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const isCooldown = err.message?.includes("wait") || err.message?.includes("Limit");
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isCooldown 
          ? `My AI brain is a bit busy! Give me ${getRemainingCooldown()} seconds to catch my breath.`
          : "I'm having trouble connecting to the AI service. Please check your internet or try again in a moment.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-400 flex items-center justify-center">
            <i className="fas fa-robot"></i>
          </div>
          <div>
            <h3 className="font-bold">PawPulse AI Assistant</h3>
            <p className="text-xs text-indigo-100 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${cooldown > 0 ? 'bg-amber-400 animate-pulse' : 'bg-green-400 animate-pulse'}`}></span>
              {cooldown > 0 ? `AI Scaling (${cooldown}s)` : 'Online & Expert-Ready'}
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text"
          placeholder={cooldown > 0 ? `System busy... ${cooldown}s` : `Ask about health or symptoms...`}
          value={input}
          disabled={cooldown > 0}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={isLoading || cooldown > 0}
          className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default AIChat;
