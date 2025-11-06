import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchArticles, fetchSearch } from "../api/articles";

// Simple hero slider component
function HeroSlider({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const len = slides.length;
  const containerRef = React.useRef(null);
  const resumeRef = React.useRef(null);
  const [loadedMap, setLoadedMap] = useState({});

  // preload next slide image for smoother transitions
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const next = (index + 1) % len;
    const url = slides[next] && slides[next].featuredImage;
    if (url) {
      const img = new Image();
      img.src = url;
    }
  }, [index, slides, len]);

  // helper: attempt to derive a small placeholder URL from a larger unsplash-style URL
  const getPlaceholderUrl = (url) => {
    if (!url || typeof url !== "string") return url;
    // try to replace widthxheight patterns, fallback to adding a small size param
    const replaced = url.replace(/(\d{2,4}x\d{2,4})/, "60x32");
    if (replaced !== url) return replaced;
    // fallback: append a query to hint smaller size (may or may not work)
    try {
      const u = new URL(url);
      u.searchParams.set("w", "100");
      return u.toString();
    } catch (e) {
      return url;
    }
  };

  const markLoaded = (i) => {
    setLoadedMap((m) => ({ ...m, [i]: true }));
  };

  useEffect(() => {
    // keyboard navigation when hero or its children are focused
    function onKey(e) {
      if (!containerRef.current) return;
      const active = document.activeElement;
      if (!containerRef.current.contains(active)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + len) % len);
        setPaused(true);
        scheduleResume();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % len);
        setPaused(true);
        scheduleResume();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [len]);

  useEffect(() => {
    return () => {
      if (resumeRef.current) clearTimeout(resumeRef.current);
    };
  }, []);

  const scheduleResume = () => {
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), 5000);
  };

  useEffect(() => {
    // Respect users who prefer reduced motion: don't autoplay
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (len <= 1 || prefersReduced) return;
    const id = setInterval(() => {
      if (!paused) {
        setIndex((i) => (i + 1) % len);
      }
    }, 2000);
    return () => clearInterval(id);
  }, [len, paused]);

  const goPrev = () => {
    setIndex((i) => (i - 1 + len) % len);
    setPaused(true);
    scheduleResume();
  };
  const goNext = () => {
    setIndex((i) => (i + 1) % len);
    setPaused(true);
    scheduleResume();
  };

  if (!slides || slides.length === 0) return null;

  return (
    <section
      className="hero"
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured articles carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="hero-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => {
          const placeholder = getPlaceholderUrl(s.featuredImage);
          const isLoaded = !!loadedMap[i];
          return (
            <div className="hero-slide" key={s.id || i}>
              {placeholder && (
                <img
                  src={placeholder}
                  alt=""
                  aria-hidden="true"
                  className="hero-placeholder"
                />
              )}
              {s.featuredImage && (
                <img
                  src={s.featuredImage}
                  alt={s.title}
                  className={`hero-image ${isLoaded ? "loaded" : ""}`}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => markLoaded(i)}
                />
              )}
              <div className="hero-overlay">
                <div className="hero-badge">{s.category || "News"}</div>
                <h2 className="hero-title">{s.title}</h2>
                <p className="hero-excerpt">{s.excerpt}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="hero-arrow hero-arrow-left"
        onClick={goPrev}
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        className="hero-arrow hero-arrow-right"
        onClick={goNext}
        aria-label="Next slide"
      >
        ›
      </button>
      {/* live region for screen readers */}
      <div className="sr-only" aria-live="polite">
        Slide {index + 1} of {len}
      </div>
    </section>
  );
}

const ArticleCard = ({ article, featured }) => (
  <article className={featured ? "featured-article-card" : "article-card"}>
    <div className="article-content">
      <div className="article-meta">
        <span className="article-category">{article.category || "News"}</span>
        {article.author && (
          <span className="article-author">{article.author.name}</span>
        )}
        <span className="article-time">
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString()
            : article.createdAt
            ? new Date(article.createdAt).toLocaleDateString()
            : "Recent"}
        </span>
      </div>
      <h2 className="article-title">
        <Link
          to={`/article/${encodeURIComponent(article.slug)}`}
          className="article-link"
        >
          {article.title}
        </Link>
      </h2>
      <p className="article-excerpt">{article.excerpt}</p>
      {article.tags && article.tags.length > 0 && (
        <div
          style={{
            marginTop: "0.5rem",
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {article.tags.map((t, i) => (
            <span
              key={`${t}-${i}`}
              style={{
                fontSize: "0.8rem",
                padding: "0.15rem 0.5rem",
                background: "#f3f4f6",
                borderRadius: "999px",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
    {article.featuredImage && (
      <Link
        to={`/article/${encodeURIComponent(article.slug)}`}
        className="article-image-link"
      >
        <img
          src={article.featuredImage}
          alt={article.title}
          className="article-image"
        />
      </Link>
    )}
  </article>
);

const SidebarArticle = ({ article }) => (
  <article className="sidebar-article">
    {article.featuredImage && (
      <img
        src={article.featuredImage}
        alt={article.title}
        className="sidebar-article-image"
      />
    )}
    <div className="sidebar-article-content">
      <h3>{article.title}</h3>
    </div>
  </article>
);

const VideoArticle = ({ article }) => (
  <div className="video-article">
    <div className="video-thumbnail">
      <img src={article.thumbnail} alt={article.title} />
      <div className="play-button">▶</div>
    </div>
    <div className="video-content">
      <h3>{article.title}</h3>
      <div className="video-meta">
        <span className="article-category">Olympics</span>
        <span className="article-time">{article.duration} min read</span>
      </div>
    </div>
  </div>
);

export default function ArticlesView() {
  const [articles, setArticles] = useState([
    {
      title: "Women's Basketball Semifinals Preview And Schedule",
      excerpt:
        "The inaugural Olympic breaking competition kicked off at La Concorde on Friday...",
      category: "Olympics",
      author: { name: "Leslie Alexander" },
      createdAt: "7 hours ago",
      featuredImage: "/images/basketball.jpg",
    },
    // Add more sample articles as needed
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState(null);
  const paramsForRender = new URLSearchParams(window.location.search || "");
  const currentQuery = paramsForRender.get("q") || "";

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams(location.search || "");
    const q = params.get("q") || "";

    const loadArticles = async () => {
      try {
        setLoading(true);
        let response;
        if (q) {
          response = await fetchSearch({ q, status: "PUBLISHED", limit: 50 });
        } else {
          response = await fetchArticles();
        }
        if (!mounted) return;
        setArticles(response.data || []);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // initial load & on search param change
    loadArticles();

    // listen for external updates (e.g., CMS saved a new article)
    function onArticlesUpdated() {
      loadArticles();
    }
    window.addEventListener("articles-updated", onArticlesUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("articles-updated", onArticlesUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  if (loading) return <p>Loading articles...</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (articles.length === 0) return <p>No published articles found</p>;

  // Apply category/tag filters
  const filteredArticles = articles.filter((article) => {
    if (selectedCategory && selectedCategory !== "All") {
      if ((article.category || "") !== selectedCategory) return false;
    }
    if (selectedTag) {
      const tags = Array.isArray(article.tags) ? article.tags : [];
      if (!tags.includes(selectedTag)) return false;
    }
    return true;
  });

  // Filter video articles for the sidebar
  const mainArticles = filteredArticles
    .filter((article) => !article.isVideo)
    .slice(0, 5);
  const videoArticles = articles.filter((article) => article.isVideo);
  const sidebarArticles = filteredArticles.slice(5, 10);

  // compute unique categories and tags for filters
  const categories = Array.from(
    new Set(articles.map((a) => a.category || "News"))
  ).sort();
  const tags = Array.from(
    new Set(
      (articles || []).flatMap((a) => (Array.isArray(a.tags) ? a.tags : []))
    )
  ).sort();

  if (loading) return <div className="loading">Loading articles...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="articles-container">
      <main className="main-content">
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <label style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            Category:&nbsp;
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedTag(null);
              }}
            >
              <option value="All">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className={selectedTag === t ? "tag-active" : "tag"}
                style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "999px",
                  border: "1px solid #ddd",
                  background:
                    selectedTag === t ? "var(--accent)" : "transparent",
                  color: selectedTag === t ? "#fff" : "inherit",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {/* Search indicator */}
        {currentQuery ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "1rem",
              padding: "0.5rem 0.75rem",
              background: "#f7fafc",
              borderRadius: "6px",
            }}
          >
            <div>
              Showing results for <strong>"{currentQuery}"</strong>
            </div>
            <div>
              <button
                onClick={() => {
                  // clear search by navigating to base path
                  window.history.pushState({}, "", "/");
                  // trigger reload by dispatching popstate
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
                className="tag"
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}

        {/* Hero slider placed just below nav */}
        <HeroSlider slides={mainArticles.slice(0, 4)} />

        <h1 className="section-title">Latest Articles</h1>
        <div className="article-grid">
          {mainArticles.map((article, index) => (
            <ArticleCard
              key={article.id || index}
              article={article}
              featured={index === 0}
            />
          ))}
        </div>
      </main>
      <aside className="sidebar">
        <h2 className="section-title">News in Video</h2>
        <div className="video-articles">
          {videoArticles.map((article, index) => (
            <VideoArticle
              key={article.id || `video-${index}`}
              article={article}
            />
          ))}
        </div>
        <h2 className="section-title">Trending</h2>
        <div className="trending-articles">
          {sidebarArticles.map((article, index) => (
            <SidebarArticle
              key={article.id || `sidebar-${index}`}
              article={article}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
