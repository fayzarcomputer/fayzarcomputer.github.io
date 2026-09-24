/**
 * pdf-ocr-engine.js — Tesseract.js OCR Wrapper
 * বাংলা ও ইংরেজি টেক্সট শনাক্তকরণ
 */

'use strict';

const OCREngine = (() => {
  const isToolsDir = location.pathname.includes('/tools/');
  const TESSDATA_PATH = isToolsDir ? '../libs/tessdata/' : 'libs/tessdata/';
  let workers = {};
  let isReady = { ben: false, eng: false };

  async function loadTesseract() {
    if (window.Tesseract) return window.Tesseract;
    return new Promise((resolve, reject) => {
      const isTools = location.pathname.includes('/tools/');
      const s = document.createElement('script');
      s.src = (isTools ? '../libs/' : 'libs/') + 'tesseract.min.js';
      s.onload = () => resolve(window.Tesseract);
      s.onerror = () => reject(new Error('tesseract.min.js লোড করা যায়নি'));
      document.head.appendChild(s);
    });
  }

  async function getWorker(lang = 'ben+eng') {
    if (workers[lang]) return workers[lang];
    const Tesseract = await loadTesseract();
    const isTools = location.pathname.includes('/tools/');
    const baseLib = isTools ? '../libs/' : 'libs/';

    // Fully offline Tesseract v5 configuration
    const worker = await Tesseract.createWorker(lang, 1, {
      workerPath: baseLib + 'worker.min.js',
      corePath: baseLib + 'tesseract-core-lstm.wasm.js',
      langPath: baseLib + 'tessdata',
      gzip: false,
      logger: m => {
        if (m.status === 'recognizing text') {
          const pct = Math.min(99, Math.round(m.progress * 100));
          document.dispatchEvent(new CustomEvent('ocr-progress', { detail: { pct, lang } }));
        } else if (m.status === 'loading tesseract core') {
          document.dispatchEvent(new CustomEvent('ocr-progress', { detail: { pct: 25, lang } }));
        } else if (m.status === 'initializing api') {
          document.dispatchEvent(new CustomEvent('ocr-progress', { detail: { pct: 40, lang } }));
        }
      }
    });
    workers[lang] = worker;
    return worker;
  }

  /**
   * Run OCR on a canvas element
   * @param {HTMLCanvasElement} canvas
   * @param {'ben'|'eng'|'ben+eng'} lang
   * @returns {Promise<{text: string, confidence: number, blocks: Array}>}
   */
  async function recognize(canvas, lang = 'ben+eng') {
    try {
      // Use exact multi-language code (ben+eng), do NOT replace '+' with '_'
      const worker = await getWorker(lang);
      const result = await worker.recognize(canvas);
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        blocks: result.data.blocks || [],
        words: result.data.words || [],
        lines: result.data.lines || []
      };
    } catch (e) {
      console.warn('OCR multi-lang failed, trying fallback to ben:', e);
      const worker = await getWorker('ben');
      const result = await worker.recognize(canvas);
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        blocks: result.data.blocks || [],
        words: result.data.words || [],
        lines: result.data.lines || []
      };
    }
  }

  /**
   * OCR a specific PDF page
   * @param {number} pageNum
   * @param {string} lang
   * @param {function} progressCb
   */
  async function recognizePage(pageNum, lang = 'ben+eng', progressCb) {
    if (!window.PDFCore) throw new Error('PDFCore not loaded');
    const canvas = await window.PDFCore.getPageImageData(pageNum, 2.0);
    if (!canvas) throw new Error('Could not render page for OCR');
    if (progressCb) progressCb({ status: 'Rendering page...', pct: 10 });

    const result = await recognize(canvas, lang);
    if (progressCb) progressCb({ status: 'সম্পন্ন', pct: 100 });
    return result;
  }

  /**
   * OCR all pages of current document
   */
  async function recognizeAllPages(lang = 'ben+eng', progressCb) {
    const total = window.PDFCore?.getTotalPages?.() || 0;
    const results = [];
    for (let i = 1; i <= total; i++) {
      if (progressCb) progressCb({ pct: Math.round((i - 1) / total * 100), page: i, total });
      const r = await recognizePage(i, lang);
      results.push({ page: i, ...r });
    }
    return results;
  }

  // Cleanup workers
  async function terminate() {
    for (const w of Object.values(workers)) {
      try { await w.terminate(); } catch(e) {}
    }
    workers = {};
  }

  return { recognize, recognizePage, recognizeAllPages, terminate };
})();

window.OCREngine = OCREngine;
