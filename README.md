# FoveaNav project website — GitHub Pages package

This folder is prepared for a GitHub Pages website that anyone with its link can
open. It includes the static website, the paper PDF, and edited demonstration
videos. Author and affiliation fields remain empty. The package itself does not
create a repository or publish anything.

## Access and indexing

The intended release is publicly accessible without advertising the link yet.
The page requests `noindex, nofollow` from search engines. This is a request,
not access control: anyone with the URL can access and share the website and
its assets. A private GitHub repository does **not** normally make its Pages
website private. GitHub documents the distinction in
[its Pages setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The supplied workflow runs **only when manually requested**. It has no push or
pull-request trigger. Keep the indexing request until wider release is intended;
then remove the robots meta tag from `dist/index.html` and deploy the update.

## Preview locally

From this folder:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open <http://127.0.0.1:8000>. Stop with Ctrl+C. No build or package installation
is required.

## Publish

1. Create a dedicated website repository when ready. Add this folder's contents
   at the repository root, including the hidden `.github` directory. Use Git to
   upload the complete package; do not upload the outer ZIP as a single file.
2. Put `.github/workflows/pages.yml` on the default branch, normally `main`.
3. In **Settings → Pages → Build and deployment → Source**, select
   **GitHub Actions**.
4. In **Actions → Publish FoveaNav to GitHub Pages → Run workflow**, select the
   default branch and run it. This is the publication step.
5. Open the URL reported by the deployment. Future updates require another
   manual workflow run after the updated files have been committed.

All media links are relative, so project URLs with a repository subpath work.
The workflow obtains the site's actual `base_url` from
[`actions/configure-pages`](https://github.com/actions/configure-pages/blob/v5/action.yml)
and fills the canonical and social-sharing URLs automatically. No username,
domain, private-hosting URL, or hosting identifier is embedded in this package.

## Files to edit

| File | Purpose |
| --- | --- |
| `dist/index.html` | Page structure and text |
| `dist/styles.css` | Layout and visual style |
| `dist/app.js` | Playback controls and interactions |
| `dist/site-data.js` | Results and future author, affiliation, code, and arXiv links |
| `dist/assets/` | Paper, videos, posters, figures, and transcript |
| `.github/workflows/pages.yml` | Manual deployment workflow |
| `scripts/set-pages-url.py` | Deployment-specific canonical and sharing URLs |

The original research code, training data, model checkpoints, raw recordings,
private hosting configuration, and edit-provenance files are not part of this
website package.
