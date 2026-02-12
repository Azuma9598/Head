// src/utils/logger.js
const isDev = process.env.NODE_ENV !== 'production';

const logger = {
  info: (...args) => isDev && console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  debug: (...args) => isDev && console.debug('[DEBUG]', ...args)
};

module.exports = logger;