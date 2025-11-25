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

  if (loading) return <div className="muted">Loading About editorâ€¦</div>;

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
              placeholder="Why NNI exists â€” short editorial mission or purpose"
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
