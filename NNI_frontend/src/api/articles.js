// Minimal frontend API helpers for articles
// Exports: fetchArticles, createArticle

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function fetchArticles({ status = "PUBLISHED" } = {}) {
  const url = `${API_BASE}/api/articles?status=${encodeURIComponent(status)}`;
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch articles: ${res.status} ${text}`);
  }
  const json = await res.json();
  // Normalize articles to ensure category and tags are present
  if (json && Array.isArray(json.data)) {
    json.data = json.data.map((a) => ({
      ...a,
      category: a.category || "News",
      tags: Array.isArray(a.tags)
        ? a.tags
        : a.tags
        ? String(a.tags)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    }));
  }
  return json;
}

async function createArticle({
  title,
  content,
  excerpt,
  status = "DRAFT",
  featuredImageFile,
  category,
  tags,
  token,
} = {}) {
  const url = `${API_BASE}/api/articles`;
  const form = new FormData();
  form.append("title", title || "");
  form.append("content", content || "");
  form.append("excerpt", excerpt || "");
  form.append("status", status);
  if (category) form.append("category", category);
  if (Array.isArray(tags)) form.append("tags", JSON.stringify(tags));
  if (featuredImageFile) form.append("featuredImage", featuredImageFile);

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    body: form,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Create article failed: ${res.status} ${body}`);
  }
  return res.json();
}

async function fetchSearch({ q = "", status = "PUBLISHED", limit = 20 } = {}) {
  const url = new URL(
    `${API_BASE}/api/articles/search`,
    window.location.origin
  );
  if (q) url.searchParams.set("q", q);
  if (status) url.searchParams.set("status", status);
  if (limit) url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Search failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  // Normalize articles to ensure category and tags are present
  if (json && Array.isArray(json.data)) {
    json.data = json.data.map((a) => ({
      ...a,
      category: a.category || "News",
      tags: Array.isArray(a.tags)
        ? a.tags
        : a.tags
        ? String(a.tags)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    }));
  }
  return json;
}

export { fetchArticles, createArticle, fetchSearch };
