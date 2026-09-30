# GPN Central System

Central web platform for **Guided Path Noida** — unified login, admin console,
student dashboards, parent view, E-store, and automation queues.

**Live**: https://repos.guidedpathnoida.in/

---

## What This Is

A static frontend (GitHub Pages) + Google Apps Script backend. No build step.
No npm. No frameworks. Vanilla HTML, CSS, and JavaScript (ES5-compatible).

The system serves:

- **Online students** — assessments, materials, wallet, results
- **Offline students** — attendance, fees, tests, batches, files
- **Master students (`mp-`)** — combined Online + Offline dashboard
- **Parents** — read-only view of their linked child
- **Admin** — full management console across all modules

---

## Repository Structure

```
/
├── CNAME                        # repos.guidedpathnoida.in
├── README.md                    # this file
├── robots.txt                   # SEO
├── manifest.json                # PWA manifest
├── sw.js                        # Service worker
│
├── index.html                   # Redirector
├── login.html                   # Unified login
├── terms.html                   # Terms / Privacy / DPDP
├── estore.html                  # Public store
├── print-preview.html           # Print helper
├── parent.html                  # Parent read-only
│
├── student-online.html
├── student-offline.html
├── student-master.html
│
├── admin.html
├── admin-online.html
├── admin-offline.html
├── admin-master.html
├── admin-automation.html
├── admin-estore.html
├── admin-reports.html
├── admin-settings.html
│
├── shared/
│   ├── config.js                # Public config (window.GPN_CONFIG)
│   ├── gpn.js                   # Shared utilities (window.GPN)
│   └── gpn.css                  # Master stylesheet
│
└── assets/
    ├── icons/                   # favicon.ico + 4 PNG icons
    ├── banners/                 # (reserved)
    └── products/                # (reserved)
```

---

## Backend

Backend lives in a separate Google Apps Script project (not in this repo):

- **6 files**: `config.gs`, `shared.gs`, `online.gs`, `offline.gs`, `automation.gs`, `estore.gs`
- **5 Google Sheets**: Online · Offline · Master · Automation · E-store
- **Web App URL**: set in `shared/config.js` → `GPN_CONFIG.API_URL`

---

## User IDs

| Prefix | Type | Example |
|---|---|---|
| `ol-` | Online student | `ol-arnav042` |
| `hq-` | Offline student | `hq-priya108` |
| `mp-` | Master student | `mp-rahul001` |
| `pr-` | Parent | `pr-rajesh001` |
| `U-`  | Admin | `U-0001` |

Default password for students and parents = phone digits.
Admin must change password on first login.

---

## Local Development

Not applicable — this is a static site served by GitHub Pages.

To test locally, open any `.html` in a browser. API calls will target the
deployed Apps Script Web App.

---

## Deployment

1. Commit changes to this repo — GitHub Pages rebuilds in 1–2 minutes.
2. To update the backend, open the Apps Script project →
   **Deploy → Manage deployments → pencil icon → New version → Deploy**.
   Never use "New deployment" — that changes the URL.

---

## Versioning

Each file has a version header (e.g. `Version: 1.0.2`). When editing a shared
file in `shared/`, bump the version in the header and update the `?v=` query
string in every HTML page that includes it.

---

## License

Proprietary — Guided Path Noida.