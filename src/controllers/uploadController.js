const path = require('path');
const fs = require('fs').promises;
const tmp = require('tmp');
const { promisify } = require('util');
const { extractZip } = require('../services/extractor');
const { fixAddonFiles } = require('../services/fixer');
const { zipDirectory } = require('../services/zipper');
const { removeDirectory } = require('../utils/cleanup');
const { BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');
const { FIXED_PREFIX } = require('../utils/constants');
const upload = require('../middlewares/multerConfig');

const tmpDirAsync = promisify(tmp.dir);

exports.handleUpload = [
  upload.single('file'),
  async (req, res, next) => {
    let tempDir = null;
    try {
      if (!req.file) throw new BadRequestError('No file uploaded');

      const originalName = req.file.originalname;
      logger.info(`Processing: ${originalName}`);

      tempDir = await tmpDirAsync({ prefix: 'mc-fixer-', unsafeCleanup: true });

      await extractZip(req.file.buffer, tempDir);
      await fixAddonFiles(tempDir);
      const zipStream = zipDirectory(tempDir);

      const fixedFilename = `${FIXED_PREFIX}${path.basename(originalName)}`;
      res.attachment(fixedFilename);
      res.setHeader('Content-Type', 'application/zip');

      zipStream.pipe(res);

      zipStream.on('end', async () => {
        await removeDirectory(tempDir);
      });

      zipStream.on('error', async (err) => {
        await removeDirectory(tempDir);
        if (!res.headersSent) next(err);
        else res.destroy(err);
      });
    } catch (error) {
      if (tempDir) await removeDirectory(tempDir);
      next(error);
    }
  }
];