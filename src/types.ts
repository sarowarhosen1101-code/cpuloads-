export type TaskStatus = 'Idle' | 'Running' | 'Completed' | 'Failed';

export interface MemoryStats {
  total: number; // in bytes
  free: number;  // in bytes
  used: number;  // in bytes
  usedPercentage: number;
}

export interface SystemStats {
  cpuUsage: number;
  memory: MemoryStats;
  processUptime: number; // in seconds
  systemUptime: number;  // in seconds
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface TaskState {
  status: TaskStatus;
  progress: number;
  executionTime: number; // in milliseconds
  startedAt?: string;
  completedAt?: string;
  error?: string;
  logs: LogEntry[];
}

export interface DashboardData {
  stats: SystemStats;
  statsHistory: { cpu: number; memory: number; timestamp: string }[];
  task: TaskState;
}
