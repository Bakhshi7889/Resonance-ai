export interface LogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: string;
}

let logs: LogEntry[] = [];
const MAX_LOGS = 100;

export const addLog = (level: 'info' | 'warn' | 'error', message: string, details?: any) => {
    const entry: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        level,
        message,
        details: typeof details === 'string' ? details : JSON.stringify(details)
    };
    
    logs = [entry, ...logs].slice(0, MAX_LOGS);
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
};

export const getLogs = () => [...logs];

export const clearLogs = () => {
    logs = [];
};
