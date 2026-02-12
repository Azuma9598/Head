// src/services/extractor.js
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs').promises;
const { BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Extracts a zip buffer to a target directory, preventing path traversal.
 * @param {Buffer} zipBuffer - Raw zip data
 * @param {string} targetDir - Absolute path to extract to
 */
async function extractZip(zipBuffer, targetDir) {
  const resolvedTarget = path.resolve(targetDir) + path.sep;
  try {
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      const entryName = entry.entryName;
      const resolvedPath = path.resolve(targetDir, entryName);

      // Path traversal protection: resolved path must be strictly inside targetDir
      if (!resolvedPath.startsWith(resolvedTarget)) {
        throw new BadRequestError(`Path traversal attempt detected: ${entryName}`);
      }

      if (entry.isDirectory) {
        await fs.mkdir(resolvedPath, { recursive: true });
      } else {
        await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
        await fs.writeFile(resolvedPath, entry.getData());
      }
    }

    logger.info(`Extracted ${zipEntries.length} entries to ${targetDir}`);
  } catch (error) {
    logger.error('Extraction failed:', error);
    // Don't re-wrap errors that are already operational (e.g. BadRequestError)
    if (error.isOperational) throw error;
    throw new BadRequestError(`Failed to extract archive: ${error.message}`);
  }
}

module.exports = { extractZip };