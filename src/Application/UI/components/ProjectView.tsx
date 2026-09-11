import React, { useEffect, useRef } from "react";
import { ProjectStory } from "../content/projects";
import { Button } from "./honestui/Button";
import UIEventBus from "../EventBus";

export default function ProjectView({ project }: { project: ProjectStory }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef<{ x: number; y: number; id: number } | null>(
    null,
  );
  const outside = (x: number, y: number) => {
    const rect = dialog.current?.getBoundingClientRect();
    return (
      !!rect &&
      (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
    );
  };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  const close = () => UIEventBus.dispatch("putBackRoomObject", {});
  return (
    <dialog
      ref={dialog}
      className="project-view"
      data-desk-ui
      aria-labelledby="project-title"
      onPointerDown={(event) => {
        backdropPress.current =
          event.button === 0 && outside(event.clientX, event.clientY)
            ? { x: event.clientX, y: event.clientY, id: event.pointerId }
            : null;
      }}
      onPointerUp={(event) => {
        const start = backdropPress.current;
        backdropPress.current = null;
        if (
          start &&
          start.id === event.pointerId &&
          Math.hypot(event.clientX - start.x, event.clientY - start.y) < 12 &&
          outside(event.clientX, event.clientY)
        )
          close();
      }}
      onPointerCancel={() => {
        backdropPress.current = null;
      }}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="project-view-toolbar">
        <span>
          Connor Love <span aria-hidden="true">/</span> Selected work
        </span>
        <Button
          variant="ghost"
          size="sm"
          autoFocus
          onClick={close}
          aria-label="Close project and return to room"
        >
          Back to room{" "}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </Button>
      </div>
      <div className="project-view-scroll">
        <header className="project-view-header">
          <div>
            <p className="project-view-eyebrow">{project.category}</p>
            <h1 id="project-title">{project.name}</h1>
            <p className="project-view-intro">{project.intro}</p>
          </div>
          <div className="project-view-actions">
            <Button asChild>
              <a href={project.url} target="_blank" rel="noreferrer">
                {project.action} <span aria-hidden="true">↗</span>
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={project.caseStudy} target="_blank" rel="noreferrer">
                Case study <span aria-hidden="true">↗</span>
              </a>
            </Button>
          </div>
        </header>
        <div className="project-view-overview">
          <figure
            className={`project-view-image project-view-image-${project.slug}`}
          >
            <img
              src={project.image}
              alt={project.alt}
              width="1280"
              height={project.slug === "honestui" ? 720 : 600}
            />
            <figcaption>
              <span>Product view</span>
              <span>{new URL(project.url).hostname.replace(/^www\./, "")}</span>
            </figcaption>
          </figure>
          <section className="project-view-built">
            <h2>What I designed and built</h2>
            <p>{project.built}</p>
            <div className="project-view-fact">
              <strong>{project.fact}</strong>
              <span>{project.factLabel}</span>
            </div>
          </section>
        </div>
        <div className="project-view-story">
          <section>
            <h2>The challenge</h2>
            <p>{project.challenge}</p>
          </section>
          <section>
            <h2 className="project-view-solution">How I solved it</h2>
            <p>{project.solution}</p>
          </section>
        </div>
        <footer className="project-view-footer">
          <span>Design & development by Connor Love</span>
          <Button variant="link" size="sm" asChild>
            <a href={project.caseStudy} target="_blank" rel="noreferrer">
              Read the full case study <span aria-hidden="true">↗</span>
            </a>
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
