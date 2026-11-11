---
name: new-story
description: Add a new story/blog post to the website — creates docs/AG###_<slug>.md, places images in docs/img/, adds the entry to the timeline in index.html, and builds the static story page. Use when the user wants to publish, add, or post a new story, article, or post.
---

# Add a new story

Stories are Markdown files in `docs/`, listed in the git-log style timeline in `index.html`. `npm run build` (scripts/build-stories.mjs) turns each one into a static page `docs/AG###_<slug>.html` with link-preview metadata, the date, external versions and previous/next links. `story.html?file=...` only redirects old links to those pages. Never edit the generated `.html` files by hand.

## 1. Gather inputs

Ask only for what is missing:
- **Content**: a draft (pasted text or a path to a file).
- **Title**.
- **Date** shown on the timeline (default: current month, e.g. `Nov 2026`).
- **Role** it belongs under in the timeline (default: the most recent/top role in `index.html`).
- **Images** (optional): paths to image files, and where they go in the text.
- **External versions** (optional): URLs of the same article on Medium and/or LinkedIn. Always ask for these.

## 2. Pick the next ID

```bash
ls docs/ | grep -oE '^AG[0-9]{3}' | sort | tail -1
```

Increment by one, zero-padded to three digits (e.g. `AG015` → `AG016`). Lowercase form for images: `ag016`.

## 3. Copy images

Copy each image into `docs/img/` as `ag<NNN>_img<MMM>.<ext>`, numbered from `000` in order of appearance, keeping the original extension (e.g. `ag016_img000.jpeg`, `ag016_img001.jpg`). Use `cp`, never move the user's originals.

## 4. Write the Markdown file

Path: `docs/AG<NNN>_<Slug>.md`, where the slug is short and descriptive using underscores (e.g. `AG015_EUNL_meeting.md`).

Follow this header layout (header image optional):

```markdown
![](./img/ag016_img000.jpeg)

# <Title>

*By Andrea Grioni*

---

<body>
```

- Reference images with relative paths: `![](./img/ag016_img001.jpg)`.
- Keep the author's text as written; only fix formatting (headings, lists, links). Don't rewrite prose unless asked.

## 5. Add the timeline entry in index.html

Find the `<div class="gl-role">` for the chosen role, then insert a new `<li>` as the **first** item of the `<ul class="gl-stories">` that follows it (newest first), matching the existing indentation:

```html
              <li>
                <span class="story-date">Nov 2026</span>
                <span class="story-title"><Title></span>
                <span class="story-links">
                  <a href="docs/AG016_<Slug>.html" class="pub-link">Read</a>
                  <a href="https://medium.com/@grioni.andrea/..." target="_blank" class="pub-link">Medium</a>
                  <a href="https://www.linkedin.com/pulse/..." target="_blank" class="pub-link">LinkedIn</a>
                </span>
              </li>
```

- Include the Medium/LinkedIn links only if provided, in that order (Read, Medium, LinkedIn), always with `target="_blank"`.
- Strip tracking query strings from the URLs (e.g. `?trackingId=...`) and any trailing `/`.
- If an external link arrives after the story was added, add it to the existing `<li>` rather than creating a new entry, then rebuild (step 6).
- The timeline entry is the source of truth for the page's title, date and "Also on" links.

Escape HTML special characters in the title (`&` → `&amp;`, `–` → `&ndash;`, etc.).

## 6. Build the story pages

```bash
npm install   # first time only
npm run build
```

This regenerates every `docs/AG###_*.html` page (the previous story's "Next" link changes too), `sitemap.xml` and `feed.xml` (RSS), and rewrites any `story.html?file=` links in `index.html`. The timeline date must look like `Nov 2026` (it becomes the RSS publication date).

Safety net: the GitHub Action `.github/workflows/rebuild-stories.yml` runs the same build after every push to `main` and commits the regenerated files back if they were stale. Still run the build locally so you can preview, and so the commit is complete.

New images: keep them web-sized. Photos and screenshots should be JPEG, at most ~1600px wide (posters up to ~2400px), ideally under 500 KB. For example: `sips -Z 1600 -s format jpeg -s formatOptions 82 in.png --out docs/img/ag016_img001.jpg`.

## 7. Verify

- The new `.md` file and all referenced images exist at the paths used.
- `index.html` link path matches the filename exactly (case-sensitive on GitHub Pages).
- `docs/AG<NNN>_<Slug>.html` exists and its `<meta name="description">` reads well (it is the first real paragraph of the story).
- Optionally preview: `python3 -m http.server 8000` and open `http://localhost:8000/docs/AG<NNN>_<Slug>.html`.

## 8. Publish (only when the user asks, e.g. "publish it")

Stop after step 7 and show the user a summary. Pushing to `main` makes the story public on GitHub Pages, so only commit and push when the user explicitly asks.

1. Stage only the story files: the new `docs/AG<NNN>_<Slug>.md`, its `docs/img/ag<NNN>_*` images, `index.html`, the regenerated `docs/AG*.html` pages, `sitemap.xml` and `feed.xml`. Never stage `.DS_Store`, the user's drafts folder (e.g. `new_story/`), or unrelated changes.
2. Commit with the message:

   ```
   Add AG<NNN> post: <Title>
   ```

3. `git pull --rebase origin main`, then `git push origin main`. If the pull has conflicts or the push is rejected, stop and tell the user — never force-push.
4. Tell the user the live URLs (they update within a minute or two):
   - `https://andreagrioni.github.io/#timeline`
   - `https://andreagrioni.github.io/docs/AG<NNN>_<Slug>.html`
