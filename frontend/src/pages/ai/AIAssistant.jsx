import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, Database, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const AIAssistant = () => {
  const { business } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your VyaparX AI Business Assistant. Ask me anything about sales performance, top products, restock requirements, customer segments, or expense breakdowns!',
      data: null,
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Which product sold the most?',
    'Who is my best customer?',
    'Which products should I restock?',
    'What are our highest expenses?',
    'Show customers inactive for 60 days',
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/assistant', { query: textToSend });
      const assistantMsg = {
        sender: 'assistant',
        text: res.data.answer,
        data: res.data.data,
        type: res.data.type,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, I encountered an issue processing your query. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              VyaparX Conversational Assistant
            </h2>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Controlled Query Layer (Zero Raw SQL Execution)
            </p>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 bg-white dark:bg-surface-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-lg rounded-2xl p-4 text-xs ${
                m.sender === 'user'
                  ? 'bg-brand-600 text-white font-medium'
                  : 'bg-slate-50 dark:bg-surface-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

              {/* Render Structured Table if present */}
              {m.data && Array.isArray(m.data) && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-[11px]">
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-surface-900">
                      {m.data.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx}>
                          {Object.values(row).map((val, vIdx) => (
                            <td key={vIdx} className="p-2">
                              {typeof val === 'number' ? val.toLocaleString('en-IN') : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-surface-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400 animate-pulse">
            <Bot className="w-4 h-4" />
            <span>Analyzing database & generating safe insights...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-[11px]">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 bg-white dark:bg-surface-900 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-800 whitespace-nowrap shadow-2xs font-medium transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white dark:bg-surface-900 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a natural business question (e.g. 'What is our profit margin?')"
          className="flex-1 px-3 py-2 text-xs bg-transparent border-none text-slate-900 dark:text-white focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
