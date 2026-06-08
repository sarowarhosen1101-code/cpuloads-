import React, { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Activity, 
  Server, 
  CheckCircle2, 
  XOctagon, 
  Loader2, 
  Flame, 
  RefreshCw,
  Cpu,
  Clock,
  LogOut,
  AppWindow
} from 'lucide-react';
import { MetricCard } from './components/MetricCard';
import { ResourceChart } from './components/ResourceChart';
import { TerminalLogs } from './components/TerminalLogs';
import { DashboardData, TaskStatus } from './types';

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error(`Failed to load stats (HTTP ${response.status})`);
      }
      const json: DashboardData = await response.json();
      setData(json);
      setErrorMsg(null);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Unable to communicate with the system telemetry agent.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Poll resources telemetry every 1 second as requested
  useEffect(() => {
    fetchDashboardData(false);

    pollIntervalRef.current = setInterval(() => {
      fetchDashboardData(true);
    }, 1000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const triggerRunTask = async () => {
    if (data?.task.status === 'Running') return;
    setIsTriggering(true);
    try {
      const response = await fetch('/api/task/run', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Could not trigger backend pipeline task.');
      }
      // Instantly refresh stat after scheduling
      await fetchDashboardData(true);
    } catch (err: any) {
      alert(err.message || 'Error scheduling task');
    } finally {
      setIsTriggering(false);
    }
  };

  const triggerResetTask = async () => {
    setIsTriggering(true);
    try {
      const response = await fetch('/api/task/reset', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Could not request state reset.');
      }
      await fetchDashboardData(true);
    } catch (err: any) {
      alert(err.message || 'Error resetting engine');
    } finally {
      setIsTriggering(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    
    return parts.join(' ');
  };

  const formatExecutionTime = (ms: number): string => {
    const totalSecs = ms / 1000;
    return totalSecs.toFixed(1) + 's';
  };

  // Helper styles for status badges
  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'Running':
        return {
          label: 'Calculating',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400'
        };
      case 'Completed':
        return {
          label: 'Pipeline Success',
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          dot: 'bg-blue-400'
        };
      case 'Failed':
        return {
          label: 'System Aborted',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400'
        };
      default:
        return {
          label: 'Idle Standby',
          bg: 'bg-neutral-800 border-neutral-700 text-neutral-400',
          dot: 'bg-neutral-600'
        };
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        <h2 className="mt-4 text-lg font-semibold tracking-wide text-neutral-200">Retrieving system diagnostics...</h2>
        <p className="mt-1.5 text-xs text-neutral-500 font-mono">Initializing telemetric channel on localhost:3000</p>
      </div>
    );
  }

  // Error boundary Fallback UI
  if (errorMsg && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center">
        <div className="rounded-full bg-rose-500/10 p-4 border border-rose-500/20">
          <XOctagon className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="mt-4 text-lg font-bold tracking-tight text-neutral-200">Diagnostics Offline</h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-400">
          {errorMsg}
        </p>
        <button
          onClick={() => fetchDashboardData()}
          className="mt-6 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 transition-all font-semibold"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, statsHistory, task } = data!;
  const currentStatusConfig = getStatusConfig(task.status);

  return (
    <div id="full-scope-dashboard" className="min-h-screen bg-neutral-950 font-sans text-neutral-200 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Dynamic ambient header accent */}
      <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

      {/* Top Banner Navigation area */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 p-2 border border-neutral-800 shadow-md">
              <Server className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-900 text-emerald-400 border border-neutral-800 font-mono tracking-wider">SECURE KERNEL</span>
                {task.status === 'Running' && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    COMPUTING
                  </span>
                )}
              </div>
              <h1 className="text-md font-bold text-neutral-100 tracking-tight mt-0.5">Telemetry Monitor</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Dev Server: Port 3000 (ONLINE)</span>
            </div>
            <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
            <span className="text-neutral-400">Sync Interval: 1.0s</span>
          </div>
        </div>
      </header>

      {/* Primary Dashboard Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Core telemetry widgets grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard 
            title="CPU Load"
            type="cpu"
            value={`${stats.cpuUsage}%`}
            subtitle="Weighted Core Thread usage"
            badge={{
              text: stats.cpuUsage > 80 ? 'Heavy Load' : stats.cpuUsage > 40 ? 'Moderate' : 'Optimal',
              variant: stats.cpuUsage > 80 ? 'warning' : 'success'
            }}
          />

          <MetricCard 
            title="System Memory"
            type="memory"
            value={`${stats.memory.usedPercentage}%`}
            subtitle="Volatile RAM consumption footprint"
            memoryDetails={stats.memory}
          />

          <MetricCard 
            title="Process Core Lifetime"
            type="uptime"
            value={formatUptime(stats.processUptime)}
            subtitle="Dashboard host agent active runtime"
            badge={{
              text: `STABLE`,
              variant: 'info'
            }}
          />
        </div>

        {/* Historic Graph telemetry */}
        <ResourceChart history={statsHistory} />

        {/* Task Executor Dashboard Panel */}
        <div id="processor-task-pipeline-card" className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-md relative overflow-hidden">
          {/* Decorative radial lighting in background */}
          <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-neutral-100">Math Kernel Pipeline & CPU Burner</h2>
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold font-mono tracking-wider ${currentStatusConfig.bg}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${currentStatusConfig.dot}`} />
                  {currentStatusConfig.label}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Fires high-intensity multi-stage algebraic algorithms (Sieve of Eratosthenes, matrix cross products, SHA-256 challenges) to monitor host resource telemetry under stress. Runs fully asynchronous, preventing client blocking.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Main task trigger */}
              <button
                onClick={triggerRunTask}
                disabled={task.status === 'Running' || isTriggering}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 px-5 py-2.5 text-xs text-black font-bold font-mono transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
              >
                {task.status === 'Running' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Kerneĺ Busy
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-black" />
                    RUN STRESS TASK
                  </>
                )}
              </button>

              {/* Force abort and reset button */}
              {(task.status !== 'Idle' || task.logs.length > 1) && (
                <button
                  onClick={triggerResetTask}
                  disabled={isTriggering}
                  className="flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 px-3.5 py-2.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                  title={task.status === 'Running' ? "Kill & Abort Execution" : "Clear Engine logs"}
                >
                  <RotateCcw className={`h-4 w-4 ${isTriggering ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            
            {/* Left stat segment */}
            <div className="space-y-4">
              <div className="rounded-lg bg-neutral-950 p-4 border border-neutral-900 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Pipeline Clock Time</span>
                  <span className="text-neutral-300 font-mono font-medium">
                    {formatExecutionTime(task.executionTime)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Scheduled Trigger</span>
                  <span className="text-neutral-300 font-mono">
                    {task.startedAt ? new Date(task.startedAt).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Completed Frame</span>
                  <span className="text-neutral-300 font-mono">
                    {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Telemetry Log Counts</span>
                  <span className="text-neutral-300 font-mono font-semibold">
                    {task.logs.length} entries
                  </span>
                </div>
              </div>
            </div>

            {/* Right progress indicator area */}
            <div className="md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">Task Pipeline Progress</span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">
                    {task.progress}%
                  </span>
                </div>
                
                <div className="mt-3.5 h-3.5 w-full rounded-full bg-neutral-950 border border-neutral-900 overflow-hidden relative">
                  {/* Subtle background striping */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[pulse_2s_infinite] pointer-events-none" />
                  
                  <div 
                    style={{ width: `${task.progress}%` }} 
                    className={`h-full rounded-full transition-all duration-300 relative ${
                      task.status === 'Failed' 
                        ? 'bg-rose-500' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                  />
                </div>
              </div>

              {/* Multi-phase status list */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 bg-neutral-950/60 p-2 rounded-lg border border-neutral-900">
                  <span className={`h-2 w-2 rounded-full ${task.progress >= 12 ? 'bg-emerald-400' : task.status === 'Running' ? 'bg-neutral-700 animate-pulse' : 'bg-neutral-850'}`} />
                  <span className="text-neutral-400">1. Float Pre-Aloc</span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-950/60 p-2 rounded-lg border border-neutral-900">
                  <span className={`h-2 w-2 rounded-full ${task.progress >= 25 ? 'bg-emerald-400' : task.progress >= 12 ? 'bg-neutral-700 animate-pulse' : 'bg-neutral-850'}`} />
                  <span className="text-neutral-400">2. Sieve Primes</span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-950/60 p-2 rounded-lg border border-neutral-900">
                  <span className={`h-2 w-2 rounded-full ${task.progress >= 37 ? 'bg-emerald-400' : task.progress >= 25 ? 'bg-neutral-700 animate-pulse' : 'bg-neutral-850'}`} />
                  <span className="text-neutral-400">3. Matrix Mults</span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-950/60 p-2 rounded-lg border border-neutral-900">
                  <span className={`h-2 w-2 rounded-full ${task.progress >= 50 ? 'bg-emerald-400' : task.progress >= 37 ? 'bg-neutral-700 animate-pulse' : 'bg-neutral-850'}`} />
                  <span className="text-neutral-400">4. Crypto Puzzle</span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-950/60 p-2 rounded-lg border border-neutral-900">
                  <span className={`h-2 w-2 rounded-full ${task.progress >= 62 ? 'bg-emerald-400' : task.progress >= 50 ? 'bg-neutral-700 animate-pulse' : 'bg-neutral-850'}`} />
                  <span className="text-neutral-400">5. Sorting Keys</span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-950/60 p-2 rounded-lg border border-neutral-900">
                  <span className={`h-2 w-2 rounded-full ${task.progress >= 75 ? 'bg-emerald-400' : task.progress >= 62 ? 'bg-neutral-700 animate-pulse' : 'bg-neutral-850'}`} />
                  <span className="text-neutral-400">6. Monte Carlo Pi</span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-950/60 p-2 rounded-lg border border-neutral-900">
                  <span className={`h-2 w-2 rounded-full ${task.progress >= 87 ? 'bg-emerald-400' : task.progress >= 75 ? 'bg-neutral-700 animate-pulse' : 'bg-neutral-850'}`} />
                  <span className="text-neutral-400">7. Mandelbrot Set</span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-950/60 p-2 rounded-lg border border-neutral-900">
                  <span className={`h-2 w-2 rounded-full ${task.progress === 100 ? 'bg-emerald-400' : task.progress >= 87 ? 'bg-neutral-700 animate-pulse' : 'bg-neutral-850'}`} />
                  <span className="text-neutral-400">8. Telemetry Audit</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Live TTY Stream terminal output log */}
        <TerminalLogs logs={task.logs} />

      </main>

      {/* Decorative clean human footer line strictly matching rules */}
      <footer className="border-t border-neutral-900 mt-12 py-6 bg-neutral-950/60 select-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-650">
          <span>Active Monitor Service — {lastRefreshedAt ? `Last telemetry sync at ${lastRefreshedAt}` : 'Initializing clock'}</span>
          <span>Google AI Studio Diagnostics Terminal — UTC {new Date().toISOString().substring(11,19)}</span>
        </div>
      </footer>
    </div>
  );
}
