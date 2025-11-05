// AWS S3 helper (deprecated)
// This file is intentionally left as a no-op shim to avoid accidental usage.
// The project now uses Google Cloud Storage (GCS). If you intentionally need
// S3 support, restore or implement it in a new module.

module.exports = {
  uploadToS3: async () => {
    throw new Error(
      "S3 helper is deprecated in this codebase. Use GCS helpers instead."
    );
  },
  deleteFromS3: async () => {
    throw new Error(
      "S3 helper is deprecated in this codebase. Use GCS helpers instead."
    );
  },
};
