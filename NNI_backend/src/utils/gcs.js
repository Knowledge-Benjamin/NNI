const { Storage } = require("@google-cloud/storage");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Initialize GCS client
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(BUCKET_NAME);
const MAX_IMAGE_SIZE = 1200; // Max dimension for images

/**
 * Process image before upload
 * - Resizes image while maintaining aspect ratio
 * - Converts to JPEG format
 * - Strips EXIF data
 * - Optimizes quality
 */
async function processImage(buffer) {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if image is larger than MAX_IMAGE_SIZE
    if (metadata.width > MAX_IMAGE_SIZE || metadata.height > MAX_IMAGE_SIZE) {
      image.resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    return await image
      .jpeg({ quality: 80, progressive: true })
      .withMetadata({ strip: true })
      .toBuffer();
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error("Failed to process image");
  }
}

/**
 * Upload file to Google Cloud Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original filename
 * @param {string} mimetype - File mime type
 * @returns {Promise<string>} - Returns the public URL of the uploaded file
 */
async function uploadToGCS(buffer, originalname, mimetype) {
  try {
    // Process image if it's an image file
    const processedBuffer = mimetype.startsWith("image/")
      ? await processImage(buffer)
      : buffer;

    // Generate unique filename
    const extension = path.extname(originalname);
    const filename = `${uuidv4()}${extension}`;
    const filePath = `images/${filename}`;

    // Create a new blob in the bucket and upload the file data.
    const blob = bucket.file(filePath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: mimetype,
        cacheControl: "public, max-age=31536000", // Cache for 1 year
      },
    });

    // Return promise that resolves with public URL
    return new Promise((resolve, reject) => {
      blobStream.on("error", (error) => {
        console.error("Error uploading to GCS:", error);
        reject(new Error("Failed to upload file to Google Cloud Storage"));
      });

      blobStream.on("finish", async () => {
        // Make the file public
        try {
          await blob.makePublic();

          // Construct public URL
          const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;
          resolve(publicUrl);
        } catch (error) {
          console.error("Error making file public:", error);
          reject(new Error("Failed to make file public"));
        }
      });

      blobStream.end(processedBuffer);
    });
  } catch (error) {
    console.error("Error in uploadToGCS:", error);
    throw error;
  }
}

/**
 * Delete file from Google Cloud Storage
 * @param {string} fileUrl - The public URL of the file to delete
 */
async function deleteFromGCS(fileUrl) {
  try {
    // Extract filename from URL
    const filename = fileUrl.split("/").pop();
    const filePath = `images/${filename}`;

    // Delete the file
    await bucket.file(filePath).delete();
  } catch (error) {
    console.error("Error deleting from GCS:", error);
    throw new Error("Failed to delete file from Google Cloud Storage");
  }
}

module.exports = {
  uploadToGCS,
  deleteFromGCS,
};
