import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Terminal } from './components/Terminal';
import { ToolDrawer } from './components/ToolDrawer';
import { ChatMessage, SystemStatus, ToolInfo } from './types';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'tools' | 'guide'>('tools');

  // Load initial status and tool registry on mount
  useEffect(() => {
    fetchStatus();
    fetchTools();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchTools = async () => {
    try {
      const res = await fetch('/api/tools');
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          role: 'assistant',
          content: data.text || 'Done.',
          toolUsed: data.toolUsed,
          toolData: data.toolData,
          pendingAction: data.pendingAction,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}_err`,
            role: 'assistant',
            content: errData.error || 'Failed to process request.',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          role: 'assistant',
          content: `Network error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await fetch('/api/clear', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      <Header
        status={status}
        onOpenTools={() => {
          setDrawerTab('tools');
          setDrawerOpen(true);
        }}
        onOpenGuide={() => {
          setDrawerTab('guide');
          setDrawerOpen(true);
        }}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Terminal
          messages={messages}
          onSendMessage={handleSendMessage}
          onClear={handleClear}
          isLoading={isLoading}
        />
      </main>

      <ToolDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tools={tools}
        defaultTab={drawerTab}
      />
    </div>
  );
}
