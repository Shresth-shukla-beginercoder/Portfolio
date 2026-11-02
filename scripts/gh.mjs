import { writeFileSync } from "node:fs";
const u = "Shresth-shukla-beginercoder";
const j = async (r) => (await r.json());
const [user, repos, stars] = await Promise.all([
  j(await fetch(`https://api.github.com/users/${u}`)),
  j(await fetch(`https://api.github.com/users/${u}/repos?sort=updated&per_page=30`)),
  j(await fetch(`https://api.github.com/users/${u}/repos?sort=pushed&per_page=40&state=all`)).catch(() => []),
]);
const top = [...new Map(repos.map((r) => [r.name, r])).values()]
  .filter((r) => !r.fork)
  .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)))
  .slice(0, 12)
  .map((r) => ({ name: r.name, desc: r.description, lang: r.language, stars: r.stargazers_count, pushed: r.pushed_at, homepage: r.homepage, topics: (r.topics || []).slice(0, 8) }));
const out = {
  login: user.login, name: user.name, bio: user.bio, blog: user.blog,
  location: user.location, company: user.company,
  public_repos: user.public_repos, followers: user.followers, avatar: user.avatar_url,
  html: user.html_url,
  top_nonfork: top,
};
writeFileSync("scripts/gh-data.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
