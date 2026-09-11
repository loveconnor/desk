// Based on connorlove.com/about, linkedin.com/in/loveconnor,
// github.com/loveconnor/lovechat, and github.com/HappyCoderHackathons/prismo.
export const skillGroups = [
  {
    title: "Frontend",
    items: ["React", "Next.js", "TypeScript", "Angular", "TanStack Start"],
  },
  {
    title: "Backend & data",
    items: [
      "Node.js / Fastify",
      "Python / Flask",
      "PostgreSQL",
      "Redis",
      "AI integration",
    ],
  },
  {
    title: "Design & interaction",
    items: [
      "Three.js",
      "GSAP animation",
      "UX design",
      "Design systems",
      "Component libraries",
    ],
  },
  {
    title: "Quality & delivery",
    items: [
      "Web performance",
      "Accessibility",
      "Software testing",
      "Technical SEO",
      "Docker",
    ],
  },
];

// Personal content lives here; the desktop and the 3D scene run independently.
export const profile = {
  name: "Connor Love",
  role: "Freelance Web Developer",
  location: "Columbus, Ohio",
  email: "connor@connorlove.com",
  github: "https://github.com/loveconnor",
  linkedin: "https://www.linkedin.com/in/loveconnor/",
  twitter: "https://x.com/connorlove_dev",
  calendar: "https://cal.com/loveconnor",
  website: "https://www.connorlove.com",
  skills: skillGroups.flatMap((group) => group.items),
  projects: [
    {
      name: "HonestUI",
      slug: "honestui",
      category: "Design & development",
      image: "/connor/honestui.webp",
    },
    {
      name: "Clove Colors",
      slug: "clove-colors",
      category: "Interactive web application",
      image: "/connor/clove-colors.webp",
    },
    {
      name: "Tokenizer",
      slug: "tokenizer",
      category: "Developer tool",
      image: "/connor/tokenizer.webp",
    },
  ],
};
