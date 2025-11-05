import React from "react";

export function Toasts({ toasts = [], onDismiss }) {
  return (
    <div className="toasts-root" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || "info"}`}>
          <div className="toast-message">{t.message}</div>
          <button
            className="toast-close"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toasts;
