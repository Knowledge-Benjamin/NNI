import React, { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
// CmsEditor removed: About editor now uses structured section-based API only
import CmsList from "../components/CmsList";
import * as api from "../utils/api";
import Toasts from "../components/Toasts";
import TagInput from "../components/TagInput";

// About editor component: supports freeform HTML or a structured JSON representation
function AboutEditor({ token, pushToast }) {
  const [loading, setLoading] = useState(false);
  const [about, setAbout] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const featuredFileRef = useRef(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

  // About editor now uses structured sections only
  const [structured, setStructured] = useState({
    hero: {
      title: "NNI News",
      subtitle: "Deep Analysis. Verified Truth.",
      image: "",
      meta: "",
    },
    mission: "",
    why: "",
    coreValues: [],
    stats: [],
    founder: { name: "", role: "", photo: "", bio: "" },
    journey: [],
    team: [],
    contact: { cta: "", email: "" },
    notes: "",
  });

  function setStructuredField(path, value) {
    setStructured((s) => {
      const copy = JSON.parse(JSON.stringify(s || {}));
      const keys = path.split(".");
      let cur = copy;
      for (let i = 0; i < keys.length - 1; i++)
        cur = cur[keys[i]] = cur[keys[i]] || {};
      cur[keys[keys.length - 1]] = value;
      return copy;
    });
  }

  // Ensure founder appears in the team list for editing and preview.
  function mergeFounderIntoTeam(sections) {
    const s = JSON.parse(JSON.stringify(sections || {}));
    s.team = Array.isArray(s.team) ? s.team.slice() : [];
    if (s.founder && s.founder.name) {
      const founderName = String(s.founder.name || "").trim();
      const exists = s.team.find(
        (m) => String(m.name || "").trim() === founderName
      );
      if (!exists) {
        s.team.unshift({
          name: s.founder.name,
          role: s.founder.role || "",
          photo: s.founder.photo || null,
          bio: s.founder.bio || "",
        });
      } else {
        s.team = s.team.map((m) => {
          if (String(m.name || "").trim() === founderName) {
            return {
              name: s.founder.name,
              role: s.founder.role || m.role,
              photo: m.photo || s.founder.photo || null,
              bio: m.bio || s.founder.bio || "",
            };
          }
          return m;
        });
      }
    }
    return s;
  }

  function addStat() {
    setStructured((s) => ({
      ...s,
      stats: [...(s.stats || []), { label: "", value: "" }],
    }));
  }
  function removeStat(i) {
    setStructured((s) => ({
      ...s,
      stats: (s.stats || []).filter((_, idx) => idx !== i),
    }));
  }
  function addTeam() {
    setStructured((s) => ({
      ...s,
      team: [...(s.team || []), { name: "", role: "", photo: "", bio: "" }],
    }));
  }
  function removeTeam(i) {
    setStructured((s) => ({
      ...s,
      team: (s.team || []).filter((_, idx) => idx !== i),
    }));
  }

  function applyStructuredToAbout() {
    if (!about) return;
    const obj = { type: "about", sections: structured };
    setAbout((a) => ({ ...a, content: JSON.stringify(obj) }));
  }
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Try structured about endpoint first
        try {
          const r = await api.getAbout();
          if (!mounted) return;
          if (r && r.data) {
            setAbout({
              id: `about-${Date.now()}`,
              title: "About NNI",
              content: JSON.stringify(r.data),
            });
            setStructured((prev) => ({
              ...prev,
              ...mergeFounderIntoTeam(r.data.sections),
            }));
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore and fallback to legacy article fetch
        }

        const res = await api.getArticleBySlug("about-nni");
        if (!mounted) return;
        let parsed = null;
        try {
          if (res && res.content) parsed = JSON.parse(res.content);
        } catch (err) {
          parsed = null;
        }
        if (parsed && parsed.type === "about" && parsed.sections) {
          setAbout(res);
          setStructured((prev) => ({
            ...prev,
            ...mergeFounderIntoTeam(parsed.sections),
          }));
        } else {
          setAbout(res);
        }
      } catch (e) {
        if (e && e.status === 404) {
          setAbout({
            id: `about-draft-${Date.now()}`,
            title: "About NNI",
            content:
              "<h2>About NNI</h2><p>Edit this content to update the site About page.</p>",
            excerpt: "About NNI",
            status: "DRAFT",
            category: "News",
            tags: [],
          });
        } else {
          setError(e?.message || String(e));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  async function handleSave(asPublished = false) {
    if (!about) return;
    setSaving(true);
    setError(null);
    try {
      if (!token) throw new Error("Authentication required to save About page");
      const res = await api.replaceAboutSections(structured, token);
      if (res && res.data) {
        setStructured(mergeFounderIntoTeam(res.data.sections || structured));
        setAbout((a) => ({
          ...a,
          content: JSON.stringify({
            type: "about",
            sections: res.data.sections || structured,
          }),
        }));
      }
      pushToast("About page updated", "success");
    } catch (e) {
      setError(e?.message || String(e));
      pushToast(e?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="muted">Loading About editor…</div>;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>About Page Editor</h2>

      <label className="field">
        <span className="label">Title</span>
        <input
          className="input"
          value={about?.title || ""}
          onChange={(e) => setAbout((s) => ({ ...s, title: e.target.value }))}
        />
      </label>

      <div style={{ marginTop: "0.5rem" }}>
        <div style={{ marginBottom: ".5rem", fontWeight: 600 }}>
          Structured About editor (hero, mission, stats, team, contact)
        </div>

        <div style={{ marginTop: ".5rem", display: "grid", gap: ".5rem" }}>
          <fieldset>
            <legend>Hero</legend>
            <label className="field">
              <span className="label">Title</span>
              <input
                className="input"
                value={structured.hero?.title || ""}
                onChange={(e) =>
                  setStructuredField("hero.title", e.target.value)
                }
              />
            </label>
            <label className="field">
              <span className="label">Subtitle</span>
              <input
                className="input"
                value={structured.hero?.subtitle || ""}
                onChange={(e) =>
                  setStructuredField("hero.subtitle", e.target.value)
                }
              />
            </label>
            <label className="field">
              <span className="label">Background image URL</span>
              <input
                className="input"
                value={structured.hero?.image || ""}
                onChange={(e) =>
                  setStructuredField("hero.image", e.target.value)
                }
                placeholder="https://..."
              />
            </label>
            <label className="field">
              <span className="label">Meta line</span>
              <input
                className="input"
                value={structured.hero?.meta || ""}
                onChange={(e) =>
                  setStructuredField("hero.meta", e.target.value)
                }
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Mission</legend>
            <textarea
              className="input"
              rows={4}
              value={structured.mission || ""}
              onChange={(e) => setStructuredField("mission", e.target.value)}
            />
          </fieldset>

          <fieldset>
            <legend>Stats</legend>
            {(structured.stats || []).map((st, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: ".5rem",
                  alignItems: "center",
                }}
              >
                <input
                  className="input"
                  placeholder="Value"
                  value={st.value || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.stats[i].value = v;
                      return copy;
                    });
                  }}
                />
                <input
                  className="input"
                  placeholder="Label"
                  value={st.label || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.stats[i].label = v;
                      return copy;
                    });
                  }}
                />
                <button className="btn btn-ghost" onClick={() => removeStat(i)}>
                  Remove
                </button>
              </div>
            ))}
            <button className="btn" onClick={addStat}>
              Add stat
            </button>
          </fieldset>

          <fieldset>
            <legend>Team</legend>
            {(structured.team || []).map((m, i) => (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid var(--muted)",
                  paddingBottom: ".5rem",
                  marginBottom: ".5rem",
                }}
              >
                <input
                  className="input"
                  placeholder="Name"
                  value={m.name || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.team[i].name = v;
                      return copy;
                    });
                  }}
                />
                <input
                  className="input"
                  placeholder="Role"
                  value={m.role || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.team[i].role = v;
                      return copy;
                    });
                  }}
                />
                <input
                  className="input"
                  placeholder="Photo URL"
                  value={m.photo || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.team[i].photo = v;
                      return copy;
                    });
                  }}
                />
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Bio"
                  value={m.bio || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.team[i].bio = v;
                      return copy;
                    });
                  }}
                />
                <div style={{ marginTop: ".25rem" }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => removeTeam(i)}
                  >
                    Remove member
                  </button>
                </div>
              </div>
            ))}
            <button className="btn" onClick={addTeam}>
              Add team member
            </button>
          </fieldset>

          <fieldset>
            <legend>Contact / Press</legend>
            <input
              className="input"
              placeholder="CTA short line"
              value={structured.contact?.cta || ""}
              onChange={(e) =>
                setStructuredField("contact.cta", e.target.value)
              }
            />
            <input
              className="input"
              placeholder="Email"
              value={structured.contact?.email || ""}
              onChange={(e) =>
                setStructuredField("contact.email", e.target.value)
              }
            />
          </fieldset>

          <fieldset>
            <legend>Why / Purpose</legend>
            <textarea
              className="input"
              rows={4}
              placeholder="Why NNI exists — short editorial mission or purpose"
              value={structured.why || ""}
              onChange={(e) => setStructuredField("why", e.target.value)}
            />
          </fieldset>

          <fieldset>
            <legend>Core Values</legend>
            {(structured.coreValues || []).map((v, i) => (
              <div key={i} style={{ marginBottom: ".5rem" }}>
                <input
                  className="input"
                  placeholder="Value title"
                  value={v.title || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.coreValues[i] = copy.coreValues[i] || {};
                      copy.coreValues[i].title = val;
                      return copy;
                    });
                  }}
                />
                <input
                  className="input"
                  placeholder="Short description"
                  value={v.description || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.coreValues[i] = copy.coreValues[i] || {};
                      copy.coreValues[i].description = val;
                      return copy;
                    });
                  }}
                />
                <div style={{ marginTop: ".25rem" }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      setStructured((s) => ({
                        ...s,
                        coreValues: (s.coreValues || []).filter(
                          (_, idx) => idx !== i
                        ),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              className="btn"
              onClick={() =>
                setStructured((s) => ({
                  ...s,
                  coreValues: [
                    ...(s.coreValues || []),
                    { title: "", description: "" },
                  ],
                }))
              }
            >
              Add value
            </button>
          </fieldset>

          <fieldset>
            <legend>Founder</legend>
            <input
              className="input"
              placeholder="Name"
              value={structured.founder?.name || ""}
              onChange={(e) =>
                setStructuredField("founder.name", e.target.value)
              }
            />
            <input
              className="input"
              placeholder="Role"
              value={structured.founder?.role || ""}
              onChange={(e) =>
                setStructuredField("founder.role", e.target.value)
              }
            />
            <input
              className="input"
              placeholder="Photo URL"
              value={structured.founder?.photo || ""}
              onChange={(e) =>
                setStructuredField("founder.photo", e.target.value)
              }
            />
            <textarea
              className="input"
              rows={3}
              placeholder="Short bio"
              value={structured.founder?.bio || ""}
              onChange={(e) =>
                setStructuredField("founder.bio", e.target.value)
              }
            />
          </fieldset>

          <fieldset>
            <legend>Journey / Timeline</legend>
            {(structured.journey || []).map((it, i) => (
              <div key={i} style={{ marginBottom: ".5rem" }}>
                <input
                  className="input"
                  placeholder="Date or milestone"
                  value={it.date || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.journey[i] = copy.journey[i] || {};
                      copy.journey[i].date = val;
                      return copy;
                    });
                  }}
                />
                <input
                  className="input"
                  placeholder="Description"
                  value={it.text || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStructured((s) => {
                      const copy = JSON.parse(JSON.stringify(s));
                      copy.journey[i] = copy.journey[i] || {};
                      copy.journey[i].text = val;
                      return copy;
                    });
                  }}
                />
                <div style={{ marginTop: ".25rem" }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      setStructured((s) => ({
                        ...s,
                        journey: (s.journey || []).filter(
                          (_, idx) => idx !== i
                        ),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              className="btn"
              onClick={() =>
                setStructured((s) => ({
                  ...s,
                  journey: [...(s.journey || []), { date: "", text: "" }],
                }))
              }
            >
              Add milestone
            </button>
          </fieldset>

          <fieldset>
            <legend>Notes / Legal</legend>
            <textarea
              className="input"
              rows={3}
              placeholder="Notes, legal disclaimers or editorial notes"
              value={structured.notes || ""}
              onChange={(e) => setStructuredField("notes", e.target.value)}
            />
          </fieldset>

          <div style={{ display: "flex", gap: ".5rem" }}>
            <button
              className="btn"
              onClick={() => {
                applyStructuredToAbout();
                pushToast(
                  "Structured content applied to About preview",
                  "success"
                );
              }}
            >
              Apply to content
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setStructured((s) => ({ ...s }))}
            >
              Refresh
            </button>
          </div>

          <div style={{ marginTop: ".75rem" }}>
            <h4>Preview</h4>
            <div
              style={{
                border: "1px solid var(--muted)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: ".5rem" }}>
                <h3>{structured.hero?.title}</h3>
                {structured.hero?.subtitle && (
                  <p className="lead">{structured.hero.subtitle}</p>
                )}
                {structured.mission && <p>{structured.mission}</p>}
                {structured.stats && structured.stats.length > 0 && (
                  <div style={{ display: "flex", gap: ".5rem" }}>
                    {structured.stats.map((st, i) => (
                      <div
                        key={i}
                        style={{
                          padding: ".5rem",
                          borderRadius: 6,
                          background: "var(--bg)",
                          flex: 1,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{st.value}</div>
                        <div className="muted">{st.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        {!token && (
          <div className="muted">You must be signed in to save changes.</div>
        )}
        <button
          className="btn"
          onClick={() => handleSave(false)}
          disabled={saving || !token}
        >
          Save Draft
        </button>
        <button
          className="btn btn-primary"
          onClick={() => handleSave(true)}
          disabled={saving || !token}
        >
          Save & Publish
        </button>
      </div>

      {error && (
        <div className="auth-error" style={{ marginTop: ".5rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default function CMS() {
  const { token } = useAuth();
  const [tab, setTab] = useState(window.location.hash || "");
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

  useEffect(() => {
    if (!selected) return;
    const id = selected.id;
    const handler = setTimeout(() => {
      try {
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
      } catch (e) {}
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
      setError(e?.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    function onHash() {
      setTab(window.location.hash || "");
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
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
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      canonical: "",
      featuredImageName: "",
      featuredImageAlt: "",
    };
    setArticles([newArticle, ...articles]);
    setSelected(newArticle);
    try {
      localStorage.setItem(
        `cms-draft-${newArticle.id}`,
        JSON.stringify(newArticle)
      );
    } catch (e) {}
  }

  function handleSelect(article) {
    setSelected(article);
    try {
      const raw = localStorage.getItem(`cms-draft-${article.id}`);
      if (raw) setSelected((s) => ({ ...article, ...JSON.parse(raw) }));
    } catch (e) {}
    try {
      setExcerptTouched(Boolean(article && article.excerpt));
    } catch (e) {}
  }

  async function handleDelete(article) {
    if (!confirm(`Delete article "${article.title}"? This cannot be undone.`))
      return;
    if (article.id && !String(article.id).startsWith("draft-")) {
      try {
        await api.deleteArticle(article.id, token);
        setArticles((s) => s.filter((a) => a.id !== article.id));
        setSelected(null);
        pushToast("Article deleted", "success");
      } catch (e) {
        pushToast(e?.message || "Delete failed", "error");
      }
    } else {
      setArticles((s) => s.filter((a) => a.id !== article.id));
      setSelected(null);
    }
  }

  async function handleSave(article) {
    setSaving(true);
    setError(null);
    try {
      const safeContent = sanitizeHTML(article.content || "");
      const payload = { ...article, content: safeContent };
      if (!payload.featuredImage) {
        const inferred = extractFirstImageUrl(safeContent);
        if (inferred) payload.featuredImage = inferred;
      }
      if (article.id && !String(article.id).startsWith("draft-")) {
        const updated = await api.updateArticle(article.id, payload, token);
        setArticles((s) => s.map((a) => (a.id === updated.id ? updated : a)));
        setSelected(updated);
        try {
          window.dispatchEvent(new Event("articles-updated"));
        } catch (e) {}
      } else {
        const created = await api.createArticle(payload, token);
        setArticles((s) => [created, ...s.filter((a) => a.id !== article.id)]);
        setSelected(created);
        try {
          window.dispatchEvent(new Event("articles-updated"));
        } catch (e) {}
      }
      try {
        localStorage.removeItem(`cms-draft-${article.id}`);
      } catch (e) {}
      pushToast("Saved", "success");
    } catch (e) {
      setError(e?.message || "Save failed");
      pushToast(e?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

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

  function sanitizeHTML(html) {
    if (!html) return html;
    let s = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");
    return s;
  }

  function stripHtmlToText(html) {
    if (!html) return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const text = doc.body.textContent || "";
      return String(text).replace(/\s+/g, " ").trim();
    } catch (e) {
      return String(html)
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  const wordCount = useMemo(() => {
    if (!selected || !selected.content) return 0;
    const text = stripHtmlToText(selected.content || "");
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [selected?.content]);

  function extractFirstImageUrl(html) {
    if (!html) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const img = doc.querySelector("img");
      if (img && img.src) return img.src;
    } catch (e) {
      const m = html.match(/<img[^>]+src=["']?([^"'>\s]+)["']?/i);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  useEffect(() => {
    if (!selected) return;
    if (excerptTouched) return;
    const text = stripHtmlToText(selected.content || "");
    const auto = text.slice(0, excerptLength).trim();
    if ((selected.excerpt || "") !== auto)
      setSelected((s) => ({ ...s, excerpt: auto }));
  }, [selected?.content, excerptLength, excerptTouched]);

  return (
    <div className="cms-page">
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <button
          className={`btn ${tab !== "#about" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => {
            window.location.hash = "";
            setTab("");
          }}
        >
          Articles
        </button>
        <button
          className={`btn ${tab === "#about" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => {
            window.location.hash = "#about";
            setTab("#about");
          }}
        >
          About Page
        </button>
      </div>

      <CmsList
        articles={articles}
        selectedId={selected?.id}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onTogglePublish={handleTogglePublish}
      />

      <section className="cms-main">
        {tab === "#about" ? (
          <AboutEditor token={token} pushToast={pushToast} />
        ) : null}

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
          <div className="cms-top-area">
            <div
              style={{
                marginTop: ".75rem",
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
                <small style={{ color: "var(--danger)", marginLeft: ".75rem" }}>
                  Please shorten your article to 5000 words or less.
                </small>
              )}
            </div>

            <div className="cms-controls">
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
                <label className="field" style={{ marginTop: ".5rem" }}>
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

              <div className="cms-controls-right">
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

            <div className="cms-editor-wrapper">
              <CmsEditor
                value={selected.content}
                onChange={(html) => setSelected({ ...selected, content: html })}
                onImageUpload={(url) => {
                  setFeaturedImageUrl(url);
                  setSelected((s) => ({ ...s, featuredImage: url }));
                }}
              />
            </div>

            <div className="cms-featured-row">
              <div className="cms-featured-preview">
                <div style={{ fontSize: ".75rem" }} className="muted">
                  Featured image
                </div>
                {selected.featuredImage || featuredImageUrl ? (
                  <img
                    src={selected.featuredImage || featuredImageUrl}
                    alt={selected.featuredImageAlt || "Featured"}
                    className="cms-featured-img"
                  />
                ) : (
                  <div className="cms-featured-placeholder">
                    <span>No image</span>
                  </div>
                )}
              </div>

              <div className="cms-featured-controls">
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
                        // Article featured-image upload: set preview and selected.article featuredImage
                        setFeaturedImageUrl(url);
                        setSelected((s) => ({ ...s, featuredImage: url }));
                      }
                    } finally {
                      setUploadingFeatured(false);
                      try {
                        e.target.value = null;
                      } catch (er) {}
                    }
                  }}
                />

                <div style={{ display: "flex", gap: ".5rem" }}>
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

              <div className="cms-meta-grid">
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
                <details style={{ padding: ".5rem" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                    Post metadata
                  </summary>
                  <div
                    style={{
                      marginTop: ".5rem",
                      display: "grid",
                      gap: ".5rem",
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

            <div style={{ marginTop: ".5rem" }}>
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

            <div style={{ marginTop: ".75rem", display: "flex", gap: ".5rem" }}>
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
