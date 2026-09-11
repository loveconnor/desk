import React, { useEffect, useState } from "react";
import { RoomDetail } from "../../World/RoomInteractions";
import UIEventBus from "../EventBus";
import ProjectView from "./ProjectView";
import { projectStories } from "../content/projects";
export default function RoomInspector() {
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  useEffect(() => {
    const show = (e: Event) => setDetail((e as CustomEvent).detail);
    const hide = () => setDetail(null);
    document.addEventListener("inspectRoomObject", show);
    document.addEventListener("roomObjectReturned", hide);
    return () => {
      document.removeEventListener("inspectRoomObject", show);
      document.removeEventListener("roomObjectReturned", hide);
    };
  }, []);
  const project = projectStories.find(
    (project) => project.slug === detail?.projectSlug,
  );
  if (project) return <ProjectView key={project.slug} project={project} />;
  return detail ? (
    <div
      className="object-in-hand"
      data-desk-ui
      aria-label={`Inspecting ${detail.title}`}
    >
      {detail.showDescription && (
        <details className="artwork-context">
          <summary>
            <svg
              className="artwork-context-chevron"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m9 5 7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {detail.title} · {detail.subtitle} — Design context
          </summary>
          <p>{detail.body}</p>
        </details>
      )}
      <span>Drag to turn · Esc to put back</span>
      <button
        className="portfolio-control"
        onClick={() => UIEventBus.dispatch("putBackRoomObject", {})}
      >
        Put back ↙
      </button>
      {detail.href && (
        <a
          className="portfolio-control"
          href={detail.href}
          target="_blank"
          rel="noreferrer"
        >
          Read more ↗
        </a>
      )}
    </div>
  ) : null;
}
