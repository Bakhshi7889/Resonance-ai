
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: string;
}

const LOG_KEY = 'resonance_logs_v1';

export const addLog = (level: LogEntry['level'], message: string, details?: any) => {
  const entry: LogEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    level,
    message,
    details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : undefined
  };
  
  try {
    const existing = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    // Keep last 100 logs
    const updated = [entry, ...existing].slice(0, 100);
    localStorage.setItem(LOG_KEY, JSON.stringify(updated));
    
    // Also log to console for devtools
    const style = level === 'error' ? 'color: red; font-weight: bold' : level === 'warn' ? 'color: orange' : 'color: cyan';
    console.log(`%c[${level.toUpperCase()}] ${message}`, style, details || '');
  } catch (e) {
    console.error('Logging failed', e);
  }
};

export const getLogs = (): LogEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
};

export const clearLogs = () => {
  localStorage.removeItem(LOG_KEY);
};
