// src/middlewares/multerConfig.js
const multer = require('multer');
const path = require('path');
const { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } = require('../utils/constants');
const { BadRequestError } = require('../utils/errors');

// Memory storage – we process as stream later, but multer needs destination
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(MAX_FILE_SIZE),
    files: 1
  }
});

module.exports = upload;