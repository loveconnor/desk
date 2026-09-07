import Arrow from "../icons/Arrow";
import React, { useState } from "react";
import { profile } from "./profile";
import { openDocument, resumeUrl } from "../documents/Documents";
import "./notes.css";

const notes = [
  {
    id: "welcome",
    title: "Hello, I’m Connor",
    folder: "Personal",
    preview: "A little about me and what I build.",
  },
  {
    id: "projects",
    title: "Projects",
    folder: "Work",
    preview: "HonestUI, Clove Colors, and Tokenizer.",
  },
  {
    id: "social",
    title: "Social links",
    folder: "Personal",
    preview: "Find me online. Let’s connect.",
  },
  {
    id: "resume",
    title: "Résumé",
    folder: "Work",
    preview: "Experience, education, and skills.",
  },
  ...profile.projects.map((p) => ({
    id: p.slug,
    title: p.name,
    folder: "Work",
    preview: p.category,
  })),
];
const Link = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children} <Arrow />
  </a>
);
export default function Notes() {
  const [folder, setFolder] = useState("All Notes");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("welcome");
  const filtered = notes.filter(
    (n) =>
      (folder === "All Notes" || n.folder === folder) &&
      `${n.title} ${n.preview}`.toLowerCase().includes(query.toLowerCase()),
  );
  const note = filtered.find((n) => n.id === selected) || filtered[0];
  const project = profile.projects.find((p) => p.slug === note?.id);
  return (
    <section className="notes-app" aria-label="Notes">
      <nav className="notes-folders" aria-label="Note folders">
        <span>On My Mac</span>
        {["All Notes", "Personal", "Work"].map((f) => (
          <button
            key={f}
            className={folder === f ? "selected" : ""}
            onClick={() => setFolder(f)}
          >
            ▱ {f}
            <small>
              {notes.filter((n) => f === "All Notes" || n.folder === f).length}
            </small>
          </button>
        ))}
      </nav>
      <aside className="notes-list">
        <label className="notes-search">
          <span>⌕</span>
          <input
            aria-label="Search notes"
            placeholder="Search notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div aria-label="Note list">
          {filtered.map((n) => (
            <button
              key={n.id}
              aria-pressed={note?.id === n.id}
              className={note?.id === n.id ? "selected" : ""}
              onClick={() => setSelected(n.id)}
            >
              <strong>{n.title}</strong>
              <span>{n.preview}</span>
              <small>▱ {n.folder}</small>
            </button>
          ))}
        </div>
        <footer>{filtered.length} notes</footer>
      </aside>
      <article className="note-page">
        <div className="note-toolbar">
          <span>▤</span>
          <span>Aa</span>
          <span>☷</span>
          <span>Notes · Connor Love</span>
        </div>
        {!note ? (
          <div className="note-content">
            <h1>No notes found</h1>
            <p>Try another search.</p>
          </div>
        ) : (
          <div className="note-content">
            <p className="note-eyebrow">{note.folder} / Connor Love</p>
            <h1>{note.title}</h1>
            {note.id === "welcome" && (
              <>
                <p>I’m Connor, a web developer based in Columbus, Ohio.</p>
                <p>
                  I build websites, web apps, and interactive experiences. This
                  is a little collection of my work and the places you can find
                  me.
                </p>
                <h2>Start here</h2>
                <ul>
                  <li>Projects — explore what I’ve built.</li>
                  <li>Social links — find me online or book a call.</li>
                  <li>Résumé — my experience and education.</li>
                </ul>
              </>
            )}
            {note.id === "projects" && (
              <>
                <p>
                  A few things I’ve been working on. Open a project’s note for a
                  closer look.
                </p>
                <div className="note-project-list">
                  {profile.projects.map((p) => (
                    <button key={p.slug} onClick={() => setSelected(p.slug)}>
                      <strong>{p.name}</strong>
                      <span>
                        {p.category} <Arrow direction="right" />
                      </span>
                    </button>
                  ))}
                </div>
                <p>
                  <Link href={profile.github}>More on GitHub</Link>
                </p>
              </>
            )}
            {note.id === "social" && (
              <>
                <p>Find me around the web, or say hello.</p>
                <ul className="note-socials">
                  {[
                    ["GitHub", profile.github],
                    ["LinkedIn", profile.linkedin],
                    ["X / Twitter", profile.twitter],
                    ["Website", profile.website],
                    ["Book a call", profile.calendar],
                    ["Email", `mailto:${profile.email}`],
                  ].map(([label, url]) => (
                    <li key={label}>
                      <Link href={url}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {note.id === "resume" && (
              <>
                <p>My experience, education, and technical skills.</p>
                <button
                  className="note-resume"
                  onClick={() => openDocument("resume")}
                >
                  <img
                    src="/resume/preview.png"
                    alt="Preview of Connor Love’s résumé"
                  />
                  <span>
                    Résumé.pdf{" "}
                    <b>
                      Open <Arrow />
                    </b>
                  </span>
                </button>
                <p>
                  <Link href={resumeUrl}>Open PDF</Link>
                </p>
                <p>
                  <Link href="/resume/resume.tex">LaTeX source</Link>
                </p>
              </>
            )}
            {project && (
              <>
                <img
                  className="note-project-image"
                  src={project.image}
                  alt={project.name}
                />
                <p>{project.category}</p>
                <p>
                  <Link href={`${profile.website}/projects/${project.slug}`}>
                    View {project.name}
                  </Link>
                </p>
              </>
            )}
          </div>
        )}
      </article>
    </section>
  );
}
