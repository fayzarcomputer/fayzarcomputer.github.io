/**
 * pdf-font-manager.js — Font Manager for PDF Editor
 * বাংলা ও ইংরেজি ফন্ট লোড ও রেজিস্ট্রেশন
 */

'use strict';

const FontManager = (() => {
  const isToolsDir = location.pathname.includes('/tools/');
  const FONTS_BASE = isToolsDir ? '../fonts/' : 'fonts/';

  // Built-in font catalog
  const BUILTIN_FONTS = [
    // Bangla (Unicode & Bijoy)
    { id: 'NotoSansBengali', name: 'Noto Sans বাংলা', lang: 'bn', path: 'bangla/NotoSansBengali.ttf' },
    { id: 'NotoSerifBengali', name: 'Noto Serif বাংলা', lang: 'bn', path: 'bangla/NotoSerifBengali.ttf' },
    { id: 'Kalpurush', name: 'কালপুরুষ (Kalpurush)', lang: 'bn', path: 'bangla/Kalpurush.ttf' },
    { id: 'Nikosh', name: 'নিকশ (Nikosh Govt)', lang: 'bn', path: 'bangla/Nikosh.ttf' },
    { id: 'SiyamRupali', name: 'সিয়াম রূপালী (Siyam Rupali)', lang: 'bn', path: 'bangla/SiyamRupali.ttf' },
    { id: 'SutonnyMJ', name: 'SutonnyMJ (বিজয়)', lang: 'bn', path: 'bangla/SutonnyMJ-Regular.ttf' },
    { id: 'SutonnyOMJ', name: 'SutonnyOMJ (বিজয় ওএমজে)', lang: 'bn', path: 'bangla/SutonnyOMJ.ttf' },
    // English
    { id: 'Inter', name: 'Inter', lang: 'en', path: 'english/Inter-Regular.woff2' },
    // Standard PDF fonts (no download needed)
    { id: 'Helvetica', name: 'Helvetica', lang: 'en', path: null, standard: true },
    { id: 'Times-Roman', name: 'Times Roman', lang: 'en', path: null, standard: true },
    { id: 'Courier', name: 'Courier', lang: 'en', path: null, standard: true },
  ];

  const loadedFonts = new Map(); // id -> ArrayBuffer
  const customFonts = [];

  /**
   * Load a font as ArrayBuffer for use with pdf-lib
   */
  async function loadFont(fontId) {
    if (loadedFonts.has(fontId)) return loadedFonts.get(fontId);

    const def = [...BUILTIN_FONTS, ...customFonts].find(f => f.id === fontId);
    if (!def || def.standard) return null;

    const url = FONTS_BASE + def.path;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = await resp.arrayBuffer();
      loadedFonts.set(fontId, buf);

      // Register live FontFace so HTML and Canvas immediately render this font
      try {
        const ff = new FontFace(def.id, buf);
        await ff.load();
        document.fonts.add(ff);
      } catch (fe) {}

      return buf;
    } catch (e) {
      console.warn(`Font load failed: ${fontId}`, e);
      return null;
    }
  }

  /**
   * Register font with pdf-lib PDFDocument
   */
  async function embedFont(pdfDoc, fontId) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    const { PDFDocument, StandardFonts } = window.PDFLib;

    if (window.fontkit && !pdfDoc.customFontkitRegistered) {
      pdfDoc.registerFontkit(window.fontkit);
      pdfDoc.customFontkitRegistered = true;
    }

    // Standard fonts
    const standardMap = {
      'Helvetica': StandardFonts.Helvetica,
      'Times-Roman': StandardFonts.TimesRoman,
      'Courier': StandardFonts.Courier,
    };
    if (standardMap[fontId]) {
      return await pdfDoc.embedFont(standardMap[fontId]);
    }

    // Custom TTF fonts
    const buf = await loadFont(fontId);
    if (!buf) throw new Error(`Cannot load font: ${fontId}`);
    return await pdfDoc.embedFont(buf);
  }

  /**
   * Load custom font from user-uploaded file
   */
  async function loadCustomFont(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const id = 'custom_' + file.name.replace(/\.[^.]+$/, '').replace(/\s+/g, '_');
        const name = file.name.replace(/\.[^.]+$/, '');
        const buf = e.target.result;
        loadedFonts.set(id, buf);
        const entry = { id, name, lang: 'custom', path: null, custom: true };
        customFonts.push(entry);
        // Register as CSS font for live preview
        const ff = new FontFace(name, buf);
        ff.load().then(f => document.fonts.add(f)).catch(() => {});
        resolve(entry);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Apply font to canvas context for live preview
   */
  async function applyToCanvas(ctx, fontId, size) {
    const def = [...BUILTIN_FONTS, ...customFonts].find(f => f.id === fontId);
    if (!def) { ctx.font = `${size}px sans-serif`; return; }
    if (def.standard) { ctx.font = `${size}px ${def.name}`; return; }
    if (!def.path && !def.custom) { ctx.font = `${size}px sans-serif`; return; }

    // Ensure CSS font is loaded
    await document.fonts.load(`${size}px "${def.name}"`);
    ctx.font = `${size}px "${def.name}"`;
  }

  function getAllFonts() {
    return [...BUILTIN_FONTS, ...customFonts];
  }

  function getBanglaFonts() {
    return getAllFonts().filter(f => f.lang === 'bn' || f.lang === 'custom');
  }

  function getEnglishFonts() {
    return getAllFonts().filter(f => f.lang === 'en' || f.lang === 'custom');
  }

  /**
   * Build font selector <option> elements
   */
  function buildFontOptions(selectEl, lang = 'all') {
    selectEl.innerHTML = '';
    const fonts = lang === 'bn' ? getBanglaFonts()
                : lang === 'en' ? getEnglishFonts()
                : getAllFonts();

    const groups = {};
    fonts.forEach(f => {
      const g = f.lang === 'bn' ? 'বাংলা' : f.lang === 'en' ? 'English' : 'Custom';
      if (!groups[g]) groups[g] = [];
      groups[g].push(f);
    });

    Object.entries(groups).forEach(([label, list]) => {
      const og = document.createElement('optgroup');
      og.label = label;
      list.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        og.appendChild(opt);
      });
      selectEl.appendChild(og);
    });
  }

  return { loadFont, embedFont, loadCustomFont, applyToCanvas, getAllFonts, getBanglaFonts, getEnglishFonts, buildFontOptions };
})();

window.FontManager = FontManager;
