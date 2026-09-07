import Arrow from "../icons/Arrow";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./documents.css";

export const resumeUrl = "/resume/resume.pdf";
export function openDocument(
  kind: "resume" | "links",
  origin?: { x: number; y: number },
  lifted = false,
) {
  window.dispatchEvent(
    new CustomEvent("connor-document", { detail: { kind, origin, lifted } }),
  );
}
export default function Documents() {
  const [view, setView] = useState<{ lifted?: boolean } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => {
    setView(null);
    setZoomed(false);
    window.dispatchEvent(new Event("connor-paper-return"));
  };
  useEffect(() => {
    const open = (event: Event) => setView((event as CustomEvent).detail);
    window.addEventListener("connor-document", open);
    return () => window.removeEventListener("connor-document", open);
  }, []);
  useEffect(() => {
    if (!view || !dialog.current) return;
    const previous = document.activeElement as HTMLElement;
    const el = dialog.current;
    el.showModal();
    el.focus();
    if (!view.lifted && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      el.querySelector(".held-paper")?.animate(
        [
          { transform: "translateY(90px) rotateX(20deg)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 500, easing: "ease-out" },
      );
    return () => {
      el.close();
      previous?.focus();
    };
  }, [view]);
  return createPortal(
    <div data-desk-ui onMouseDown={(e) => e.stopPropagation()}>
      {view && (
        <dialog
          ref={dialog}
          tabIndex={-1}
          className={`paper-reader ${zoomed ? "zoomed" : ""}`}
          aria-label="Connor Love résumé"
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button
            className="held-paper"
            aria-label={zoomed ? "Fit résumé to screen" : "Enlarge résumé"}
            onClick={() => setZoomed(!zoomed)}
          >
            <img
              src="/resume/preview.png"
              alt="Connor Love résumé: education, experience, projects, research and technical skills. Open the PDF below for accessible text."
            />
          </button>
          <nav className="paper-actions" aria-label="Résumé controls">
            <a href={resumeUrl} target="_blank" rel="noreferrer">
              Open PDF <Arrow />
            </a>
            <button onClick={() => setZoomed(!zoomed)}>
              {zoomed ? "Fit page" : "Zoom in"}
            </button>
            <button aria-label="Close document" onClick={close}>
              Put down ×
            </button>
          </nav>
        </dialog>
      )}
    </div>,
    document.body,
  );
}
