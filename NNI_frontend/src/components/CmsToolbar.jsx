import React from "react";

export default function CmsToolbar({ onCommand }) {
  return (
    <div className="cms-toolbar" role="toolbar" aria-label="Editor toolbar">
      <button type="button" onClick={() => onCommand("undo")} title="Undo">
        ↶
      </button>
      <button type="button" onClick={() => onCommand("redo")} title="Redo">
        ↷
      </button>

      <button type="button" onClick={() => onCommand("bold")} title="Bold">
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => onCommand("italic")} title="Italic">
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => onCommand("underline")}
        title="Underline"
      >
        <u>U</u>
      </button>

      <select
        onChange={(e) => onCommand("formatBlock", e.target.value)}
        defaultValue="P"
        aria-label="Paragraph style"
      >
        <option value="P">P</option>
        <option value="H1">H1</option>
        <option value="H2">H2</option>
        <option value="H3">H3</option>
        <option value="H4">H4</option>
        <option value="H5">H5</option>
        <option value="H6">H6</option>
      </select>

      <button
        type="button"
        onClick={() => onCommand("justifyLeft")}
        title="Align left"
      >
        L
      </button>
      <button
        type="button"
        onClick={() => onCommand("justifyCenter")}
        title="Center"
      >
        C
      </button>
      <button
        type="button"
        onClick={() => onCommand("justifyRight")}
        title="Right"
      >
        R
      </button>
      <button
        type="button"
        onClick={() => onCommand("justifyFull")}
        title="Justify"
      >
        J
      </button>

      <button
        type="button"
        onClick={() => onCommand("insertOrderedList")}
        title="Numbered list"
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => onCommand("insertUnorderedList")}
        title="Bulleted list"
      >
        •
      </button>

      <button
        type="button"
        onClick={() => onCommand("createLink")}
        title="Insert link"
      >
        🔗
      </button>
      <button
        type="button"
        onClick={() => onCommand("insertImage")}
        title="Insert image"
      >
        🖼
      </button>
      <button
        type="button"
        onClick={() => onCommand("removeFormat")}
        title="Remove formatting"
      >
        ⎚
      </button>
    </div>
  );
}
