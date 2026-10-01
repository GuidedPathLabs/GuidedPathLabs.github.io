/**
 * ============================================================================
 * GPN CENTRAL SYSTEM — FRONTEND HELPERS
 * ============================================================================
 *
 * Shared utilities for every HTML page. Loaded after shared/config.js.
 *
 * Exposes a single global: window.GPN
 *
 * Sections:
 *   1.  Config access
 *   2.  Session (token, role, user, module)
 *   3.  API caller (POST JSON)
 *   4.  Auth failure handling (auto redirect)
 *   5.  Toast notifications
 *   6.  Escaping + sanitization
 *   7.  Date + time formatting
 *   8.  Currency + number formatting
 *   9.  DOM helpers ($, $$, on, ready)
 *   10. Modal helpers (open, close)
 *   11. Loading + button state
 *   12. Navigation guards
 *   13. Print / export helpers
 *   14. Clipboard
 *   15. URL query parsing
 *   16. Misc utilities
 *   17. Service worker registration
 *
 * Version: 1.0.1
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  var CFG = window.GPN_CONFIG;
  if (!CFG) {
    console.error('GPN: config.js not loaded before gpn.js');
    return;
  }


  /* ==========================================================================
   * 1. CONFIG ACCESS
   * ======================================================================== */

  function cfg(key, fallback) {
    return (CFG[key] !== undefined) ? CFG[key] : fallback;
  }


  /* ==========================================================================
   * 2. SESSION
   * ======================================================================== */

  var Session = {

    getToken:  function () { return localStorage.getItem(CFG.STORAGE_KEY) || ''; },
    getRole:   function () { return String(localStorage.getItem(CFG.STORAGE_ROLE) || '').toUpperCase(); },
    getUser:   function () { return localStorage.getItem(CFG.STORAGE_USER) || ''; },
    getName:   function () { return localStorage.getItem(CFG.STORAGE_NAME) || ''; },
    getModule: function () { return localStorage.getItem(CFG.STORAGE_MODULE) || ''; },

    isLoggedIn: function () {
      return !!Session.getToken() && !!Session.getRole();
    },

    isAdmin:   function () { return Session.getRole() === 'ADMIN'; },
    isStudent: function () { return Session.getRole() === 'STUDENT'; },
    isParent:  function () { return Session.getRole() === 'PARENT'; },

    save: function (data) {
      if (!data) return;
      if (data.token)  localStorage.setItem(CFG.STORAGE_KEY, data.token);
      if (data.role)   localStorage.setItem(CFG.STORAGE_ROLE, String(data.role).toUpperCase());
      if (data.userId) localStorage.setItem(CFG.STORAGE_USER, data.userId);
      if (data.name)   localStorage.setItem(CFG.STORAGE_NAME, data.name);
      if (data.module) localStorage.setItem(CFG.STORAGE_MODULE, data.module);
    },

    clear: function () {
      localStorage.removeItem(CFG.STORAGE_KEY);
      localStorage.removeItem(CFG.STORAGE_ROLE);
      localStorage.removeItem(CFG.STORAGE_USER);
      localStorage.removeItem(CFG.STORAGE_NAME);
      localStorage.removeItem(CFG.STORAGE_MODULE);
    },

    /** Returns the correct landing page for the current session role/module. */
    landingPage: function () {
      if (Session.isAdmin())   return CFG.PAGE_ADMIN;
      if (Session.isParent())  return CFG.PAGE_PARENT;
      if (Session.isStudent()) {
        var m = Session.getModule();
        if (m === 'ol') return CFG.PAGE_STUDENT_ONLINE;
        if (m === 'hq') return CFG.PAGE_STUDENT_OFFLINE;
        if (m === 'mp') return CFG.PAGE_STUDENT_MASTER;
        return CFG.PAGE_STUDENT_ONLINE;
      }
      return CFG.PAGE_LOGIN;
    }
  };


  /* ==========================================================================
   * 3. API CALLER
   * ======================================================================== */

  var __authFailHandler = null;

  function setAuthFailHandler(fn) {
    __authFailHandler = fn;
  }

  function isAuthError(code) {
    return ['NO_TOKEN', 'INVALID_TOKEN', 'TOKEN_REVOKED', 'TOKEN_EXPIRED', 'ACCOUNT_INACTIVE', 'USER_NOT_FOUND']
      .indexOf(code) >= 0;
  }

  /**
   * Calls the backend. Always returns a promise resolving to the JSON envelope.
   * Auto-includes the session token if present. Auto-redirects on auth failure.
   */
  function api(action, payload, options) {
    options = options || {};

    var body = Object.assign({ action: action }, payload || {});
    var token = Session.getToken();
    if (token && !options.skipToken) body.token = token;

    return fetch(CFG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow'
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json && json.ok === false && isAuthError(json.error)) {
        if (typeof __authFailHandler === 'function') {
          __authFailHandler(json);
        } else {
          Session.clear();
          Toast.show('Session expired. Please sign in again.', 'error');
          setTimeout(function () { window.location.href = CFG.PAGE_LOGIN; }, 1200);
        }
      }
      return json;
    })
    .catch(function (err) {
      console.error('API error:', action, err);
      return { ok: false, error: 'NETWORK', message: 'Network error. Check your connection.' };
    });
  }

  /**
   * Convenience: api() with a data-or-fail pattern. Resolves to json.data on
   * success, or throws on failure. Use when you want to chain operations.
   */
  function apiData(action, payload) {
    return api(action, payload).then(function (json) {
      if (json && json.ok) return json.data || {};
      throw json || { ok: false, error: 'UNKNOWN', message: 'Unknown error' };
    });
  }


  /* ==========================================================================
   * 4. HUMAN-READABLE ERROR MESSAGES
   * ======================================================================== */

  var ERROR_MESSAGES = {
    NETWORK:             'Cannot reach server. Check your connection.',
    BAD_RESPONSE:        'Server returned an unexpected response.',
    NO_TOKEN:            'Please sign in to continue.',
    INVALID_TOKEN:       'Your session is invalid. Please sign in again.',
    TOKEN_EXPIRED:       'Your session expired. Please sign in again.',
    TOKEN_REVOKED:       'Your session was ended. Please sign in again.',
    ACCOUNT_INACTIVE:    'Your account is not active. Contact admin.',
    RATE_LIMITED:        'Too many attempts. Please wait a few minutes.',
    INVALID_CREDENTIALS: 'Invalid ID or password.',
    USER_NOT_FOUND:      'User record not found.',
    FORBIDDEN:           'You do not have permission for this action.',
    UNKNOWN_ACTION:      'This action is not available.',
    SERVER_ERROR:        'Something went wrong on the server.',
    INVALID_INPUT:       'Some fields are invalid. Please review.',
    MISSING_FIELDS:      'Some required fields are missing.',
    NOT_FOUND:           'Record not found.',
    DUPLICATE_ID:        'This ID is already in use.'
  };

  function friendlyError(json) {
    if (!json) return 'Something went wrong.';
    if (ERROR_MESSAGES[json.error]) return ERROR_MESSAGES[json.error];
    if (json.message) return String(json.message);
    return 'Request failed. Please try again.';
  }


  /* ==========================================================================
   * 5. TOAST
   * ======================================================================== */

  var Toast = (function () {
    var wrap = null;

    function ensureWrap() {
      if (wrap) return wrap;
      wrap = document.getElementById('gpn-toast-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'gpn-toast-wrap';
        wrap.className = 'gpn-toast-wrap';
        document.body.appendChild(wrap);
      }
      return wrap;
    }

    function show(message, kind) {
      kind = kind || 'info';
      var el = document.createElement('div');
      el.className = 'gpn-toast gpn-toast-' + kind;
      el.textContent = String(message == null ? '' : message);
      ensureWrap().appendChild(el);

      setTimeout(function () {
        el.classList.add('gpn-toast-out');
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
      }, CFG.TOAST_DURATION_MS || 4500);
    }

    return {
      show:  show,
      ok:    function (m) { show(m, 'ok'); },
      error: function (m) { show(m, 'error'); },
      info:  function (m) { show(m, 'info'); },
      warn:  function (m) { show(m, 'warn'); }
    };
  })();


  /* ==========================================================================
   * 6. ESCAPING
   * ======================================================================== */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escAttr(s) { return esc(s); }


  /* ==========================================================================
   * 7. DATE + TIME
   * ======================================================================== */

  var MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function parseDate(v) {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    var s = String(v).trim();
    if (!s) return null;

    /* ISO date or datetime */
    var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));

    /* Display format: 08 Apr 2026 */
    var mo = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    var leg = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
    if (leg && mo[leg[2]] !== undefined) return new Date(parseInt(leg[3], 10), mo[leg[2]], parseInt(leg[1], 10));

    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Returns "08 Apr 2026" or "—" if invalid. */
  function formatDate(v) {
    var d = parseDate(v);
    if (!d) return '—';
    return String(d.getDate()).padStart(2, '0') + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
  }

  /** Returns "08 Apr 2026 · 15:30" or "—". */
  function formatDateTime(v) {
    var d = parseDate(v);
    if (!d) return '—';
    var datePart = String(d.getDate()).padStart(2, '0') + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
    var h = d.getHours(), mi = d.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return datePart + ' · ' + h12 + ':' + String(mi).padStart(2, '0') + ' ' + ampm;
  }

  /** Returns "15:30" or "". */
  function formatTime(v) {
    if (!v) return '';
    var s = String(v).trim();
    var m = s.match(/^(\d{1,2}):(\d{2})/);
    if (m) return String(m[1]).padStart(2, '0') + ':' + m[2];
    var d = parseDate(v);
    if (!d) return '';
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /** Returns ISO date "2026-04-08" or "". */
  function formatDateISO(v) {
    var d = parseDate(v);
    if (!d) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function todayISO() {
    return formatDateISO(new Date());
  }

  function isValidDate(v) { return parseDate(v) !== null; }

  /** Returns "in 3 days", "2 days ago", "today". */
  function relativeDays(v) {
    var d = parseDate(v);
    if (!d) return '';
    var t = new Date(); t.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    var diff = Math.round((d.getTime() - t.getTime()) / 86400000);
    if (diff === 0) return 'today';
    if (diff === 1) return 'tomorrow';
    if (diff === -1) return 'yesterday';
    if (diff > 0) return 'in ' + diff + ' days';
    return Math.abs(diff) + ' days ago';
  }


  /* ==========================================================================
   * 8. CURRENCY + NUMBERS
   * ======================================================================== */

  function formatCurrency(v) {
    var n = Number(v);
    if (isNaN(n)) n = 0;
    return (CFG.CURRENCY_SYMBOL || '₹') + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  function formatNumber(v, decimals) {
    var n = Number(v);
    if (isNaN(n)) n = 0;
    if (decimals === undefined) return n.toLocaleString('en-IN');
    return n.toFixed(decimals);
  }

  function formatPercent(v) {
    var n = Number(v);
    if (isNaN(n)) n = 0;
    return (Math.round(n * 10) / 10) + '%';
  }


  /* ==========================================================================
   * 9. DOM HELPERS
   * ======================================================================== */

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function byId(id) { return document.getElementById(id); }

  function on(el, evt, fn) {
    if (!el) return;
    el.addEventListener(evt, fn);
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') e.className = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
          e.addEventListener(k.substring(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] !== null && attrs[k] !== undefined) {
          e.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c === null || c === undefined) return;
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
      });
    }
    return e;
  }

  function clear(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  }

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }


  /* ==========================================================================
   * 10. MODAL HELPERS
   * ======================================================================== */

  var Modal = {
    open: function (id) {
      var m = byId(id);
      if (!m) return;
      m.hidden = false;
      m.setAttribute('aria-hidden', 'false');
      var first = m.querySelector('input,select,textarea,button');
      if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 30);
    },

    close: function (id) {
      var m = byId(id);
      if (!m) return;
      m.hidden = true;
      m.setAttribute('aria-hidden', 'true');
    },

    /** Close on backdrop click and Escape key. Wire once per modal id. */
    wire: function (id) {
      var m = byId(id);
      if (!m) return;
      m.addEventListener('click', function (e) {
        if (e.target === m) Modal.close(id);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !m.hidden) Modal.close(id);
      });
    }
  };


  /* ==========================================================================
   * 11. LOADING + BUTTON STATE
   * ======================================================================== */

  function setLoading(btn, loading, idleLabel) {
    if (!btn) return;
    if (loading) {
      if (!btn.dataset.idleLabel) btn.dataset.idleLabel = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="gpn-spinner"></span> ' + (idleLabel || 'Please wait…');
    } else {
      btn.disabled = false;
      if (btn.dataset.idleLabel) {
        btn.innerHTML = btn.dataset.idleLabel;
        delete btn.dataset.idleLabel;
      }
    }
  }

  function showContainerLoading(container, message) {
    if (!container) return;
    container.innerHTML = '<div class="gpn-loading"><span class="gpn-spinner"></span> ' +
      esc(message || 'Loading…') + '</div>';
  }

  function showContainerError(container, message) {
    if (!container) return;
    container.innerHTML = '<div class="gpn-error-state">' + esc(message || 'Something went wrong') + '</div>';
  }

  function showContainerEmpty(container, message) {
    if (!container) return;
    container.innerHTML = '<div class="gpn-empty-state">' + esc(message || 'Nothing here yet') + '</div>';
  }


  /* ==========================================================================
   * 12. NAVIGATION GUARDS
   * ======================================================================== */

  var Guard = {

    /**
     * Ensures the current session matches one of the allowed roles.
     * Redirects to login if not. Redirects to landing page if logged in but
     * wrong role. Returns true if the caller should proceed with rendering.
     */
    requireRoles: function (allowed) {
      if (!Session.isLoggedIn()) {
        window.location.href = CFG.PAGE_LOGIN;
        return false;
      }
      var role = Session.getRole();
      if (allowed && allowed.length && allowed.indexOf(role) < 0) {
        window.location.href = Session.landingPage();
        return false;
      }
      return true;
    },

    requireAdmin: function () { return Guard.requireRoles(['ADMIN']); },
    requireStudent: function () { return Guard.requireRoles(['STUDENT']); },
    requireParent: function () { return Guard.requireRoles(['PARENT']); },

    /** Send already-logged-in users to their landing page. Used on login page. */
    redirectIfLoggedIn: function () {
      if (Session.isLoggedIn()) {
        window.location.href = Session.landingPage();
        return true;
      }
      return false;
    },

    logout: function () {
      api('auth.logout').then(function () {
        Session.clear();
        window.location.href = CFG.PAGE_LOGIN;
      }).catch(function () {
        Session.clear();
        window.location.href = CFG.PAGE_LOGIN;
      });
    }
  };


  /* ==========================================================================
   * 13. PRINT / EXPORT HELPERS
   * ======================================================================== */

  var Export = {

    /**
     * Opens the print preview page in a new tab with HTML content to be
     * printed. The preview page reads from sessionStorage and calls
     * window.print() automatically.
     */
    printHTML: function (htmlString, title) {
      try {
        sessionStorage.setItem('gpn_print_html', htmlString);
        sessionStorage.setItem('gpn_print_title', title || 'Print');
      } catch (e) {
        Toast.error('Could not open print preview.');
        return;
      }
      var w = window.open(CFG_PRINT_PAGE(), '_blank');
      if (!w) Toast.error('Please allow popups to print.');
    },

    /**
     * Triggers a browser download of a CSV string.
     */
    downloadCSV: function (csvString, filename) {
      var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename || ('export-' + todayISO() + '.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    /**
     * Copy plain text to clipboard with fallback for older browsers.
     */
    copy: function (text, okMessage) {
      text = String(text == null ? '' : text);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          Toast.ok(okMessage || 'Copied');
        }).catch(function () {
          Export._fallbackCopy(text, okMessage);
        });
      } else {
        Export._fallbackCopy(text, okMessage);
      }
    },

    _fallbackCopy: function (text, okMessage) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        Toast.ok(okMessage || 'Copied');
      } catch (e) {
        Toast.error('Copy failed');
      }
      document.body.removeChild(ta);
    }
  };

  function CFG_PRINT_PAGE() {
    return 'print-preview.html';
  }


  /* ==========================================================================
   * 14. URL QUERY PARSING
   * ======================================================================== */

  function query() {
    var out = {};
    var s = window.location.search;
    if (!s) return out;
    s = s.replace(/^\?/, '');
    s.split('&').forEach(function (pair) {
      if (!pair) return;
      var parts = pair.split('=');
      var k = decodeURIComponent(parts[0] || '');
      var v = decodeURIComponent(parts.slice(1).join('=') || '');
      if (k) out[k] = v;
    });
    return out;
  }


  /* ==========================================================================
   * 15. SAFE URLS
   * ======================================================================== */

  /** Builds a full R2 view URL from a relative path stored in a sheet. */
  function viewURL(path) {
    if (!path) return '';
    var p = String(path).replace(/^\/+/, '');
    return (CFG.R2 && CFG.R2.VIEW_BASE ? CFG.R2.VIEW_BASE : '') + p;
  }

  /** Builds a full R2 download URL from a relative path. */
  function downloadURL(path) {
    if (!path) return '';
    var p = String(path).replace(/^\/+/, '');
    return (CFG.R2 && CFG.R2.DOWNLOAD_BASE ? CFG.R2.DOWNLOAD_BASE : '') + p;
  }

  /** Builds a full R2 asset URL (logo, banner). */
  function assetURL(path) {
    if (!path) return '';
    var p = String(path).replace(/^\/+/, '');
    return (CFG.R2 && CFG.R2.ASSETS_BASE ? CFG.R2.ASSETS_BASE : '') + p;
  }

  /** Returns the WhatsApp prefilled URL for a product. */
  function buyURL(name, id) {
    var text = 'Hi GPN! I want to buy: ' + String(name || '') + (id ? ' (' + id + ')' : '');
    return CFG.WHATSAPP + '?text=' + encodeURIComponent(text);
  }

  /** Validates a URL starts with https:// */
  function isHttpsURL(s) { return /^https:\/\/.+/.test(String(s || '').trim()); }


  /* ==========================================================================
   * 16. MISC
   * ======================================================================== */

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 250);
    };
  }

  function throttle(fn, wait) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last < (wait || 250)) return;
      last = now;
      fn.apply(this, arguments);
    };
  }

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function safeJSON(s, fb) { try { return JSON.parse(s); } catch (e) { return fb; } }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }

  function todayStr() { return todayISO(); }


  /* ==========================================================================
   * EXPORT
   * ======================================================================== */

  window.GPN = {
    cfg:      cfg,

    Session:  Session,
    Guard:    Guard,
    Toast:    Toast,
    Modal:    Modal,
    Export:   Export,

    api:      api,
    apiData:  apiData,
    friendlyError: friendlyError,
    isAuthError:   isAuthError,
    setAuthFailHandler: setAuthFailHandler,

    esc:      esc,
    escAttr:  escAttr,

    parseDate:       parseDate,
    formatDate:      formatDate,
    formatDateTime:  formatDateTime,
    formatTime:      formatTime,
    formatDateISO:   formatDateISO,
    isValidDate:     isValidDate,
    relativeDays:    relativeDays,
    todayISO:        todayISO,

    formatCurrency:  formatCurrency,
    formatNumber:    formatNumber,
    formatPercent:   formatPercent,

    $:        $,
    $$:       $$,
    byId:     byId,
    on:       on,
    ready:    ready,
    el:       el,
    clear:    clear,
    show:     show,
    hide:     hide,

    setLoading:            setLoading,
    showContainerLoading:  showContainerLoading,
    showContainerError:    showContainerError,
    showContainerEmpty:    showContainerEmpty,

    query:    query,

    viewURL:      viewURL,
    downloadURL:  downloadURL,
    assetURL:     assetURL,
    buyURL:       buyURL,
    isHttpsURL:   isHttpsURL,

    debounce:  debounce,
    throttle:  throttle,
    deepClone: deepClone,
    safeJSON:  safeJSON,
    uuid:      uuid,
    todayStr:  todayStr
  };


  /* ==========================================================================
   * 17. SERVICE WORKER REGISTRATION
   * ==========================================================================
   * Registers sw.js on window load. Safe to call on every page — the browser
   * silently no-ops if the SW is already registered with the same scope.
   *
   * Silent on failure — the app works fine without a service worker; it just
   * doesn't get offline caching or PWA install prompt.
   * ======================================================================== */

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('sw.js', { scope: './' })
        .catch(function (err) {
          /* Silent — SW is a progressive enhancement, not a requirement */
          if (window.console && console.warn) {
            console.warn('GPN: Service worker registration failed:', err);
          }
        });
    });
  }

})(window, document);