import React from "react";

export default function CmsList({
  articles = [],
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onTogglePublish,
}) {
  return (
    <aside
      className="cms-list"
      style={{
        width: 320,
        padding: "1rem",
        borderRight: "1px solid var(--muted)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <h3>Articles</h3>
        <button className="btn" onClick={onCreate}>
          New
        </button>
      </div>
      <div style={{ maxHeight: "60vh", overflow: "auto" }}>
        {articles.length === 0 && <div className="muted">No articles</div>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {articles.map((a) => (
            <li
              key={a.id}
              style={{
                marginBottom: "0.5rem",
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <button
                className={`cms-list-item ${
                  selectedId === a.id ? "active" : ""
                }`}
                style={{ flex: 1, textAlign: "left" }}
                onClick={() => onSelect(a)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{a.title || "Untitled"}</div>
                  <div
                    className={`status-badge ${
                      a.status === "PUBLISHED" ? "published" : "draft"
                    }`}
                  >
                    {a.status === "PUBLISHED" ? "Published" : "Draft"}
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  {a.publishedAt
                    ? new Date(a.publishedAt).toLocaleString()
                    : "—"}
                </div>
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                {/* Publish/Unpublish toggle for persisted articles */}
                {a.id && !String(a.id).startsWith("draft-") && (
                  <button
                    className={`btn ${
                      a.status === "PUBLISHED" ? "btn-ghost" : ""
                    }`}
                    onClick={() => onTogglePublish && onTogglePublish(a)}
                    title={a.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  >
                    {a.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={() => onDelete(a)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
