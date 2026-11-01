---
name: new-story
description: Add a new story/blog post to the website — creates docs/AG###_<slug>.md, places images in docs/img/, and adds the entry to the timeline in index.html. Use when the user wants to publish, add, or post a new story, article, or post.
---

# Add a new story

Stories are Markdown files in `docs/`, rendered by `story.html?file=...`, and listed in the git-log style timeline in `index.html`.

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
                  <a href="story.html?file=docs/AG016_<Slug>.md" class="pub-link">Read</a>
                  <a href="https://medium.com/@grioni.andrea/..." target="_blank" class="pub-link">Medium</a>
                  <a href="https://www.linkedin.com/pulse/..." target="_blank" class="pub-link">LinkedIn</a>
                </span>
              </li>
```

- Include the Medium/LinkedIn links only if provided, in that order (Read, Medium, LinkedIn), always with `target="_blank"`.
- Strip tracking query strings from the URLs (e.g. `?trackingId=...`) and any trailing `/`.
- If an external link arrives after the story was added, add it to the existing `<li>` rather than creating a new entry.

Escape HTML special characters in the title (`&` → `&amp;`, `–` → `&ndash;`, etc.).

## 6. Verify

- The new `.md` file and all referenced images exist at the paths used.
- `index.html` link path matches the filename exactly (case-sensitive on GitHub Pages).
- Optionally preview: `python3 -m http.server 8000` and open `http://localhost:8000/story.html?file=docs/AG<NNN>_<Slug>.md`.

## 7. Publish (only when the user asks, e.g. "publish it")

Stop after step 6 and show the user a summary. Pushing to `main` makes the story public on GitHub Pages, so only commit and push when the user explicitly asks.

1. Stage only the story files: the new `docs/AG<NNN>_<Slug>.md`, its `docs/img/ag<NNN>_*` images, and `index.html`. Never stage `.DS_Store`, the user's drafts folder (e.g. `new_story/`), or unrelated changes.
2. Commit with the message:

   ```
   Add AG<NNN> post: <Title>
   ```

3. `git pull --rebase origin main`, then `git push origin main`. If the pull has conflicts or the push is rejected, stop and tell the user — never force-push.
4. Tell the user the live URLs (they update within a minute or two):
   - `https://andreagrioni.github.io/#timeline`
   - `https://andreagrioni.github.io/story.html?file=docs/AG<NNN>_<Slug>.md`
