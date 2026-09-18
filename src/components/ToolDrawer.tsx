import React, { useState } from 'react';
import { X, Wrench, Shield, AlertTriangle, AlertOctagon, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { ToolInfo } from '../types';

interface ToolDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tools: ToolInfo[];
  defaultTab?: 'tools' | 'guide';
}

export const ToolDrawer: React.FC<ToolDrawerProps> = ({
  isOpen,
  onClose,
  tools,
  defaultTab = 'tools',
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'guide'>(defaultTab);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const termuxCommands = [
    {
      title: '1. Update Termux Repositories',
      cmd: 'pkg update -y && pkg upgrade -y',
    },
    {
      title: '2. Install Node.js, Git & Termux:API',
      cmd: 'pkg install -y nodejs git termux-api coreutils',
    },
    {
      title: '3. Clone NEXA Project',
      cmd: 'git clone <repo-url> nexa && cd nexa',
    },
    {
      title: '4. Run Automated Bootstrapper',
      cmd: 'bash scripts/termux-setup.sh',
    },
    {
      title: '5. Launch NEXA in Terminal',
      cmd: 'nexa',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn font-mono">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-sky-950 text-sky-300 border border-sky-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tool Catalog ({tools.length})
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Termux Setup
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'tools' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                NEXA inspects each request and executes the corresponding tool through Gemini function calling or deterministic fast-routing.
              </p>

              {tools.map((t) => (
                <div
                  key={t.name}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sky-400 text-xs">{t.name}</span>
                    {t.riskLevel === 'SAFE' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> SAFE
                      </span>
                    )}
                    {t.riskLevel === 'SENSITIVE' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> SENSITIVE
                      </span>
                    )}
                    {t.riskLevel === 'DANGEROUS' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" /> DANGEROUS
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{t.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Running on Android via Termux
                </p>
                <p className="text-emerald-300/80">
                  NEXA is engineered to run natively in Termux with companion app Termux:API installed for hardware sensor and telephony access.
                </p>
              </div>

              <div className="space-y-3">
                {termuxCommands.map((item, idx) => (
                  <div key={item.title} className="space-y-1">
                    <span className="text-xs font-bold text-slate-300">{item.title}</span>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded p-2 text-xs">
                      <code className="text-sky-300 break-all">{item.cmd}</code>
                      <button
                        onClick={() => copyToClipboard(item.cmd, idx)}
                        className="ml-2 text-slate-400 hover:text-slate-100 p-1 cursor-pointer"
                        title="Copy command"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                <span className="font-bold text-slate-200">Android Permissions:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Install Termux:API companion app from F-Droid</li>
                  <li>Grant Contacts, SMS, Call Phone, and Camera permissions</li>
                  <li>Add your <code className="text-sky-300">GEMINI_API_KEY</code> to <code className="text-sky-300">.env</code></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
