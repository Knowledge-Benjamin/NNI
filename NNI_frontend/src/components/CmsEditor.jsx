import React, { useEffect, useRef, useState } from "react";
import CmsToolbar from "./CmsToolbar";
import { uploadImageToImgBB } from "../utils/api";

export default function CmsEditor({ value = "", onChange, onImageUpload }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const [content, setContent] = useState(value);
  const [selection, setSelection] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);

  // when `value` prop changes from outside, update editor DOM only when
  // not focused to avoid stealing caret (fixes flicker/jump while typing)
  useEffect(() => {
    if (!ref.current) return;
    const html = value || "";
    const current = ref.current.innerHTML;
    if (html !== current && !isFocused) {
      ref.current.innerHTML = html;
      setContent(html);
    }
  }, [value, isFocused]);

  useEffect(() => {
    if (onChange) onChange(content);
  }, [content]);

  // keyboard shortcuts (Ctrl/Cmd + B/I/U)
  useEffect(() => {
    function onKey(e) {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        exec("bold");
      }
      if (key === "i") {
        e.preventDefault();
        exec("italic");
      }
      if (key === "u") {
        e.preventDefault();
        exec("underline");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function exec(command, param) {
    if (command === "createLink") {
      const url = window.prompt("Enter URL", "https://");
      if (!url) return;
      document.execCommand("createLink", false, url);
      updateContent();
      return;
    }

    if (command === "insertImage") {
      // open file picker for image upload
      if (fileRef.current) fileRef.current.click();
      return;
    }

    if (command === "formatBlock") {
      // map H1..H6 to proper tags
      const tag = param;
      try {
        document.execCommand("formatBlock", false, `<${tag}>`);
      } catch (e) {
        // fallback
        document.execCommand("formatBlock", false, tag);
      }
      updateContent();
      return;
    }

    try {
      document.execCommand(command, false, param || null);
      updateContent();
    } catch (e) {
      console.warn("Formatting command failed", command, e);
    }
  }

  function updateContent() {
    if (!ref.current) return;
    setContent(ref.current.innerHTML);
  }

  function handleInput() {
    // read directly from DOM to avoid unnecessary re-sets
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    setContent(html);
  }

  function handleSelectChange() {
    try {
      const sel = window.getSelection();
      setSelection(sel ? sel.toString() : null);
    } catch (e) {
      setSelection(null);
    }
  }

  async function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUploading(true);
    try {
      // USE PROXY — NO KEY EXPOSED
      const data = await uploadImageToImgBB(f, null); // ← THIS LINE FIXED

      const url = data?.url || data?.display_url || null;
      if (url) {
        if (onImageUpload) onImageUpload(url);
        document.execCommand("insertImage", false, url);
        updateContent();
      }
    } catch (err) {
      console.error("Image upload failed", err);
      alert(err.message || "Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  }
  return (
    <div className="cms-editor-root">
      <CmsToolbar onCommand={exec} />
      <div className="editor-area">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className="cms-content editable"
          onInput={handleInput}
          onKeyUp={handleSelectChange}
          onMouseUp={handleSelectChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <div className="cms-editor-footer">
          <div className="muted cms-editor-stats">
            {selection
              ? `Selection: ${selection.length} chars`
              : "No selection"}
          </div>
          <div className="muted cms-editor-words">
            {content
              ? `${
                  content
                    .replace(/<[^>]+>/g, "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length
                } words`
              : "0 words"}
          </div>
        </div>
      </div>
    </div>
  );
}
