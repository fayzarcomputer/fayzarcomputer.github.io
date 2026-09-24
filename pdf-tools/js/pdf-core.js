/**
 * pdf-core.js — PDF.js Renderer Wrapper
 * ফয়জার কম্পিউটার PDF Tools Suite
 */

'use strict';

const PDFCore = (() => {
  let pdfjsLib = null;
  let currentDoc = null;
  let currentPage = 1;
  let totalPages = 0;
  let renderTask = null;
  let scale = 1.5;

  // Initialize PDF.js — uses already-loaded window.pdfjsLib
  async function init() {
    if (pdfjsLib) return pdfjsLib;
    if (window.pdfjsLib) {
      pdfjsLib = window.pdfjsLib;
      // Ensure workerSrc is always set
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
      }
      return pdfjsLib;
    }
    // Fallback: dynamic load
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'libs/pdf.min.js';
      script.onload = () => {
        pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = () => reject(new Error('pdf.min.js লোড ব্যর্থ'));
      document.head.appendChild(script);
    });
  }

  // Load PDF from ArrayBuffer or URL
  async function loadDocument(source) {
    await init();
    const loadingTask = pdfjsLib.getDocument(source instanceof ArrayBuffer
      ? { data: source }
      : { url: source }
    );
    currentDoc = await loadingTask.promise;
    totalPages = currentDoc.numPages;
    currentPage = 1;
    return { numPages: totalPages };
  }

  // Render a specific page to a canvas element with HiDPI / Retina super-sampling
  async function renderPage(pageNum, canvas, customScale) {
    if (!currentDoc) throw new Error('No document loaded');
    if (renderTask) {
      try { renderTask.cancel(); } catch(e) {}
    }

    const page = await currentDoc.getPage(pageNum);
    const s = customScale || scale;
    const dpr = Math.max(window.devicePixelRatio || 1, 2); // 2x or screen DPR for crisp vector text

    const viewport = page.getViewport({ scale: s });
    const outputViewport = page.getViewport({ scale: s * dpr });

    canvas.width = Math.floor(outputViewport.width);
    canvas.height = Math.floor(outputViewport.height);
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';

    const ctx = canvas.getContext('2d');
    renderTask = page.render({
      canvasContext: ctx,
      viewport: outputViewport
    });
    await renderTask.promise;
    currentPage = pageNum;
    return {
      width: Math.floor(viewport.width),
      height: Math.floor(viewport.height),
      dpr: dpr,
      page
    };
  }

  // Render page to a new canvas and return it (for thumbnails)
  async function renderPageToCanvas(pageNum, thumbScale = 0.3) {
    if (!currentDoc) return null;
    const page = await currentDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: thumbScale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  }

  // Get text content of a page (for search/OCR fallback)
  async function getPageTextContent(pageNum) {
    if (!currentDoc) return '';
    const page = await currentDoc.getPage(pageNum);
    const content = await page.getTextContent();
    return content.items.map(i => i.str).join(' ');
  }

  // Get page as ImageData for OCR
  async function getPageImageData(pageNum, ocrScale = 2.0) {
    if (!currentDoc) return null;
    const page = await currentDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: ocrScale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  }

  // Render all thumbnails into a container
  async function renderThumbnails(container, onThumbClick) {
    if (!currentDoc) return;
    container.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'page-thumb';
      wrap.dataset.page = i;

      const canvas = await renderPageToCanvas(i, 0.25);
      wrap.appendChild(canvas);

      const label = document.createElement('div');
      label.className = 'thumb-label';
      label.textContent = `পেজ ${i}`;
      wrap.appendChild(label);

      wrap.addEventListener('click', () => {
        container.querySelectorAll('.page-thumb').forEach(t => t.classList.remove('selected'));
        wrap.classList.add('selected');
        if (onThumbClick) onThumbClick(i);
      });
      container.appendChild(wrap);
    }
  }

  function setScale(s) { scale = s; }
  function getScale() { return scale; }
  function getCurrentPage() { return currentPage; }
  function getTotalPages() { return totalPages; }
  function getDocument() { return currentDoc; }

  return { init, loadDocument, renderPage, renderPageToCanvas, getPageTextContent, getPageImageData, renderThumbnails, setScale, getScale, getCurrentPage, getTotalPages, getDocument };
})();

window.PDFCore = PDFCore;
