export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type LogCategory =
  | 'PROVIDER_DISCOVERY'
  | 'PROVIDER_SELECTION'
  | 'ACCOUNT_SELECTION'
  | 'CHAIN_VALIDATION'
  | 'BALANCE_QUERY'
  | 'TRANSACTION_LIFECYCLE'
  | 'RPC_DISPATCH'
  | 'RPC_FAILOVER'
  | 'ROUTING_QUERY';

export interface WalletTraceLog {
  id: string;
  timestamp: number;
  timeFormatted: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, any>;
}

type LogListener = (log: WalletTraceLog) => void;

class WalletLogger {
  private logs: WalletTraceLog[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs: number = 200;
  private lastConsoleLogs: Map<string, number> = new Map();

  constructor() {
    this.info('PROVIDER_DISCOVERY', 'Wallet logger initialized and trace monitor ready.');
  }

  private createLog(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: Record<string, any>
  ): WalletTraceLog {
    const now = new Date();
    const entry: WalletTraceLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + `.${now.getMilliseconds().toString().padStart(3, '0')}`,
      level,
      category,
      message,
      details,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Rate-limit & deduplicate console output to avoid console flooding
    const logKey = `${level}:${category}:${message}`;
    const lastTime = this.lastConsoleLogs.get(logKey) || 0;
    const isSpam = Date.now() - lastTime < 3000;

    if (!isSpam) {
      this.lastConsoleLogs.set(logKey, Date.now());

      // Console output with distinctive styling
      const colorMap: Record<LogLevel, string> = {
        DEBUG: 'color: #94a3b8;',
        INFO: 'color: #38bdf8; font-weight: bold;',
        WARN: 'color: #fbbf24; font-weight: bold;',
        ERROR: 'color: #f87171; font-weight: bold;',
      };

      const prefix = `%c[Saydex:${category}]%c ${message}`;
      if (level === 'ERROR') {
        console.error(prefix, colorMap[level], 'color: inherit;', details || '');
      } else if (level === 'WARN') {
        console.warn(prefix, colorMap[level], 'color: inherit;', details || '');
      } else {
        console.log(prefix, colorMap[level], 'color: inherit;', details || '');
      }
    }

    // Notify subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Wallet trace listener error:', err);
      }
    });

    return entry;
  }

  debug(category: LogCategory, message: string, details?: Record<string, any>) {
    return this.createLog('DEBUG', category, message, details);
  }

  info(category: LogCategory, message: string, details?: Record<string, any>) {
    return this.createLog('INFO', category, message, details);
  }

  warn(category: LogCategory, message: string, details?: Record<string, any>) {
    return this.createLog('WARN', category, message, details);
  }

  error(category: LogCategory, message: string, details?: Record<string, any>) {
    return this.createLog('ERROR', category, message, details);
  }

  getLogs(): WalletTraceLog[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.info('PROVIDER_DISCOVERY', 'Wallet trace log buffer cleared.');
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const walletLogger = new WalletLogger();
