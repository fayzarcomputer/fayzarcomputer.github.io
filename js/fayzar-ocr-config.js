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
      "a3sEa0gSeGQcYX0aH15SSGlPeHNDX2ZuQ3xQYhp/aWxkfX9zYkcfWn5dHx9QTVpYRVlgcE0="
    ],
    MASK_SALT: 42
  };

  /**
   * Key health and cooldown tracker
   */
  const keyStatusMap = new Map(); // key -> { state: 'active' | 'cooldown' | 'invalid', until: timestamp }

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
      keyStatusMap.set(key.trim(), {
        state: 'cooldown',
        until: Date.now() + (seconds * 1000)
      });
    },

    /**
     * Mark a key as permanently invalid for current session (e.g. 400 API_KEY_INVALID)
     */
    markKeyInvalid: function (key) {
      if (!key) return;
      keyStatusMap.set(key.trim(), {
        state: 'invalid',
        until: Infinity
      });
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
     * Get next key via round-robin distribution to balance quota load
     */
    getNextRoundRobinKey: function () {
      let keys = this.getAllSystemKeys(false);
      if (keys.length === 0) {
        // If all are cooling down, fall back to any valid system key
        keys = this.getAllSystemKeys(true);
      }
      if (keys.length === 0) return '';
      const key = keys[roundRobinIndex % keys.length];
      roundRobinIndex = (roundRobinIndex + 1) % keys.length;
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
    }
  };


  // Expose globally
  global.FayzarOcrConfig = FayzarOcrConfig;

})(typeof window !== 'undefined' ? window : this);
