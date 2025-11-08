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
    <aside className="cms-list">
      <div className="cms-list-header">
        <h3>Articles</h3>
        <button className="btn" onClick={onCreate}>
          New
        </button>
      </div>
      <div className="cms-list-scroll">
        {articles.length === 0 && <div className="muted">No articles</div>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {articles.map((a) => (
            <li key={a.id} className="cms-list-row">
              <button
                className={`cms-list-item ${
                  selectedId === a.id ? "active" : ""
                }`}
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
                <div
                  className="muted"
                  style={{ fontSize: "0.75rem", marginTop: "0.375rem" }}
                >
                  {a.publishedAt
                    ? new Date(a.publishedAt).toLocaleString()
                    : "—"}
                </div>
              </button>
              <div className="cms-list-actions">
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
