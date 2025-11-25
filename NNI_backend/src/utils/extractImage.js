/**
 * Extract featured image URL from HTML content
 * Finds the first <img> tag and returns its src attribute
 *
 * @param {string} content - HTML content to parse
 * @returns {string|null} - Image URL or null if not found
 */
function extractFeaturedImage(content) {
    if (!content) return null;

    try {
        const match = String(content).match(
            /<img[^>]+src=["']?([^"'>\s]+)["']?/i
        );
        return match && match[1] ? match[1] : null;
    } catch (e) {
        // Ignore regex errors
        return null;
    }
}

module.exports = {
    extractFeaturedImage,
};
