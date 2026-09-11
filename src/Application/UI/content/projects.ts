import { profile } from "../../../desktop/profile";

// Descriptions and implementation facts come from Connor's published case studies.
const stories: Record<
  string,
  {
    intro: string;
    built: string;
    challenge: string;
    solution: string;
    fact: string;
    factLabel: string;
    url: string;
    action: string;
    alt: string;
  }
> = {
  honestui: {
    intro: "React components you can take apart and make your own.",
    built:
      "I designed and built the component library, documentation, and installation workflow. Each component comes with editable source, usage examples, and guidance on behavior and accessibility.",
    challenge:
      "A component library needs shared conventions without making every customization depend on its package API.",
    solution:
      "Components copy into your project through the CLI or manual installation. Semantic CSS tokens handle theming, and charts and visual effects stay optional.",
    fact: "MIT licensed",
    factLabel: "Source you can edit and ship",
    url: "https://www.honestui.com",
    action: "Explore HonestUI",
    alt: "HonestUI's dark interface with editable React component examples, including account and payment cards.",
  },
  "clove-colors": {
    intro: "Take a palette all the way to a working interface.",
    built:
      "I designed and built a color workbench that turns palettes into light and dark themes. You can preview colors in sample interfaces and export CSS, Tailwind, or design tokens.",
    challenge:
      "A set of colors can look good together and still fail when used for text, surfaces, and controls.",
    solution:
      "I connected palette editing to semantic color roles, coordinated ramps, and contrast checks for actual foreground and background pairs. Interface previews show how those choices work together before export.",
    fact: "24 curated palettes",
    factLabel: "Start with a palette or build your own",
    url: "https://colors.connorlove.com",
    action: "Try Clove Colors",
    alt: "Clove Colors palette workbench showing navy, teal, mint, yellow, and cream colors with palette and system controls.",
  },
  tokenizer: {
    intro: "See exactly how different tokenizers read the same text.",
    built:
      "I built a byte-lossless Unigram tokenizer and a browser interface that compares it with nine established baselines. The view exposes token boundaries, counts, and ratios side by side.",
    challenge:
      "Comparisons need to stay responsive and reproducible, with a clear boundary between token counts and claims about model quality.",
    solution:
      "Text processing runs locally in a browser worker. A fixed benchmark of 2,116 records and published reproduction scripts make the measurements inspectable. Token counts describe tokenization, not model quality.",
    fact: "10 tokenizers",
    factLabel: "Compared locally in your browser",
    url: "https://tokenizer.connorlove.com",
    action: "Try Tokenizer",
    alt: "Connor's Tokenizer showing a text input beside colored token count comparisons for ten tokenizers.",
  },
};

export const projectStories = profile.projects.map((project) => ({
  ...project,
  ...stories[project.slug],
  caseStudy: `${profile.website}/projects/${project.slug}`,
}));
export type ProjectStory = (typeof projectStories)[number];
