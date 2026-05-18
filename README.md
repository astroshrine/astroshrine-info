# AstroShrine Website

Marketing and legal website for the AstroShrine Vedic astrology mobile app.

## Pages

| Page | Path | Purpose |
|------|------|---------|
| Home | `/` | Marketing landing page |
| Privacy Policy | `/privacy-policy.html` | Required by Google Play |
| Terms of Service | `/terms-of-service.html` | Legal terms |
| Support | `/support.html` | FAQ + contact form |
| Delete Account | `/delete-account.html` | Required by Google Play |

## Stack

- Pure static HTML + CSS (no JS framework)
- `serve` (Node.js static file server) for hosting
- Google Fonts: Poetsen One, Geologica, DM Sans
- Inline SVGs for icons

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Deploy to Railway

1. Push this repo to GitHub
2. In Railway dashboard: **New Project > Deploy from GitHub repo**
3. Railway auto-detects `railway.json` and deploys
4. Set a custom domain in Railway: **Settings > Networking > Custom Domain**
5. Add the DNS records Railway provides to your domain registrar

## After Deployment

### 1. Google Search Console Verification

Replace the placeholder in `index.html` line 8:

```html
<meta name="google-site-verification" content="YOUR_ACTUAL_CODE" />
```

### 2. Android App Links

Replace the SHA-256 fingerprint in `.well-known/assetlinks.json` with your release keystore fingerprint:

```bash
keytool -list -v -keystore astroshrine-upload.keystore -alias astroshrine
```

### 3. Play Store URL

Once the app is live on Play Store, search `href="#"` across all HTML files and replace with the real Play Store URL. Also change "COMING SOON TO" to "GET IT ON".

### 4. Contact Form

The support form is front-end only. Connect it to Formspree, Web3Forms, or a custom endpoint.

### 5. Terms of Service City

Replace `[Your City]` in `terms-of-service.html` with your actual jurisdiction city.
