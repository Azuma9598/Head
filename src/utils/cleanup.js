// src/utils/cleanup.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * Recursively remove a directory and its contents
 * @param {string} dirPath - Path to directory
 */
async function removeDirectory(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    logger.info(`Cleaned up temporary directory: ${dirPath}`);
  } catch (error) {
    logger.error(`Failed to clean up ${dirPath}:`, error);
    // Non-blocking – don't throw
  }
}

module.exports = {
  removeDirectory
};