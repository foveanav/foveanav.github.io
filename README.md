# FoveaNav project website

This repository hosts the FoveaNav project website, including the paper PDF and
edited demonstration videos. Author and affiliation fields remain empty.

- Website: <https://ggalggeum.github.io/FoveaNav/>
- Repository: <https://github.com/ggalggeum/FoveaNav>

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

## Update the published site

1. Edit the files in `dist/`, preview locally, then commit and push the changes
   to `main`. Keep the `noindex, nofollow` meta tag in `dist/index.html`.
2. Open [Actions → Publish FoveaNav to GitHub Pages](https://github.com/ggalggeum/FoveaNav/actions/workflows/pages.yml),
   choose **Run workflow**, select `main`, and run it.
3. Wait for the deployment to succeed, then check the website. Pushing changes
   alone does not update the published site.

**Settings → Pages → Build and deployment → Source** is configured as
**GitHub Actions**. Only `dist/` is included in the deployed website.

All media links are relative, so project URLs with a repository subpath work.
The workflow obtains the site's actual `base_url` from
[`actions/configure-pages`](https://github.com/actions/configure-pages/blob/v5/action.yml)
and fills the canonical and social-sharing URLs automatically. Private-hosting
URLs and hosting identifiers are not included.

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
