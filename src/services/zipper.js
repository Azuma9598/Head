// src/services/zipper.js
const archiver = require('archiver');
const { PassThrough } = require('stream');
const logger = require('../utils/logger');

/**
 * Create a zip stream from a directory.
 * @param {string} sourceDir - Directory to zip
 * @returns {PassThrough} Stream of zip data
 */
function zipDirectory(sourceDir) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = new PassThrough();

  archive.on('error', (err) => {
    logger.error('Archive error:', err);
    stream.destroy(err);
  });

  archive.pipe(stream);
  archive.directory(sourceDir, false);
  archive.finalize();

  return stream;
}

module.exports = { zipDirectory };
