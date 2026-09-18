import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Battery, Clock, ShieldCheck, Wrench, BookOpen } from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  onOpenTools: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onOpenTools, onOpenGuide }) => {
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 text-slate-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Terminal Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-base shadow-sm">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-100 tracking-wider text-base">NEXA</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">Personal AI Terminal Assistant</p>
          </div>
        </div>

        {/* Runtime Diagnostics Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Platform */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>{status?.platform || 'Linux / Android'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </div>

          {/* AI Engine */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{status?.geminiConfigured ? (status?.model || 'gemini-3.8-flash') : 'Offline Engine'}</span>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentTime}</span>
          </div>

          {/* Action Buttons */}
          <button
            id="tools-button"
            onClick={onOpenTools}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-200 transition-colors cursor-pointer"
            title="View registered tools"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Tools ({status?.toolsCount || 21})</span>
          </button>

          <button
            id="guide-button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors cursor-pointer"
            title="Termux & Linux Setup Guide"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Termux Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
