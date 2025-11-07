import React, { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import CmsEditor from "../components/CmsEditor";
import CmsList from "../components/CmsList";
import * as api from "../utils/api";
import Toasts from "../components/Toasts";
import TagInput from "../components/TagInput";

export default function CMS() {
  const { token } = useAuth();
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const featuredFileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [excerptLength, setExcerptLength] = useState(120);
  const [excerptTouched, setExcerptTouched] = useState(false);

  function pushToast(message, type = "success", timeout = 3500) {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((s) => [...s, { id, message, type }]);
    if (timeout)
      setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), timeout);
  }

  function dismissToast(id) {
    setToasts((s) => s.filter((t) => t.id !== id));
  }

  // autosave selected draft to localStorage (debounced)
  useEffect(() => {
    if (!selected) return;
    const id = selected.id;
    const handler = setTimeout(() => {
      try {
        // only autosave if it's a draft or unsaved local id
        localStorage.setItem(
          `cms-draft-${id}`,
          JSON.stringify({
            title: selected.title,
            excerpt: selected.excerpt,
            content: selected.content,
            status: selected.status,
            category: selected.category,
            tags: selected.tags,
          })
        );
      } catch (e) {
        // ignore storage errors
      }
    }, 2000);
    return () => clearTimeout(handler);
  }, [selected]);

  async function loadAll() {
    setLoading(true);
    try {
      const drafts = await api.getArticles("DRAFT");
      const published = await api.getArticles("PUBLISHED");
      const combined = [
        ...(drafts?.data || []),
        ...(published?.data || []),
      ].sort(
        (a, b) =>
          new Date(b.createdAt || b.publishedAt) -
          new Date(a.createdAt || a.publishedAt)
      );
      setArticles(combined);
    } catch (e) {
      setError(e.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreate() {
    const newArticle = {
      id: `draft-${Date.now()}`,
      title: "Untitled",
      content: "",
      excerpt: "",
      status: "DRAFT",
      category: "Olympics",
      tags: [],
      // metadata fields
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      canonical: "",
      featuredImageName: "",
      featuredImageAlt: "",
    };
    setArticles([newArticle, ...articles]);
    setSelected(newArticle);
    // persist a local autosave slot for drafts
    try {
      localStorage.setItem(
        `cms-draft-${newArticle.id}`,
        JSON.stringify(newArticle)
      );
    } catch (e) {}
  }

  function handleSelect(article) {
    setSelected(article);
    // if local autosave exists for this article, merge it
    try {
      const raw = localStorage.getItem(`cms-draft-${article.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSelected((s) => ({ ...article, ...parsed }));
      }
    } catch (e) {
      // ignore
    }
    // mark excerpt as touched if the article already has one
    try {
      setExcerptTouched(Boolean(article && article.excerpt));
    } catch (e) {}
  }

  async function handleDelete(article) {
    if (!confirm(`Delete article "${article.title}"? This cannot be undone.`))
      return;
    // if it's a persisted article (has numeric/uuid id without draft- prefix)
    if (article.id && !String(article.id).startsWith("draft-")) {
      try {
        await api.deleteArticle(article.id, token);
        setArticles((s) => s.filter((a) => a.id !== article.id));
        setSelected(null);
        pushToast("Article deleted", "success");
      } catch (e) {
        pushToast(e.message || "Delete failed", "error");
      }
    } else {
      // local draft, just remove
      setArticles((s) => s.filter((a) => a.id !== article.id));
      setSelected(null);
    }
  }

  async function handleSave(article) {
    setSaving(true);
    setError(null);
    try {
      // sanitize content to avoid inline scripts or event handlers
      const safeContent = sanitizeHTML(article.content || "");
      const payload = { ...article, content: safeContent };

      // If featuredImage not explicitly set, try to pull the first
      // <img src="..."> from the sanitized content and use it as
      // the featuredImage. This covers the case where an image was
      // uploaded into the editor but not set via the Replace control.
      if (!payload.featuredImage) {
        const inferred = extractFirstImageUrl(safeContent);
        if (inferred) payload.featuredImage = inferred;
      }

      if (article.id && !String(article.id).startsWith("draft-")) {
        const updated = await api.updateArticle(article.id, payload, token);
        setArticles((s) => s.map((a) => (a.id === updated.id ? updated : a)));
        setSelected(updated);
        // notify other parts of the app that articles changed
        try {
          window.dispatchEvent(new Event("articles-updated"));
        } catch (e) {}
      } else {
        const created = await api.createArticle(payload, token);
        // Replace local draft with created article
        setArticles((s) => [created, ...s.filter((a) => a.id !== article.id)]);
        setSelected(created);
        // notify other parts of the app that articles changed
        try {
          window.dispatchEvent(new Event("articles-updated"));
        } catch (e) {}
      }

      // clear any autosave for this draft
      try {
        localStorage.removeItem(`cms-draft-${article.id}`);
      } catch (e) {}

      pushToast("Saved", "success");
    } catch (e) {
      setError(e.message || "Save failed");
      pushToast(e.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  // Publish/unpublish toggle from list
  async function handleTogglePublish(article) {
    if (!article || !article.id || String(article.id).startsWith("draft-"))
      return;
    const newStatus = article.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      setSaving(true);
      const updated = await api.updateArticle(
        article.id,
        { ...article, status: newStatus },
        token
      );
      setArticles((s) => s.map((a) => (a.id === updated.id ? updated : a)));
      if (selected && selected.id === updated.id) setSelected(updated);
      pushToast(
        newStatus === "PUBLISHED" ? "Article published" : "Article unpublished",
        "success"
      );
      try {
        window.dispatchEvent(new Event("articles-updated"));
      } catch (e) {}
    } catch (err) {
      pushToast(err?.message || "Failed to update status", "error");
    } finally {
      setSaving(false);
    }
  }

  // very small sanitizer: strip <script> and on* attributes
  function sanitizeHTML(html) {
    if (!html) return html;
    let s = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");
    return s;
  }

  // Convert HTML content to plain text for excerpt generation
  function stripHtmlToText(html) {
    if (!html) return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const text = doc.body.textContent || "";
      return String(text).replace(/\s+/g, " ").trim();
    } catch (e) {
      // fallback
      return String(html)
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  // Count words in the provided HTML content (plain-text fallback)
  const wordCount = useMemo(() => {
    if (!selected || !selected.content) return 0;
    const text = stripHtmlToText(selected.content || "");
    if (!text) return 0;
    // split on whitespace, filter empty
    return text.split(/\s+/).filter(Boolean).length;
  }, [selected?.content]);

  // Extract the first image URL from HTML content, or null if none.
  function extractFirstImageUrl(html) {
    if (!html) return null;
    try {
      // Use DOMParser in the browser to safely parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const img = doc.querySelector("img");
      if (img && img.src) return img.src;
    } catch (e) {
      // fallback to a regex if DOMParser isn't available for some reason
      const m = html.match(/<img[^>]+src=["']?([^"'>\s]+)["']?/i);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  // Auto-generate excerpt from content when user hasn't manually edited the excerpt.
  useEffect(() => {
    if (!selected) return;
    if (excerptTouched) return; // don't overwrite manual edits

    const text = stripHtmlToText(selected.content || "");
    const auto = text.slice(0, excerptLength).trim();
    // Only update if different to avoid unnecessary state churn
    if ((selected.excerpt || "") !== auto) {
      setSelected((s) => ({ ...s, excerpt: auto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.content, excerptLength, excerptTouched]);

  return (
    <div style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
      <CmsList
        articles={articles}
        selectedId={selected?.id}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onTogglePublish={handleTogglePublish}
      />

      <section style={{ flex: 1, padding: "1rem" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>CMS Editor</h1>
            <p className="muted">Create, edit and publish articles</p>
          </div>
          <div>
            <button className="btn" onClick={loadAll} disabled={loading}>
              Refresh
            </button>
          </div>
        </header>

        {selected ? (
          <div style={{ marginTop: "1rem" }}>
            {/* Word count and warning */}
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <small className={wordCount > 5000 ? "error" : "muted"}>
                Words: {wordCount} / 5000{" "}
                {wordCount > 5000 ? "(exceeds limit)" : ""}
              </small>
              {wordCount > 5000 && (
                <small
                  style={{ color: "var(--danger)", marginLeft: "0.75rem" }}
                >
                  Please shorten your article to 5000 words or less.
                </small>
              )}
            </div>

            {/* Title + Excerpt controls */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <label className="field">
                  <span className="label">Title</span>
                  <input
                    className="input"
                    value={selected.title}
                    onChange={(e) =>
                      setSelected({ ...selected, title: e.target.value })
                    }
                  />
                </label>

                <label className="field" style={{ marginTop: "0.5rem" }}>
                  <span className="label">Excerpt</span>
                  <input
                    className="input"
                    value={selected.excerpt}
                    onChange={(e) => {
                      setExcerptTouched(true);
                      setSelected({ ...selected, excerpt: e.target.value });
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  minWidth: "12.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <label style={{ display: "flex", flexDirection: "column" }}>
                  <span className="label">Category</span>
                  <select
                    value={selected.category || "Olympics"}
                    onChange={(e) =>
                      setSelected((s) => ({ ...s, category: e.target.value }))
                    }
                    className="input"
                    style={{ padding: "0.375rem 0.5rem" }}
                  >
                    <option>Olympics</option>
                    <option>News</option>
                    <option>Sports</option>
                    <option>Opinion</option>
                    <option>Lifestyle</option>
                    <option>Technology</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column" }}>
                  <span className="label">Tags</span>
                  <TagInput
                    value={selected.tags || []}
                    onChange={(tags) => setSelected((s) => ({ ...s, tags }))}
                    placeholder="Add a tag"
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column" }}>
                  <span className="label">Excerpt length</span>
                  <select
                    value={excerptLength}
                    onChange={(e) => setExcerptLength(Number(e.target.value))}
                    className="input"
                    style={{ padding: "0.375rem 0.5rem" }}
                  >
                    <option value={50}>50 chars</option>
                    <option value={100}>100 chars</option>
                    <option value={120}>120 chars</option>
                    <option value={160}>160 chars</option>
                    <option value={200}>200 chars</option>
                  </select>
                </label>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setExcerptTouched(false);
                    setSelected((s) => ({ ...s }));
                  }}
                  title="Revert to auto-generated excerpt"
                >
                  Auto
                </button>
              </div>
            </div>

            <div style={{ marginTop: "0.75rem" }}>
              <CmsEditor
                value={selected.content}
                onChange={(html) => setSelected({ ...selected, content: html })}
                onImageUpload={(url) => {
                  setFeaturedImageUrl(url);
                  setSelected((s) => ({ ...s, featuredImage: url }));
                }}
              />
            </div>

            {/* Featured image preview + replace/remove controls */}
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: "7.5rem" }}>
                <div style={{ fontSize: "0.75rem" }} className="muted">
                  Featured image
                </div>
                {selected.featuredImage || featuredImageUrl ? (
                  <img
                    src={selected.featuredImage || featuredImageUrl}
                    alt="Featured"
                    style={{
                      width: "7.5rem",
                      height: "5rem",
                      objectFit: "cover",
                      borderRadius: "0.375rem",
                      marginTop: "0.375rem",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "7.5rem",
                      height: "5rem",
                      border: "1px dashed var(--muted)",
                      borderRadius: "0.375rem",
                      marginTop: "0.375rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{ fontSize: "0.75rem", color: "var(--muted)" }}
                    >
                      No image
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={featuredFileRef}
                  onChange={async (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    setUploadingFeatured(true);
                    try {
                      const data = await api.uploadImageToImgBB(f);
                      const url = data?.url || data?.display_url || null;
                      if (url) {
                        setFeaturedImageUrl(url);
                        setSelected((s) => ({ ...s, featuredImage: url }));
                      }
                    } catch (err) {
                      pushToast(
                        (err && err.message) || "Upload failed",
                        "error"
                      );
                    } finally {
                      setUploadingFeatured(false);
                      try {
                        e.target.value = null;
                      } catch (er) {}
                    }
                  }}
                />

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn"
                    onClick={() =>
                      featuredFileRef.current && featuredFileRef.current.click()
                    }
                    disabled={uploadingFeatured}
                  >
                    {uploadingFeatured ? "Uploading..." : "Replace Image"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setFeaturedImageUrl(null);
                      setSelected((s) => ({ ...s, featuredImage: null }));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Featured image name / alt and metadata fields */}
              <div
                style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem" }}
              >
                <label className="field">
                  <span className="label">Featured image name</span>
                  <input
                    className="input"
                    placeholder="e.g. olympics-opening-ceremony"
                    value={selected.featuredImageName || ""}
                    onChange={(e) =>
                      setSelected((s) => ({
                        ...s,
                        featuredImageName: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span className="label">Featured image alt text</span>
                  <input
                    className="input"
                    placeholder="Describe the image for accessibility"
                    value={selected.featuredImageAlt || ""}
                    onChange={(e) =>
                      setSelected((s) => ({
                        ...s,
                        featuredImageAlt: e.target.value,
                      }))
                    }
                  />
                </label>

                <details style={{ padding: "0.5rem" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                    Post metadata
                  </summary>
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "grid",
                      gap: "0.5rem",
                    }}
                  >
                    <label className="field">
                      <span className="label">Meta title</span>
                      <input
                        className="input"
                        value={selected.metaTitle || ""}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            metaTitle: e.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span className="label">Meta description</span>
                      <textarea
                        className="input"
                        rows={3}
                        value={selected.metaDescription || ""}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            metaDescription: e.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span className="label">
                        Meta keywords (comma separated)
                      </span>
                      <input
                        className="input"
                        value={selected.metaKeywords || ""}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            metaKeywords: e.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span className="label">Canonical URL</span>
                      <input
                        className="input"
                        placeholder="https://example.com/your-article"
                        value={selected.canonical || ""}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            canonical: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </details>
              </div>
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <button
                className="btn"
                onClick={() => {
                  const w = window.open("", "_blank", "noopener");
                  const safe = sanitizeHTML(selected.content || "");
                  if (w) {
                    w.document.write(
                      `<html><head><title>${
                        selected.title || "Preview"
                      }</title></head><body>${safe}</body></html>`
                    );
                    w.document.close();
                  } else {
                    alert("Unable to open preview window");
                  }
                }}
              >
                Preview
              </button>
            </div>

            <div
              style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}
            >
              <button
                className="btn"
                onClick={() => {
                  if (wordCount > 5000) {
                    pushToast(
                      "Article exceeds 5000-word limit. Please shorten it.",
                      "error"
                    );
                    return;
                  }
                  handleSave({
                    ...selected,
                    status: "DRAFT",
                    featuredImage: selected.featuredImage || featuredImageUrl,
                  });
                }}
                disabled={saving || wordCount > 5000}
                title="Save to Draft"
              >
                Save to Draft
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  if (wordCount > 5000) {
                    pushToast(
                      "Article exceeds 5000-word limit. Please shorten it.",
                      "error"
                    );
                    return;
                  }
                  handleSave({
                    ...selected,
                    status: "PUBLISHED",
                    featuredImage: selected.featuredImage || featuredImageUrl,
                  });
                }}
                disabled={saving || wordCount > 5000}
                title="Save & Publish"
              >
                Save & Publish
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="muted" style={{ marginTop: "1rem" }}>
            Select an article or create a new one.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="auth-error"
            style={{ marginTop: "1rem" }}
          >
            {error}
          </div>
        )}
        <Toasts toasts={toasts} onDismiss={dismissToast} />
      </section>
    </div>
  );
}
