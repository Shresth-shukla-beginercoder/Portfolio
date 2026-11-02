// Data sourced from the real GitHub profile (github.com/Shresth-shukla-beginercoder)
// and the live Vercel deployments. The LinkedIn profile is login-gated, so the
// experience/certification entries below are inferred from repos and still need
// your confirmation before shipping (email + profile text + project stack are set).
export const PROFILE = {
  name: "Shresth Shukla",
  role: "Full Stack Developer",
  subRoles: ["React.js", "JavaScript", "Node.js", "Python", "PostgreSQL", "Docker", "MCP · AI"],
  bio: "Fourth-year B.Tech CSE (AI & ML) student at ITM GIDA, Gorakhpur — focused on full-stack web development across frontend, backend, REST APIs, databases and deployment.",
  about:
    "I'm a fourth-year B.Tech Computer Science & Engineering student specializing in Artificial Intelligence and Machine Learning at ITM GIDA, Gorakhpur. I'm primarily focused on full-stack web development — building web applications across frontend and backend, REST APIs, databases, authentication and deployment. Beyond the core stack I'm exploring Model Context Protocol (MCP) and AI-powered applications, and I have a foundation in Python-based data analytics and visualization. I'm looking for full-stack developer opportunities where I can contribute to real-world applications and keep growing.",
  location: "Gorakhpur, India",
  photo: "/src/assets/images/portrait.jpg",
};

export const SOCIALS = {
  github: "https://github.com/Shresth-shukla-beginercoder",
  linkedin: "https://www.linkedin.com/in/shresth-shukla-9117b6296/",
  email: "shresthshukla1234@gmail.com",
};

const GH = "https://github.com/Shresth-shukla-beginercoder";

export const PROJECTS = [
  {
    id: "p-01",
    title: "Sales Analytics",
    blurb: "Sales data cleaning, EDA and an interactive data-analysis & visualization web app built with Python + Flask, plus an MCP chatbot.",
    tags: ["Python", "Flask", "Pandas", "Plotly", "MCP"],
    year: "2026",
    image: "/src/assets/images/projects/sales-analytics.svg",
    repoUrl: `${GH}/sales-analytics-project`,
    // Local Python/Flask app — no public deployment yet.
    // TODO(content): add liveUrl here when Sales Analytics gets deployed.
    liveUrl: null,
  },
  {
    id: "p-02",
    title: "MediTrack",
    blurb: "Full-stack medication & health tracking app, built with JavaScript and deployed live.",
    tags: ["JavaScript", "React", "Vercel"],
    year: "2026",
    image: "/src/assets/images/projects/meditrack.jpg",
    repoUrl: `${GH}/MediTrack`,
    liveUrl: "https://medi-track-lake-two.vercel.app",
  },
  {
    id: "p-03",
    title: "YelpCamp",
    blurb: "Full-stack camping & local-discovery platform with AI + MCP integration — search, browse and review spots, built on Node + Express + PostgreSQL.",
    tags: ["JavaScript", "Node", "Express", "PostgreSQL", "MCP"],
    year: "2026",
    image: "/src/assets/images/projects/yelpcamp.jpg",
    repoUrl: `${GH}/YelpCamp`,
    liveUrl: "https://yelp-camp-tau-mocha.vercel.app/",
  },
  {
    id: "p-04",
    title: "MCP · Agentic AI",
    blurb: "Model Context Protocol experiments and agentic, LLM tool-calling pipelines in Python.",
    tags: ["Python", "MCP", "Agentic AI", "LLM"],
    year: "2026",
    image: "/src/assets/images/projects/mcp-agentic.svg",
    repoUrl: `${GH}/MCP_Master`,
    // Experiments live in the repository; no deployed app.
    liveUrl: null,
  },
];

// Levels are approximate — tune to taste. Grounded in the skills you listed.
export const SKILLS = [
  { name: "Frontend · HTML · CSS · JavaScript · React", level: 85 },
  { name: "Backend · Node.js · Express · REST APIs · Flask", level: 82 },
  { name: "Database · PostgreSQL · SQL", level: 78 },
  { name: "Languages · JavaScript · Python · C++", level: 78 },
  { name: "Data · Pandas · Plotly · Visualization", level: 80 },
  { name: "Tools · Git · GitHub · Docker · Vercel · Render", level: 88 },
  { name: "AI · MCP · Generative AI · ML", level: 75 },
];

export const EXPERIENCE = [
  {
    org: "EduSkills Foundation",
    period: "2026",
    role: "Generative AI, Deep Learning & Language Models — Virtual Intern",
    summary:
      "Virtual internship spanning generative AI, deep learning and LLMs, Model Context Protocol (MCP), Python data analysis and data visualization, and machine learning.",
  },
  {
    org: "EduSkills Foundation",
    period: "2026",
    role: "Java Full Stack Developer — Virtual Intern",
    summary:
      "Full-stack virtual internship covering full-stack development, React.js, Node.js, REST APIs, PostgreSQL, HTML5 and CSS3.",
  },
  {
    org: "ITM GIDA, Gorakhpur",
    period: "4th year",
    role: "B.Tech CSE (AI & ML)",
    summary:
      "Full-stack and applied project work spanning web development, REST APIs, PostgreSQL, authentication and deployment, alongside core AI/ML coursework.",
  },
];

export const CERTIFICATIONS = [
  {
    title: "Generative AI, Deep Learning & Language Models — Virtual Internship",
    issuer: "EduSkills Foundation",
    year: "2026",
    image: "/src/assets/images/credentials/eduskill-ai.png",
  },
  {
    title: "Java Full Stack Developer — Virtual Internship",
    issuer: "EduSkills Foundation",
    year: "2026",
    image: "/src/assets/images/credentials/eduskill-java.png",
  },
  {
    title: "The Web Developer Bootcamp 2026",
    issuer: "Udemy · Colt Steele",
    year: "2026",
    image: "/src/assets/images/credentials/udemy-webdev.jpg",
  },
];

export const ACHIEVEMENTS = [
  "Shipped Sales Analytics — a Python/Flask EDA + interactive analytics dashboard",
  "Deployed full-stack apps live on Vercel (MediTrack, YelpCamp, CRUD app)",
  "Explored agentic AI — Model Context Protocol (MCP) tool-calling pipelines",
  "Algorithm problem-solving & competitive DSA in C++",
];

export const NAV = [
  { id: "hero", label: "01 / Home" },
  { id: "projects", label: "02 / Work" },
  { id: "skills", label: "03 / Skills" },
  { id: "contact", label: "04 / Contact" },
];
