// The 15 construction agents. Colour is never the only distinguisher:
// each agent also carries its own trail style, chip and idle motion.
// Palette checked for pairwise distinctness against the black + deep-red site.
export const AGENTS = [
  { id: "a-01", num: 1,  name: "Axis",     role: "Layout",      color: "#4C8DFF", trail: "solid",  speed: 0.90, idle: 2.4, edge: "left" },
  { id: "a-02", num: 2,  name: "Grid",     role: "Measure",     color: "#22D3EE", trail: "dotted", speed: 1.05, idle: 2.1, edge: "left" },
  { id: "a-03", num: 3,  name: "Align",    role: "Spacing",     color: "#2DD4BF", trail: "dashed", speed: 0.95, idle: 2.6, edge: "left" },
  { id: "a-04", num: 4,  name: "Glyph",    role: "Headings",    color: "#A78BFA", trail: "solid",  speed: 1.10, idle: 1.9, edge: "top" },
  { id: "a-05", num: 5,  name: "Kern",     role: "Body text",   color: "#E879F9", trail: "dotted", speed: 1.15, idle: 2.2, edge: "top" },
  { id: "a-06", num: 6,  name: "Lead",     role: "Labels",      color: "#F472B6", trail: "dashed", speed: 0.88, idle: 2.5, edge: "top" },
  { id: "a-07", num: 7,  name: "Lens",     role: "Portrait",    color: "#FBBF24", trail: "solid",  speed: 1.00, idle: 2.0, edge: "right" },
  { id: "a-08", num: 8,  name: "Crop",     role: "Photos",      color: "#A3E635", trail: "dotted", speed: 1.18, idle: 2.3, edge: "right" },
  { id: "a-09", num: 9,  name: "Frame",    role: "Signature",   color: "#34D399", trail: "ripple", speed: 0.92, idle: 2.7, edge: "right" },
  { id: "a-10", num: 10, name: "Route",    role: "Navigation",  color: "#FB923C", trail: "dashed", speed: 1.08, idle: 1.8, edge: "bottom" },
  { id: "a-11", num: 11, name: "Press",    role: "Buttons",     color: "#C7D2FE", trail: "solid",  speed: 0.86, idle: 2.4, edge: "bottom" },
  { id: "a-12", num: 12, name: "Deck",     role: "Cards",       color: "#94A3B8", trail: "dotted", speed: 1.12, idle: 2.1, edge: "bottom" },
  { id: "a-13", num: 13, name: "Atmos",    role: "Background",  color: "#FF6B6B", trail: "ripple", speed: 0.98, idle: 2.8, edge: "left" },
  { id: "a-14", num: 14, name: "Polish",   role: "Finishing",   color: "#FDE047", trail: "dashed", speed: 1.20, idle: 1.7, edge: "right" },
  { id: "a-15", num: 15, name: "Sentinel", role: "Inspection",  color: "#FFFFFF", trail: "solid",  speed: 0.85, idle: 3.0, edge: "top" },
];

// Which agent leads which layer kind.
export const KIND_OWNER = {
  layout: 1, type: 4, image: 7, nav: 10, button: 11, card: 12, bg: 13, polish: 14,
};

export const SECTIONS = [
  { id: "hero",           name: "Hero" },
  { id: "about",          name: "About" },
  { id: "skills",         name: "Technical Skills" },
  { id: "projects",       name: "Featured Projects" },
  { id: "experience",     name: "Experience" },
  { id: "certifications", name: "Certifications" },
  { id: "achievements",   name: "Achievements" },
  { id: "contact",        name: "Contact" },
];
