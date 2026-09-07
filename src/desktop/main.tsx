import { bindKeyboard, keyboardState } from "../keyboard/KeyboardState";
import Arrow from "../icons/Arrow";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { profile } from "./profile";
import "./style.css";
import "./macos.css";
import Documents from "../documents/Documents";
import Notes from "./Notes";
import Music from "./Music";

type AppId =
  | "about"
  | "browser"
  | "calculator"
  | "code"
  | "terminal"
  | "music"
  | "settings"
  | "contact"
  | "trash";
type WindowState = {
  id: AppId;
  x: number;
  y: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
};
const apps: { id: AppId; title: string; icon: string }[] = [
  { id: "about", title: "About Connor", icon: "system/user-home.png" },
  { id: "browser", title: "Web Browser", icon: "apps/chrome.png" },
  { id: "contact", title: "Contact Me", icon: "apps/gedit.png" },
  { id: "code", title: "Notes", icon: "apps/vscode.png" },
  { id: "calculator", title: "Calculator", icon: "apps/calc.png" },
  { id: "terminal", title: "Terminal", icon: "apps/bash.png" },
  { id: "music", title: "Music", icon: "apps/spotify.png" },
  { id: "settings", title: "Settings", icon: "apps/gnome-control-center.png" },
  { id: "trash", title: "Trash", icon: "system/user-trash-full.png" },
];
const Icon = ({ id }: { id: AppId }) => (
  <img draggable={false} alt="" src={"/macos/" + id + ".png"} />
);
const External = ({
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} target="_blank" rel="noreferrer" {...rest}>
    {children}
  </a>
);

function About() {
  const [tab, setTab] = useState("About Me");
  return (
    <div className="about-app">
      <nav className="about-nav">
        {["About Me", "Experience", "Skills", "Projects", "Contact"].map(
          (t, i) => (
            <button
              key={t}
              aria-label={t}
              className={tab === t ? "selected" : ""}
              onClick={() => setTab(t)}
            >
              <span>{["♙", "▤", "⚒", "▣", "✉"][i]}</span>
              {t}
            </button>
          ),
        )}
      </nav>
      <main className="about-content">
        {tab === "About Me" && (
          <>
            <img
              className="portrait"
              src="/connor/portrait.webp"
              alt="Connor Love"
            />
            <h1>
              my name is <b>Connor Love</b>,<br />
              I'm a <strong>Web Developer!</strong>
            </h1>
            <div className="divider" />
            <ul className="bio">
              <li>
                <span>🏡</span>
                <p>
                  I'm a freelance web developer based in <b>Columbus, Ohio</b>.
                  I design and build custom websites, web applications, and
                  interactive product experiences.
                </p>
              </li>
              <li>
                <span>👨🏻‍💻</span>
                <p>
                  I bring design and engineering together with{" "}
                  <b>React, Next.js, and Three.js</b>, focusing on performance,
                  detail, and intentional user experience.
                </p>
              </li>
              <li>
                <span>🎲</span>
                <p>
                  My experience as a self-taught developer has pushed me to
                  think creatively and build with intention, focusing on how
                  things look, feel, and perform in real use.
                </p>
              </li>
              <li>
                <span>🌟</span>
                <p>
                  I work with founders, agencies, and product teams across the
                  United States and worldwide. Have something in mind?{" "}
                  <button
                    className="inline-link"
                    onClick={() => setTab("Contact")}
                  >
                    Let's build it.
                  </button>
                </p>
              </li>
            </ul>
          </>
        )}
        {tab === "Experience" && (
          <section className="content-section">
            <h1>Design meets engineering.</h1>
            <p>
              I build thoughtful digital products, from the first idea to the
              final production details.
            </p>
            {[
              "Custom websites & web apps",
              "Frontend engineering",
              "Motion & interactive experiences",
              "Product interfaces & design systems",
              "Performance, SEO & accessibility",
            ].map((s) => (
              <article className="experience" key={s}>
                <h2>{s}</h2>
                <p>
                  Clear structure, careful execution, and details that make the
                  experience feel considered.
                </p>
              </article>
            ))}
            <External href={profile.website + "/about"}>
              More about my work <Arrow />
            </External>
          </section>
        )}
        {tab === "Skills" && (
          <section className="content-section">
            <h1>My toolkit</h1>
            <p>Tools for fast, accessible, and expressive web experiences.</p>
            <div className="skills">
              {profile.skills.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </section>
        )}
        {tab === "Projects" && <Projects />}
        {tab === "Contact" && <Contact />}
      </main>
    </div>
  );
}
function Projects() {
  return (
    <section className="content-section">
      <h1>Selected work</h1>
      <p>A few things I've been building.</p>
      <div className="projects">
        {profile.projects.map((p) => (
          <External
            className="project"
            key={p.slug}
            href={profile.website + "/projects/" + p.slug}
          >
            <img src={p.image} alt={p.name + " project preview"} />
            <div>
              <h2>
                {p.name} <Arrow />
              </h2>
              <p>{p.category}</p>
            </div>
          </External>
        ))}
      </div>
      <External href={profile.github}>
        Explore my GitHub <Arrow />
      </External>
    </section>
  );
}
function Contact() {
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("Let’s build something");
  const [message, setMessage] = useState("");
  return (
    <section className="content-section contact">
      <span className="big-icon">✉</span>
      <h1>Let's make something great.</h1>
      <p>Based in Columbus, Ohio. Working everywhere.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        }}
      >
        <label>
          To
          <input readOnly value={profile.email} />
        </label>
        <label>
          Subject
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </label>
        <label>
          Message
          <textarea
            rows={5}
            placeholder="Tell me about your project…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </label>
        <button className="primary" type="submit">
          Open email draft <Arrow />
        </button>
      </form>
      <div className="social-links">
        <External href={profile.linkedin}>
          LinkedIn <Arrow />
        </External>
        <External href={profile.github}>
          GitHub <Arrow />
        </External>
        <External href={profile.calendar}>
          Book a call <Arrow />
        </External>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(profile.email);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Email copied ✓" : "Copy email"}
        </button>
      </div>
    </section>
  );
}
function Terminal() {
  const [history, setHistory] = useState<string[]>([
    'Welcome to Connor’s desktop. Type "help" to get started.',
  ]);
  const [command, setCommand] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [history]);
  const run = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim().toLowerCase();
    setCommand("");
    if (cmd === "clear") {
      setHistory([]);
      return;
    }
    const responses: Record<string, string> = {
      help: "Available commands:\n  whoami    About Connor\n  skills    My toolkit\n  projects  Selected work\n  contact   Get in touch\n  pwd       Current directory\n  ls        Files\n  date      Current date and time\n  clear     Clear terminal",
      whoami: `${profile.name}\n${profile.role} · ${profile.location}\nI build thoughtful digital products.`,
      skills: profile.skills.join("  •  "),
      projects: profile.projects
        .map((p) => `${p.name}\n${profile.website}/projects/${p.slug}`)
        .join("\n\n"),
      contact: `${profile.email}\n${profile.linkedin}\n${profile.calendar}`,
      pwd: "/home/connor",
      ls: "about.txt  projects/  contact.txt  skills.txt",
      date: new Date().toLocaleString(),
      "cat about.txt": `${profile.name} — ${profile.role}\n${profile.location}`,
      "cat contact.txt": profile.email,
      "cat skills.txt": profile.skills.join("\n"),
      "ls projects": profile.projects.map((p) => p.name).join("\n"),
      "ls projects/": profile.projects.map((p) => p.name).join("\n"),
    };
    setHistory((h) => [
      ...h,
      `connor@love:~$ ${command}`,
      responses[cmd] ??
        (cmd
          ? `${command}: command not found. Type "help" for available commands.`
          : ""),
    ]);
  };
  return (
    <div
      className="terminal"
      onClick={(e) =>
        (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()
      }
    >
      {history.map((h, i) => (
        <pre key={i}>{h}</pre>
      ))}
      <form onSubmit={run}>
        <label htmlFor="command">
          connor@love<span>:~$</span>
        </label>
        <input
          id="command"
          aria-label="Terminal command"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
      </form>
      <div ref={end} />
    </div>
  );
}
function Calculator() {
  const [display, setDisplay] = useState("0");
  const [saved, setSaved] = useState<number | null>(null);
  const [op, setOp] = useState("");
  const [fresh, setFresh] = useState(false);
  const calculate = (a: number, b: number, operation: string) =>
    operation === "+"
      ? a + b
      : operation === "−"
        ? a - b
        : operation === "×"
          ? a * b
          : b === 0
            ? NaN
            : a / b;
  const press = (key: string) => {
    if (key === "AC") {
      setDisplay("0");
      setSaved(null);
      setOp("");
      setFresh(false);
      return;
    }
    if (key === "⌫") {
      setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
      return;
    }
    if (key === "±") {
      setDisplay(String(-Number(display)));
      return;
    }
    if ("+−×÷".includes(key)) {
      const n =
        saved !== null && !fresh
          ? calculate(saved, Number(display), op)
          : Number(display);
      setSaved(n);
      setDisplay(String(n));
      setOp(key);
      setFresh(true);
      return;
    }
    if (key === "=") {
      if (saved !== null) {
        const n = calculate(saved, Number(display), op);
        setDisplay(
          Number.isFinite(n) ? String(Number(n.toPrecision(12))) : "Error",
        );
        setSaved(null);
        setOp("");
        setFresh(true);
      }
      return;
    }
    if (key === "." && display.includes(".") && !fresh) return;
    setDisplay(
      fresh || display === "0" || display === "Error"
        ? key === "."
          ? "0."
          : key
        : display + key,
    );
    setFresh(false);
  };
  return (
    <div className="calculator">
      <div className="calc-op">
        {saved !== null ? `${saved} ${op}` : "Basic mode"}
      </div>
      <output>{display}</output>
      <div className="calc-keys">
        {[
          "AC",
          "±",
          "⌫",
          "÷",
          "7",
          "8",
          "9",
          "×",
          "4",
          "5",
          "6",
          "−",
          "1",
          "2",
          "3",
          "+",
          "0",
          ".",
          "=",
        ].map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={k === "=" ? "equals" : ""}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
function Browser() {
  const [address, setAddress] = useState(profile.website);
  const [url, setUrl] = useState(profile.website);
  const [navigation, setNavigation] = useState(0);
  const navigate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector("input")!;
    try {
      const destination = new URL(
        address.includes("://") ? address : `https://${address}`,
      );
      if (
        destination.protocol !== "https:" ||
        !["connorlove.com", "www.connorlove.com"].includes(destination.hostname)
      ) {
        throw new Error("Enter a connorlove.com address.");
      }
      input.setCustomValidity("");
      setUrl(destination.href);
      setAddress(destination.href);
      setNavigation((value) => value + 1);
    } catch {
      input.setCustomValidity("Enter a valid connorlove.com address.");
      input.reportValidity();
    }
  };
  return (
    <div className="browser">
      <form onSubmit={navigate}>
        <button
          type="button"
          aria-label="Portfolio home"
          onClick={() => {
            setUrl(profile.website);
            setAddress(profile.website);
            setNavigation((value) => value + 1);
          }}
        >
          ⌂
        </button>
        <input
          aria-label="Web address"
          value={address}
          onChange={(event) => {
            event.target.setCustomValidity("");
            setAddress(event.target.value);
          }}
        />
        <button type="submit">Go</button>
      </form>
      <iframe
        key={navigation}
        className="browser-page"
        title="Connor Love’s portfolio"
        src={url}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

function Desktop() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const highest = useRef(1);
  const [time, setTime] = useState(new Date());
  const [activities, setActivities] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(false);
  const [wallpaper, setWallpaper] = useState(() => {
    try {
      return localStorage.getItem("connor-macos-wallpaper") || "macos";
    } catch {
      return "macos";
    }
  });
  const [locked, setLocked] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("connor-macos-wallpaper", wallpaper);
    } catch {}
  }, [wallpaper]);
  useEffect(() => {
    if (window.parent === window) {
      const unbind = bindKeyboard();
      const sounds = Array.from(
        { length: 6 },
        (_, i) => new Audio(`/audio/keyboard/key_${i + 1}.mp3`),
      );
      const click = () => {
        const audio = sounds[
          Math.floor(Math.random() * sounds.length)
        ].cloneNode() as HTMLAudioElement;
        audio.volume = 0.35;
        void audio.play().catch(() => {});
      };
      keyboardState.listeners.add(click);
      return () => {
        unbind();
        keyboardState.listeners.delete(click);
      };
    }
    const relay = (e: Event) => {
      const m = e as MouseEvent,
        k = e as KeyboardEvent;
      window.parent.postMessage(
        {
          type: e.type,
          clientX: m.clientX,
          clientY: m.clientY,
          key: k.key,
          code: k.code,
          repeat: k.repeat,
        },
        window.location.origin,
      );
    };
    const events = ["mousemove", "mousedown", "mouseup", "keydown", "keyup"];
    events.forEach((t) => window.addEventListener(t, relay));
    const reset = () =>
      window.parent.postMessage(
        { type: "keyboard-reset" },
        window.location.origin,
      );
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      events.forEach((t) => window.removeEventListener(t, relay));
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      reset();
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (locked) {
        e.preventDefault();
        e.stopPropagation();
        setLocked(false);
        return;
      }
      if (e.key === "Escape") {
        setActivities(false);
        setStatus(false);
        setContext(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [locked]);
  const open = (id: AppId) => {
    setActivities(false);
    setContext(null);
    setWindows((ws) =>
      ws.some((w) => w.id === id)
        ? ws.map((w) =>
            w.id === id ? { ...w, minimized: false, z: ++highest.current } : w,
          )
        : [
            ...ws,
            {
              id,
              x: 60 + ((ws.length * 22) % 150),
              y: 42 + ((ws.length * 22) % 150),
              z: ++highest.current,
              minimized: false,
              maximized: window.innerWidth < 650,
            },
          ],
    );
  };
  const patch = (id: AppId, values: Partial<WindowState>) =>
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...values } : w)));
  const drag = (e: React.PointerEvent, w: WindowState) => {
    if (w.maximized || (e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const x = e.clientX,
      y = e.clientY;
    const move = (ev: PointerEvent) =>
      patch(w.id, {
        x: Math.max(
          12,
          Math.min(window.innerWidth - 160, w.x + ev.clientX - x),
        ),
        y: Math.max(
          30,
          Math.min(window.innerHeight - 70, w.y + ev.clientY - y),
        ),
      });
    const done = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", done);
      el.removeEventListener("pointercancel", done);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", done);
    el.addEventListener("pointercancel", done);
  };
  const settings = (
    <section className="content-section">
      <h1>Personalize your desktop</h1>
      <h2>Background</h2>
      <div className="wallpapers">
        {["macos", "midnight", "forest"].map((w) => (
          <button
            aria-label={w + " wallpaper"}
            aria-pressed={wallpaper === w}
            key={w}
            className={
              "wallpaper-option " + w + (wallpaper === w ? " active" : "")
            }
            onClick={() => setWallpaper(w)}
          />
        ))}
      </div>
      <h2>Display brightness</h2>
      <input
        aria-label="Display brightness"
        type="range"
        min="40"
        max="100"
        value={brightness}
        onChange={(e) => setBrightness(Number(e.target.value))}
      />
      <h2>Connor's desktop</h2>
      <p>A place for work, curiosity, and a little nostalgia.</p>
      <p>
        {profile.name} · {profile.location}
      </p>
      <button
        className="primary"
        onClick={() => {
          setLocked(true);
          setStatus(false);
        }}
      >
        Lock screen
      </button>
      <p>
        <a href="/" target="_top">
          Return to the 3D experience <Arrow />
        </a>
      </p>
    </section>
  );
  return (
    <div
      className={"desktop " + wallpaper}
      style={{ filter: `brightness(${brightness / 100})` }}
      onClick={() => {
        setContext(null);
      }}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest(".app-window")) return;
        e.preventDefault();
        setContext({
          x: Math.min(e.clientX, window.innerWidth - 225),
          y: Math.min(e.clientY, window.innerHeight - 150),
        });
      }}
    >
      <Documents />
      <header className="topbar">
        <button
          aria-label="Launchpad"
          onClick={() => {
            setActivities(!activities);
            setStatus(false);
          }}
        >
          <img
            aria-hidden="true"
            className="apple-mark"
            src="/macos/apple.png"
            alt=""
          />
          <b>Finder</b>
        </button>
        <span className="clock">
          {time.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          {time.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
        <button
          className="system-tray"
          aria-label="System menu"
          onClick={() => setStatus(!status)}
        >
          {[
            "network-wireless-signal-good-symbolic",
            "audio-volume-medium-symbolic",
            "battery-good-symbolic",
          ].map((i) => (
            <img key={i} src={"/themes/Yaru/status/" + i + ".svg"} alt="" />
          ))}
          <Arrow direction="down" />
        </button>
      </header>
      <nav className="dock" aria-label="Applications">
        {apps.slice(0, 8).map((a) => (
          <button
            key={a.id}
            title={a.title}
            aria-label={a.title}
            className={
              windows.some((w) => w.id === a.id && !w.minimized)
                ? "running"
                : ""
            }
            onClick={() => open(a.id)}
          >
            <Icon id={a.id} />
            <span className="tooltip">{a.title}</span>
          </button>
        ))}
        <button
          className="app-grid"
          title="Show applications"
          aria-label="Show applications"
          onClick={() => setActivities(!activities)}
        >
          <img alt="" src="/macos/launchpad.png" />
        </button>
      </nav>
      <div className="desktop-icons">
        {(["about", "trash", "contact"] as AppId[]).map((id) => (
          <button
            key={id}
            onDoubleClick={() => open(id)}
            onClick={(e) => {
              if (
                e.detail === 0 ||
                window.matchMedia("(pointer: coarse)").matches
              )
                open(id);
            }}
          >
            <Icon id={id} />
            <span>{apps.find((a) => a.id === id)!.title}</span>
          </button>
        ))}
        <External className="x-shortcut" href={profile.twitter}>
          <span className="x-icon">𝕏</span>
          <span>
            Connor Love <Arrow />
          </span>
        </External>
      </div>
      {windows
        .filter((w) => !w.minimized)
        .map((w) => (
          <section
            role="dialog"
            aria-label={apps.find((a) => a.id === w.id)!.title}
            key={w.id}
            className={"app-window " + w.id + (w.maximized ? " maximized" : "")}
            style={{ left: w.x, top: w.y, zIndex: w.z }}
            onPointerDown={() => patch(w.id, { z: ++highest.current })}
          >
            <header
              className="window-title"
              onPointerDown={(e) => drag(e, w)}
              onDoubleClick={() => patch(w.id, { maximized: !w.maximized })}
            >
              <span>
                {w.id === "terminal"
                  ? "connor@love: ~"
                  : apps.find((a) => a.id === w.id)!.title}
              </span>
              <div className="window-controls">
                <button
                  title="Minimize"
                  aria-label={"Minimize " + w.id}
                  onClick={() => patch(w.id, { minimized: true })}
                >
                  −
                </button>
                <button
                  title="Maximize"
                  aria-label={"Maximize " + w.id}
                  onClick={() => patch(w.id, { maximized: !w.maximized })}
                >
                  □
                </button>
                <button
                  title="Close"
                  className="close"
                  aria-label={"Close " + w.id}
                  onClick={() =>
                    setWindows((ws) => ws.filter((a) => a.id !== w.id))
                  }
                >
                  ×
                </button>
              </div>
            </header>
            <div className="window-body">
              {w.id === "about" ? (
                <About />
              ) : w.id === "contact" ? (
                <Contact />
              ) : w.id === "code" ? (
                <Notes />
              ) : w.id === "terminal" ? (
                <Terminal />
              ) : w.id === "calculator" ? (
                <Calculator />
              ) : w.id === "browser" ? (
                <Browser />
              ) : w.id === "settings" ? (
                settings
              ) : w.id === "music" ? (
                <Music />
              ) : (
                <div className="trash-content">
                  <Icon id="trash" />
                  <h2>Trash is empty</h2>
                  <p>A fresh start. Nothing to restore.</p>
                </div>
              )}
            </div>
          </section>
        ))}
      {activities && (
        <div className="activities">
          <input
            aria-label="Search applications"
            autoFocus
            placeholder="Type to search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="application-grid">
            {apps
              .filter((a) =>
                a.title.toLowerCase().includes(query.toLowerCase()),
              )
              .map((a) => (
                <button key={a.id} onClick={() => open(a.id)}>
                  <Icon id={a.id} />
                  <span>{a.title}</span>
                </button>
              ))}
          </div>
          {!apps.some((a) =>
            a.title.toLowerCase().includes(query.toLowerCase()),
          ) && <p>No applications found.</p>}
        </div>
      )}
      {status && (
        <div className="status-menu">
          <p>◉ &nbsp; Connected</p>
          <p>▣ &nbsp; Fully charged</p>
          <hr />
          <button
            onClick={() => {
              open("settings");
              setStatus(false);
            }}
          >
            ⚙ &nbsp; Settings
          </button>
          <button
            onClick={() => {
              setLocked(true);
              setStatus(false);
            }}
          >
            ▣ &nbsp; Lock screen
          </button>
          <a href="/" target="_top">
            ↶ &nbsp; Restart experience
          </a>
        </div>
      )}
      {context && (
        <div
          className="context-menu"
          style={{ left: context.x, top: context.y }}
        >
          <button onClick={() => open("about")}>Open home folder</button>
          <button onClick={() => open("terminal")}>Open in terminal</button>
          <hr />
          <button onClick={() => open("settings")}>Change background…</button>
        </div>
      )}
      {locked && (
        <button className="lock-screen" onClick={() => setLocked(false)}>
          <span className="lock-time">
            {time.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
          <span>
            {time.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="unlock-hint">Click or press a key to unlock</span>
          <span className="lock-name">Connor Love</span>
        </button>
      )}
    </div>
  );
}
ReactDOM.render(<Desktop />, document.getElementById("root"));
