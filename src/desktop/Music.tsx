import Arrow from "../icons/Arrow";
import React, { useRef, useState } from "react";
import tracks from "./data/work-playlist.json";
import "./music.css";
const duration = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
export default function Music() {
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const current = selected === null ? null : tracks[selected];
  const choose = (i: number) => {
    setError(false);
    setSelected(i);
  };
  return (
    <section className="work-music">
      <header className="music-hero">
        <img
          className="playlist-cover playlist-photo"
          src="/music/quiet-hours-cover.png"
          alt="Morning sunlight over a forest lake, with coffee and a notebook by an open window"
        />
        <div>
          <span className="music-kicker">PLAYLIST · CONNOR LOVE</span>
          <h1>Quiet Hours</h1>
          <p>
            Warm folk-pop, easy melodies, and room to think. A fresh mix of
            favorites for settling into work.
          </p>
          <small>
            {tracks.length} songs ·{" "}
            {Math.round(
              tracks.reduce((total, t) => total + (t.trackTimeMillis || 0), 0) /
                60000,
            )}{" "}
            minutes
          </small>
          <button className="music-play" onClick={() => choose(0)}>
            <Arrow direction="play" /> Listen to previews
          </button>
        </div>
      </header>
      <div className="music-tracklist" aria-label="Quiet Hours tracks">
        {tracks.map((t, i) => (
          <div
            className={`music-track ${selected === i ? "selected" : ""}`}
            key={t.trackId}
          >
            <button
              className="track-preview"
              aria-label={`Preview ${t.trackName} by ${t.artistName}`}
              onClick={() => choose(i)}
              disabled={!t.previewUrl}
            >
              <span className="track-number">
                {selected === i ? "♫" : i + 1}
              </span>
              <img src={t.artworkUrl100} alt="" loading="lazy" />
              <span className="track-meta">
                <strong>{t.trackName}</strong>
                <small>{t.artistName}</small>
              </span>
            </button>
            <span className="track-duration">
              {duration(t.trackTimeMillis || 0)}
            </span>
            <a
              href={t.trackViewUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${t.trackName} in Apple Music`}
            >
              <Arrow />
            </a>
          </div>
        ))}
      </div>
      <footer className="music-player">
        {current ? (
          <>
            <div className="now-playing">
              <strong>{current.trackName}</strong>
              <span>{current.artistName} · Preview</span>
            </div>
            <audio
              ref={audio}
              key={current.trackId}
              controls
              autoPlay
              src={current.previewUrl || undefined}
              onError={() => setError(true)}
              onEnded={() => {
                if (selected !== null && selected < tracks.length - 1)
                  choose(selected + 1);
              }}
            />
            {error && (
              <p>
                Preview unavailable. Open this song in Apple Music to listen.
              </p>
            )}
          </>
        ) : (
          <p>
            Choose a song to hear a preview. Open <Arrow /> for the full track
            in Apple Music.
          </p>
        )}
      </footer>
    </section>
  );
}
