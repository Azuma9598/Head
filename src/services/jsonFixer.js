// src/services/jsonFixer.js
const jsonrepair = require('jsonrepair');
const logger = require('../utils/logger');

/**
 * Attempts to parse JSON; if fails, uses jsonrepair to fix syntax.
 * @param {string} content - Raw JSON string
 * @returns {object} Parsed object
 * @throws {Error} If repair also fails
 */
function parseAndFixJSON(content) {
  try {
    return JSON.parse(content);
  } catch (err) {
    logger.warn('JSON parse failed, attempting repair...');
    try {
      const repaired = jsonrepair(content);
      return JSON.parse(repaired);
    } catch (repairErr) {
      throw new Error(`Unrepairable JSON: ${repairErr.message}`);
    }
  }
}

/**
 * Fix common version field issues: ensures it's [major, minor, patch]
 * @param {any} version - Version field from manifest
 * @returns {array} Fixed version array
 */
function fixVersion(version) {
  if (Array.isArray(version) && version.length === 3 && version.every(v => typeof v === 'number')) {
    return version;
  }
  // Attempt to convert from string "1.2.3" or [1,2,3] with string numbers
  if (typeof version === 'string') {
    const parts = version.split('.').map(Number);
    if (parts.length === 3 && parts.every(v => !isNaN(v))) {
      return parts;
    }
  }
  if (Array.isArray(version) && version.length === 3) {
    const numVersion = version.map(v => (typeof v === 'string' ? Number(v) : v));
    if (numVersion.every(v => !isNaN(v))) return numVersion;
  }
  // Fallback to default
  return [1, 0, 0];
}

module.exports = {
  parseAndFixJSON,
  fixVersion
};