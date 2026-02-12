// src/services/manifestFixer.js
const { fixVersion } = require('./jsonFixer');
const logger = require('../utils/logger');

/**
 * Validates and fixes manifest.json structure
 * @param {object} manifest - Parsed manifest object
 * @returns {object} Corrected manifest
 */
function fixManifest(manifest) {
  if (!manifest.format_version) manifest.format_version = 2;

  // Fix header
  if (manifest.header) {
    if (manifest.header.version) {
      manifest.header.version = fixVersion(manifest.header.version);
    }
    if (!manifest.header.uuid || typeof manifest.header.uuid !== 'string') {
      // Generate a placeholder UUID? Better to leave as-is, user will fix.
      logger.warn('Manifest missing valid UUID, keeping original');
    }
    if (!manifest.header.name) manifest.header.name = 'Fixed Addon';
    if (!manifest.header.description) manifest.header.description = 'Repaired by Minecraft Addon Studio';
  }

  // Fix modules version
  if (Array.isArray(manifest.modules)) {
    manifest.modules.forEach(module => {
      if (module.version) module.version = fixVersion(module.version);
    });
  }

  // Fix dependencies version format
  if (Array.isArray(manifest.dependencies)) {
    manifest.dependencies.forEach(dep => {
      if (dep.version) dep.version = fixVersion(dep.version);
    });
  }

  return manifest;
}

module.exports = { fixManifest };