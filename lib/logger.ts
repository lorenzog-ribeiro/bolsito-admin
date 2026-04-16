// FIX: logger centralizado para substituir console.* em produção
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  error: (message: string, error?: unknown) => {
    if (isDev) console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: unknown) => {
    if (isDev) console.warn(`[WARN] ${message}`, data);
  },
  info: (message: string, data?: unknown) => {
    if (isDev) console.info(`[INFO] ${message}`, data);
  },
};
