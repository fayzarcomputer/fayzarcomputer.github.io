/**
 * ============================================================================
 * Fayzar Computer v2 - AI Bengali OCR & Math (LaTeX) to Bijoy .doc Engine
 * (MULTI-PAGE UNIFIED EXTRACTION WITH LIVE STREAMING & CLEAN FORMATTING)
 * ============================================================================
 * Features:
 * 1. Unified Multi-Page Batching: Sends ALL images/pages together in 1 single API call.
 * 2. Real-Time Live SSE Streaming: Output streams live onto the screen immediately.
 * 3. Clean Roman Numerals: Automatic removal of asterisks (*i.* -> i., *i* -> i).
 * 4. Clean Creative Questions: Formatted without score brackets ([১], [২]).
 * 5. Native .doc (RTF/SutonnyMJ) & .docx (OOXML, Bijoy/Unicode) Word Generation.
 * 6. Multi-Model Independent Quota Failover (Gemini 2.0 Flash -> 1.5 Flash -> 1.5 Pro).
 * ============================================================================
 */

(function (global) {
  'use strict';

  const STORAGE_KEYS = {
    FREE_COUNT: 'fayzar_ai_ocr_free_count',
    BYOK_KEY: 'fayzar_ai_ocr_gemini_key',
    GAS_URL: 'fayzar_ai_ocr_gas_url',
    DEMO_MODE: 'fayzar_ai_ocr_demo_mode',
    SELECTED_MODEL: 'fayzar_ai_ocr_selected_model'
  };

  const MAX_FREE_USES = 5;
  const REQUEST_TIMEOUT_MS = 25000;
  const MAX_IMAGE_DIMENSION = 1400;
  const JPEG_COMPRESSION_QUALITY = 0.84;

  const GEMINI_PROMPT = `তুমি একজন বিশেষজ্ঞ একাডেমিক প্রশ্নপত্র OCR ট্রান্সক্রাইবার এবং LaTeX/Word ডকুমেন্ট বিশেষজ্ঞ। তোমার কাজ হলো প্রদত্ত স্ক্যান করা প্রশ্নপত্র, বই বা নথির ছবি থেকে ১০০% নির্ভুল বাংলা ইউনিকোড টেক্সট ও LaTeX গাণিতিক সমীকরণ এক্সট্রাক্ট করা এবং সোর্স ফাইলের অবিকল কাঠামো তৈরি করা।

মূল নিয়মাবলী:

১. ইউনিকোড বাংলা ও নির্ভুল বানান:
   - আউটপুট সম্পূর্ণ স্ট্যান্ডার্ড ইউনিকোড (Unicode) বাংলায় হবে (কোনো Bijoy/ASCII কোড ব্যবহার করবে না)।
   - বাংলা বানান, যুক্তাক্ষর, মাত্রা, হসন্ত এবং দাঁড়ি ১০০% শুদ্ধ রাখবে।

২. সমীকরণ ও সূত্র (LaTeX) এবং বাংলা এককের পৃথকীকরণ:
   - সমস্ত গাণিতিক ও বৈজ্ঞানিক সমীকরণ বাধ্যতামূলকভাবে LaTeX ফরম্যাটে ($...$) লিখবে।
   - কঠোর সতর্কতা: লেটেক্স কোডের ($...$ বা \\text{...}) ভেতরে কোনো অবস্থাতেই বাংলা লেখা, শব্দ, একক বা কোটেশন (যেমন: "বর্গসেমি", "সেমি", "মিটার", "টাকা", "টি", "জন") রাখবে না।
   - সমস্ত বাংলা লেখা ও একক সবসময় $...$-এর বাইরে লিখবে।
   - যেমন: (ক) $4\\sqrt{55}$ "বর্গসেমি" (অথবা (ক) $4\\sqrt{55}$ বর্গসেমি)
   - ইনলাইন সূত্র: $সমীকরণ$ (যেমন $x^2 + y^2 = r^2$, $\\sin^2\\theta + \\cos^2\\theta = 1$)
   - ডিসপ্লে/ব্লক সূত্র: $$সমীকরণ$$ (যেমন $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$)
   - ভগ্নাংশ: \\frac{লব}{হর}
   - বর্গমূল: \\sqrt{x} বা \\sqrt[n]{x}
   - ঘাত ও সূচক: x^{2}, m^{-1} (curly bracket আবশ্যক)
   - গ্রিক অক্ষর: \\alpha, \\beta, \\theta, \\lambda, \\pi, \\Delta, \\Omega ইত্যাদি

৩. বহুনির্বাচনী প্রশ্ন (MCQ) বিন্যাস ও বিকল্পসমূহ (বাধ্যতামূলক):
   - বহুনির্বাচনী প্রশ্নের সবকটি বিকল্প ((ক), (খ), (গ), (ঘ)) এবং রোমান সংখ্যার শর্ত (i, ii, iii) ১০০% হুবহু অবিকল তুলে ধরবে।
   - কোনো অবস্থাতেই কোনো অপশন বা বিকল্প বাদ দেবে না।
   - অপশনগুলো মূল প্রশ্নপত্রের মতো পাশাপাশি বা সুন্দরভাবে বিন্যাস করবে:
     ১. প্রশ্ন...
        (ক) অপশন ১    (খ) অপশন ২    (গ) অপশন ৩    (ঘ) অপশন ৪

৪. সৃজনশীল প্রশ্ন (CQ) ও অথবা/বিকল্প প্রশ্ন:
   - উদ্দীপক, ১., ২., ক., খ., গ., ঘ. এবং ডানপাশের নম্বর সুনির্দিষ্টভাবে সাজাবে।
   - মূল প্রশ্নপত্রে কোনো 'অথবা' বা বিকল্প প্রশ্ন থাকলে তা অবশ্যই আলাদা লাইনে 'অথবা' লিখে অবিকল বজায় রাখবে। কখনোই অথবা বা বিকল্প প্রশ্ন বাদ দেবে না।
   - মূল প্রশ্নপত্রের শিরোনাম ও সেকশন হেডিং অবিকল রাখবে।

৫. টেবিল ও ছক (Tables):
   - অবশ্যই কোনো টেবিল বা ছক এড়িয়ে যাবে না। প্রতিটি টেবিল নিখুঁতভাবে Markdown টেবিলে রূপান্তর করবে।

৬. চিত্র/জ্যামিতিক চিত্র ও ডায়াগ্রাম চিহ্নিতকরণ:
   - মূল নথিতে কোনো চিত্র থাকলে [চিত্র আছে: চিত্রে ...] এভাবে স্পষ্টভাবে উল্লেখ করবে।

৭. মূল সংখ্যা ও একক:
   - মূল ফাইলে ইংরেজি সংখ্যা বা একক (যেমন 210 V, 0.83 A, 50 Hz, 10 kg) থাকলে তা মূল ফরম্যাটেই রাখবে।

৮. অতিরিক্ত কথা, উত্তর ও সমাধান বর্জন:
   - এটি একটি অবিকল প্রশ্নপত্র ট্রান্সক্রিপশন। তুমি নিজে থেকে কোনো প্রশ্নের উত্তর, সমাধান, বা ব্যাখ্যা তৈরি করবে না।
   - শুরুতে বা শেষে কোনো প্রকার ভূমিকা, চ্যাট বার্তা, কোডব্লক বা নোট যুক্ত করবে না। মূল প্রশ্নপত্রটি হুবহু অবিকল আউটপুট দেবে।

৯. সমীকরণ ও সমাধানের পুনরাবৃত্তি বর্জন (Anti-Loop):
   - মূল চিত্রে যতটুকু তথ্য বা প্রশ্ন আছে, হুবহু ততটুকুই লিখবে।
   - কোনো অবস্থাতেই একই সমীকরণ, লাইন বা শর্ত বারবার পুনরাবৃত্তি (infinite loop / hallucination) করে পেজ ভরাবে না। প্রতিটি ধাপ একবারই লিখবে।`;

  const savedKey = (typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEYS.BYOK_KEY) || localStorage.getItem('bengali_ocr_gemini_key') || '') : '');
  const savedGas = (typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEYS.GAS_URL) || localStorage.getItem('bengali_ocr_gas_url') || '') : '');
  const rawDemoSetting = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.DEMO_MODE) : null;
  const isDemo = (rawDemoSetting === 'true');

  const state = {
    freeUsesCount: typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem(STORAGE_KEYS.FREE_COUNT) || '0', 10) : 0,
    byokApiKey: savedKey,
    gasUrl: savedGas,
    demoMode: isDemo,
    selectedModel: typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'auto') : 'auto',

    filesQueue: [],
    selectedFile: null,
    imageBase64: '',
    imageMimeType: '',
    isProcessing: false,
    unicodeText: '',
    bijoyText: '',
    activeViewTab: 'unicode'
  };

  // Dynamic API Key Vault Connector (Securely loads deobfuscated keys from fayzar-ocr-config.js)
  function getActiveApiKey() {
    const customKey = (state && state.byokApiKey ? state.byokApiKey : '').trim();
    if (customKey && customKey.length > 10) return customKey;
    const localKey = (typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEYS.BYOK_KEY) || localStorage.getItem('bengali_ocr_gemini_key') || '') : '').trim();
    if (localKey && localKey.length > 10) return localKey;
    if (typeof window !== 'undefined' && window.FayzarOcrConfig && typeof window.FayzarOcrConfig.getActiveApiKey === 'function') {
      return window.FayzarOcrConfig.getActiveApiKey();
    }
    return '';
  }

  function getBackupApiKey() {
    if (typeof window !== 'undefined' && window.FayzarOcrConfig && typeof window.FayzarOcrConfig.getBackupApiKey === 'function') {
      return window.FayzarOcrConfig.getBackupApiKey();
    }
    return '';
  }

  const hasValidConfig = Boolean(savedKey || savedGas || getActiveApiKey());

  let elements = {};
  let _dictLoaded = false;

  async function loadConverterDictionary() {
    if (_dictLoaded) return;
    _dictLoaded = true;
    let dict = [];
    try {
      const local = JSON.parse(localStorage.getItem('fayzar_converter_dict') || '[]');
      if (Array.isArray(local) && local.length) dict = local;
    } catch (e) { /* ignore */ }

    if (!dict.length) {
      try {
        const res = await fetch('data/converter_dict.json?t=' + Date.now());
        if (res.ok) {
          const j = await res.json();
          if (Array.isArray(j) && j.length) dict = j;
        }
      } catch (e) { /* ignore */ }
    }

    if (typeof window.BanglaConverter !== 'undefined' && typeof window.BanglaConverter.setCustomDictionary === 'function') {
      window.BanglaConverter.setCustomDictionary(dict);
    }
  }

  function init() {
    bindElements();
    if (!elements.panel) return;
    loadSettings();
    updateBadges();
    setupEvents();
    loadConverterDictionary();
  }

  function bindElements() {
    elements = {
      panel: document.getElementById('panel-text') || document.getElementById('panel-ai-ocr'),
      dropZone: document.getElementById('ai-ocr-dropzone'),
      fileInput: document.getElementById('ai-ocr-file-input'),
      uploadPrompt: document.getElementById('ai-ocr-upload-prompt'),
      previewContainer: document.getElementById('ai-ocr-preview-container'),
      imagePreview: document.getElementById('ai-ocr-image-preview'),
      pdfPreviewIcon: document.getElementById('ai-ocr-pdf-preview'),
      removeImageBtn: document.getElementById('ai-ocr-remove-image-btn'),
      fileName: document.getElementById('ai-ocr-file-name'),
      fileSize: document.getElementById('ai-ocr-file-size'),
      fileCountBadge: document.getElementById('ai-ocr-file-count-badge'),
      multiThumbs: document.getElementById('aiOcrThumbsList') || document.getElementById('ai-ocr-multi-thumbs'),

      convertBtn: document.getElementById('executeAiConversionBtn') || document.getElementById('ai-ocr-convert-btn'),
      convertBtnText: document.getElementById('executeAiConversionBtnText') || document.getElementById('ai-ocr-convert-btn-text'),
      progressContainer: document.getElementById('wizardProgressCard') || document.getElementById('ai-ocr-progress-container'),
      progressStepText: document.getElementById('wizardProgressTitle') || document.getElementById('ai-ocr-progress-step-text'),
      progressBar: document.getElementById('wizardProgressBar') || document.getElementById('ai-ocr-progress-bar'),
      progressPercent: document.getElementById('wizardProgressPctText') || document.getElementById('ai-ocr-progress-percent'),

      successCard: document.getElementById('wizardResultCard') || document.getElementById('ai-ocr-success-card'),
      togglePreviewBtn: document.getElementById('wizardPreviewToggleBtn') || document.getElementById('ai-ocr-toggle-preview-btn'),
      togglePreviewText: document.getElementById('wizardPreviewToggleText') || document.getElementById('ai-ocr-toggle-preview-text'),
      collapsiblePreview: document.getElementById('wizardPreviewBox') || document.getElementById('ai-ocr-collapsible-preview'),

      creditBadge: document.getElementById('ai-ocr-credit-badge'),
      modeBadge: document.getElementById('ai-ocr-mode-badge'),

      outputUnicodeArea: document.getElementById('wizardPreviewContent') || document.getElementById('ai-ocr-output-unicode'),
      outputBijoyArea: document.getElementById('ai-ocr-output-bijoy'),

      copyBtn: document.getElementById('wizardCopyTextBtn') || document.getElementById('ai-ocr-copy-btn'),
      sendToConverterBtn: document.getElementById('ai-ocr-send-to-converter-btn'),
      downloadDocBtn: document.getElementById('wizardDlDocBtn') || document.getElementById('ai-ocr-download-doc-btn'),
      downloadBijoyDocxBtn: document.getElementById('ai-ocr-download-bijoy-docx-btn'),
      downloadDocxBtn: document.getElementById('wizardDlDocxBtn') || document.getElementById('ai-ocr-download-docx-btn'),

      pageSizeSelect: document.getElementById('ai-target-page-size') || document.getElementById('ai-ocr-page-size'),
      pageMarginSelect: document.getElementById('ai-target-page-margin') || document.getElementById('ai-ocr-page-margin'),
      fontSizeSelect: document.getElementById('ai-target-font-size') || document.getElementById('ai-ocr-font-size'),
      lineSpacingSelect: document.getElementById('ai-ocr-line-spacing'),

      openSettingsBtn: document.getElementById('ai-ocr-open-settings-btn') || document.getElementById('ai-ocr-settings-btn'),
      settingsModal: document.getElementById('ai-ocr-settings-modal'),
      closeSettingsBtn: document.getElementById('ai-ocr-settings-close-btn') || document.getElementById('ai-ocr-close-settings-btn'),
      saveSettingsBtn: document.getElementById('ai-ocr-settings-save-btn') || document.getElementById('ai-ocr-save-settings-btn'),
      demoToggle: document.getElementById('ai-ocr-demo-toggle'),
      geminiKeyInput: document.getElementById('ai-ocr-settings-api-key') || document.getElementById('ai-ocr-gemini-key-input'),
      modelSelect: document.getElementById('ai-ocr-settings-model-select') || document.getElementById('ai-ocr-model-select'),
      gasUrlInput: document.getElementById('ai-ocr-gas-url-input'),
      resetCreditsBtn: document.getElementById('ai-ocr-reset-credits-btn'),

      byokModal: document.getElementById('ai-ocr-byok-modal'),
      byokInput: document.getElementById('ai-ocr-byok-input'),
      saveByokBtn: document.getElementById('ai-ocr-save-byok-btn'),
      cancelByokBtn: document.getElementById('ai-ocr-cancel-byok-btn')
    };
  }

  function loadSettings() {
    if (elements.demoToggle) elements.demoToggle.checked = state.demoMode;
    if (elements.geminiKeyInput) elements.geminiKeyInput.value = state.byokApiKey;
    if (elements.gasUrlInput) elements.gasUrlInput.value = state.gasUrl;
    if (elements.modelSelect) elements.modelSelect.value = state.selectedModel || 'auto';
  }

  function updateBadges() {
    const activeKey = getActiveApiKey();
    if (elements.creditBadge) {
      if (activeKey) {
        elements.creditBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300";
        elements.creditBadge.textContent = "AI OCR সক্রিয় (ফ্রি)";
      } else {
        const remaining = Math.max(0, MAX_FREE_USES - state.freeUsesCount);
        elements.creditBadge.textContent = `ফ্রি ক্রেডিট: ${toBengaliNumber(remaining)}/${toBengaliNumber(MAX_FREE_USES)}`;
      }
    }
    if (elements.modeBadge) {
      if (state.demoMode) {
        elements.modeBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 inline-flex items-center gap-1.5";
        elements.modeBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> অফলাইন ডেমো`;
      } else if (activeKey) {
        elements.modeBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 inline-flex items-center gap-1.5";
        elements.modeBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> লাইভ AI সচল`;
      } else {
        elements.modeBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 inline-flex items-center gap-1.5";
        elements.modeBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-500"></span> ফ্রি প্রক্সি`;
      }
    }
  }

  function setupEvents() {
    if (elements.dropZone) {
      ['dragenter', 'dragover'].forEach(name => {
        elements.dropZone.addEventListener(name, (e) => {
          e.preventDefault();
          elements.dropZone.classList.add('border-indigo-500', 'bg-indigo-50/50', 'dark:bg-indigo-950/20');
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        elements.dropZone.addEventListener(name, (e) => {
          e.preventDefault();
          elements.dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/50', 'dark:bg-indigo-950/20');
        });
      });
      elements.dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
      });
    }

    if (elements.fileInput) {
      elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
      });
    }

    if (elements.removeImageBtn) {
      elements.removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearImage();
      });
    }

    if (elements.convertBtn) elements.convertBtn.addEventListener('click', startOcrConversion);

    if (elements.togglePreviewBtn) {
      elements.togglePreviewBtn.addEventListener('click', () => {
        const isHidden = elements.collapsiblePreview?.classList.contains('hidden');
        if (isHidden) {
          elements.collapsiblePreview?.classList.remove('hidden');
          elements.collapsiblePreview?.classList.add('flex');
          if (elements.togglePreviewText) elements.togglePreviewText.textContent = 'প্রিভিউ লুকান';
        } else {
          elements.collapsiblePreview?.classList.add('hidden');
          elements.collapsiblePreview?.classList.remove('flex');
          if (elements.togglePreviewText) elements.togglePreviewText.textContent = 'টেক্সট প্রিভিউ দেখুন';
        }
      });
    }

    if (elements.copyBtn) elements.copyBtn.addEventListener('click', copyCurrentText);
    if (elements.sendToConverterBtn) elements.sendToConverterBtn.addEventListener('click', sendToMainConverter);

    if (elements.downloadDocBtn) elements.downloadDocBtn.addEventListener('click', () => downloadWordDocument('doc'));
    if (elements.downloadBijoyDocxBtn) elements.downloadBijoyDocxBtn.addEventListener('click', () => downloadWordDocument('bijoy_docx'));
    if (elements.downloadDocxBtn) elements.downloadDocxBtn.addEventListener('click', () => downloadWordDocument('unicode_docx'));

    if (elements.modeBadge) {
      elements.modeBadge.style.cursor = 'pointer';
      elements.modeBadge.addEventListener('click', () => toggleModal(elements.settingsModal, true));
    }
    if (elements.openSettingsBtn) elements.openSettingsBtn.addEventListener('click', () => toggleModal(elements.settingsModal, true));
    if (elements.closeSettingsBtn) elements.closeSettingsBtn.addEventListener('click', () => toggleModal(elements.settingsModal, false));
    if (elements.saveSettingsBtn) elements.saveSettingsBtn.addEventListener('click', saveSettings);
    if (elements.resetCreditsBtn) elements.resetCreditsBtn.addEventListener('click', resetCredits);
    if (elements.cancelByokBtn) elements.cancelByokBtn.addEventListener('click', () => toggleModal(elements.byokModal, false));
    if (elements.saveByokBtn) elements.saveByokBtn.addEventListener('click', saveByokKey);
  }

  // =========================================================================
  // DYNAMIC SCRIPT LAZY-LOADER & FAILSAFE UTILITIES
  // =========================================================================

  async function ensureExternalScript(globalVarName, url) {
    if (typeof window !== 'undefined' && window[globalVarName]) {
      return window[globalVarName];
    }
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${url}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(window[globalVarName]));
        existing.addEventListener('error', () => reject(new Error(`লাইব্রেরি লোড হতে ব্যর্থ: ${url}`)));
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve(window[globalVarName]);
      script.onerror = () => reject(new Error(`লাইব্রেরি স্ক্রিপ্ট লোড হতে ব্যর্থ: ${url}`));
      document.head.appendChild(script);
    });
  }

  async function ensurePdfJs() {
    if (typeof window !== 'undefined' && typeof window.pdfjsLib !== 'undefined') {
      if (!window.pdfjsLib.GlobalWorkerOptions?.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      return window.pdfjsLib;
    }
    if (typeof window !== 'undefined' && window['pdfjs-dist/build/pdf']) {
      const lib = window['pdfjs-dist/build/pdf'];
      if (!lib.GlobalWorkerOptions?.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      return lib;
    }
    try {
      await ensureExternalScript('pdfjsLib', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        return window.pdfjsLib;
      }
    } catch (e) {
      console.warn('PDF.js dynamic load failed:', e);
    }
    return window.pdfjsLib || window['pdfjs-dist/build/pdf'] || null;
  }

  // Multi-page PDF to High-DPI JPEG Canvas Renderer
  async function renderPdfFileToPages(file, maxPages = 25) {
    const pdfLib = await ensurePdfJs();
    if (!pdfLib) {
      throw new Error('PDF.js লাইব্রেরি লোড হয়নি। দয়া করে ইন্টারনেট সংযোগ চেক করে পেজ রিফ্রেশ দিন।');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = Math.min(pdfDoc.numPages, maxPages);
    const pages = [];

    for (let pNum = 1; pNum <= numPages; pNum++) {
      const page = await pdfDoc.getPage(pNum);
      const unscaled = page.getViewport({ scale: 1.0 });

      // Optimal scale for Bengali conjuncts & mathematical OCR (1.8x, capped at MAX_IMAGE_DIMENSION)
      let scale = 1.8;
      if (unscaled.width * scale > MAX_IMAGE_DIMENSION || unscaled.height * scale > MAX_IMAGE_DIMENSION) {
        scale = Math.min(MAX_IMAGE_DIMENSION / unscaled.width, MAX_IMAGE_DIMENSION / unscaled.height);
      }

      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      await page.render({ canvasContext: ctx, viewport }).promise;

      const base64 = canvas.toDataURL('image/jpeg', JPEG_COMPRESSION_QUALITY);
      pages.push({
        file: file,
        name: `${file.name} (পেজ ${toBengaliNumber(pNum)})`,
        originalName: file.name,
        pageNum: pNum,
        totalPages: pdfDoc.numPages,
        isPdfPage: true,
        size: Math.round((base64.length * 3) / 4),
        base64: base64,
        mimeType: 'image/jpeg'
      });
    }

    return pages;
  }

  // Fast image optimization: resize on canvas
  async function fastOptimizeImageFile(file) {
    return new Promise((resolve) => {
      if (!file) {
        resolve({ base64: '', mimeType: 'image/jpeg' });
        return;
      }

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        renderPdfFileToPages(file, 1).then(pages => {
          if (pages.length > 0) {
            resolve({ base64: pages[0].base64, mimeType: 'image/jpeg' });
          } else {
            const reader = new FileReader();
            reader.onload = e => resolve({ base64: e.target.result, mimeType: 'application/pdf' });
            reader.readAsDataURL(file);
          }
        }).catch(() => {
          const reader = new FileReader();
          reader.onload = e => resolve({ base64: e.target.result, mimeType: 'application/pdf' });
          reader.readAsDataURL(file);
        });
        return;
      }

      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target.result;
        img.onload = () => {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          const maxDim = MAX_IMAGE_DIMENSION;
          const quality = JPEG_COMPRESSION_QUALITY;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          resolve({ base64: canvas.toDataURL('image/jpeg', quality), mimeType: 'image/jpeg' });
        };
        img.onerror = () => resolve({ base64: rawDataUrl, mimeType: file.type || 'image/jpeg' });
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(filesList) {
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList);

    clearImage();
    state.filesQueue = [];
    let totalBytes = 0;

    setLoading(true, 'ফাইল প্রসেসিং ও পেজ রেন্ডারিং হচ্ছে...', 15);

    try {
      for (let file of files) {
        const isImage = file.type.match('image.*') || /\.(png|jpe?g|webp|bmp|jfif)$/i.test(file.name);
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (!isImage && !isPdf) {
          showToast(`'${file.name}' ফরম্যাট সমর্থিত নয়! শুধুমাত্র PDF বা ছবি দিন।`, 'warning');
          continue;
        }
        if (file.size > 50 * 1024 * 1024) {
          showToast(`'${file.name}' সাইজ ৫০MB-র বেশি!`, 'warning');
          continue;
        }

        totalBytes += file.size;

        if (isPdf) {
          try {
            const pdfPages = await renderPdfFileToPages(file);
            for (const p of pdfPages) {
              state.filesQueue.push(p);
            }
          } catch (pdfErr) {
            console.warn('PDF page rendering fallback:', pdfErr);
            const opt = await fastOptimizeImageFile(file);
            state.filesQueue.push({
              file: file,
              name: file.name,
              size: file.size,
              isPdf: true,
              mimeType: opt.mimeType,
              base64: opt.base64
            });
          }
        } else {
          const opt = await fastOptimizeImageFile(file);
          state.filesQueue.push({
            file: file,
            name: file.name,
            size: file.size,
            isPdf: false,
            mimeType: opt.mimeType,
            base64: opt.base64
          });
        }
      }
    } catch (processErr) {
      console.error('File queue processing error:', processErr);
    } finally {
      setLoading(false);
    }

    if (state.filesQueue.length === 0) return;

    // Single item / page handling
    if (state.filesQueue.length === 1) {
      const single = state.filesQueue[0];
      state.selectedFile = single.file;
      state.imageMimeType = single.mimeType;
      state.imageBase64 = single.base64;

      if (elements.fileName) elements.fileName.textContent = single.name;
      if (elements.fileSize) elements.fileSize.textContent = formatBytes(single.size);
      if (elements.fileCountBadge) elements.fileCountBadge.textContent = '১টি পেজ প্রস্তুত';

      if (elements.imagePreview) {
        elements.imagePreview.src = single.base64;
        elements.imagePreview.classList.remove('hidden');
      }
      elements.pdfPreviewIcon?.classList.add('hidden');
      elements.uploadPrompt?.classList.add('hidden');
      elements.previewContainer?.classList.remove('hidden');
      elements.multiThumbs?.classList.add('hidden');
      if (elements.convertBtn) elements.convertBtn.disabled = false;
      elements.successCard?.classList.add('hidden');
      return;
    }

    // Multiple pages / files handling
    state.selectedFile = state.filesQueue[0].file;
    state.imageBase64 = state.filesQueue[0].base64;
    state.imageMimeType = state.filesQueue[0].mimeType;

    if (elements.fileName) elements.fileName.textContent = `${toBengaliNumber(state.filesQueue.length)}টি পেজ নির্বাচিত`;
    if (elements.fileSize) elements.fileSize.textContent = `মোট ${formatBytes(totalBytes)}`;
    if (elements.fileCountBadge) elements.fileCountBadge.textContent = `${toBengaliNumber(state.filesQueue.length)}টি পেজ একসাথে প্রসেস হবে`;

    if (elements.imagePreview) {
      elements.imagePreview.src = state.filesQueue[0].base64;
      elements.imagePreview.classList.remove('hidden');
    }
    elements.pdfPreviewIcon?.classList.add('hidden');
    elements.uploadPrompt?.classList.add('hidden');
    elements.previewContainer?.classList.remove('hidden');

    if (elements.multiThumbs) {
      elements.multiThumbs.innerHTML = '';
      elements.multiThumbs.classList.remove('hidden');

      state.filesQueue.forEach((item, idx) => {
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'w-16 h-18 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center relative flex-shrink-0 cursor-pointer shadow-sm hover:border-indigo-500 transition';
        thumbDiv.innerHTML = `
          <img src="${item.base64}" class="w-full h-full object-cover" alt="Page ${idx + 1}">
          <div class="absolute inset-x-0 bottom-0 bg-slate-900/80 backdrop-blur-xs py-0.5 text-[8px] font-bold text-white text-center truncate px-1">
            P${toBengaliNumber(idx + 1)}
          </div>
        `;
        thumbDiv.addEventListener('click', () => {
          if (elements.imagePreview) elements.imagePreview.src = item.base64;
        });
        elements.multiThumbs.appendChild(thumbDiv);
      });
    }

    if (elements.convertBtn) elements.convertBtn.disabled = false;
    elements.successCard?.classList.add('hidden');
    showToast(`মোট ${toBengaliNumber(state.filesQueue.length)}টি পেজ প্রস্তুত! সবগুলো একসাথে নিখুঁতভাবে রূপান্তর হবে।`, 'info');
  }

  function clearImage() {
    state.selectedFile = null;
    state.imageBase64 = '';
    state.imageMimeType = '';
    state.filesQueue = [];
    if (elements.fileInput) elements.fileInput.value = '';
    if (elements.imagePreview) elements.imagePreview.src = '';
    if (elements.previewContainer) elements.previewContainer.classList.add('hidden');
    if (elements.uploadPrompt) elements.uploadPrompt.classList.remove('hidden');
    if (elements.multiThumbs) {
      elements.multiThumbs.innerHTML = '';
      elements.multiThumbs.classList.add('hidden');
    }
    if (elements.convertBtn) elements.convertBtn.disabled = true;
    if (elements.successCard) {
      elements.successCard.classList.add('hidden');
      elements.successCard.classList.remove('flex');
    }
    if (elements.collapsiblePreview) {
      elements.collapsiblePreview.classList.add('hidden');
      elements.collapsiblePreview.classList.remove('flex');
      if (elements.togglePreviewText) elements.togglePreviewText.textContent = 'টেক্সট প্রিভিউ দেখুন';
    }
  }

  async function startOcrConversion() {
    if (!state.imageBase64 && state.filesQueue.length === 0) {
      showToast('অনুগ্রহ করে প্রথমে ফাইল আপলোড করুন', 'warning');
      return;
    }

    const key = getActiveApiKey();
    if (key) {
      await runDirectGeminiOcr(key);
      return;
    }

    if (state.gasUrl && state.gasUrl.trim().length > 0) {
      await runGasProxyOcr();
      return;
    }

    if (state.demoMode) {
      await runDemoSimulation();
      return;
    }

    toggleModal(elements.byokModal, true);
  }

  // Unified Smart Wizard Conversion Bridge
  async function startUnifiedOcr(targetFormat = 'doc', onProgress = null, onStream = null) {
    if (!state.imageBase64 && state.filesQueue.length === 0) {
      throw new Error('অনুগ্রহ করে প্রথমে ছবি বা PDF ফাইল নির্বাচন করুন');
    }

    const queue = state.filesQueue.length > 0
      ? state.filesQueue
      : [{ file: state.selectedFile, mimeType: state.imageMimeType, base64: state.imageBase64, name: 'ফাইল' }];
    const total = queue.length;

    if (onProgress) onProgress(total > 1 ? `মোট ${toBengaliNumber(total)}টি পেজ/ছবি প্রস্তুত করা হচ্ছে...` : 'ফাইল প্রস্তুত করা হচ্ছে...', 25);

    const mediaItems = await Promise.all(queue.map(async (item) => {
      const b64 = await ensureBase64(item);
      return {
        data: b64,
        mimeType: item.mimeType,
        name: item.name
      };
    }));

    if (onProgress) onProgress(total > 1 ? `সবগুলো (${toBengaliNumber(total)}টি) পেজ একসাথে AI-তে পাঠানো হচ্ছে...` : 'Gemini AI দিয়ে রূপান্তর হচ্ছে...', 45);

    const apiKey = getActiveApiKey();

    let rawText = '';
    if (state.demoMode && !apiKey) {
      if (onProgress) onProgress('অফলাইন ডেমো সিমুলেশন চলছে...', 60);
      await sleep(700);
      rawText = DEMO_SAMPLE_TEXT;
      if (onStream) onStream(rawText);
    } else if (apiKey) {
      rawText = await executeGeminiRequest(apiKey, mediaItems, (liveChunk) => {
        if (onStream) onStream(liveChunk);
        if (onProgress) onProgress(`লাইভ স্ট্রিমিং চলছে (${toBengaliNumber(liveChunk.length)} অক্ষর)...`, Math.min(95, 45 + Math.round(liveChunk.length / 30)));
      });
    } else {
      toggleModal(elements.byokModal, true);
      throw new Error('অনুগ্রহ করে আপনার Gemini API Key প্রদান করুন বা সেটিংস থেকে ডেমো মোড চালু করুন।');
    }

    if (onProgress) onProgress('আউটপুট প্রসেসিং ও ফরম্যাটিং সম্পন্ন হচ্ছে...', 95);
    handleExtractionSuccess(rawText);

    // Auto-generate and download the requested target document
    await downloadWordDocument(targetFormat);

    if (onProgress) onProgress('রূপান্তর সফলভাবে সম্পন্ন হয়েছে!', 100);

    return {
      unicodeText: state.unicodeText,
      bijoyText: state.bijoyText,
      totalFiles: total
    };
  }

  async function ensureBase64(item) {
    if (item.base64) return item.base64;
    const opt = await fastOptimizeImageFile(item.file);
    item.base64 = opt.base64;
    item.mimeType = opt.mimeType;
    return item.base64;
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  // UNIFIED MULTI-IMAGE / MULTI-PAGE GEMINI OCR (ALL PAGES IN 1 SINGLE API REQUEST)
  async function runDirectGeminiOcr(apiKey) {
    const queue = state.filesQueue.length > 0
      ? state.filesQueue
      : [{ file: state.selectedFile, mimeType: state.imageMimeType, base64: state.imageBase64, name: 'ফাইল' }];
    const total = queue.length;

    setLoading(true, total > 1 ? `মোট ${toBengaliNumber(total)}টি পেজ/ছবি একসাথে প্রস্তুত করা হচ্ছে...` : 'ফাইল প্রস্তুত করা হচ্ছে...', 25);

    // Parallel pre-optimization of all images
    const mediaItems = await Promise.all(queue.map(async (item) => {
      const b64 = await ensureBase64(item);
      return {
        data: b64,
        mimeType: item.mimeType,
        name: item.name
      };
    }));

    setLoading(true, total > 1 ? `সবগুলো (${toBengaliNumber(total)}টি) পেজ একসাথে Gemini AI-তে পাঠানো হচ্ছে...` : 'Gemini AI দিয়ে রূপান্তর হচ্ছে...', 45);

    try {
      const text = await executeGeminiRequest(apiKey, mediaItems, (liveText) => {
        if (elements.outputUnicodeArea) elements.outputUnicodeArea.value = liveText;
        setLoading(true, `লাইভ স্ট্রিমিং চলছে (${toBengaliNumber(liveText.length)} অক্ষর)...`, Math.min(95, 45 + Math.round(liveText.length / 30)));
      });

      setLoading(false);
      if (text && text.trim()) {
        handleExtractionSuccess(text);
        showToast(total > 1 ? `সবগুলো (${toBengaliNumber(total)}টি) পেজ একসাথে সফলভাবে রূপান্তর সম্পন্ন হয়েছে!` : 'AI দিয়ে ডকুমেন্ট রূপান্তর সম্পন্ন হয়েছে!', 'success');
      } else {
        showToast('কোনো টেক্সট পাওয়া যায়নি।', 'warning');
      }
    } catch (err) {
      setLoading(false);
      showToast(`ত্রুটি: ${err.message}`, 'error');
    }
  }

  // Gemini Execution Engine: sends ALL media parts in 1 single contents array with live SSE Streaming
  async function executeGeminiRequest(apiKey, mediaInput, onStreamChunk = null) {
    let currentApiKey = (apiKey && apiKey.trim().length > 10) ? apiKey.trim() : (getBackupApiKey() || getActiveApiKey());

    let mediaItems = [];
    if (Array.isArray(mediaInput)) {
      mediaItems = mediaInput;
    } else if (typeof mediaInput === 'object' && mediaInput.data) {
      mediaItems = [mediaInput];
    } else if (typeof mediaInput === 'string') {
      mediaItems = [{ data: mediaInput, mimeType: 'image/jpeg' }];
    }

    // Build the unified contents parts array containing the prompt followed by ALL images/pages
    const parts = [{ text: GEMINI_PROMPT }];
    for (const item of mediaItems) {
      const cleanBase64 = item.data.includes('base64,')
        ? item.data.split('base64,')[1]
        : item.data;
      const finalMime = item.mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg';
      parts.push({
        inlineData: { mimeType: finalMime, data: cleanBase64 }
      });
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    let candidateModels = [
      'gemini-2.5-flash',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-flash-latest',
      'gemini-3.7-flash',
      'gemini-pro-latest'
    ];

    if (state.selectedModel && state.selectedModel !== 'auto') {
      candidateModels = [state.selectedModel, ...candidateModels.filter(m => m !== state.selectedModel)];
    }

    let lastError = null;
    const BACKOFF_DELAYS = [2000, 4000, 8000]; // 2s -> 4s -> 8s exponential backoff

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      let retryCount = 0;
      let modelSucceeded = false;

      while (retryCount <= BACKOFF_DELAYS.length) {
        if (retryCount > 0) {
          const delayMs = BACKOFF_DELAYS[retryCount - 1] + Math.floor(Math.random() * 300);
          const delaySec = Math.round(delayMs / 1000);
          setLoading(true, `[${model} কোটা ব্যস্ত] ${toBengaliNumber(delaySec)} সেকেন্ড অপেক্ষা করে পুনরায় চেষ্টা করা হচ্ছে (চেষ্টা ${toBengaliNumber(retryCount)}/৩)...`, 50 + (i * 7));
          await sleep(delayMs);
        }

        // 1. Try Fast Real-Time SSE Stream Endpoint
        const streamEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${currentApiKey}`;

        try {
          const res = await fetchWithTimeout(streamEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }, REQUEST_TIMEOUT_MS);

          if (res.status === 404) {
            // Model not supported, break inner loop to try next model
            break;
          }

          if (res.status === 429 || res.status === 503) {
            retryCount++;
            if (retryCount <= BACKOFF_DELAYS.length) {
              lastError = new Error(`${model} রেট লিমিট (HTTP ${res.status})`);
              continue; // Retry with next backoff
            } else {
              const nextModel = candidateModels[i + 1] || 'বিকল্প মডেল';
              setLoading(true, `[${model} লিমিট শেষ] বিকল্প মডেল (${nextModel})-এ সুইচ হচ্ছে...`, 50 + ((i + 1) * 7));
              lastError = new Error(`${model} রেট লিমিট অতিক্রম করেছে।`);
              break; // Exhausted retries, proceed to next model
            }
          }

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${res.status}`;
            if (res.status === 400 && errMsg.includes('API_KEY_INVALID')) {
              const backupKey = getBackupApiKey();
              if (currentApiKey !== backupKey) {
                currentApiKey = backupKey;
                continue;
              }
              throw new Error('Gemini API Key সঠিক নয়। Google AI Studio থেকে সঠিক Key প্রদান করুন।');
            }
            lastError = new Error(errMsg);
            break; // Non-retryable error, try next candidate model
          }

          // 2. Read and parse SSE stream chunks with robust event-boundary buffering (Zero Data Loss)
          if (res.body && typeof res.body.getReader === 'function') {
            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let streamBuffer = '';
            let fullStreamedText = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              streamBuffer += decoder.decode(value, { stream: true });

              // Split on complete SSE event boundaries (\n\n or \r\n\r\n)
              const events = streamBuffer.split(/\r?\n\r?\n/);
              // Preserve the last partial chunk in streamBuffer
              streamBuffer = events.pop() || '';

              for (const ev of events) {
                if (!ev.trim()) continue;
                const lines = ev.split(/\r?\n/);
                let eventPayload = '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data:')) {
                    const dataPart = trimmed.slice(5).trim();
                    if (dataPart && dataPart !== '[DONE]') {
                      eventPayload += (eventPayload ? '\n' : '') + dataPart;
                    }
                  }
                }

                if (!eventPayload) continue;

                try {
                  const chunkObj = JSON.parse(eventPayload);
                  const candidates = chunkObj.candidates || [];
                  for (const cand of candidates) {
                    const partsList = cand.content?.parts || [];
                    for (const p of partsList) {
                      if (p.text) {
                        fullStreamedText += p.text;
                        if (onStreamChunk) onStreamChunk(fullStreamedText);
                      }
                    }
                  }
                } catch (pe) {
                  // Fallback: Attempt line by line parsing if multiple JSON payloads were joined
                  const splitLines = eventPayload.split('\n');
                  for (const sLine of splitLines) {
                    try {
                      const chunkObj = JSON.parse(sLine);
                      const text = chunkObj.candidates?.[0]?.content?.parts?.[0]?.text || '';
                      if (text) {
                        fullStreamedText += text;
                        if (onStreamChunk) onStreamChunk(fullStreamedText);
                      }
                    } catch (pe2) {
                      // Keep partial line in streamBuffer for next read packet
                      streamBuffer = `data: ${sLine}\n\n` + streamBuffer;
                    }
                  }
                }
              }
            }

            // Flush any remaining final data
            if (streamBuffer.trim().startsWith('data:')) {
              const remaining = streamBuffer.trim().slice(5).trim();
              if (remaining && remaining !== '[DONE]') {
                try {
                  const chunkObj = JSON.parse(remaining);
                  const text = chunkObj.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (text) {
                    fullStreamedText += text;
                    if (onStreamChunk) onStreamChunk(fullStreamedText);
                  }
                } catch (e) { /* ignore end */ }
              }
            }

            if (fullStreamedText.trim()) {
              return cleanOcrResponse(fullStreamedText);
            }
          }

          // 3. Standard non-streaming fallback
          const fallbackRes = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }, REQUEST_TIMEOUT_MS);

          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json().catch(() => ({}));
            const fbCandidate = fbData.candidates?.[0];
            if (fbCandidate && fbCandidate.content && fbCandidate.content.parts) {
              return cleanOcrResponse(fbCandidate.content.parts.map(p => p.text || '').join('\n'));
            }
          }

        } catch (err) {
          if (err.name === 'AbortError') {
            lastError = new Error(`${model} রেসপন্স দিতে দেরি করছে, পরের মডেল চেষ্টা করা হচ্ছে...`);
            break;
          }
          if (err.message.includes('API Key') || err.message.includes('Safety Filter')) {
            throw err;
          }
          lastError = err;
          break;
        }
      }
    }

    // Cooldown auto-retry on fallback model
    try {
      setLoading(true, 'বিকল্প ব্যাকআপ মডেলে স্বয়ংক্রিয় রিকভারি চেষ্টা চলছে...', 88);
      await sleep(1500);
      const retryModel = 'gemini-2.5-flash-lite';
      const retryEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${retryModel}:generateContent?key=${currentApiKey}`;
      const retryRes = await fetchWithTimeout(retryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, REQUEST_TIMEOUT_MS);

      if (retryRes.ok) {
        const retryData = await retryRes.json().catch(() => ({}));
        const parts = retryData.candidates?.[0]?.content?.parts;
        if (parts && parts.length > 0) {
          return cleanOcrResponse(parts.map(p => p.text || '').join('\n'));
        }
      }
    } catch (retryErr) { /* ignore */ }

    // Dynamic Discovery Fallback
    try {
      setLoading(true, 'আপনার API Key-এর জন্য উপলব্ধ মডেল তালিকা খোঁজা হচ্ছে...', 92);
      const listRes = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${currentApiKey}`, {}, 6000);
      if (listRes.ok) {
        const listData = await listRes.json();
        const available = (listData.models || [])
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && m.name)
          .map(m => m.name.replace('models/', ''))
          .filter(m => m.includes('flash') || m.includes('pro'));

        for (const dynModel of available) {
          if (candidateModels.includes(dynModel)) continue;
          try {
            const dynRes = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${dynModel}:generateContent?key=${currentApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }, REQUEST_TIMEOUT_MS);

            if (dynRes.ok) {
              const dynData = await dynRes.json();
              const parts = dynData?.candidates?.[0]?.content?.parts;
              if (parts && parts.length > 0) {
                return cleanOcrResponse(parts.map(p => p.text || '').join('\n'));
              }
            }
          } catch (dynErr) { /* try next */ }
        }
      }
    } catch (e) { /* ignore */ }

    throw new Error(lastError?.message || 'Gemini API থেকে কোনো টেক্সট পাওয়া যায়নি।');
  }

  async function runGasProxyOcr() {
    const queue = state.filesQueue.length > 0
      ? state.filesQueue
      : [{ file: state.selectedFile, mimeType: state.imageMimeType, base64: state.imageBase64, name: 'ফাইল' }];
    const total = queue.length;

    setLoading(true, `সবগুলো (${toBengaliNumber(total)}টি) ফাইল একসাথে প্রক্সির মাধ্যমে পাঠানো হচ্ছে...`, 35);

    try {
      const mediaItems = await Promise.all(queue.map(async (item) => {
        const b64 = await ensureBase64(item);
        const cleanBase64 = b64.includes('base64,') ? b64.split('base64,')[1] : b64;
        return {
          imageBase64: cleanBase64,
          mimeType: item.mimeType
        };
      }));

      const postBody = mediaItems.length === 1
        ? { imageBase64: mediaItems[0].imageBase64, mimeType: mediaItems[0].mimeType }
        : { images: mediaItems, imageBase64: mediaItems[0].imageBase64, mimeType: mediaItems[0].mimeType };

      const res = await fetchWithTimeout(state.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(postBody)
      }, REQUEST_TIMEOUT_MS * 2);

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'GAS Proxy Error');

      state.freeUsesCount += 1;
      localStorage.setItem(STORAGE_KEYS.FREE_COUNT, state.freeUsesCount.toString());
      updateBadges();

      handleExtractionSuccess(result.extractedText);
      showToast(`সফলভাবে এক্সট্রাক্ট করা হয়েছে! (${MAX_FREE_USES - state.freeUsesCount} টি ফ্রি ক্রেডিট বাকি)`, 'success');
    } catch (e) {
      const msg = e.name === 'AbortError' ? 'রিকোয়েস্ট টাইমআউট হয়েছে' : e.message;
      showToast(`প্রক্সি ত্রুটি: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function runDemoSimulation() {
    setLoading(true, 'ইমেজ অপ্টিমাইজেশন ও নয়েজ ফিল্টারিং...', 40);
    await sleep(200);
    setLoading(true, 'বাংলা যুক্তবর্ণ ও গাণিতিক সমীকরণ রিকগনিশন...', 85);
    await sleep(200);

    const demoText = `মেসার্স শাহ আলম ট্রেডার্স
ফুলবাড়ী, দিনাজপুর। ফোন: 01717-101919

বিষয়: পণ্য সরবরাহ বিবরণী ও মূল্য তালিকা

| ক্রমিক | পণ্যের বিবরণ | পরিমাণ | একক দর (টাকা) | মোট মূল্য (টাকা) |
|---|---|---|---|---|
| ০১ | মিনিকেট চাল | ৫০ বস্তা | ৩,২০০/- | ১,৬০,০০০/- |
| ০২ | নাজিরশাইল চাল | ৩০ বস্তা | ৩,৫০০/- | ১,০৫,০০০/- |
| ০৩ | সয়াবিন তেল (৫ লিটার) | ২০ কার্টুন | ৪,২০০/- | ৮৪,০০০/- |
| ০৪ | মসুর ডাল (দেশি) | ১০ বস্তা | ৬,০০০/- | ৬০,০০০/- |

সর্বমোট মূল্য: ৪,০৯,০০০/- (চার লক্ষ নয় হাজার টাকা মাত্র)

১. গণিত সমীকরণ মডেল:
\\[ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\]`;

    handleExtractionSuccess(demoText);
    setLoading(false);
    showToast('অফলাইন ডেমো কনভার্সন সফল হয়েছে!', 'success');
  }

  function handleExtractionSuccess(unicodeText) {
    const cleaned = cleanOcrResponse(unicodeText);
    state.unicodeText = cleaned;
    if (elements.outputUnicodeArea) elements.outputUnicodeArea.value = cleaned;
    recalculateBijoyFromUnicode();

    if (elements.successCard) {
      elements.successCard.classList.remove('hidden');
      elements.successCard.classList.add('flex');
      setTimeout(() => {
        elements.successCard?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }

  function recalculateBijoyFromUnicode() {
    if (window.BanglaConverter && typeof window.BanglaConverter.unicodeToBijoy === 'function') {
      state.bijoyText = window.BanglaConverter.unicodeToBijoy(state.unicodeText);
      if (elements.outputBijoyArea) elements.outputBijoyArea.value = state.bijoyText;
    } else {
      state.bijoyText = state.unicodeText;
      if (elements.outputBijoyArea) elements.outputBijoyArea.value = state.unicodeText;
    }
  }

  async function copyCurrentText() {
    const text = state.unicodeText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('টেক্সট সফলভাবে ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
    } catch (e) {
      showToast('টেক্সট কপি সম্পন্ন হয়েছে!', 'success');
    }
  }

  async function sendToMainConverter() {
    if (!state.unicodeText || !state.unicodeText.trim()) {
      showToast('কোনো টেক্সট পাওয়া যায়নি!', 'warning');
      return;
    }

    showToast('ফয়জার কনভার্টারে ফাইল প্রস্তুত ও আপলোড করা হচ্ছে...', 'info');

    try {
      const docxBlob = await createDocxBlob(state.unicodeText, false);
      const rawName = state.selectedFile?.name || state.filesQueue?.[0]?.name || 'OCR_Document';
      const baseName = rawName.replace(/\.[^/.]+$/, '');
      const docxFile = new File([docxBlob], `${baseName}.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        lastModified: Date.now()
      });

      const textTabBtn = document.querySelector('.tool-switch-btn[data-tool-tab="text"]');
      if (textTabBtn) textTabBtn.click();

      const wizardSubTabFileBtn = document.getElementById('wizard-subtab-file-btn');
      if (wizardSubTabFileBtn) wizardSubTabFileBtn.click();

      if (typeof window.initiateFileScan === 'function') {
        await window.initiateFileScan(docxFile);
      } else {
        const wizardFileInput = document.getElementById('wizardFileInput');
        if (wizardFileInput) {
          const dt = new DataTransfer();
          dt.items.add(docxFile);
          wizardFileInput.files = dt.files;
          wizardFileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      const mainSource = document.getElementById('source-text');
      if (mainSource) {
        mainSource.value = state.unicodeText;
        mainSource.dispatchEvent(new Event('input', { bubbles: true }));
      }

      showToast('ফাইলটি সফলভাবে ফয়জার কনভার্টারে আপলোড ও স্ক্যান হয়েছে!', 'success');
    } catch (e) {
      console.error('Send to converter error:', e);
      showToast(`ফয়জার কনভার্টারে পাঠাতে সমস্যা: ${e.message}`, 'error');
    }
  }

  // =========================================================================
  // DOCUMENT EXPORT ENGINE (RTF .doc + OOXML .docx WITH REAL TABLES & MATH)
  // =========================================================================

  const CP1252_MAP_TABLE = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
    0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
    0x017E: 0x9E, 0x0178: 0x9F
  };

  function encodeRtfText(str) {
    if (!str) return '';
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code === 0x5C) out += '\\\\';
      else if (code === 0x7B) out += '\\{';
      else if (code === 0x7D) out += '\\}';
      else if (code >= 0x20 && code <= 0x7E) {
        out += str[i];
      } else if (CP1252_MAP_TABLE[code] !== undefined) {
        out += "\\'" + CP1252_MAP_TABLE[code].toString(16).padStart(2, '0');
      } else if (code >= 0x80 && code <= 0xFF) {
        out += "\\'" + code.toString(16).padStart(2, '0');
      } else {
        out += `\\u${code}?`;
      }
    }
    return out;
  }

  function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function sanitizeMathBengaliSeparation(rawText) {
    if (!rawText || typeof rawText !== 'string') return rawText || '';
    let s = rawText;

    s = s.replace(/\\text(?:rm|md|bf|it)?\{\s*([^{}]*?[\u0980-\u09FF][^{}]*?)\s*\}/g, '$1');

    s = s.replace(/\$\$([\s\S]*?)\$\$|\$([^\$]+?)\$|\\\[([\s\S]*?\\\])|\\\(([\s\S]*?)\\\)/g, (match, d1, s1, b1, p1) => {
      const isDouble = Boolean(d1 || b1);
      const inner = d1 || s1 || b1 || p1 || '';

      if (!/[\u0980-\u09FF]/.test(inner)) {
        return match;
      }

      const tokenRegex = /([^\u0980-\u09FF"'”’]+)|(["'”’]*[\u0980-\u09FF]+(?:[\s\-_/]+[\u0980-\u09FF]+)*["'”’]*)/g;
      let parts = [];
      let m;
      while ((m = tokenRegex.exec(inner)) !== null) {
        if (m[1]) {
          const mathChunk = m[1].trim();
          if (mathChunk) parts.push(isDouble ? `$$${mathChunk}$$` : `$${mathChunk}$`);
        } else if (m[2]) {
          const bnChunk = m[2].trim();
          if (bnChunk) parts.push(bnChunk);
        }
      }

      return parts.join(' ');
    });

    s = s.replace(/\$\$\s*\$\$/g, '').replace(/\$\s*\$/g, '');
    return s;
  }

  // Sanitizer: Strips unwanted asterisks around Roman numerals & removes mark brackets [১], [২] from questions
  function suppressHallucinatedRepetitions(text) {
    if (!text || typeof text !== 'string') return text || '';
    const lines = text.split('\n');
    const result = [];
    let lastNonEmpty = '';
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed && trimmed === lastNonEmpty) {
        continue;
      }
      if (trimmed) lastNonEmpty = trimmed;
      result.push(lines[i]);
    }
    return result.join('\n').trim();
  }

  function cleanOcrResponse(rawText) {
    if (!rawText) return '';
    let text = suppressHallucinatedRepetitions(sanitizeMathBengaliSeparation(rawText.trim()));

    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
    }

    text = text.replace(/^[=\-\s]*Start of OCR[^\n]*[=\-\s]*\n?/gim, '');
    text = text.replace(/^[=\-\s]*End of OCR[^\n]*[=\-\s]*\n?/gim, '');
    text = text.replace(/^[=\-\s]*Page\s*\d+[^\n]*[=\-\s]*\n?/gim, '');

    // 1. Clean asterisks around Roman numerals: *i.* -> i., *ii.* -> ii., *iii.* -> iii.
    text = text.replace(/\*+\s*(i{1,4}|iv|v|vi{0,3}|ix|x)\s*\.\s*\*+/gi, '$1.');
    
    // 2. Clean asterisks around inline Roman numerals: *i*, *ii*, *iii*, *i, ii*, *i ও ii*, *i, ii ও iii*
    text = text.replace(/\*+\s*([iIvVxX0-9]+(?:\s*,\s*[iIvVxX0-9]+)*(?:\s*ও\s*[iIvVxX0-9]+)*)\s*\*+/g, '$1');
    text = text.replace(/\*+([iIvVxX]+)\*+/g, '$1');

    // 3. Clean leading bullet asterisks on numbered lists: * i. -> i., * 1. -> 1.
    text = text.replace(/^[\*\-•]\s*([iIvVxX0-9\u0980-\u09FF]+\.)/gm, '$1');

    const rawLines = text.split('\n');
    const cleanedLines = [];

    for (let i = 0; i < rawLines.length; i++) {
      let l = rawLines[i];
      const trimmed = l.trim();

      // Skip OCR delimiter lines
      if (/^[=\-]{2,}/.test(trimmed) && /ocr/i.test(trimmed)) {
        continue;
      }

      // 4. Remove score marks [১], [২], [৩], [৪], [৮], [১০], (১), (২) at the end of creative questions
      // e.g. "ক. রূপান্তরক কাকে বলে? [১]" -> "ক. রূপান্তরক কাকে বলে?"
      l = l.replace(/(\?|।|[a-zA-Z\u0980-\u09FF"'”’\$])\s*\[\s*[০-��0-9\s]+\s*\]\s*$/g, '$1');
      l = l.replace(/(\?|।|[a-zA-Z\u0980-\u09FF"'”’\$])\s*[\(（]\s*[০-৯0-9\s]+\s*[\)）]\s*$/g, '$1');
      
      // If line is a CQ subquestion (e.g. ক. ... ১) with trailing mark digit, remove trailing digit
      if (/^[কখগঘabcd]\./i.test(trimmed)) {
        l = l.replace(/(\?|।)\s+[০-৯0-9]\s*$/g, '$1');
      }

      cleanedLines.push(l);
    }

    let finalCleaned = cleanedLines.join('\n').trim();
    if (typeof EquationConverter !== 'undefined' && typeof EquationConverter.autoWrapLatex === 'function') {
      finalCleaned = EquationConverter.autoWrapLatex(finalCleaned);
    }
    return finalCleaned;
  }

  function parseRichRuns(rawText) {
    if (!rawText) return [];

    let clean = rawText
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\pm/g, '±')
      .replace(/\\leq/g, '≤')
      .replace(/\\geq/g, '≥')
      .replace(/\\neq/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\theta/g, 'θ')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\pi/g, 'π')
      .replace(/\\Omega/g, 'Ω')
      .replace(/\\mu/g, 'µ')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\degree|\^\\circ/g, '°')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\quad|\\qquad/g, '   ')
      .replace(/\$/g, '');

    const rx = /([a-zA-Z0-9\u0980-\u09FF]+)([_^])(\{([^}]+)\}|([a-zA-Z0-9\u0980-\u09FF]))/g;
    const runs = [];
    let lastIdx = 0;
    let match;

    while ((match = rx.exec(clean)) !== null) {
      const pre = clean.substring(lastIdx, match.index);
      if (pre) runs.push({ text: pre });

      const base = match[1];
      const op = match[2];
      const scriptVal = match[4] || match[5];

      runs.push({ text: base });
      if (op === '_') runs.push({ text: scriptVal, isSubscript: true });
      else if (op === '^') runs.push({ text: scriptVal, isSuperscript: true });

      lastIdx = rx.lastIndex;
    }

    const post = clean.substring(lastIdx);
    if (post) runs.push({ text: post });

    return runs.length > 0 ? runs : [{ text: clean }];
  }

  function isTableDividerLine(line) {
    const trimmed = (line || '').trim();
    return /^\s*\|?[\s\-:]+(\|[\s\-:]+)+\|?\s*$/.test(trimmed) && trimmed.includes('-');
  }

  function isTableRowCandidate(line) {
    const trimmed = (line || '').trim();
    if (!trimmed) return false;
    if (isTableDividerLine(trimmed)) return true;
    if (!trimmed.includes('|')) return false;
    const parts = trimmed.replace(/^\s*\||\|\s*$/g, '').split('|');
    return parts.length >= 2;
  }

  function parseDocumentBlocks(text) {
    if (!text || !text.trim()) return [];

    if (text.includes('<table') || text.includes('<TABLE')) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const body = doc.body;
        const blocks = [];

        for (const node of Array.from(body.childNodes)) {
          if (node.nodeType === 1) {
            const tag = node.tagName.toLowerCase();
            if (tag === 'table') {
              const rows = [];
              const trs = node.querySelectorAll('tr');
              for (const tr of Array.from(trs)) {
                const cells = [];
                const tds = tr.querySelectorAll('th, td');
                for (const td of Array.from(tds)) cells.push(td.textContent.trim());
                if (cells.length > 0) rows.push(cells);
              }
              if (rows.length > 0) blocks.push({ type: 'table', rows });
            } else {
              const textContent = node.textContent.trim();
              if (textContent) {
                const isHeading = /^h[1-6]$/.test(tag);
                blocks.push({ type: 'paragraph', text: isHeading ? `**${textContent}**` : textContent });
              }
            }
          } else if (node.nodeType === 3 && node.textContent.trim()) {
            blocks.push({ type: 'paragraph', text: node.textContent.trim() });
          }
        }

        if (blocks.length > 0) return blocks;
      } catch (e) {
        console.warn('DOM parsing failed, falling back to text parsing:', e);
      }
    }

    const lines = text.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (isTableRowCandidate(trimmed)) {
        const tableLines = [];
        while (i < lines.length && isTableRowCandidate(lines[i].trim())) {
          tableLines.push(lines[i].trim());
          i++;
        }

        const hasDivider = tableLines.some(l => isTableDividerLine(l));
        if (hasDivider || tableLines.length >= 2) {
          const parsedRows = [];
          for (const tLine of tableLines) {
            if (isTableDividerLine(tLine)) continue;
            const cleanLine = tLine.replace(/^\s*\|/, '').replace(/\|\s*$/, '');
            const cells = cleanLine.split('|').map(c => c.trim());
            if (cells.length > 0 && cells.some(c => c.length > 0)) {
              parsedRows.push(cells);
            }
          }

          if (parsedRows.length > 0) {
            blocks.push({ type: 'table', rows: parsedRows });
            continue;
          }
        } else {
          for (const tLine of tableLines) {
            blocks.push({ type: 'paragraph', text: tLine });
          }
          continue;
        }
      }

      blocks.push({ type: 'paragraph', text: line });
      i++;
    }

    return blocks;
  }

  function renderRunsForRtf(text, isBijoy, fontSizeHalfPt) {
    if (!text || !text.trim()) return '';
    if (typeof EquationConverter !== 'undefined' && hasLatexMath(text)) {
      const segments = EquationConverter.splitTextAndMath(text);
      let rtf = '';
      for (const seg of segments) {
        if (seg.type === 'math') {
          if (EquationConverter.needsEqField && !EquationConverter.needsEqField(seg.value)) {
            const clean = EquationConverter.sanitizeSimpleMath ? EquationConverter.sanitizeSimpleMath(seg.value, isBijoy) : seg.value.replace(/\$/g, '');
            rtf += renderSimpleMathRtf(clean, isBijoy, fontSizeHalfPt, false);
          } else {
            const eqCode = EquationConverter.latexToEqField(seg.value, isBijoy);
            rtf += renderEquationForRtf(eqCode, isBijoy, fontSizeHalfPt, false);
          }
        } else if (seg.value) {
          rtf += renderRunsForRtfPlain(seg.value, isBijoy, fontSizeHalfPt, false);
        }
      }
      return rtf;
    }
    return renderRunsForRtfPlain(text, isBijoy, fontSizeHalfPt, false);
  }

  function encodeEqInst(str) {
    if (!str) return '';
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c === 0x7B) out += '\\{';
      else if (c === 0x7D) out += '\\}';
      else if (c >= 0x20 && c <= 0x7E) out += str[i];
      else out += '\\u' + c + '?';
    }
    return out;
  }

  function plainEqApprox(eqCode) {
    return String(eqCode || '')
      .replace(/\\F\(([^,]*),([^)]*)\)/g, '($1)/($2)')
      .replace(/\\R\((?:[^,]*,)?([^)]*)\)/g, '√($1)')
      .replace(/\\S\\up4\((.*?)\)/g, '$1 ')
      .replace(/\\S\\do4\((.*?)\)/g, '$1 ')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function renderEquationForRtf(eqCode, isBijoy, fontSizeHalfPt, isBold) {
    const boldPrefix = isBold ? '\\b ' : '';
    const boldSuffix = isBold ? '\\b0 ' : '';
    const inst = encodeEqInst(eqCode);
    const plain = plainEqApprox(eqCode);
    const visible = isBijoy && typeof window.BanglaConverter !== 'undefined'
      ? window.BanglaConverter.unicodeToBijoy(plain)
      : plain;
    return `{\\field{\\*\\fldinst ${boldPrefix}{\\f0\\fs${fontSizeHalfPt} EQ ${inst}}${boldSuffix}}{\\fldrslt ${boldPrefix}{\\f0\\fs${fontSizeHalfPt} ${encodeRtfText(visible || ' ')}}${boldSuffix}}}`;
  }

  function renderSimpleMathRtf(clean, isBijoy, fontSizeHalfPt, isBold) {
    const boldPrefix = isBold ? '\\b ' : '';
    const boldSuffix = isBold ? '\\b0 ' : '';
    return `{\\f0\\fs${fontSizeHalfPt} ${boldPrefix}${encodeRtfText(isBijoy && typeof window.BanglaConverter !== 'undefined' ? window.BanglaConverter.unicodeToBijoy(clean) : clean)}${boldSuffix}}`;
  }

  function renderRunsForRtfPlain(text, isBijoy, fontSizeHalfPt, isBold) {
    if (!text || !text.trim()) return '';

    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    let rtf = '';

    for (const part of parts) {
      if (!part) continue;
      const bold = isBold || (part.startsWith('**') && part.endsWith('**'));
      const cleanText = (part.startsWith('**') && part.endsWith('**')) ? part.slice(2, -2) : part;

      const mathRuns = parseRichRuns(cleanText);

      for (const mRun of mathRuns) {
        const segments = window.BanglaConverter && typeof window.BanglaConverter.splitMixedBengaliAndEnglish === 'function'
          ? window.BanglaConverter.splitMixedBengaliAndEnglish(mRun.text)
          : [{ type: 'bengali', text: mRun.text }];

        for (const seg of segments) {
          const boldPrefix = bold ? '\\b ' : '';
          const boldSuffix = bold ? '\\b0 ' : '';
          const subPrefix = mRun.isSubscript ? '\\sub ' : (mRun.isSuperscript ? '\\super ' : '');
          const subSuffix = (mRun.isSubscript || mRun.isSuperscript) ? '\\nosupersub ' : '';

          if (seg.type === 'english' || !isBijoy) {
            const font = isBijoy ? '\\f1' : '\\f0';
            rtf += `{${font}\\fs${fontSizeHalfPt} ${boldPrefix}${subPrefix}${encodeRtfText(seg.text)}${subSuffix}${boldSuffix}}`;
          } else {
            const bijoyText = window.BanglaConverter ? window.BanglaConverter.unicodeToBijoy(seg.text) : seg.text;
            rtf += `{\\f0\\fs${fontSizeHalfPt} ${boldPrefix}${subPrefix}${encodeRtfText(bijoyText)}${subSuffix}${boldSuffix}}`;
          }
        }
      }
    }
    return rtf;
  }

  function hasLatexMath(text) {
    return /\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/.test(text);
  }

  function renderRunsForOoxml(text, isBijoy, fontSizeHalfPt) {
    if (!text || !text.trim()) return '';
    if (typeof EquationConverter !== 'undefined' && hasLatexMath(text)) {
      const segments = EquationConverter.splitTextAndMath(text);
      let runsXml = '';
      for (const seg of segments) {
        if (seg.type === 'math') {
          if (typeof EquationConverter !== 'undefined' && typeof EquationConverter.latexToOmml === 'function') {
            runsXml += EquationConverter.latexToOmml(seg.value, isBijoy);
          } else {
            const eqCode = EquationConverter.latexToEqField(seg.value, isBijoy);
            runsXml += renderEquationForOoxml(eqCode, isBijoy, fontSizeHalfPt, false);
          }
        } else if (seg.value) {
          runsXml += renderRunsForOoxmlPlain(seg.value, isBijoy, fontSizeHalfPt, false);
        }
      }
      return runsXml;
    }
    return renderRunsForOoxmlPlain(text, isBijoy, fontSizeHalfPt, false);
  }

  function renderEquationForOoxml(eqCode, isBijoy, fontSizeHalfPt, isBold) {
    const bengaliFont = isBijoy ? 'SutonnyMJ' : 'Kalpurush';
    const scriptSz = Math.round(fontSizeHalfPt * 0.67);
    const boldTag = isBold ? '<w:b/>' : '';

    const rpr = (fontName, sz) => `      <w:rPr>
        <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/>
        <w:sz w:val="${sz}"/>
        <w:szCs w:val="${sz}"/>
        ${boldTag}
      </w:rPr>`;

    let xml = '';
    xml += `      <w:r>
${rpr('Times New Roman', fontSizeHalfPt)}
        <w:fldChar w:fldCharType="begin"/>
      </w:r>\n`;

    const fullEq = ' EQ ' + eqCode + ' ';
    const tokens = (typeof EquationConverter !== 'undefined' && typeof EquationConverter.tokenizeEqCode === 'function')
      ? EquationConverter.tokenizeEqCode(fullEq)
      : [{ text: fullEq, italic: false, isScript: false, isQuotedText: false }];

    for (const t of tokens) {
      if (!t || !t.text) continue;
      const isBn = t.isQuotedText && typeof window.BanglaConverter !== 'undefined'
        && (window.BanglaConverter.hasBengaliText && window.BanglaConverter.hasBengaliText(t.text) || isBijoy);
      const fontName = isBn ? bengaliFont : 'Times New Roman';
      const sz = t.isScript ? scriptSz : fontSizeHalfPt;
      const italicTag = t.italic && !isBn ? '<w:i/><w:iCs/>' : '';
      xml += `      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/>
          <w:sz w:val="${sz}"/>
          <w:szCs w:val="${sz}"/>
          ${boldTag}
          ${italicTag}
        </w:rPr>
        <w:instrText xml:space="preserve">${escapeXml(t.text)}</w:instrText>
      </w:r>\n`;
    }

    xml += `      <w:r>
${rpr('Times New Roman', fontSizeHalfPt)}
        <w:fldChar w:fldCharType="end"/>
      </w:r>\n`;
    return xml;
  }

  function renderSimpleMathOoxml(tok, isBijoy, fontSizeHalfPt, isBold) {
    const boldTag = isBold ? '<w:b/>' : '';
    const isBn = tok.isBengali || (typeof window.BanglaConverter !== 'undefined'
      && window.BanglaConverter.hasBengaliText && window.BanglaConverter.hasBengaliText(tok.text));
    const fontName = isBn ? (isBijoy ? 'SutonnyMJ' : 'Kalpurush') : 'Times New Roman';
    const italicTag = tok.italic && !isBn ? '<w:i/><w:iCs/>' : '';
    return `      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/>
          <w:sz w:val="${fontSizeHalfPt}"/>
          <w:szCs w:val="${fontSizeHalfPt}"/>
          ${boldTag}
          ${italicTag}
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(tok.text)}</w:t>
      </w:r>\n`;
  }

  function renderRunsForOoxmlPlain(text, isBijoy, fontSizeHalfPt, isBold) {
    if (!text || !text.trim()) return '';

    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    let runsXml = '';

    for (const part of parts) {
      if (!part) continue;
      const bold = isBold || (part.startsWith('**') && part.endsWith('**'));
      const cleanText = (part.startsWith('**') && part.endsWith('**')) ? part.slice(2, -2) : part;

      const mathRuns = parseRichRuns(cleanText);

      for (const mRun of mathRuns) {
        const segments = window.BanglaConverter && typeof window.BanglaConverter.splitMixedBengaliAndEnglish === 'function'
          ? window.BanglaConverter.splitMixedBengaliAndEnglish(mRun.text)
          : [{ type: 'bengali', text: mRun.text }];

        for (const seg of segments) {
          const boldTag = bold ? '<w:b/>' : '';
          const vertAlignTag = mRun.isSubscript
            ? '<w:vertAlign w:val="subscript"/>'
            : (mRun.isSuperscript ? '<w:vertAlign w:val="superscript"/>' : '');

          if (seg.type === 'english') {
            runsXml += `      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
          <w:sz w:val="${fontSizeHalfPt}"/>
          <w:szCs w:val="${fontSizeHalfPt}"/>
          ${boldTag}
          ${vertAlignTag}
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(seg.text)}</w:t>
      </w:r>\n`;
          } else {
            const targetText = isBijoy && window.BanglaConverter ? window.BanglaConverter.unicodeToBijoy(seg.text) : seg.text;
            const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';
            runsXml += `      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/>
          <w:sz w:val="${fontSizeHalfPt}"/>
          <w:szCs w:val="${fontSizeHalfPt}"/>
          ${boldTag}
          ${vertAlignTag}
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(targetText)}</w:t>
      </w:r>\n`;
          }
        }
      }
    }
    return runsXml;
  }

  async function downloadWordDocument(format) {
    const text = state.unicodeText;
    if (!text || !text.trim()) {
      showToast('ডাউনলোড করার মতো কোনো টেক্সট নেই', 'warning');
      return;
    }

    const pageSizeVal = elements.pageSizeSelect ? elements.pageSizeSelect.value : 'a4';
    const marginVal = elements.pageMarginSelect ? elements.pageMarginSelect.value : 'normal';
    const fontSizeVal = elements.fontSizeSelect ? elements.fontSizeSelect.value : '14';
    const fontSizePt = parseInt(fontSizeVal, 10) || 14;

    const rawName = state.selectedFile?.name || state.filesQueue?.[0]?.name || 'Question_Paper';
    const baseName = rawName.replace(/\.[^/.]+$/, '');

    // FORMAT 1: Word 2003 .DOC (Direct Full-Fidelity Word 2003 SutonnyMJ Document)
    if (format === 'doc') {
      showToast(`ওয়ার্ড ২০০৩ (.doc) ফাইল প্রস্তুত হচ্ছে...`, 'info');

      try {
        let docBlob = null;
        if (typeof DocxHandler !== 'undefined' && typeof DocxHandler.createDocFromText === 'function') {
          docBlob = DocxHandler.createDocFromText(text, 'SutonnyMJ', true);
        } else if (typeof DocxToDocConverter !== 'undefined') {
          const docxBlob = await createDocxBlob(text, true, { pageSize: pageSizeVal, margin: marginVal, fontSize: fontSizeVal });
          const docxConverter = new DocxToDocConverter();
          const docResult = await docxConverter.convertDocxToDoc(docxBlob, {
            pageSize: pageSizeVal,
            preserveSutonny: true,
            optimizeForQuestionPaper: true
          });
          docBlob = docResult.blob || docResult.convertedBlob;
        }

        if (!docBlob) {
          throw new Error('Word 2003 (.doc) ফাইল প্রস্তুত করা যায়নি');
        }

        triggerDownload(docBlob, `${baseName}_Word2003.doc`);
        showToast(`ওয়ার্ড ২০০৩ (.doc - সুতন্নিএমজে) সফলভাবে ডাউনলোড হয়েছে!`, 'success');
      } catch (err) {
        console.error('Doc conversion error', err);
        showToast(`ওয়ার্ড ২০০৩ ফাইল তৈরিতে সমস্যা: ${err.message}`, 'error');
        throw err;
      }
      return;
    }

    // FORMAT 2: Modern Word .DOCX (Bijoy SutonnyMJ)
    if (format === 'bijoy_docx') {
      showToast(`বিজয় .DOCX তৈরি হচ্ছে...`, 'info');
      try {
        const blob = await createDocxBlob(text, true, { pageSize: pageSizeVal, margin: marginVal, fontSize: fontSizeVal });
        triggerDownload(blob, `${baseName}_Bijoy.docx`);
        showToast(`বিজয় .DOCX ডাউনলোড সম্পন্ন!`, 'success');
      } catch (err) {
        showToast(`DOCX তৈরিতে সমস্যা: ${err.message}`, 'error');
        throw err;
      }
      return;
    }

    // FORMAT 3: Modern Word .DOCX (Unicode)
    if (format === 'unicode_docx') {
      showToast(`ইউনিকোড .DOCX তৈরি হচ্ছে...`, 'info');
      try {
        const blob = await createDocxBlob(text, false, { pageSize: pageSizeVal, margin: marginVal, fontSize: fontSizeVal });
        triggerDownload(blob, `${baseName}_Unicode.docx`);
        showToast(`ইউনিকোড .DOCX ডাউনলোড সম্পন্ন!`, 'success');
      } catch (err) {
        showToast(`DOCX তৈরিতে সমস্যা: ${err.message}`, 'error');
        throw err;
      }
      return;
    }
  }

  async function createDocxBlob(text, isBijoy = false, customOptions = {}) {
    let ZipConstructor = (typeof JSZip !== 'undefined')
      ? JSZip
      : (typeof window !== 'undefined' && window.JSZip ? window.JSZip : (typeof global !== 'undefined' && global.JSZip ? global.JSZip : null));

    if (!ZipConstructor) {
      try {
        await ensureExternalScript('JSZip', 'js/jszip.min.js');
      } catch (e1) {
        try {
          await ensureExternalScript('JSZip', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        } catch (e2) { /* ignore */ }
      }
      ZipConstructor = (typeof JSZip !== 'undefined') ? JSZip : (typeof window !== 'undefined' ? window.JSZip : null);
    }

    if (!ZipConstructor) {
      if (typeof DocxHandler !== 'undefined' && typeof DocxHandler.createDocxFromText === 'function') {
        return await DocxHandler.createDocxFromText(text, { isBijoy });
      }
      throw new Error('JSZip লাইব্রেরি লোড হয়নি, অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে পেজটি রিফ্রেশ দিন');
    }

    const pageSizeVal = customOptions.pageSize || (elements.pageSizeSelect ? elements.pageSizeSelect.value : 'a4');
    const marginVal = customOptions.margin || (elements.pageMarginSelect ? elements.pageMarginSelect.value : 'normal');
    const fontSizeVal = customOptions.fontSize || (elements.fontSizeSelect ? elements.fontSizeSelect.value : '14');
    const fontSizePt = parseInt(fontSizeVal, 10) || 14;
    const fontSizeHalfPt = fontSizePt * 2;

    const PAGE_SIZES = {
      'a4': { w: 11906, h: 16838, name: 'A4' },
      'legal': { w: 12240, h: 20160, name: 'Legal' },
      'letter': { w: 12240, h: 15840, name: 'Letter' }
    };

    const MARGINS = {
      'normal': { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      'narrow': { top: 720, right: 720, bottom: 720, left: 720 },
      'moderate': { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      'wide': { top: 1800, right: 1800, bottom: 1800, left: 1800 }
    };

    const pageDim = PAGE_SIZES[pageSizeVal] || PAGE_SIZES['a4'];
    const pageMar = MARGINS[marginVal] || MARGINS['normal'];
    const printableWidth = pageDim.w - pageMar.left - pageMar.right;

    const blocks = parseDocumentBlocks(text);

    let bodyContentXml = '';

    for (const block of blocks) {
      if (block.type === 'paragraph') {
        const trimmed = block.text.trim();
        if (!trimmed) {
          bodyContentXml += `    <w:p>
      <w:pPr>
        <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${isBijoy ? 'SutonnyMJ' : 'Kalpurush'}" w:hAnsi="${isBijoy ? 'SutonnyMJ' : 'Kalpurush'}" w:cs="${isBijoy ? 'SutonnyMJ' : 'Kalpurush'}"/>
          <w:sz w:val="${fontSizeHalfPt}"/>
          <w:szCs w:val="${fontSizeHalfPt}"/>
        </w:rPr>
        <w:t xml:space="preserve"> </w:t>
      </w:r>
    </w:p>\n`;
        } else {
          const runsXml = renderRunsForOoxml(block.text, isBijoy, fontSizeHalfPt);
          bodyContentXml += `    <w:p>
      <w:pPr>
        <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
      </w:pPr>
${runsXml}    </w:p>\n`;
        }
      } else if (block.type === 'table') {
        const rows = block.rows;
        if (rows.length === 0) continue;
        const maxCols = Math.max(...rows.map(r => r.length));
        const colWidth = Math.floor(printableWidth / maxCols);

        const gridColsXml = Array(maxCols).fill(0).map(() => `<w:gridCol w:w="${colWidth}"/>`).join('');
        const rowsXml = rows.map((row, rIdx) => {
          const isHeader = (rIdx === 0);
          const trPr = isHeader ? '<w:trPr><w:tblHeader/></w:trPr>' : '';
          const cellsXml = Array(maxCols).fill(0).map((_, c) => {
            const cellText = row[c] || '';
            const cellRuns = renderRunsForOoxml(cellText, isBijoy, fontSizeHalfPt);
            return `        <w:tc>
          <w:tcPr>
            <w:tcW w:w="${colWidth}" w:type="dxa"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
              <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
              <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
              <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            </w:tcBorders>
            <w:vAlign w:val="top"/>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
            </w:pPr>
${cellRuns || '            <w:r><w:t xml:space="preserve"> </w:t></w:r>'}
          </w:p>
        </w:tc>`;
          }).join('\n');

          return `      <w:tr>${trPr}\n${cellsXml}\n      </w:tr>`;
        }).join('\n');

        bodyContentXml += `    <w:tbl>
      <w:tblPr>
        <w:tblStyle w:val="TableGrid"/>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        </w:tblBorders>
        <w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
      </w:tblPr>
      <w:tblGrid>${gridColsXml}</w:tblGrid>
${rowsXml}
    </w:tbl>
    <w:p/>\n`;
      }
    }

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  mc:Ignorable="w14">
  <w:body>
${bodyContentXml}
    <w:sectPr>
      <w:pgSz w:w="${pageDim.w}" w:h="${pageDim.h}"/>
      <w:pgMar w:top="${pageMar.top}" w:right="${pageMar.right}" w:bottom="${pageMar.bottom}" w:left="${pageMar.left}" w:header="709" w:footer="709" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="${isBijoy ? 'SutonnyMJ' : 'Times New Roman'}" w:hAnsi="${isBijoy ? 'SutonnyMJ' : 'Times New Roman'}" w:cs="${isBijoy ? 'SutonnyMJ' : 'Kalpurush'}"/>
        <w:sz w:val="${fontSizeHalfPt}"/>
        <w:szCs w:val="${fontSizeHalfPt}"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
    </w:pPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    const zip = new ZipConstructor();
    zip.file("[Content_Types].xml", contentTypesXml);
    zip.folder("_rels").file(".rels", relsXml);
    zip.folder("word").file("document.xml", documentXml);
    zip.folder("word").file("styles.xml", stylesXml);
    zip.folder("word").folder("_rels").file("document.xml.rels", docRelsXml);

    return await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function setLoading(loading, text = '', percent = 0) {
    state.isProcessing = loading;
    if (elements.convertBtn) elements.convertBtn.disabled = loading;
    if (loading) {
      if (elements.progressContainer) {
        elements.progressContainer.classList.remove('hidden');
        elements.progressContainer.classList.add('flex');
      }
      if (elements.progressStepText) elements.progressStepText.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-indigo-500 mr-2"></i> ${text}`;
      if (elements.progressBar) elements.progressBar.style.width = `${percent}%`;
      if (elements.progressPercent) elements.progressPercent.textContent = `${Math.round(percent)}%`;
      if (elements.convertBtnText) elements.convertBtnText.textContent = 'প্রসেসিং হচ্ছে...';
      if (elements.successCard) elements.successCard.classList.add('hidden');
    } else {
      if (elements.progressContainer) {
        elements.progressContainer.classList.add('hidden');
        elements.progressContainer.classList.remove('flex');
      }
      if (elements.convertBtnText) elements.convertBtnText.textContent = 'AI দিয়ে কনভার্ট ও ওয়ার্ড ফাইল তৈরি করুন';
    }
  }

  function toggleModal(modal, show) {
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  function saveByokKey() {
    const key = elements.byokInput.value.trim();
    if (!key) {
      showToast('অনুগ্রহ করে একটি সঠিক Gemini API Key প্রদান করুন', 'warning');
      return;
    }
    state.byokApiKey = key;
    state.demoMode = false;
    localStorage.setItem(STORAGE_KEYS.BYOK_KEY, key);
    localStorage.setItem('bengali_ocr_gemini_key', key);
    localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'false');
    if (elements.geminiKeyInput) elements.geminiKeyInput.value = key;
    if (elements.demoToggle) elements.demoToggle.checked = false;

    updateBadges();
    toggleModal(elements.byokModal, false);
    showToast('API Key সংরক্ষিত হয়েছে! লাইভ কনভার্সন শুরু হচ্ছে...', 'success');
    startOcrConversion();
  }

  function saveSettings() {
    state.demoMode = elements.demoToggle.checked;
    state.gasUrl = elements.gasUrlInput.value.trim();
    state.byokApiKey = elements.geminiKeyInput.value.trim();
    state.selectedModel = elements.modelSelect.value || 'auto';

    if (state.byokApiKey || state.gasUrl) {
      state.demoMode = elements.demoToggle.checked;
    }

    localStorage.setItem(STORAGE_KEYS.DEMO_MODE, state.demoMode.toString());
    localStorage.setItem(STORAGE_KEYS.GAS_URL, state.gasUrl);
    localStorage.setItem('bengali_ocr_gas_url', state.gasUrl);
    localStorage.setItem(STORAGE_KEYS.BYOK_KEY, state.byokApiKey);
    localStorage.setItem('bengali_ocr_gemini_key', state.byokApiKey);
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, state.selectedModel);

    updateBadges();
    toggleModal(elements.settingsModal, false);
    showToast('সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
  }

  function resetCredits() {
    state.freeUsesCount = 0;
    localStorage.setItem(STORAGE_KEYS.FREE_COUNT, '0');
    updateBadges();
    showToast('ফ্রি ক্রেডিট রিসেট করা হয়েছে (৫ টি ব্যবহার প্রাপ্ত)', 'success');
  }

  function toBengaliNumber(num) {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bnDigits[parseInt(d)]);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function showToast(message, type = 'info') {
    if (typeof window.showToastNotification === 'function') {
      window.showToastNotification(message, type);
      return;
    }
    const toast = document.createElement('div');
    const bgColors = {
      info: 'bg-slate-900 text-slate-100 border-slate-700',
      success: 'bg-emerald-950 text-emerald-100 border-emerald-700',
      warning: 'bg-amber-950 text-amber-100 border-amber-700',
      error: 'bg-rose-950 text-rose-100 border-rose-700'
    };
    toast.className = `fixed bottom-5 right-5 z-50 p-3.5 px-4 rounded-2xl border shadow-2xl flex items-center gap-2.5 text-xs transition-all duration-300 ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Instant global engine export (available immediately before DOMContentLoaded)
  const FayzarAiOcrEngine = {
    init,
    startOcrConversion,
    startUnifiedOcr,
    downloadWordDocument,
    handleFiles,
    fastOptimizeImageFile,
    executeGeminiRequest,
    cleanOcrResponse,
    state
  };

  if (typeof window !== 'undefined') {
    window.FayzarAiOcrEngine = FayzarAiOcrEngine;
    window.AiOcrEngine = FayzarAiOcrEngine;
  }
  global.FayzarAiOcrEngine = FayzarAiOcrEngine;

  // Safe DOM Initialization
  try {
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          try { init(); } catch (e) { console.warn('AI OCR engine DOM init warning:', e); }
        });
      } else {
        try { init(); } catch (e) { console.warn('AI OCR engine init warning:', e); }
      }
    }
  } catch (e) {
    console.warn('AI OCR auto-init warning:', e);
  }

})(typeof window !== 'undefined' ? window : this);
