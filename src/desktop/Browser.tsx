import React, { useState } from "react";
import { profile } from "./profile";

export const browserSites = [
  {
    name: "Portfolio",
    url: profile.website,
    aliases: ["home", "connor", "portfolio"],
  },
  { name: "HonestUI", url: "https://www.honestui.com", aliases: ["honestui"] },
  {
    name: "Tokenizer",
    url: "https://tokenizer.connorlove.com",
    aliases: ["tokenizer"],
  },
];

export function browserDestination(value: string): { url: string } {
  const text = value.trim();
  const shortcut = browserSites.find((site) =>
    site.aliases.includes(text.toLowerCase()),
  );
  if (shortcut) return { url: shortcut.url };
  const destination = new URL(text.includes("://") ? text : `https://${text}`);
  const allowed =
    destination.hostname === "connorlove.com" ||
    destination.hostname.endsWith(".connorlove.com") ||
    ["honestui.com", "www.honestui.com"].includes(destination.hostname);
  if (
    !allowed ||
    destination.protocol !== "https:" ||
    destination.username ||
    destination.password ||
    destination.port
  )
    throw new Error(
      "Enter a Connor Love project address or choose a project below.",
    );
  return { url: destination.href };
}

export default function Browser() {
  const [address, setAddress] = useState(profile.website);
  const [url, setUrl] = useState(profile.website);
  const [revision, setRevision] = useState(0);
  const visit = (next: string) => {
    setUrl(next);
    setAddress(next);
    setRevision((value) => value + 1);
  };
  const navigate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector("input")!;
    try {
      const destination = browserDestination(address);
      input.setCustomValidity("");
      visit(destination.url);
    } catch {
      input.setCustomValidity(
        "Enter a Connor Love project address or choose a project below.",
      );
      input.reportValidity();
    }
  };
  return (
    <div className="browser">
      <form onSubmit={navigate}>
        <button
          type="button"
          aria-label="Portfolio home"
          onClick={() => visit(profile.website)}
        >
          ⌂
        </button>
        <button
          type="button"
          aria-label="Reload page"
          onClick={() => setRevision((value) => value + 1)}
        >
          ↻
        </button>
        <input
          aria-label="Web address"
          placeholder="Enter a project address"
          value={address}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          onChange={(event) => {
            event.target.setCustomValidity("");
            setAddress(event.target.value);
          }}
          onFocus={(event) => event.target.select()}
        />
        <button type="submit">Go</button>
      </form>
      <nav className="browser-projects" aria-label="Project shortcuts">
        {browserSites.map((site) => (
          <button key={site.url} onClick={() => visit(site.url)}>
            {site.name}
          </button>
        ))}
      </nav>
      <iframe
        key={revision}
        className="browser-page"
        title="Connor Love websites"
        src={url}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
