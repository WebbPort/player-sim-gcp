# Offense Web Frontend — Deploy to Google Cloud (Static Site + Cloud Run API)

This guide hosts your static website (**index.html + app.js**) on **Google Cloud Storage (GCS)** and connects it to your already‑deployed **Cloud Run** API.

- **API (already deployed):** `https://player-sim-api-664678380310.us-central1.run.app`
- **Project ID:** `optimal-tea-470117-t4`
- **Platform:** Windows / PowerShell
- **Result (site URL):** `https://storage.googleapis.com/player-sim-web-optimal-tea-470117-t4/index.html`

---

## 0) Prerequisites

- **gcloud CLI** installed and authenticated: `gcloud --version` then `gcloud auth login`.
- You have **Owner/Editor** on the project `optimal-tea-470117-t4`.
- Your static files (`index.html`, `app.js`) are in a local folder.

> Tip: If you also use BigQuery, follow your existing setup. This doc focuses on frontend hosting and API wiring.

---

## 1) Set variables (PowerShell)

```powershell
# Project & region
$env:GOOGLE_CLOUD_PROJECT = "optimal-tea-470117-t4"
$REGION = "us-central1"

# Cloud Run API endpoint (already deployed)
$API_URL = "https://player-sim-api-664678380310.us-central1.run.app"

# GCS bucket for static site (must be globally unique — this exact name is available in your URL)
$BUCKET = "player-sim-web-optimal-tea-470117-t4"
```

Confirm the active project:
```powershell
gcloud config set project $env:GOOGLE_CLOUD_PROJECT
gcloud projects describe $env:GOOGLE_CLOUD_PROJECT --format="value(projectNumber)"
```

---

## 2) Create the bucket

Use the modern `gcloud storage` commands (preferred over legacy `gsutil`).

```powershell
# Create a regional bucket
gcloud storage buckets create "gs://$BUCKET" --location=$REGION

# Turn on Uniform Bucket-Level Access (recommended)
gcloud storage buckets update "gs://$BUCKET" --uniform-bucket-level-access
```

---

## 3) Make the site publicly readable

Grant public read access to objects (not to the bucket’s metadata):

```powershell
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" `
  --member="allUsers" `
  --role="roles/storage.objectViewer"
```

> This allows anyone to GET objects (e.g., `index.html`, `app.js`). You can revoke later if needed.

---

## 4) Configure website main page & error page

```powershell
# Optional: set website behavior for "index" and a simple 404 page
gcloud storage buckets update "gs://$BUCKET" `
  --web-main-page-suffix="index.html" `
  --web-error-page="404.html"
```

If you don’t have a `404.html`, you can skip `--web-error-page`.

---

## 5) Upload your static files

From the folder that contains `index.html` and `app.js`:

```powershell
# Upload files
gcloud storage cp .\index.html "gs://$BUCKET/"
gcloud storage cp .\app.js "gs://$BUCKET/"

# (Optional) set cache headers, useful when iterating quickly
gcloud storage cp .\app.js "gs://$BUCKET/app.js" --cache-control="no-store"
```

---

## 6) Wire the frontend to the Cloud Run API

In your **app.js**, call the Cloud Run API with `fetch`. Example:

```javascript
const API_URL = "https://player-sim-api-664678380310.us-central1.run.app";

async function pingApi() {
  const res = await fetch(API_URL + "/health", { method: "GET", mode: "cors" });
  const txt = await res.text();
  document.getElementById("status").textContent = txt;
}

pingApi().catch(err => {
  console.error("API call failed:", err);
  document.getElementById("status").textContent = "API error (see console)";
});
```

> Replace `/health` with your actual path (e.g., `/similarity/offense`).

### Ensure the API allows CORS
Since your site will load from `https://storage.googleapis.com`, the browser will make a **cross‑origin** request to Cloud Run. Your Cloud Run service must respond with appropriate CORS headers, e.g.:

```
Access-Control-Allow-Origin: https://storage.googleapis.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

If you control the API code (e.g., FastAPI), add CORS middleware. Otherwise, consider returning these headers from handlers or using a simple middleware layer.

> Also confirm the Cloud Run service is public:
```powershell
gcloud run services add-iam-policy-binding player-sim-api-664678380310 `
  --member="allUsers" `
  --role="roles/run.invoker" `
  --region=$REGION --platform=managed
```
(Replace the service name above if different from your URL.)

---

## 7) Test your site

Open:
```
https://storage.googleapis.com/player-sim-web-optimal-tea-470117-t4/index.html
```

If the page loads but API calls fail with CORS, open DevTools (F12) → **Console** and **Network** tabs to see the exact error and missing headers.

---

## 8) Common issues & fixes

- **403 when opening index.html**  
  Public read not set. Re‑run the IAM binding in step 3.

- **404 on index.html**  
  File not uploaded or path typo. Re‑upload with step 5.

- **CORS error calling Cloud Run**  
  Add `Access-Control-Allow-*` headers on the API responses. For preflight (OPTIONS) requests, make sure OPTIONS returns 200 with those headers.

- **Stale JavaScript after deploy**  
  Add `--cache-control="no-store"` on uploads while iterating, or change filenames with hashes (`app.1234.js`).

- **Wrong project**  
  Ensure `gcloud config get-value project` shows `optimal-tea-470117-t4`.

---

## 9) One‑shot setup (copy/paste)

```powershell
$env:GOOGLE_CLOUD_PROJECT = "optimal-tea-470117-t4"
$REGION = "us-central1"
$BUCKET = "player-sim-web-optimal-tea-470117-t4"
$API_URL = "https://player-sim-api-664678380310.us-central1.run.app"

gcloud config set project $env:GOOGLE_CLOUD_PROJECT

gcloud storage buckets create "gs://$BUCKET" --location=$REGION
gcloud storage buckets update "gs://$BUCKET" --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" `
  --member="allUsers" --role="roles/storage.objectViewer"
gcloud storage buckets update "gs://$BUCKET" `
  --web-main-page-suffix="index.html"

gcloud storage cp .\index.html "gs://$BUCKET/"
gcloud storage cp .\app.js "gs://$BUCKET/" --cache-control="no-store"

# (Optional) make sure Cloud Run is invokable by anyone
gcloud run services add-iam-policy-binding player-sim-api-664678380310 `
  --member="allUsers" --role="roles/run.invoker" `
  --region=$REGION --platform=managed

Write-Host "Open your site:"
Write-Host "https://storage.googleapis.com/$BUCKET/index.html"
```

---

## 10) What you should see

- **Static site** served from GCS at  
  `https://storage.googleapis.com/player-sim-web-optimal-tea-470117-t4/index.html`
- **Frontend** code in `index.html` + `app.js` calling your **Cloud Run** API at  
  `https://player-sim-api-664678380310.us-central1.run.app`

If anything blocks you, copy the exact error text and we’ll troubleshoot quickly.
