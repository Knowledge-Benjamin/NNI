// Lightweight API helpers for articles, includes Authorization when token provided
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function request(
  path,
  { method = "GET", body, token, isForm = false } = {}
) {
  const headers = {};
  let payload;
  if (isForm) {
    payload = body; // FormData
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: payload,
    // Avoid returning cached responses so clients always get fresh article lists
    cache: "no-store",
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    // not json
  }

  if (!res.ok) {
    const err = new Error(
      json?.error || json?.message || res.statusText || "Request failed"
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

export async function getArticles(status = "DRAFT") {
  const data = await request(
    `/api/articles?status=${encodeURIComponent(status)}`
  );
  return data;
}

export async function createArticle(
  { title, content, excerpt, status = "DRAFT", featuredImage },
  token
) {
  // If featuredImage is a File (binary), send as multipart/form-data so
  // the backend upload middleware can process it. If it's a string (URL),
  // send JSON with featuredImage set to that URL.
  if (featuredImage instanceof File) {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("content", content);
    fd.append("excerpt", excerpt);
    fd.append("status", status);
    fd.append("featuredImage", featuredImage);
    // include optional category and tags when present on the payload
    if (typeof arguments[0].category !== "undefined") {
      fd.append("category", arguments[0].category);
    }
    if (typeof arguments[0].tags !== "undefined") {
      const t = arguments[0].tags;
      fd.append("tags", Array.isArray(t) ? JSON.stringify(t) : String(t));
    }
    return await request(`/api/articles`, {
      method: "POST",
      body: fd,
      token,
      isForm: true,
    });
  }

  return await request(`/api/articles`, {
    method: "POST",
    body: {
      title,
      content,
      excerpt,
      status,
      featuredImage: featuredImage || null,
      category: arguments[0].category,
      tags: arguments[0].tags,
    },
    token,
  });
}

export async function updateArticle(
  id,
  { title, content, excerpt, status = "DRAFT", featuredImage },
  token
) {
  if (featuredImage instanceof File) {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("content", content);
    fd.append("excerpt", excerpt);
    fd.append("status", status);
    fd.append("featuredImage", featuredImage);
    if (typeof arguments[1].category !== "undefined") {
      fd.append("category", arguments[1].category);
    }
    if (typeof arguments[1].tags !== "undefined") {
      const t = arguments[1].tags;
      fd.append("tags", Array.isArray(t) ? JSON.stringify(t) : String(t));
    }
    return await request(`/api/articles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: fd,
      token,
      isForm: true,
    });
  }

  return await request(`/api/articles/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: {
      title,
      content,
      excerpt,
      status,
      featuredImage: featuredImage || null,
      category: arguments[1].category,
      tags: arguments[1].tags,
    },
    token,
  });
}

export async function deleteArticle(id, token) {
  return await request(`/api/articles/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

export async function getArticleBySlug(slug) {
  return await request(`/api/articles/${encodeURIComponent(slug)}`);
}

// NOTE: We use a single uploadImageToImgBB implementation below (keep only one)

// Upload image to ImgBB. Accepts a File and optional apiKey.
// Returns the imgbb response data object on success (data.display_url, data.url, etc.)
export async function uploadImageToImgBB(file, apiKey) {
  // Prefer using a server-side proxy to avoid exposing the ImgBB key to clients.
  const useProxy = import.meta.env.VITE_USE_IMGBB_PROXY === "true";
  const key = apiKey || import.meta.env.VITE_IMGBB_KEY;
  if (!useProxy && !key) {
    // Fail fast: do not keep a secret in source. Require the key to be
    // provided via Vite env (VITE_IMGBB_KEY) or passed explicitly when not using proxy.
    throw new Error(
      "ImgBB API key not provided. Set VITE_IMGBB_KEY in your .env file, enable VITE_USE_IMGBB_PROXY, or pass apiKey to uploadImageToImgBB."
    );
  }
  // Send the File directly as multipart/form-data. ImgBB accepts either a
  // base64 string or a binary file — sending the File avoids building a huge
  // base64 string in memory and prevents subtle formatting issues that can
  // produce 400 responses.
  const fd = new FormData();
  fd.append("image", file);

  let res;
  let json;
  try {
    if (useProxy) {
      // send to our backend proxy which will forward to ImgBB using a
      // server-side key (safer for production)
      res = await fetch(`${API_BASE}/api/uploads/imgbb`, {
        method: "POST",
        body: fd,
      });
    } else {
      res = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          body: fd,
        }
      );
    }
  } catch (networkErr) {
    const err = new Error(`ImgBB network error: ${networkErr.message}`);
    err.cause = networkErr;
    throw err;
  }

  try {
    json = await res.json();
  } catch (parseErr) {
    const err = new Error(
      `ImgBB returned non-JSON response: ${res.status} ${res.statusText}`
    );
    err.body = null;
    throw err;
  }

  if (!res.ok) {
    const msg =
      json?.error?.message || json?.data?.error || JSON.stringify(json);
    const err = new Error(`ImgBB upload failed: ${msg}`);
    err.body = json;
    throw err;
  }

  // SUCCESS: backend proxy returns { data: { ... } } or full ImgBB response
  // ImgBB original has json.success true + json.status 200
  // Our proxy may skip those — so we ONLY check res.ok
  return json.data || json; // always return the image data

  // return json.data; // contains display_url, url, image.url, etc.
}

export default {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleBySlug,
  uploadImageToImgBB,
};
