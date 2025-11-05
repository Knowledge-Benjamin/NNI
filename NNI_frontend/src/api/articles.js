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
  return res.json();
}

async function createArticle({
  title,
  content,
  excerpt,
  status = "DRAFT",
  featuredImageFile,
  token,
} = {}) {
  const url = `${API_BASE}/api/articles`;
  const form = new FormData();
  form.append("title", title || "");
  form.append("content", content || "");
  form.append("excerpt", excerpt || "");
  form.append("status", status);
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

export { fetchArticles, createArticle };
