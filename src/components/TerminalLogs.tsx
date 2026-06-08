import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Copy, Check, ShieldAlert, BadgeCheck, AlertTriangle } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalLogsProps {
  logs: LogEntry[];
}

export function TerminalLogs({ logs }: TerminalLogsProps) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'warn' | 'error'>('all');
  const consoleContainerRef = useRef<HTMLDivElement>(null);

  const scrollContainerToBottom = () => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  };

  const handleCopyLogs = () => {
    const logText = logs
      .map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogColorClasses = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-emerald-400';
      case 'warn':
        return 'text-amber-400';
      case 'error':
        return 'text-rose-400';
      default:
        return 'text-neutral-300';
    }
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 mr-2 inline" />;
      case 'warn':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mr-2 inline" />;
      case 'error':
        return <ShieldAlert className="h-3.5 w-3.5 text-rose-500 mr-2 inline" />;
      default:
        return <span className="text-neutral-500 mr-2 inline font-mono font-bold">&gt;</span>;
    }
  };

  const filteredLogs = logs.filter(l => {
    if (filter === 'all') return true;
    return l.level === filter;
  });

  return (
    <div id="system-execution-terminal" className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 font-mono shadow-2xl relative overflow-hidden flex flex-col h-[350px]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">System Execution Logs</span>
        </div>

        <div className="flex gap-2 items-center">
          {/* Quick Filter buttons */}
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-md p-0.5 text-2xs md:text-xs">
            {(['all', 'success', 'warn', 'error'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-2 py-0.5 rounded capitalize text-[10px] transition-all ${
                  filter === lvl 
                    ? 'bg-neutral-800 text-neutral-200 font-bold' 
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Scroll to Bottom Button */}
          <button
            onClick={scrollContainerToBottom}
            className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            title="Scroll to bottom"
          >
            <span className="text-[10px]">Scroll Down</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            title="Copy all session logs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal stdout area */}
      <div 
        ref={consoleContainerRef}
        className="flex-1 overflow-y-auto pr-1 space-y-1.5 text-xs select-text scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-600 italic">
            No matching log entries found.
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            });
            const milliStr = String(new Date(log.timestamp).getMilliseconds()).padStart(3, '0');

            return (
              <div 
                key={index} 
                className="hover:bg-neutral-900/40 py-0.5 px-1 rounded transition-colors group flex items-start leading-relaxed border-l-2 border-transparent hover:border-neutral-800"
              >
                <span className="text-neutral-600 select-none mr-3 shrink-0 text-[11px]">
                  [{timeStr}.{milliStr}]
                </span>
                <span className={`${getLogColorClasses(log.level)} break-all`}>
                  {getLogIcon(log.level)}
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer statistics */}
      <div className="border-t border-neutral-900 pt-2.5 mt-2.5 text-neutral-600 text-[10px] flex justify-between shrink-0 select-none">
        <span>Log Buffer: {logs.length}/300 lines</span>
        <span>Output Mode: Raw TTY</span>
      </div>
    </div>
  );
}
