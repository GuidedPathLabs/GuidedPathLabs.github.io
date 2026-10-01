/**
 * ============================================================================
 * GPN CENTRAL SYSTEM — FRONTEND CONFIGURATION
 * ============================================================================
 *
 * Public configuration loaded by every HTML page. Safe to commit to a public
 * repository — contains no secrets, no sheet IDs, no credentials.
 *
 * Every page reads from window.GPN_CONFIG.
 *
 * Version: 1.0.0
 * ============================================================================
 */

(function () {
  'use strict';

  window.GPN_CONFIG = {

    /* ------------------------------------------------------------------
     * Backend
     * ---------------------------------------------------------------- */
    API_URL: 'https://script.google.com/macros/s/AKfycbx5USAQD6a8jqMQK7T8PVybtVRf9N_AyHlHYrXQRKr2YetUuGzBcF12_3gte6NT_zdh/exec',

    /* Frontend version — bump when deploying new static assets so
     * browsers fetch fresh CSS/JS (we append ?v=<version> in includes). */
    VERSION: '1.0.0',

    /* ------------------------------------------------------------------
     * Identity
     * ---------------------------------------------------------------- */
    APP_NAME:       'GPN Central System',
    APP_SHORT_NAME: 'GPN',

    /* ------------------------------------------------------------------
     * Contact / support
     * ---------------------------------------------------------------- */
    WEBSITE:          'https://guidedpathnoida.in',
    WHATSAPP:         'https://wa.me/guidedpathnoida',
    LOCATE_URL:       'https://www.guidedpathnoida.in/locate',

    CONTACT_EMAIL:    'admin@guidedpathnoida.in',
    SUPPORT_EMAIL:    'support@guidedpathnoida.in',
    REPORT_EMAIL:     'report@guidedpathnoida.in',
    ACADEMIC_EMAIL:   'academic@guidedpathnoida.in',
    ADMISSIONS_EMAIL: 'admissions@guidedpathnoida.in',

    PHONES: [
      { name: 'Dr. Abhishek Tripathi', role: 'Founder & Academic Director', number: '+91 9599411511' },
      { name: 'Mrs. Rishu Tripathi',   role: 'Co-founder & Primary Head',   number: '+91 8448907904' }
    ],

    /* ------------------------------------------------------------------
     * CDN bases (used by frontend to build file URLs)
     * ---------------------------------------------------------------- */
    R2: {
      VIEW_BASE:     'https://files.guidedpathnoida.in/',
      DOWNLOAD_BASE: 'https://downloads.guidedpathnoida.in/',
      ASSETS_BASE:   'https://assets.guidedpathnoida.in/'
    },

    /* ------------------------------------------------------------------
     * Session
     * ---------------------------------------------------------------- */
    STORAGE_KEY:   'gpn_token',
    STORAGE_ROLE:  'gpn_role',
    STORAGE_USER:  'gpn_user',
    STORAGE_NAME:  'gpn_name',
    STORAGE_MODULE:'gpn_module',

    /* Redirects after login (relative filenames only) */
    PAGE_LOGIN:           'login.html',
    PAGE_ADMIN:           'admin.html',
    PAGE_STUDENT_ONLINE:  'student-online.html',
    PAGE_STUDENT_OFFLINE: 'student-offline.html',
    PAGE_STUDENT_MASTER:  'student-master.html',
    PAGE_PARENT:          'parent.html',
    PAGE_ESTORE:          'estore.html',

    /* ------------------------------------------------------------------
     * Classroom enum — mirrors backend CLASSES for dropdowns
     * ---------------------------------------------------------------- */
    CLASSES: [
      'Nursery', 'LKG', 'UKG',
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
      'Class 11 Science', 'Class 11 Commerce',
      'Class 12 Science', 'Class 12 Commerce',
      'All Classes'
    ],

    BOARDS: ['CBSE', 'ICSE', 'State Board', 'UP Board', 'Other'],

    /* ------------------------------------------------------------------
     * Rate limit hints shown to users (actual enforcement server-side)
     * ---------------------------------------------------------------- */
    RATE_LIMIT_INFO: {
      USER_MAX_ATTEMPTS: 5,
      USER_LOCK_MINUTES: 15
    },

    /* ------------------------------------------------------------------
     * UI
     * ---------------------------------------------------------------- */
    CURRENCY_SYMBOL: '₹',
    TOAST_DURATION_MS: 4500
  };

})();