// Build static story pages from docs/AG###_*.md.
//
// For every story listed in the #timeline section of index.html, this writes
// docs/AG###_<slug>.html next to the Markdown source, with:
//   - the article pre-rendered (readable by search engines and link previews)
//   - <title>, meta description, canonical URL, Open Graph / Twitter tags
//   - the publication date and external versions (Medium, LinkedIn, ...)
//   - previous / next links in chronological order
// It also rewrites "story.html?file=docs/X.md" links in index.html to the
// static pages. Run with:  npm run build

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://andreagrioni.github.io';
const DEFAULT_IMAGE = `${SITE}/images/profile_picture.jpg`;
const STORY_RE = /(?:story\.html\?file=)?docs\/(AG\d{3}_[A-Za-z0-9_-]+)\.(?:md|html)/;

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’')
    .replace(/&#39;/g, "'")
    .replace(/&ouml;/g, 'ö')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const stripTags = (s) => decodeEntities(s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- timeline

function readTimeline(indexHtml) {
  const start = indexHtml.indexOf('<section id="timeline">');
  const end = indexHtml.indexOf('</section>', start);
  if (start < 0 || end < 0) throw new Error('Could not find <section id="timeline"> in index.html');
  const section = indexHtml.slice(start, end);

  const stories = [];
  for (const [, li] of section.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
    const read = li.match(/href="([^"]+)"[^>]*>Read</);
    const m = read && read[1].match(STORY_RE);
    if (!m) continue; // external-only entries (e.g. LinkedIn-only posts)
    const date = stripTags(li.match(/<span class="story-date">([\s\S]*?)<\/span>/)[1]);
    const title = stripTags(li.match(/<span class="story-title">([\s\S]*?)<\/span>/)[1]);
    const external = [...li.matchAll(/<a href="(https?:[^"]+)"[^>]*>([^<]+)<\/a>/g)].map(
      ([, url, label]) => ({ url, label: label.trim() })
    );
    stories.push({ id: m[1], date, title, external });
  }
  // The timeline is newest first; we want chronological order.
  return stories.reverse();
}

// ---------------------------------------------------------------- rendering

function firstParagraph(html) {
  const withoutQuotes = html.replace(/<blockquote>[\s\S]*?<\/blockquote>/g, '');
  for (const [, inner] of withoutQuotes.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
    if (/<mark/i.test(inner)) continue; // UPDATE notes
    const text = stripTags(inner);
    if (text.length < 60) continue; // bylines, author/date lines, image-only paragraphs
    return text;
  }
  return '';
}

function truncate(text, max = 200) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '…';
}

function renderStory(story, prev, next) {
  const mdPath = join(ROOT, 'docs', `${story.id}.md`);
  if (!existsSync(mdPath)) throw new Error(`Missing ${mdPath}`);
  let body = marked.parse(readFileSync(mdPath, 'utf8'));

  // Internal links: story.html?file=docs/X.md -> X.html (pages live side by side in docs/)
  body = body.replace(/href="story\.html\?file=docs\/(AG\d{3}_[A-Za-z0-9_-]+)\.md"/g, 'href="$1.html"');
  // External links open in a new tab
  body = body.replace(/<a href="(https?:[^"]+)"(?![^>]*target=)/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');

  // Date and external versions, right below the title
  const versions = story.external
    .map((e) => `<a href="${escapeHtml(e.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(e.label)}</a>`)
    .join(' &middot; ');
  const meta =
    `<p class="story-meta"><time>${escapeHtml(story.date)}</time>` +
    (versions ? ` &middot; Also on ${versions}` : '') +
    '</p>';
  body = /<\/h1>/.test(body) ? body.replace(/<\/h1>/, `</h1>\n${meta}`) : meta + body;

  const description = truncate(firstParagraph(body));
  const imgMatch = body.match(/<img[^>]+src="(?:\.\/)?(img\/[^"]+)"/);
  const image = imgMatch ? `${SITE}/docs/${imgMatch[1]}` : DEFAULT_IMAGE;
  const url = `${SITE}/docs/${story.id}.html`;
  const title = escapeHtml(story.title);
  const desc = escapeHtml(description);

  const navLink = (s, rel, label) =>
    s
      ? `<a class="story-nav-${rel}" href="${s.id}.html" rel="${rel}"><span>${label}</span>${escapeHtml(s.title)}</a>`
      : '<span></span>';

  return `<!DOCTYPE html>
<!-- Generated by scripts/build-stories.mjs from docs/${story.id}.md. Do not edit by hand: edit the .md file and run "npm run build". -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Andrea Grioni</title>
  <meta name="description" content="${desc}">
  <meta name="author" content="Andrea Grioni">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Andrea Grioni">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/story.css">
</head>
<body>

<nav>
  <div class="nav-container">
    <a href="../index.html" class="nav-brand">AG</a>
    <ul>
      <li><a href="../index.html#about">About</a></li>
      <li><a href="../index.html#timeline">Timeline</a></li>
      <li><a href="../index.html#education">Education</a></li>
      <li><a href="../index.html#publications">Publications</a></li>
      <li><a href="../index.html#contact">Contact</a></li>
    </ul>
  </div>
</nav>

<main>
  <div class="container story-container">
    <a href="../index.html#timeline" class="back-link">&#8592; All Stories</a>
    <article class="prose">
${body}
    </article>
    <div class="story-nav" role="navigation" aria-label="More stories">
      ${navLink(prev, 'prev', '&#8592; Previous')}
      ${navLink(next, 'next', 'Next &#8594;')}
    </div>
  </div>
</main>

<footer>
  <p>Copyright &copy; ${new Date().getFullYear()} Andrea Grioni</p>
</footer>

</body>
</html>
`;
}

// ---------------------------------------------------------------- main

const indexPath = join(ROOT, 'index.html');
let indexHtml = readFileSync(indexPath, 'utf8');
const stories = readTimeline(indexHtml);

stories.forEach((story, i) => {
  const html = renderStory(story, stories[i - 1], stories[i + 1]);
  writeFileSync(join(ROOT, 'docs', `${story.id}.html`), html);
  console.log(`built docs/${story.id}.html`);
});

const updatedIndex = indexHtml.replace(
  /href="story\.html\?file=docs\/(AG\d{3}_[A-Za-z0-9_-]+)\.md"/g,
  'href="docs/$1.html"'
);
if (updatedIndex !== indexHtml) {
  writeFileSync(indexPath, updatedIndex);
  console.log('updated index.html links to static story pages');
}
console.log(`${stories.length} stories`);
