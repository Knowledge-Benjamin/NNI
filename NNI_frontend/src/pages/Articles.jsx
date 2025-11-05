import { useState, useEffect, useRef } from "react";
import { getArticles, createArticle } from "../api/client";
import Editor from "../components/Editor";
import "./Articles.css";

function Articles({ user }) {
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [featuredImage, setFeaturedImage] = useState(null);
  const editorRef = useRef(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      console.log("Fetching articles...");
      const res = await getArticles();
      console.log("Articles response:", res.data);
      setArticles(res.data.data);
    } catch (err) {
      console.error("Failed to load articles:", err.response?.data || err);
      setError(
        "Failed to load articles: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("excerpt", excerpt);
    formData.append("content", content);
    formData.append("status", status);
    if (featuredImage) {
      formData.append("featuredImage", featuredImage);
    }

    try {
      const response = await createArticle(formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Article saved!", response.data);
      setTitle("");
      setExcerpt("");
      setContent("");
      setStatus("DRAFT");
      setFeaturedImage(null);
      // Clear editor content
      if (editorRef.current) {
        editorRef.current.commands.setContent("");
      }
      // Fetch updated list
      await fetchArticles();
    } catch (err) {
      console.error("Save failed:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to save";
      setError(`Error: ${errorMessage}`);
      // Don't clear form on error so user can try again
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="text-center" style={{ margin: "2rem 0" }}>
        Articles Dashboard
      </h1>

      <div className="card">
        <h2>Create New Article</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Excerpt (optional)"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
          <div style={{ margin: "1rem 0" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Featured Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFeaturedImage(e.target.files[0])}
            />
            {featuredImage && (
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                {featuredImage.name}
              </p>
            )}
          </div>
          <Editor content={content} onUpdate={setContent} ref={editorRef} />
          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
            <label>
              <input
                type="radio"
                value="DRAFT"
                checked={status === "DRAFT"}
                onChange={(e) => setStatus(e.target.value)}
              />
              Draft
            </label>
            <label>
              <input
                type="radio"
                value="PUBLISHED"
                checked={status === "PUBLISHED"}
                onChange={(e) => setStatus(e.target.value)}
              />
              Publish
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ marginTop: "1rem" }}
          >
            {loading ? "Saving..." : "Save Article"}
          </button>
        </form>
      </div>

      <div className="mt-4">
        <h2>Your Articles ({articles.length})</h2>
        {error && (
          <div
            className="card"
            style={{ marginBottom: "1rem", backgroundColor: "#ffebee" }}
          >
            <p style={{ color: "#c62828" }}>{error}</p>
          </div>
        )}
        {articles.map((a) => (
          <div key={a.id} className="card" style={{ marginBottom: "1rem" }}>
            <h3>{a.title}</h3>
            {a.featuredImage && (
              <img
                src={`http://localhost:5000${a.featuredImage}`}
                alt="Featured"
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              />
            )}
            <p>
              <strong>Status:</strong> {a.status}
            </p>
            <p>
              <strong>Slug:</strong> {a.slug}
            </p>
            <p>
              <strong>Author:</strong> {a.author?.name || "Unknown"}
            </p>
            <p>
              <strong>ID:</strong> {a.id}
            </p>
            <p>
              <strong>Created:</strong> {new Date(a.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Public URL:</strong>
              <a
                href={`/article/${a.slug}`}
                target="_blank"
                style={{ color: "#2563eb" }}
              >
                View Live
              </a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Articles;
