# Neural Ink — portfolio of Md. Tanvirul Islam Rifat

A comic-book × neural-network portfolio. Dark "night edition" by default, with a "day edition" newsprint theme.

**Live:** https://tanvirul-islam-rifat.vercel.app

## What's inside

- **Boot intro:** a fake model-training log, a POW!, then the page tears open. Shown once per session; any key skips it.
- **Living cover:** a canvas neural network. Neurons fire on their own, react to the cursor, and fire when clicked.
- **Research panels** for HyMaC-Net (accepted in *Scientific Reports*) and SketchEffNet.
- **Projects** laid out as a comic page, with filters and a full "case file" for each project (deep-linkable: `/#case-quakenet`).
- **Skill map:** languages → tools → domains. Edges are generated from the project data, so every line is backed by a public repo.
- **Origin story** comic strip, an **easel** to doodle on, an FC-style **player card** that flips.
- **Six collectible stickers** and a Konami-code kick-off (`↑ ↑ ↓ ↓ ← → ← → B A`).
- Responsive down to 320 px, keyboard accessible, respects `prefers-reduced-motion`, no external requests.

## Structure

```
.
├── index.html              # the page (static content + mount points)
├── 404.html                # "panel not found"
├── vercel.json             # clean URLs, caching and security headers
├── favicon.svg, apple-touch-icon.png, site.webmanifest, robots.txt, sitemap.xml
└── assets/
    ├── css/
    │   ├── tokens.css      # colours, type, spacing; both editions
    │   ├── base.css        # reset, page, layout primitives
    │   ├── components.css  # masthead, buttons, panels, bubbles, bursts, dialogs, toasts
    │   ├── sections.css    # hero, research, projects, skill map, story, off duty, contact
    │   └── effects.css     # boot intro, sound-effect bursts, kick-off mode
    ├── js/
    │   ├── theme-init.js   # runs before paint: theme + "intro already seen"
    │   ├── main.js         # entry point (ES module)
    │   ├── data/
    │   │   ├── projects.js # ← all project content lives here
    │   │   └── skills.js   # skill-map layers and spoken languages
    │   └── modules/        # boot, neural, projects, casefile, skillmap, stickers, ui, utils
    ├── fonts/              # Bangers, Atkinson Hyperlegible, JetBrains Mono (self-hosted, OFL)
    ├── img/                # portrait, project figures, social preview
    ├── media/              # short gameplay clips (WebM + MP4)
    └── docs/               # CV PDF
```

No framework and no build step: Vercel serves the folder as it is.

## Editing content

- **Add or change a project:** edit `assets/js/data/projects.js`. Set `tier` to `feature`, `more`, `archive` or `research`. The filters, the skill map and the case file update themselves.
- **Update the CV:** replace `assets/docs/Tanvirul_Islam_Rifat_CV.pdf` (keep the file name).
- **Add a skill:** add a node to `assets/js/data/skills.js`, then list its id in a project's `skills`.
- **Timeline, contact, hero text:** edit `index.html` directly.

## Run locally

The scripts are ES modules, so open the site through a local server rather than double-clicking `index.html`:

```bash
python -m http.server 8080
# then open http://localhost:8080
```

or use the VS Code "Live Server" extension.

## Deploy

Push to GitHub, then import the repository in Vercel with the **Other** framework preset, no build command and the root as the output directory. Every push to `main` redeploys.

## Credits

Fonts: [Bangers](https://fonts.google.com/specimen/Bangers), [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), all under the SIL Open Font License (see `assets/fonts/`).

## License

Code: MIT (see `LICENSE`). Personal content (text, photos, CV, project figures) © Md. Tanvirul Islam Rifat, all rights reserved.
