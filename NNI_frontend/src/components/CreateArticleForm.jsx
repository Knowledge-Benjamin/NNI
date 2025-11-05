import React, { useState } from "react";
import { createArticle } from "../api/articles";

export default function CreateArticleForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createArticle({
        title,
        content,
        excerpt,
        status: "PUBLISHED",
        featuredImageFile: file,
      });
      setTitle("");
      setContent("");
      setExcerpt("");
      setFile(null);
      if (onCreated) onCreated(res);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label>Excerpt</label>
        <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </div>
      <div>
        <label>Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div>
        <label>Featured Image</label>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "Posting..." : "Create Article"}
      </button>
    </form>
  );
}
