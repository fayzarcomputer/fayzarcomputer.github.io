/**
 * pdf-utils.js — Shared Utilities for all PDF Tools
 * Toast, progress, file upload helpers
 */

'use strict';

// ===== Load pdf-lib =====
async function loadPDFLib() {
  if (window.PDFLib) return window.PDFLib;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../libs/pdf-lib.min.js', location.href).href;
    s.onload = () => resolve(window.PDFLib);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ===== File Helpers =====
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

// ===== Toast =====
function toast(msg, type = 'info', duration = 4000) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ===== Progress =====
function showProgress(msg, pct) {
  const pm = document.getElementById('progressModal');
  if (pm) pm.style.display = 'flex';
  const pmsg = document.getElementById('progressMsg');
  const pfill = document.getElementById('progressFill');
  const ppct = document.getElementById('progressPct');
  if (pmsg) pmsg.textContent = msg;
  if (pfill) pfill.style.width = (pct || 0) + '%';
  if (ppct) ppct.textContent = (pct || 0) + '%';
}

function hideProgress() {
  const pm = document.getElementById('progressModal');
  if (pm) pm.style.display = 'none';
}

// ===== Upload Zone Setup =====
function setupDropZone(zoneId, inputId, onFiles, opts = {}) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf'));
    if (files.length) onFiles(files);
    else toast('⚠️ শুধুমাত্র .pdf ফাইল গ্রহণযোগ্য', 'error');
  });
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    if (files.length) onFiles(files);
    input.value = '';
  });
}

// ===== File List UI =====
function renderFileList(files, containerId, onRemove) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  files.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="fi-icon">📄</span>
      <span class="fi-name" title="${f.name}">${f.name}</span>
      <span class="fi-size">${formatSize(f.size)}</span>
      <button class="fi-remove" title="সরান">✕</button>
    `;
    item.querySelector('.fi-remove').addEventListener('click', () => onRemove(i));
    c.appendChild(item);
  });
}

// ===== Theme =====
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = t === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('pdf-theme', t);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}
function initTheme() {
  applyTheme(localStorage.getItem('pdf-theme') || localStorage.getItem('fayzar-theme') || 'dark');
}

// ===== Standard Tool Page Template =====
function buildToolPageHTML(opts) {
  return `
    <div class="pdf-bg-canvas"></div>
    <nav class="pdf-nav">
      <a href="../index.html" class="nav-back">← টুলস হোম</a>
      <span style="color:var(--pdf-glass-border)">|</span>
      <span style="font-family:var(--pdf-font-bn);font-size:1rem;font-weight:700;">${opts.icon} ${opts.title}</span>
      <div class="spacer"></div>
      <button onclick="toggleTheme()" class="btn btn-outline btn-sm" id="themeBtn">🌙</button>
    </nav>
    <div class="tool-page">
      <div class="tool-page-header">
        <div class="tool-page-icon" style="background:linear-gradient(135deg,${opts.color1},${opts.color2});">${opts.icon}</div>
        <div>
          <h1>${opts.title}</h1>
          <p>${opts.desc}</p>
        </div>
      </div>
    </div>
  `;
}

window.PDFUtils = { loadPDFLib, readFileAsArrayBuffer, downloadBlob, formatSize, toast, showProgress, hideProgress, setupDropZone, renderFileList, applyTheme, toggleTheme, initTheme };

// Also expose globally so tool pages can call directly: toast(), initTheme(), etc.
window.toast = toast;
window.showProgress = showProgress;
window.hideProgress = hideProgress;
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
window.setupDropZone = setupDropZone;
window.readFileAsArrayBuffer = readFileAsArrayBuffer;
window.downloadBlob = downloadBlob;
window.formatSize = formatSize;

