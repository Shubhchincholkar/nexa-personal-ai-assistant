import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, CheckCircle2, XCircle, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

interface TerminalProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  onClear: () => void;
  isLoading: boolean;
}

const QUICK_ACTIONS = [
  'What time is it?',
  'What is my battery percentage?',
  'Call Rahul',
  'Open WhatsApp',
  'Set a timer for 5 minutes',
  'calculate 45 * 12 + sqrt(144)',
  'Find my PDF files',
  'What is the latest React version?',
  '/tools',
  '/status',
];

export const Terminal: React.FC<TerminalProps> = ({
  messages,
  onSendMessage,
  onClear,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const trimmed = input.trim();
    setInputHistory((prev) => [trimmed, ...prev.slice(0, 50)]);
    setHistoryIndex(-1);
    setInput('');
    onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length > 0 && historyIndex < inputHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInput(inputHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setInput(inputHistory[prevIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Terminal Window Chrome */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono text-slate-400 ml-2">nexa@android-termux:~$</span>
        </div>
        <button
          id="clear-terminal-button"
          onClick={onClear}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
          title="Clear terminal session"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Terminal Message Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 font-mono text-sm space-y-4 select-text"
      >
        {/* Terminal Header Banner */}
        <div className="text-slate-400 border border-slate-800 bg-slate-900/50 p-4 rounded-lg leading-relaxed">
          <pre className="text-emerald-400 font-bold text-xs sm:text-sm">
{`========================================
             🤖 NEXA
      Personal AI Assistant
========================================`}
          </pre>
          <p className="mt-2 text-xs text-slate-300">
            NEXA is ready. Natural language agent running on Termux:API & Gemini Function Calling.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Type your request, execute tools, or use <span className="text-sky-400">/help</span>, <span className="text-sky-400">/tools</span>, or <span className="text-sky-400">/status</span>.
          </p>
        </div>

        {/* Message List */}
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1.5 animate-fadeIn">
            {msg.role === 'user' ? (
              <div className="flex items-start gap-2">
                <span className="text-sky-400 font-bold select-none">You:</span>
                <span className="text-slate-100 whitespace-pre-wrap">{msg.content}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold select-none">NEXA:</span>
                  <div className="flex-1 space-y-2">
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    {/* Tool Tag */}
                    {msg.toolUsed && (
                      <div className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                        <TerminalIcon className="w-3 h-3 text-sky-400" />
                        <span>tool: <strong className="text-sky-300">{msg.toolUsed}</strong></span>
                      </div>
                    )}

                    {/* Interactive Disambiguation / Confirmation Prompts */}
                    {msg.pendingAction && (
                      <div className="mt-3 p-3 rounded-lg border border-amber-500/40 bg-amber-950/20 space-y-2 max-w-md">
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <span>Action Confirmation / Selection Required:</span>
                        </div>

                        {/* Option buttons if selecting contact / option */}
                        {msg.pendingAction.options && msg.pendingAction.options.length > 0 && (
                          <div className="grid grid-cols-1 gap-1.5 pt-1">
                            {msg.pendingAction.options.map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => onSendMessage(String(opt.index || opt.label))}
                                className="text-left text-xs px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>{opt.index}. {opt.label}</span>
                                <span className="text-slate-400 text-[11px]">{opt.number}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Yes/No confirmation buttons */}
                        {msg.pendingAction.type === 'CONFIRM_ACTION' && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => onSendMessage('yes')}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Yes, Confirm</span>
                            </button>
                            <button
                              onClick={() => onSendMessage('no')}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span className="text-emerald-400 font-bold select-none">NEXA:</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              <span>Analyzing intent & executing tools...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Chips */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">Examples:</span>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => onSendMessage(action)}
            disabled={isLoading}
            className="text-xs font-mono whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Terminal Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2 font-mono"
      >
        <span className="text-sky-400 font-bold select-none text-sm">You:</span>
        <input
          ref={inputRef}
          id="terminal-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask NEXA or type a command... (Press Up/Down for history)"
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-400 text-sm font-mono focus:ring-0"
          autoFocus
        />
        <button
          id="send-button"
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
