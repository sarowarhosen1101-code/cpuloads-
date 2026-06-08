import React from 'react';
import { Cpu, Database, Clock, Activity } from 'lucide-react';
import { MemoryStats } from '../types';

interface MetricCardProps {
  title: string;
  type: 'cpu' | 'memory' | 'uptime';
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'neutral';
  };
  memoryDetails?: MemoryStats;
}

export function MetricCard({ title, type, value, subtitle, badge, memoryDetails }: MetricCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'cpu':
        return <Cpu className="h-5 w-5 text-emerald-400 animate-pulse" />;
      case 'memory':
        return <Database className="h-5 w-5 text-blue-400" />;
      case 'uptime':
        return <Clock className="h-5 w-5 text-purple-400" />;
      default:
        return <Activity className="h-5 w-5 text-neutral-400" />;
    }
  };

  const getBadgeClass = () => {
    if (!badge) return '';
    switch (badge.variant) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div id={`metric-card-${type}`} className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-neutral-700/80 hover:bg-neutral-900/80">
      {/* Decorative glow panel context */}
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-neutral-800/20 to-transparent blur-2xl" />

      <div className="flex items-center justify-between z-10 relative">
        <span className="text-sm font-medium text-neutral-400 tracking-wide">{title}</span>
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-2">
          {getIcon()}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between z-10 relative">
        <div>
          <span className="text-3xl font-mono font-bold tracking-tight text-neutral-50 md:text-4xl">
            {value}
          </span>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500 tracking-wide">{subtitle}</p>
          )}
        </div>

        {badge && (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getBadgeClass()}`}>
            {badge.text}
          </span>
        )}
      </div>

      {type === 'memory' && memoryDetails && (
        <div className="mt-5 space-y-3 border-t border-neutral-800/80 pt-4 z-10 relative">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-500">Free RAM</span>
            <span className="text-neutral-300 font-medium">{formatBytes(memoryDetails.free)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-500">Active RAM</span>
            <span className="text-neutral-300 font-medium">{formatBytes(memoryDetails.used)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-500">Total RAM</span>
            <span className="text-neutral-300 font-medium">{formatBytes(memoryDetails.total)}</span>
          </div>

          <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-950 overflow-hidden">
            <div 
              style={{ width: `${Math.min(memoryDetails.usedPercentage, 100)}%` }} 
              className={`h-full rounded-full transition-all duration-1000 ${
                memoryDetails.usedPercentage > 85 
                  ? 'bg-rose-500' 
                  : memoryDetails.usedPercentage > 60 
                  ? 'bg-amber-500' 
                  : 'bg-blue-500'
              }`}
            />
          </div>
        </div>
      )}

      {type === 'cpu' && typeof value === 'string' && (
        <div className="mt-5 space-y-2 border-t border-neutral-800/80 pt-4 z-10 relative">
          <div className="mt-1 flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-500">Core Utilization</span>
            <span className="text-neutral-300 font-medium">{value}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-950 overflow-hidden">
            <div 
              style={{ width: value }} 
              className={`h-full rounded-full transition-all duration-1000 ${
                parseFloat(value) > 85 
                  ? 'bg-rose-500 animate-pulse' 
                  : parseFloat(value) > 60 
                  ? 'bg-amber-400' 
                  : 'bg-emerald-400'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
