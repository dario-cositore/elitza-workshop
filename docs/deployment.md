# Deployment Guide

Elitza Workshop is a fully static site — no build step, no server, no environment variables. Deploy it anywhere that serves static files over HTTPS.

---

## Requirements

- HTTPS (required for the File System Access API used to write files to disk)
- No server-side processing needed
- No environment variables needed for the static site

---

## Cloudflare Pages (recommended)

The fastest path from repo to live URL.

1. Push your fork to GitHub
2. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
3. Click **Create a project** → **Connect to Git**
4. Select your `elitza-workshop` repository
5. Configure the build:
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (root)
6. Click **Save and Deploy**

Cloudflare Pages provides automatic HTTPS, global CDN, and preview deployments for every branch. The `_headers` and `_redirects` files in the repo are automatically respected.

### Custom domain

In Cloudflare Pages → your project → **Custom domains** → add your domain.
The `_redirects` file handles `/injector → /injector/` already.

---

## Netlify

1. Push your fork to GitHub
2. Log in to [Netlify](https://netlify.com) → **Add new site** → **Import an existing project**
3. Connect your GitHub repo
4. Configure the build:
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.` (root)
5. Click **Deploy site**

The `_headers` and `_redirects` files are automatically picked up by Netlify.

---

## GitHub Pages

1. Push to your GitHub repo
2. Go to **Settings** → **Pages**
3. Source: **Deploy from a branch** → `main` → `/ (root)`
4. Click **Save**

Your site will be live at `https://<username>.github.io/elitza-workshop/`.

Note: GitHub Pages serves over HTTPS, so the File System Access API will work.

---

## Self-hosted (nginx / Apache)

Serve the repo root as a static directory with HTTPS enabled.

### nginx example

```nginx
server {
    listen 443 ssl;
    server_name workshop.yourdomain.com;

    root /var/www/elitza-workshop;
    index index.html;

    # Security headers (mirrors _headers file)
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";

    location / {
        try_files $uri $uri/ =404;
    }
}
```

---

## Local development

```bash
git clone https://github.com/dario-cositore/elitza-workshop
cd elitza-workshop
python -m http.server 4173
# open http://localhost:4173
```

`localhost` counts as a secure context, so the File System Access API works fully during local development.

Do **not** open `index.html` directly as a `file://` URL — the File System Access API will not work.

---

## Environment notes

### File System Access API browser support

The File System Access API (used to write profile files directly to disk) is supported in:

- Chrome / Chromium 86+ — full support
- Edge 86+ — full support
- Opera 72+ — full support
- Safari 15.2+ — partial support (no `showDirectoryPicker` in some versions)
- Firefox — not supported (falls back gracefully; users see an error message)

For the best experience, recommend Chrome or Edge to your users.

### Content Security Policy

No CSP headers are set by default. If you add a CSP, ensure it allows:
- `cdn.jsdelivr.net` (JSZip is loaded from CDN)
- `www.youtube-nocookie.com` (embedded video on welcome screen)
- `unsafe-inline` is not needed — the app uses no inline event handlers

---

## Cloudflare Worker backend (planned)

The roadmap includes a Cloudflare Worker for:
- Serving the agent store catalog from R2
- License-gated zip delivery after Gumroad/LemonSqueezy purchase
- Post-purchase webhook → auto-install flow

See `docs/roadmap.md` for the full plan. The static site and Worker are designed to be independently deployable — the Worker is purely additive.
