GPN CENTRAL — FLAT ROOT REPOSITORY

Suggested repository name: gpn-app

UPLOAD EVERY FILE IN THIS PACKAGE DIRECTLY INTO THE ROOT OF THE REPOSITORY.
There are NO folders in this structure.

Root files:
- index.html             PWA home/menu
- offline.html           future Offline System index
- online-tests.html      future Online Tests index
- estore.html            future E-store index
- administration.html    future Administration index
- social.html            future Social Connect index
- contact.html           future Contact Us index
- locate-us.html         future Locate Us index
- style.css              one shared stylesheet
- app.js                 one shared JavaScript file
- manifest.webmanifest   PWA manifest
- sw.js                  service worker
- gpn-logo.jpg           local logo fallback (if available)
- gpn-icon-192.png       PWA icon
- gpn-icon-512.png       PWA icon

All seven menu buttons in index.html point to their matching root-level HTML page.
All pages share style.css. The PWA home registers sw.js.

This repository is the central collection of GPN application entry pages:
- Each system's index page can later be replaced with the real index page.
- Keep each system's own internal HTML/CSS/JS/backend logic and authentication as needed.
- If a system has many supporting files, they can be kept in its existing separate repository and linked from the matching root-level entry page. Alternatively, assets can be given unique filenames in this root repo. The root repository does not require one folder per system.
- Do not assume GitHub Pages makes HTML files private. Login protection and data authorization must be enforced by the relevant backend.

PWA installation:
- Publish the repository with GitHub Pages over HTTPS.
- Open the deployed root URL in Chrome/another supported browser.
- Tap Install if the browser offers the PWA install prompt; otherwise use browser menu > Install app / Add to Home screen.
