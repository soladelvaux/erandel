# Deployment: one codebase, one production home

**Decided by Sola on 2026-11-05.** The public website is the official production home of Erandel. The claude.ai page is a development preview. There is one codebase.

| Home | Address | Role | Built from |
|---|---|---|---|
| **Production** | https://soladelvaux.github.io/erandel/ | The official game; peer-to-peer multiplayer | `dist/site/index.html` |
| Preview | claude.ai page `P3U6BLPVP2jmDFDJeVh24C` (private) | Experiments and previews; multiplayer through the Claude room | `dist/preview/erandel.html` |

Both come from the same source through `node tools/build.js`. Nobody edits a deployed copy by hand. The old hand-made `Erandel.html` download (v0.4.0) is retired; the site is the download.

## Release steps

1. Commit the change on `main` in `soladelvaux/erandel`.
2. Run `tools/deploy-site.sh /path/to/soladelvaux.github.io`. It refuses uncommitted `src/` or `tools/` changes, runs the 65 tests, builds, copies `dist/site/index.html` to `erandel/index.html` in the site repo, and pushes with the source commit in the message.
3. GitHub Pages publishes the site repo within about a minute.
4. Optionally, publish `dist/preview/erandel.html` to the claude.ai preview.

During the migration (ADR-0002), only a commit whose milestone gate has passed is deployed. Rolling back means checking out the previous `rollback/*` branch and running the same script.

## Compatibility rules

- The production page must work as a static file on GitHub Pages: no server, every dependency from a public CDN or bundled.
- Everything that only works on claude.ai (the `room` capability, `window.claude.hot`) must be optional and detected at run time. The preview may use it; production must never need it.
- After ADR-0002 step U2, `tools/build.js` assembles the modules. Its two outputs and their paths do not change, so this process stays the same.
