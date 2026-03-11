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
    // Redact API keys from message and details
    const redact = (str: any) => {
        if (typeof str !== 'string') return String(str || '');
        return str.replace(/sk_[a-zA-Z0-9]{32}/g, 'sk_REDACTED').replace(/pk_[a-zA-Z0-9]{32}/g, 'pk_REDACTED');
    };
    
    const entry: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        level,
        message: redact(message),
        details: details !== undefined ? (typeof details === 'string' ? redact(details) : redact(JSON.stringify(details))) : undefined
    };
    
    logs = [entry, ...logs].slice(0, MAX_LOGS);
    console.log(`[${level.toUpperCase()}] ${entry.message}`, entry.details || '');
};

export const getLogs = () => [...logs];

export const clearLogs = () => {
    logs = [];
};
