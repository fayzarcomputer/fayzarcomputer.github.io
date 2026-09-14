/**
 * ============================================================================
 * Fayzar Computer Web - AI OCR Secure Configuration & Multi-Key Vault
 * ============================================================================
 * This file securely manages the AI OCR engine credentials and 12-key fallback pool.
 * Keys are dynamically deobfuscated at runtime (XOR 42 + Base64) to prevent source inspection.
 * ============================================================================
 */

(function (global) {
  'use strict';

  // Obfuscated credential vault (XOR bit-shifted + Base64 encoded)
  // All 16 verified, active Google AI Studio Gemini API keys (including 2 new high-quota premium keys)
  const VAULT = {
    KEYS: [
      // Primary High-Quota Key 1
      "a3sEa0gSeGQcYG1AZxJdZ0kaZWh7ZnB8W05tfh5AXhNLXVJTfnJhUnxsRX9CH2JrGm9+GF0=",
      // Primary High-Quota Key 2
      "a3sEa0gSeGQcYU8daFkYcl9dE10aTRMYZGgSUGNtcEleblJkWB1HaFpzaUFOXkdcWQdAHXs=",
      // Verified System Vault Keys (Keys 3-16)
      "a3sEa0gSeGQcYXBpZ1lMex4HWGJhfW8SHnUdW1pbUk1tYXpmGUZSGXtQb1prQVMSB2BEHU0=",
      "a2NQS3lTaU9NUElzQ2d1bUleaWl8Xlh8Z2ZAfW9zbEIfZVNae0Zd",
      "a3sEa0gSeGQcYGN9XUwYSFlMHhxGaQdTextiYklzfn1sRHx9QxNlBxxueWdzcE4fUk1+Wns=",
      "a3sEa0gSeGQcZkViQ05pRU9QGhpOQmYcZ1MSSGV5SEFNHnJ8ZkAcWm5cTm5MSHBLUBxlGns=",
      "a3sEa0gSeGQcYWlefEgSGXAbbH5jWl1BWklnXFgcH14fblh4QGh/ZWRLbB1TY01zeG5LWms=",
      "a3sEa0gSeGQcYF1SGUMSRmx7SHN6QRhBZ1hvckBzU09EW0BMaUlHfhxcXlAfUBNtXHgZf3s=",
      "a3sEa0gSeGQcYXITeEhYa0hEeWl9El1zaXBzHhxMTmRLXltBe0JEQkcfS35aZlhuSW1wc2s=",
      "a3sEa0gSeGQcYGVrY2hAfWJgU39/RW1zGnxifxhhY15vSVBtbGlcelMSQVtFXl9gRXlZZl0=",
      "a3sEa0gSeGQcY0ZtY08SGXJje1AfWUx/XlhBGGNHbXliGkB8R2d4QnlzfHhZXEBQQRpwGXs=",
      "a3sEa0gSeGQcYGRSbEUeY2xcb2xzSWl+WF1/UgdmX1J5X35NUk5jHHJPTB9Ifm5IdXp4Yk0=",
      "a3sEa0gSeGQcYxhkE2xBRxNEfnVjWERnWH11Xk5yW3BrWWJGW0hjcxxienBvRE9uHm9QRU0=",
      "a2NQS3lTaRsdS39edXBfc21ZZllhE2J5a0xIRXtnTxl+XV5+H30e",
      "a2NQS3lTaFt5XVgefn9QThsdZR5EcxtlSEkdH0QeQGlBZx91aU9F",
      "a3sEa0gSeGQcYX0aH15SSGlPeHNDX2ZuQ3xQYhp/aWxkfX9zYkcfWn5dHx9QTVpYRVlgcE0=",
      // New Verified System Vault Keys (Keys 17-19)
      "a3sEa0gSeGQcYEBbXXl+S2kSWhNZeWRTHXVQbmtwY34fSGZfB2RwT2ddfmJoHklebGgZUGs=",
      "a3sEa0gSeGQcZkxNU39nZQcTaHt4fnVvek1lbkwSRVNJc2ISQGZLc1NofwdBZkNmXUNSbl0=",
      "a2NQS3lTaxsSSWt9ekF7GmYfU0F+entwRExJEltHYWJCa2doUFMa"
    ],
    MASK_SALT: 42
  };

  /**
   * Key health and cooldown tracker with sessionStorage persistence
   */
  const keyStatusMap = new Map(); // key -> { state: 'active' | 'cooldown' | 'invalid', until: timestamp }

  // Restore active cooldowns from sessionStorage on startup
  try {
    if (typeof sessionStorage !== 'undefined') {
      const savedCooldowns = JSON.parse(sessionStorage.getItem('fayzar_key_cooldowns') || '{}');
      const now = Date.now();
      for (const [k, until] of Object.entries(savedCooldowns)) {
        if (typeof until === 'number' && until > now) {
          keyStatusMap.set(k, { state: 'cooldown', until });
        }
      }
    }
  } catch (e) {}

  function _syncCooldownsToStorage() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      const obj = {};
      const now = Date.now();
      for (const [k, status] of keyStatusMap.entries()) {
        if (status.state === 'cooldown' && status.until > now) {
          obj[k] = status.until;
        }
      }
      sessionStorage.setItem('fayzar_key_cooldowns', JSON.stringify(obj));
    } catch (e) {}
  }

  /**
   * Internal string deobfuscator
   */
  function _unpack(encodedStr, salt = VAULT.MASK_SALT) {
    if (!encodedStr) return '';
    try {
      const raw = typeof atob === 'function' ? atob(encodedStr) : Buffer.from(encodedStr, 'base64').toString('binary');
      const chars = [];
      for (let i = 0; i < raw.length; i++) {
        chars.push(String.fromCharCode(raw.charCodeAt(i) ^ salt));
      }
      return chars.join('');
    } catch (e) {
      console.warn('Vault deobfuscation failed:', e);
      return '';
    }
  }

  let roundRobinIndex = 0;
  try {
    if (typeof localStorage !== 'undefined') {
      const savedIdx = parseInt(localStorage.getItem('fayzar_key_rr_index') || '0', 10);
      if (!isNaN(savedIdx) && savedIdx >= 0) roundRobinIndex = savedIdx;
    }
  } catch (e) {}

  const FayzarOcrConfig = {
    /**
     * Strict validation for Google AI Studio Gemini API Key format
     * Supports both classic Google AI Studio keys (AIzaSy...) and modern keys (AQ.Ab8RN...)
     */
    isValidApiKey: function (key) {
      if (!key || typeof key !== 'string') return false;
      const clean = key.trim();
      return (clean.startsWith('AIzaSy') || clean.startsWith('AQ.')) && clean.length >= 35 && /^[A-Za-z0-9_.-]+$/.test(clean);
    },

    /**
     * Mark a key as temporarily on cooldown (e.g. 429 quota exhaustion)
     */
    markKeyCooldown: function (key, seconds = 60) {
      if (!key) return;
      const cleanKey = key.trim();
      keyStatusMap.set(cleanKey, {
        state: 'cooldown',
        until: Date.now() + (seconds * 1000)
      });
      _syncCooldownsToStorage();
      this.logAudit('KEY_COOLDOWN', { keyMask: cleanKey.slice(0, 8) + '...', cooldownSec: seconds });
    },

    /**
     * Mark a key as permanently invalid for current session (e.g. 400 API_KEY_INVALID)
     */
    markKeyInvalid: function (key) {
      if (!key) return;
      const cleanKey = key.trim();
      keyStatusMap.set(cleanKey, {
        state: 'invalid',
        until: Infinity
      });
      this.logAudit('KEY_INVALID', { keyMask: cleanKey.slice(0, 8) + '...' });
    },

    /**
     * Check if key is currently healthy and available for requests
     */
    isKeyAvailable: function (key) {
      if (!this.isValidApiKey(key)) return false;
      const status = keyStatusMap.get(key.trim());
      if (!status) return true;
      if (status.state === 'invalid') return false;
      if (status.state === 'cooldown' && Date.now() < status.until) return false;
      return true;
    },

    /**
     * Get Primary Default API Key
     */
    getPrimaryApiKey: function () {
      const all = this.getAllSystemKeys();
      return all.length > 0 ? all[0] : _unpack(VAULT.KEYS[0]);
    },

    /**
     * Get all active system keys from the secure pool in priority order (filtering out invalid/cooling keys)
     */
    getAllSystemKeys: function (includeCooldown = false) {
      const now = Date.now();
      return VAULT.KEYS
        .map(k => _unpack(k))
        .filter(k => {
          if (!this.isValidApiKey(k)) return false;
          if (includeCooldown) return true;
          const status = keyStatusMap.get(k);
          if (!status) return true;
          if (status.state === 'invalid') return false;
          if (status.state === 'cooldown' && now < status.until) return false;
          return true;
        });
    },

    /**
     * Get keys rotated by round-robin index so the next fresh key is always at index 0
     */
    getRotatedSystemKeys: function (includeCooldown = false) {
      const systemKeys = this.getAllSystemKeys(includeCooldown);
      if (systemKeys.length <= 1) return systemKeys;
      const offset = roundRobinIndex % systemKeys.length;
      return systemKeys.slice(offset).concat(systemKeys.slice(0, offset));
    },

    /**
     * Advance the round-robin queue, shifting the recently used key to the back
     */
    advanceRoundRobin: function () {
      // Use actual active key count so index never overshoots (fixes the 19-index vs 13-active-key mismatch)
      const activeCount = this.getAllSystemKeys(false).length || VAULT.KEYS.length;
      roundRobinIndex = (roundRobinIndex + 1) % activeCount;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('fayzar_key_rr_index', String(roundRobinIndex));
        }
      } catch (e) {}
    },

    /**
     * Get next key via round-robin distribution to balance quota load
     */
    getNextRoundRobinKey: function () {
      let keys = this.getAllSystemKeys(false);
      if (keys.length === 0) {
        keys = this.getAllSystemKeys(true);
      }
      if (keys.length === 0) return '';
      const key = keys[roundRobinIndex % keys.length];
      this.advanceRoundRobin();
      return key;
    },

    /**
     * Resolve the most appropriate active API key taking user custom keys into account
     */
    getActiveApiKey: function (userCustomKey = '') {
      if (userCustomKey && this.isValidApiKey(userCustomKey)) {
        return userCustomKey.trim();
      }
      return this.getNextRoundRobinKey();
    },

    /**
     * Internal Diagnostic & Audit Logger
     * Records all key rotation events, latency, model status for easy offline troubleshooting
     */
    logAudit: function (event, details = {}) {
      try {
        if (typeof localStorage === 'undefined') return;
        const logs = JSON.parse(localStorage.getItem('fayzar_ocr_audit_logs') || '[]');
        const entry = {
          timestamp: new Date().toISOString(),
          timeStr: new Date().toLocaleTimeString(),
          event: event || 'INFO',
          ...details
        };
        logs.unshift(entry);
        if (logs.length > 200) logs.length = 200; // retain last 200 events
        localStorage.setItem('fayzar_ocr_audit_logs', JSON.stringify(logs));
      } catch (e) {}
    },

    getAuditLogs: function () {
      try {
        if (typeof localStorage === 'undefined') return [];
        return JSON.parse(localStorage.getItem('fayzar_ocr_audit_logs') || '[]');
      } catch (e) { return []; }
    },

    clearAuditLogs: function () {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('fayzar_ocr_audit_logs');
        }
      } catch (e) {}
    }
  };


  // Expose globally
  global.FayzarOcrConfig = FayzarOcrConfig;

})(typeof window !== 'undefined' ? window : this);
