const multer = require("multer");
const { uploadToGCS } = require("./gcs");

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG and GIF images are allowed."
      ),
      false
    );
  }
};

// Create multer upload instance
const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

// Middleware to handle GCS upload after multer
const handleGcsUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Upload to Google Cloud Storage
    const gcsUrl = await uploadToGCS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Add GCS URL to the request object
    req.file.location = gcsUrl;
    next();
  } catch (error) {
    next(error);
  }
};

// Keep legacy name for backward compatibility
const handleS3Upload = handleGcsUpload;

module.exports = {
  upload: uploadMiddleware,
  handleGcsUpload,
  // legacy alias (safe to remove in future)
  handleS3Upload,
};
