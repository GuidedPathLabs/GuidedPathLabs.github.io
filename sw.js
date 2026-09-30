/**
 * ============================================================================
 * GPN CENTRAL SYSTEM — SERVICE WORKER
 * ============================================================================
 *
 * Provides:
 *   - Cache-first for shared static assets (config.js, gpn.js, gpn.css,
 *     manifest.json, icons) — fast repeat loads
 *   - Network-first for HTML navigations — always fresh pages, offline fallback
 *   - Network-only for API calls to external origins — never cache dynamic data
 *   - Auto-cleanup of old caches on version bump
 *   - Immediate activation (skipWaiting + clients.claim)
 *
 * Scope: ./  (root — controls all pages)
 *
 * Version: 1.0.0
 * ============================================================================
 */

var CACHE_NAME   = 'gpn-static-v1.0.0';
var CACHE_PREFIX = 'gpn-';


/* ============================================================================
   INSTALL — activate immediately, don't wait for old tabs to close
   ============================================================================ */

self.addEventListener('install', function (event) {
  self.skipWaiting();
});


/* ============================================================================
   ACTIVATE — delete old caches, take control of open tabs
   ============================================================================ */

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) {
            return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE_NAME;
          })
          .map(function (k) {
            return caches.delete(k);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});


/* ============================================================================
   FETCH — strategy per request
   ============================================================================ */

self.addEventListener('fetch', function (event) {
  var req = event.request;

  /* Only handle GET requests */
  if (req.method !== 'GET') return;

  var url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  /* Only handle same-origin requests */
  if (url.origin !== self.location.origin) return;

  /* Never intercept Google APIs or other external CDNs */
  var host = url.hostname;
  if (host.indexOf('google.com') >= 0) return;
  if (host.indexOf('googleusercontent.com') >= 0) return;

  var path = url.pathname;

  /* ------------------------------------------------------------------
   * A. HTML navigations → network-first
   *    Always serve fresh pages. Fall back to cache only if offline.
   * ---------------------------------------------------------------- */
  if (req.mode === 'navigate' || path.endsWith('.html') || path === '/' || path === '') {
    event.respondWith(
      fetch(req).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  /* ------------------------------------------------------------------
   * B. Shared static assets → cache-first
   *    Files under /shared/, /assets/, or with static extensions.
   *    First visit: fetch from network, cache it.
   *    Later visits: serve from cache. Bump VERSION to invalidate.
   * ---------------------------------------------------------------- */
  var isShared    = path.indexOf('/shared/')  >= 0;
  var isAsset     = path.indexOf('/assets/')  >= 0;
  var isStaticExt = (
    path.endsWith('.js')   ||
    path.endsWith('.css')  ||
    path.endsWith('.json') ||
    path.endsWith('.ico')  ||
    path.endsWith('.png')  ||
    path.endsWith('.jpg')  ||
    path.endsWith('.jpeg') ||
    path.endsWith('.svg')  ||
    path.endsWith('.webp') ||
    path.endsWith('.woff') ||
    path.endsWith('.woff2')
  );

  if (isShared || isAsset || isStaticExt) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;

        return fetch(req).then(function (res) {
          /* Only cache successful same-origin basic responses */
          if (!res || res.status !== 200 || res.type !== 'basic') return res;

          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) {
            c.put(req, copy);
          }).catch(function () { /* quota/error — ignore silently */ });

          return res;
        });
      }).catch(function () {
        /* Network failed and nothing cached */
        return new Response('', { status: 504, statusText: 'Offline' });
      })
    );
    return;
  }

  /* ------------------------------------------------------------------
   * C. Everything else → network-only (default)
   *    Left untouched; browser handles directly.
   * ---------------------------------------------------------------- */
});


/* ============================================================================
   MESSAGE — allow pages to trigger cache cleanup manually if needed
   ============================================================================ */

self.addEventListener('message', function (event) {
  var data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) { return k.indexOf(CACHE_PREFIX) === 0; })
            .map(function (k) { return caches.delete(k); })
        );
      })
    );
  }
});


/* ============================================================================
   END OF SERVICE WORKER
   ============================================================================
 */