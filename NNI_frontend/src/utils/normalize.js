/**
 * Normalize article data from API responses
 * Ensures consistent data structure for category and tags fields
 */
export function normalizeArticle(article) {
    if (!article) return null;

    return {
        ...article,
        category: article.category || "News",
        tags: Array.isArray(article.tags)
            ? article.tags
            : article.tags
                ? String(article.tags)
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                : [],
    };
}

/**
 * Normalize an array of articles
 */
export function normalizeArticles(articles) {
    if (!Array.isArray(articles)) return [];
    return articles.map(normalizeArticle);
}
