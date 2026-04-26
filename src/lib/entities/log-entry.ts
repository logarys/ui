export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface LogEntry {
  id: string;
  pipelineId: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  source?: string;
  context?: Record<string, unknown>;
}

export interface LogSearchParams {
  pipelineId?: string;
  level?: LogLevel | '';
  query?: string;
  limit?: number;
}
