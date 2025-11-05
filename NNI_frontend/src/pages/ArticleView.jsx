import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getArticleBySlug } from "../utils/api";

export default function ArticleView() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getArticleBySlug(slug);
        if (!mounted) return;
        setArticle(data);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [slug]);

  function sanitizeHTML(html) {
    if (!html) return "";
    let s = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*\"[^\"]*\"/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");
    return s;
  }

  if (loading) return <div className="loading">Loading article…</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!article) return <div className="error">Article not found</div>;

  // Extract first video iframe/video if present
  let contentHtml = article.content || "";
  let topMediaHtml = null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, "text/html");
    const vid = doc.querySelector("video, iframe");
    if (vid) {
      topMediaHtml = vid.outerHTML;
      vid.remove();
      contentHtml = doc.body.innerHTML;
    }
  } catch (e) {}

  // If no inline video but article flagged as video, show featured image with play overlay
  const showFeaturedAsVideo = !topMediaHtml && article.isVideo;

  return (
    <article className="article-page">
      <div className="article-hero">
        {topMediaHtml ? (
          <div
            className="article-media"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(topMediaHtml) }}
          />
        ) : showFeaturedAsVideo && article.featuredImage ? (
          <div className="article-media article-video-placeholder">
            <img src={article.featuredImage} alt={article.title} />
            <div className="play-overlay">▶</div>
          </div>
        ) : (
          article.featuredImage && (
            <div className="article-media">
              <img src={article.featuredImage} alt={article.title} />
            </div>
          )
        )}
      </div>

      <div className="article-body">
        <div className="article-meta-row">
          <span className="read-time">
            {(article.readTime || 3) + " min read"}
          </span>
          {article.author && (
            <span className="by">by {article.author.name}</span>
          )}
          <span className="date">
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString()
              : ""}
          </span>
        </div>

        <h1 className="article-page-title">{article.title}</h1>

        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(contentHtml) }}
        />

        <div style={{ marginTop: 24 }}>
          <Link to="/" className="btn btn-ghost">
            ← Back to home
          </Link>
        </div>
      </div>
    </article>
  );
}
