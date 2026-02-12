// src/services/fixer.js
const fs = require('fs').promises;
const path = require('path');
const { parseAndFixJSON } = require('./jsonFixer');
const { fixManifest } = require('./manifestFixer');
const { fixAnimationFile, removeHeadSmooth, removeGeometrySmooth, removeSmoothHeadScripts } = require('./animationFixer');
const logger = require('../utils/logger');

/**
 * Walk directory and process all .json files with appropriate fixers.
 * @param {string} dir - Root directory of extracted addon
 */
async function fixAddonFiles(dir) {
  const files = await walkDirectory(dir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  for (const filePath of jsonFiles) {
    try {
      const relativePath = path.relative(dir, filePath);
      const content = await fs.readFile(filePath, 'utf8');
      let json;

      // Step 1: Repair JSON syntax
      try {
        json = parseAndFixJSON(content);
      } catch (err) {
        logger.error(`Skipping unrepairable JSON: ${relativePath} - ${err.message}`);
        continue;
      }

      // Step 2: Apply domain-specific fixes
      const filename = path.basename(filePath);
      if (filename === 'manifest.json') {
        json = fixManifest(json);
        logger.info(`Fixed manifest: ${relativePath}`);
      } else if (filePath.includes('animations') || filePath.includes('animation_controllers')) {
        json = fixAnimationFile(json);
        logger.info(`Processed animation file: ${relativePath}`);
      } else {
        // Deep-scan all other JSON files (render_controllers, entity files, attachables, etc.)
        removeHeadSmooth(json);
        removeGeometrySmooth(json);
        removeSmoothHeadScripts(json);
      }

      // Step 3: Write back fixed JSON
      await fs.writeFile(filePath, JSON.stringify(json, null, 2), 'utf8');
    } catch (error) {
      logger.error(`Error processing ${filePath}:`, error);
      // Continue with other files – non-fatal
    }
  }
}

/**
 * Recursively get all files in a directory.
 * @param {string} dir - Directory path
 * @returns {Promise<string[]>} Array of absolute file paths
 */
async function walkDirectory(dir) {
  let results = [];
  const list = await fs.readdir(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(await walkDirectory(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

module.exports = { fixAddonFiles };