import React, { useState, useRef } from "react";

export default function TagInput({
  value = [],
  onChange,
  placeholder = "Add a tag",
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  function addTagsFromString(str) {
    if (!str) return;
    const parts = String(str)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = Array.from(new Set([...(value || []), ...parts]));
    onChange && onChange(next);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagsFromString(input);
      setInput("");
    } else if (e.key === "Backspace" && input === "") {
      // remove last tag
      if ((value || []).length > 0) {
        const next = (value || []).slice(0, -1);
        onChange && onChange(next);
      }
    }
  }

  function handleBlur() {
    if (input.trim()) {
      addTagsFromString(input);
      setInput("");
    }
  }

  function removeTag(idx) {
    const next = (value || []).filter((_, i) => i !== idx);
    onChange && onChange(next);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <div
        className="tag-input"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.375rem",
          alignItems: "center",
          padding: "0.375rem",
          border: "1px solid #d1d5db",
          borderRadius: "0.375rem",
          minHeight: "2.25rem",
        }}
        onClick={() => inputRef.current && inputRef.current.focus()}
      >
        {(value || []).map((t, i) => (
          <div
            key={`${t}-${i}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#eef2ff",
              padding: "0.25rem 0.5rem",
              borderRadius: "9999px",
              fontSize: "0.875rem",
            }}
          >
            <span>{t}</span>
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={(ev) => {
                ev.stopPropagation();
                removeTag(i);
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          style={{
            flex: 1,
            minWidth: "8rem",
            border: "none",
            outline: "none",
            padding: "0.25rem",
            fontSize: "0.95rem",
            background: "transparent",
          }}
        />
      </div>
      <small style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
        Press Enter or comma to add tags
      </small>
    </div>
  );
}
