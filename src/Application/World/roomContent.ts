import { profile } from "../../desktop/profile";
export const roomNotes = [
  {
    title: profile.name,
    subtitle: "ABOUT ME",
    body: `${profile.role} based in ${profile.location}. I design and build websites, product interfaces, and interactive 3D experiences. My work brings frontend development, motion, performance, and accessibility together.`,
    lines: ["Freelance web", "developer", "Columbus, Ohio"],
  },
  {
    title: "What I work with",
    subtitle: "TOOLKIT",
    body: profile.skills.join(" · "),
    lines: ["React · Next.js", "TypeScript", "Three.js"],
  },
  ...profile.projects.map((p, i) => ({
    title: p.name,
    subtitle: "PROJECT",
    body: [
      "A React component library with editable source code. Copy components into your project and make them your own. Includes interface controls, charts, icons, and optional visual effects.",
      "A color workbench for designers and developers. Build palettes, create light and dark themes, check contrast, and export CSS, Tailwind, or design tokens. Saved palettes stay in your browser.",
      "Compare how ten tokenizers split and count text. Inspect token boundaries side by side, try multilingual examples, and explore reproducible benchmarks. Text processing runs locally in a browser worker.",
    ][i],
    lines: [p.name, p.category],
    href: `${profile.website}/projects/${p.slug}`,
  })),
  {
    title: "Find me online",
    subtitle: "SAY HELLO",
    body: `${profile.email}\n${profile.github}\n${profile.linkedin}`,
    lines: ["Let's make", "something good.", "connorlove.com"],
  },
];
// A curated shelf of programming, interface design, and creative biography.
export const roomBooks = [
  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    color: "#777a74",
    topic:
      "The biography of Apple's cofounder: creativity, product thinking, and the intersection of technology and design.",
    url: "https://www.simonandschuster.com/books/Steve-Jobs/Walter-Isaacson/9781982176860",
  },
  {
    title: "The Design of Everyday Things",
    author: "Don Norman",
    color: "#c29b64",
    topic:
      "Human-centered design, clear feedback, and making objects understandable.",
  },
  {
    title: "Don't Make Me Think",
    author: "Steve Krug",
    color: "#98614c",
    topic: "Usability and making websites feel intuitive.",
  },
  {
    title: "The Pragmatic Programmer",
    author: "David Thomas & Andrew Hunt",
    color: "#42625e",
    topic: "Practical habits for building and maintaining software.",
  },
  {
    title: "Refactoring",
    author: "Martin Fowler",
    color: "#516175",
    topic:
      "Improving the structure of existing code while preserving its behavior.",
  },
  {
    title: "Designing Web Interfaces",
    author: "Bill Scott & Theresa Neil",
    color: "#8d966d",
    topic: "Interaction patterns for responsive, usable web interfaces.",
    url: "https://www.oreilly.com/library/view/designing-web-interfaces/9780596155353/",
  },
  {
    title: "Eloquent JavaScript",
    author: "Marijn Haverbeke",
    color: "#b7a77d",
    topic: "Programming fundamentals and expressive JavaScript.",
  },
  {
    title: "JavaScript: The Definitive Guide",
    author: "David Flanagan",
    color: "#546f89",
    topic: "A comprehensive guide to the language and browser APIs.",
    url: "https://www.oreilly.com/library/view/javascript-the-definitive/9781449393854/",
  },
  {
    title: "Thinking with Type",
    author: "Ellen Lupton",
    color: "#a85045",
    topic: "Typography, hierarchy, and how text shapes a design.",
  },
  {
    title: "Designing Interfaces",
    author: "Jenifer Tidwell",
    color: "#668078",
    topic: "Patterns for structuring clear user interfaces.",
  },
  {
    title: "The Elements of Typographic Style",
    author: "Robert Bringhurst",
    color: "#746850",
    topic:
      "Typographic principles, proportion, and the craft of readable pages.",
  },
];
