import { normalizeArticle, normalizeArticles } from "../utils/normalize";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export async function fetchArticles(status = "PUBLISHED") {
  const url = `${API_BASE}/articles?status=${encodeURIComponent(status)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch articles: ${resp.statusText}`);
  const json = await resp.json();
  return {
    ...json,
    data: normalizeArticles(json.data || []),
  };
}

export async function fetchArticleBySlug(slug) {
  const url = `${API_BASE}/articles/${encodeURIComponent(slug)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 404) return null;
    throw new Error(`Failed to fetch article: ${resp.statusText}`);
  }
  const article = await resp.json();
  return normalizeArticle(article);
}

export async function fetchSearch(query, status) {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (status) params.append("status", status);

  const url = `${API_BASE}/articles/search?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok)
    throw new Error(`Search request failed: ${resp.statusText}`);
  const json = await resp.json();
  return {
    ...json,
    data: normalizeArticles(json.data || []),
  };
}

export async function createArticle(articleData, token) {
  const url = `${API_BASE}/articles`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(articleData),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(errText || `Failed to create article: ${resp.statusText}`);
  }
  const article = await resp.json();
  return normalizeArticle(article);
}

export async function updateArticle(id, articleData, token) {
  const url = `${API_BASE}/articles/${encodeURIComponent(id)}`;
  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(articleData),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(errText || `Failed to update article: ${resp.statusText}`);
  }
  const article = await resp.json();
  return normalizeArticle(article);
}

export async function deleteArticle(id, token) {
  const url = `${API_BASE}/articles/${encodeURIComponent(id)}`;
  const resp = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(errText || `Failed to delete article: ${resp.statusText}`);
  }
  return resp.json();
}
