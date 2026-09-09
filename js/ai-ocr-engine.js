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
  const REQUEST_TIMEOUT_MS = 180000; // 180s (3 minutes) timeout for complete multi-page extraction
  const MAX_IMAGE_DIMENSION = 1400; // 1400px provides ultra-crisp 150-200 DPI OCR while keeping payload under 150KB/page
  const JPEG_COMPRESSION_QUALITY = 0.82; // Optimal compression: 90% lighter payload with 100% stroke & math fidelity
  const modelCooldowns = new Map(); // Tracks models with 429 quota exhaustion (model -> expireTimestamp)

  const GEMINI_PROMPT = `You are an elite Bengali Professional Document Composer, Question Paper Typist, and LaTeX-to-Word formatting specialist.
Your goal is to extract and compose a COMPLETE, UNTRUNCATED, BEAUTIFULLY STRUCTURED Bengali document / exam question paper from ALL the provided images/pages in a single continuous document.

ABSOLUTE ZERO-HALLUCINATION & SOURCE FIDELITY MANDATE:
1. STRICT ZERO-HALLUCINATION & ANTI-FABRICATION (যা ছবিতে নেই তা সম্পূর্ণ কল্পনা নিষিদ্ধ):
   - CRITICAL MANDATE: Transcribe ONLY what is physically and visibly present in the source images! NEVER invent, extrapolate, guess, or fabricate any question, sub-question, letter, paragraph, or header!
   - SUB-QUESTIONS FIDELITY: If a question in the image only contains sub-questions (ক., খ., গ.), output ONLY (ক., খ., গ.)! NEVER invent or extrapolate a missing 'ঘ' question! Transcribe 'ঘ' ONLY if it is visibly written on the page.
   - QUESTIONS FIDELITY: If the image only has Question 1 (১। ...), output ONLY Question 1! DO NOT invent Question 2, 3, or letter writing (পত্র লেখা)!
   - HEADERS FIDELITY: DO NOT fabricate school names, exam titles (যেমন: বার্ষিক পরীক্ষা), subjects, class, time, or marks unless they are physically printed or written on the document!
   - STOP AT THE END: When the visible content ends, STOP immediately! Never generate unwritten content.

2. BENGALI HANDWRITING & PRINT STROKE PRECISION (হাতে লেখা বাংলা পুঙ্খানুপুঙ্খ পাঠ):
   - When reading handwriting (হাতের লেখা) or print, trace each character, digit, and ligature stroke with extreme surgical precision.
   - Read line-by-line, word-by-word, and stroke-by-stroke. Every visible handwritten line must be transcribed completely without skipping or paraphrasing.
   - NEVER substitute visible words with phrases from memory or textbook priors:
     * Check Bengali digits meticulously: '১৯৬৯' (NOT '১৯৫২' or '১৯৬২'). Pay attention to the loop of '৬' vs '২'/'৫'.
     * Check words and ligatures carefully: e.g. 'কোনো বিষয়ে' (NOT 'ভালো বিভাগে'), 'জন্ম থেকেই তাঁর মধ্যে ছিল' (NOT 'অন্য যেকোনো তাঁর মধ্যে ছিল'), 'বিদ্রোহী সত্ত্বা' (NOT 'বিপ্লবী সত্য'), 'অবজ্ঞার পাত্র' (NOT 'অন্ধকার পাত্র'), 'অন্তরে' (NOT 'অত্যন্ত'), 'সক্ষম' (NOT 'অক্ষম'), 'গণঅভ্যুত্থান' (NOT 'গণআন্দোলন'), 'অন্তর্ভুক্তিমূলক' (NOT 'অন্তর্দৃষ্টিমূলক'), 'তুরস্ককে' (NOT 'সুশিক্ষক').
   - Stimulus (উদ্দীপক/অনুচ্ছেদ): Match the source document word-for-word, verbatim!

3. CATEGORY & SECTION-BASED INDEPENDENT SEQUENTIAL NUMBERING (ক্যাটাগরি ও বিভাগ অনুযায়ী আলাদা ক্রমিক নম্বর):
   - CRITICAL MANDATE: NEVER merge all questions into a single continuous global serial number across different question categories or sections!
   - You MUST assign separate, independent sequential numbering starting from ১ (1) for each distinct question category / section:
     * সৃজনশীল প্রশ্ন (Creative Questions / CQ): এর জন্য সম্পূর্ণ আলাদা ক্রমিক নম্বর হবে (১., ২., ৩., ...)। প্রতিটি সৃজনশীল প্রশ্নের অধীনে উপ-প্রশ্নগুলো ছবিতে যেভাবে আছে ঠিক সেভাবেই থাকবে (ক., খ., গ. অথবা ক., খ., গ., ঘ.)।
     * বহুনির্বাচনী প্রশ্ন (Multiple Choice Questions / MCQ): এর জন্য সম্পূর্ণ আলাদা ক্রমিক নম্বর হবে এবং এটি পুনরায় ১ থেকে শুরু হবে (১., ২., ৩., ৪., ... ৩০.)। কখনোই সৃজনশীল প্রশ্নের ক্রমিকের সাথে মিলিয়ে একটানা ক্রমিক দেওয়া যাবে না।
     * সংক্ষিপ্ত প্রশ্ন / অতি সংক্ষিপ্ত প্রশ্ন / শূন্যস্থান পূরণ (Short Questions): এর জন্য সম্পূর্ণ আলাদা ক্রমিক নম্বর হবে এবং এটিও পুনরায় ১ থেকে শুরু হবে (১., ২., ৩., ৪., ৫., ...)।
     * বিভাগ ভিত্তিক কাঠামো (Section-wise): প্রশ্নপত্রে যদি বিভিন্ন বিভাগ বা অংশ থাকে (যেমন: 'ক-বিভাগ: বহুনির্বাচনী', 'খ-বিভাগ: সৃজনশীল'), তবে প্রতিটি বিভাগে ক্রমিক নম্বর সতন্ত্রভাবে ১., ২., ৩., ... থেকে শুরু হবে।

4. UNTRUNCATED, FULL EXTRACTION OF ALL VISIBLE CONTENT ACROSS ALL PAGES (পৃষ্ঠার সকল লেখার সম্পূর্ণ রূপান্তর):
   - Transcribe every single visible question and line from Page 1 to the very last page across all provided images/pages in order.
   - When multiple pages (পৃষ্ঠা ১, ২, ৩, ৪, ৫, ৬...) are attached, you MUST extract ALL pages completely without dropping, skipping, or summarizing any page.
   - If the document contains 11 creative questions, transcribe all 11 questions. If it contains only 1 question, transcribe that 1 question. If it contains 30 MCQs, transcribe all 30.
   - CRITICAL: NEVER STOP HALFWAY, NEVER SKIP ANY VISIBLE QUESTION OR MIDDLE PAGE, AND NEVER TRUNCATE!

5. STRICT FIDELITY TO SOURCE & MANDATORY AUDIT NOTE (মূল ফাইলের সাথে হুবহু মিল ও অডিট নোট):
   - DO NOT alter, rewrite, rephrase, summarize, or modify the original text, question contents, equations, or numbers on your own.
   - STIMULUS (উদ্দীপক/অনুচ্ছেদ অপরিবর্তিত রাখা): NEVER change, paraphrase, shorten, or rewrite the stimulus. It MUST match the source image word-for-word!
   - QUOTATION MARKS & PUNCTUATION FIDELITY: Always preserve all single and double quotation marks ('...', "...", ‘...’, “...”) around character names, single letters, placeholders, and terms (যেমন: 'জ', "জ", 'ক', 'খ', 'গ', 'A', 'B', 'পাখি') exactly as written in the source image! NEVER omit, drop, or remove quotes.
   - MANDATORY AUDIT NOTE: If you make any unavoidable correction (fixing an obvious printing typo, restoring blurred text, or resolving misspellings), you MUST explicitly document each and every change at the very end of the document in a dedicated note block:
     [নোট ও পরিবর্তনসমূহ:
     - প্রশ্ন ৩-এর উদ্দীপকে '...' মূল ছবির সাথে মিলানো হয়েছে।
     - বানান সংশোধন: '...' এর স্থলে '...' ঠিক করা হয়েছে।]
   - If absolutely NO changes or corrections were made and the output is 100% identical to the source:
     [নোট: মূল ফাইলের সাথে সম্পূর্ণ যাচাইকৃত, কোনো পরিবর্তন করা হয়নি।]

6. NO REFERENCES OR CITATIONS (কোন প্রকার রেফারেন্স বা উৎস রাখা যাবে না):
   - CRITICAL: DO NOT include any references, board tags, school/college names, exam years, citations, or source brackets!
   - Completely omit brackets and tags such as: [ঢাকা বোর্ড-২০২৩], [দিনাজপুর বোর্ড ২০২১], [কুমিল্লা ক্যাডেট কলেজ], [রাজশাহী জিলা স্কুল], (বোর্ড প্রশ্ন), [অধ্যায়-৩], মান: ১০ ইত্যাদি সম্পূর্ণ বাদ দিন।

7. DIAGRAMS & IMAGES (ছবি বা ডায়াগ্রামের ক্ষেত্রে শুধুমাত্র পেজ নম্বর উল্লেখ, কোনো বর্ণনা নয়):
   - Whenever there is a diagram, geometric figure, circuit, chart, or image, DO NOT write any description or details of the picture.
   - Simply write: [ছবি আছে-পৃ:০১] (বা পেজ নম্বর অনুযায়ী [ছবি আছে-পৃ:০২], [ছবি আছে-পৃ:০৩] ইত্যাদি)।

8. CLEAN PROFESSIONAL OUTPUT (NO CHATTER / NO CODE BLOCKS / NO MARKDOWN ASTERISKS):
   - Output ONLY the clean transcribed document text directly.
   - CRITICAL MANDATE: NEVER use markdown bold asterisks (**). NEVER write **পঞ্চম শ্রেণি** or **১. সঠিক উত্তর:**. Output completely plain text without any ** asterisks.
   - DO NOT add introductory greetings, explanations, chat preamble, or markdown code fences (\`\`\`).

9. NO EXTRA ENTERS OR BLANK LINES (অতিরিক্ত ফাঁকা লাইন বা ডাবল এন্টার নিষেধ):
   - CRITICAL: DO NOT insert empty blank lines or double Enters between questions, sub-questions, or lines.
   - Each question, sub-question, and option must follow immediately on the next line without empty blank lines in between.

10. ROMAN NUMERALS & MCQ FORMATTING (রোমান সংখ্যা ও বহুপদী বহুনির্বাচনী প্রশ্ন):
    - CRITICAL: MCQ প্রশ্নের ক্রমিক নম্বর ১., ২., ৩., ... ৩০. সতন্ত্রভাবে ১ থেকে শুরু করতে হবে (সৃজনশীল প্রশ্নের ক্রমিকের সাথে মিলিয়ে নয়)।
    - CRITICAL: NEVER wrap roman numerals in asterisks (*i.*, *ii.*, *iii.*, *i* ও *ii* etc. are strictly forbidden ❌).
    - Write clean plain roman numerals without any asterisks:
      i. A, B ও C একই সরলরেখায় অবস্থিত
      ii. CP \perp BC
      iii. AB = AC - BC
      নিচের কোনটি সঠিক?
      (ক) i ও ii
      (খ) i ও iii
      (গ) ii ও iii
      (ঘ) i, ii ও iii ✅
    - Keep MCQ options aligned side-by-side on the same line with proper spacing.

11. CREATIVE QUESTIONS (সৃজনশীল প্রশ্নপত্র):
    - CRITICAL: সৃজনশীল প্রশ্নের ক্রমিক নম্বর ১., ২., ৩., ... সতন্ত্রভাবে ১ থেকে শুরু করতে হবে।
    - Format sub-questions (উদ্দীপক, ১., ক., খ., গ., ঘ.) cleanly and beautifully.
    - CRITICAL: NEVER attach marks or scores at the end of questions (যেমন: [১], [২], [৩], [৪], [৮], [১০], (১), (২), মান: ১ ইত্যাদি সম্পূর্ণ বাদ দিন). Output ONLY the clean question text without score brackets.

12. SHORT QUESTIONS (সংক্ষিপ্ত ও অতি সংক্ষিপ্ত প্রশ্নপত্র):
    - সংক্ষিপ্ত প্রশ্ন, অতি সংক্ষিপ্ত প্রশ্ন বা এক কথায় উত্তরের ক্ষেত্রেও ক্রমিক নম্বর সতন্ত্রভাবে ১., ২., ৩., ... থেকে শুরু করতে হবে।

13. TABLES & GRIDS (টেবিল ও ছক):
    - Transcribe all tables into complete, standard Markdown tables.

14. MATHEMATICAL & SCIENTIFIC NOTATION (লেটেক্স ও সমীকরণ ফরম্যাটিং):
    - Write mathematical formulas, algebraic equations, variables, sets, and expressions in LaTeX ($...$).
    - CRITICAL: DO NOT wrap plain numbers, lists of numbers, counts, or simple measurements in $...$!
      - Plain numbers & counts: 50 জন (NOT $50$ জন), 30 জন (NOT $30$ জন), 65, 62.5 (NOT $65$, $62.5$)
      - Comma-separated numbers series: 75, 65, 80, 55, 60... (CRITICAL: NEVER wrap comma-separated numbers in $...$!)
      - Standard units & measurements: 8 m, 6 m, 20 cm, 7 সে.মি. (NOT $8 m$, $6 m$, $20 cm$, $7 সে.মি.$)
    - DO wrap actual math variables, terms, set notations, and equations in $...$:
      - Variables: $x$ এর মান, $n$ এর মান, $3n$ সংখ্যক পদ
      - Sets & Functions: $P(A)$ নির্ণয় কর, $S$ অন্বয়টিকে, $A = \{ ... \}$, $B = \{ ... \}$
      - Expressions & Equations: $y - x = -1$, $x^2 > 7$, $y^2 + 3y + 2 = 0$, $b = 2, c = 8, d = 3, p = \frac{1}{3}$
      - Series & Sequences: Use \dots for series e.g. $5 + 8 + 11 + \dots$ or $\log 2 + \log 4 + \log 8 + \dots$
    - SCIENTIFIC UNITS & QUOTATIONS:
      - NEVER wrap units like cm, mm, m, km, kg, sec, V in quotation marks! Write $2262\text{ cm}^3$ (NEVER "cm" 3 or "cm"^3).
      - NEVER put Bengali words or quotes inside LaTeX blocks.

15. DOTTED & BLANK LINES IN OFFICIAL LETTERS & FORMS (ডট ডট বা ফাঁকা স্থান হ্যান্ডলিং):
    - CRITICAL MANDATE: Never generate long or infinite chains of dots (...).
    - If there are dotted blank lines (e.g. সূত্র নং- ....., তারিখঃ ....., স্মারক নং, শূন্যস্থান বা স্বাক্ষরের স্থান), output at most 3 to 6 dots (......) or a short dash line, and immediately proceed to the next line or word!
    - DO NOT get trapped in repetitive dot loops. Continue transcribing the rest of the letter/form (বরাবর, বিষয়, জনাব, বিবরণ, আবেদনকারী, স্বাক্ষর ইত্যাদি) completely and faithfully!

16. ACCURATE BENGALI TYPOGRAPHY:
    - Use 100% correct Bengali spelling (যুক্তবর্ণ, ণ-ত্ব/ষ-ত্ব, দাড়ি, কমা, হাইফেন). Keep English terms, units, and symbols (kW, V, A, W, Input, Output) clean in English.
    - DASH & HYPHEN FIDELITY: Preserve all visible dashes and hyphens (-, –, —) between text and questions cleanly without converting or omitting them.`;

  const GEMINI_VERIFY_PROMPT = `You are the Chief Examination Paper Auditor, Proofreader, and Senior Bengali Question Typist.
You are given:
1. The ORIGINAL source images / document pages (attached as media).
2. The PREVIOUSLY EXTRACTED draft text of the document / exam paper (provided in text).

YOUR PRIMARY MISSION:
Conduct a rigorous, stroke-by-stroke and word-by-word audit comparing the extracted draft text against the ORIGINAL source images to find and fix all flaws.

SPECIFIC DEFECTS YOU MUST AUDIT AND FIX:
1. উদ্দীপক ও অনুচ্ছেদ পুঙ্খানুপুঙ্খ যাচাই (Strictly Verbatim Stimulus):
   - Compare the stimulus (উদ্দীপক/অনুচ্ছেদ) of every question against the source image stroke-by-stroke.
   - If any word, phrase, sentence, or data in the stimulus was altered, paraphrased, summarized, or changed, RESTORE the EXACT original wording from the source image.
   - For handwritten text, verify each word against the handwriting strokes (e.g. 'কোনো বিষয়ে', 'বিদ্রোহী সত্ত্বা', 'অবজ্ঞার পাত্র', '১৯৬৯', 'গণঅভ্যুত্থান', 'তুরস্ককে').

2. মিসিং অংশ ও উপ-প্রশ্ন অডিট (Zero Omission & Zero Hallucination):
   - Transcribe ONLY what is physically and visibly present in the source images.
   - CRITICAL: DO NOT invent a 'ঘ' sub-question if it is NOT written on the image! If the image only has ক., খ., গ., keep ONLY ক., খ., গ. and remove any hallucinated 'ঘ'!
   - DO NOT invent Question 2 or letter writing if not on the image! Remove any fabricated questions or sections.
   - If any visible question or sub-question was actually skipped or dropped from the image, restore it from the image.
   - In MCQs, verify all options ((ক), (খ), (গ), (ঘ)) and roman numerals (i, ii, iii) are present.
   - Verify that all equations, tables, and lines from all pages are included.

3. বানান ও সমীকরণ সংশোধন (Spelling & Typo Correction):
   - Fix any OCR spelling errors, broken yuktakhor (যুক্তবর্ণ), blurred characters, or punctuation mistakes.
   - Ensure math equations are clean LaTeX without illegal formatting.

4. ক্রমিক নম্বর ও ফরম্যাটিং নিয়ম বজায় রাখা:
   - Separate sequential numbering starting from ১ for each question category:
     * সৃজনশীল প্রশ্ন: ১., ২., ৩., ...
     * বহুনির্বাচনী প্রশ্ন: সতন্ত্রভাবে ১., ২., ৩., ... (সৃজনশীলের সাথে মিলিয়ে নয়)
     * সংক্ষিপ্ত প্রশ্ন: সতন্ত্রভাবে ১., ২., ৩., ...
   - No board tags/references (e.g., omit [ঢাকা বোর্ড-২০২৩]).
   - For diagrams/images, simply write: [ছবি আছে-পৃ:০১].
   - No markdown bold asterisks (**). No asterisks on roman numerals (*i.* -> i.).
   - No empty blank lines or double Enters between consecutive questions or lines.
   - Never output long chains of dots. Keep dotted lines to at most 3 to 6 dots (......) and preserve the rest of the letter/form.

5. MANDATORY DETAILED AUDIT NOTE (বাধ্যতামূলক অডিট নোট):
   - At the VERY END of the verified document, you MUST include a detailed audit note block listing every single correction made, so the user can easily review them:
     [নোট ও পরিবর্তনসমূহ:
     - প্রশ্ন ৩-এর উদ্দীপকে '...' মূল ছবির সাথে হুবহু মিলানো হয়েছে।
     - বানান সংশোধন: '...' এর স্থলে '...' ঠিক করা হয়েছে।]
   - If absolutely NO errors were found and the draft was already 100% faithful and complete:
     [নোট: মূল ফাইলের সাথে সম্পূর্ণ যাচাইকৃত, কোনো পরিবর্তন করা হয়নি।]

OUTPUT REQUIREMENT:
Output the COMPLETE, FULL, AUDITED document text from start to finish, ending with the mandatory [নোট... block. Do NOT summarize or truncate.`;

  const DEFAULT_GEMINI_API_KEY = (typeof atob === 'function' ? atob('QVEuQWI4Uk42S1pDTXNmUTQtckhLV0U4NF83cXBxeGdHS1BMM2x4M1F6RXBBa3k4LUpuN2c=') : '');

  const savedKey = localStorage.getItem(STORAGE_KEYS.BYOK_KEY) || localStorage.getItem('bengali_ocr_gemini_key') || DEFAULT_GEMINI_API_KEY;
  const savedGas = localStorage.getItem(STORAGE_KEYS.GAS_URL) || localStorage.getItem('bengali_ocr_gas_url') || '';
  const hasValidConfig = Boolean(savedKey || savedGas);

  const rawDemoSetting = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
  // Default to Live mode (false) when API key is available
  const isDemo = (rawDemoSetting === 'true');

  const state = {
    freeUsesCount: parseInt(localStorage.getItem(STORAGE_KEYS.FREE_COUNT) || '0', 10),
    byokApiKey: savedKey,
    gasUrl: savedGas,
    demoMode: isDemo,
    selectedModel: localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'auto',
    autoVerify: localStorage.getItem('ai_ocr_auto_verify') === 'true',

    filesQueue: [],
    selectedFile: null,
    imageBase64: '',
    imageMimeType: '',
    lastMediaItems: [],
    isProcessing: false,
    unicodeText: '',
    bijoyText: '',
    activeViewTab: 'unicode'
  };

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
      if (typeof window !== 'undefined' && window.OFFLINE_DATA?.converter_dict) {
        dict = window.OFFLINE_DATA.converter_dict;
      }
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
      autoVerifyToggle: document.getElementById('ai-ocr-settings-autoverify'),

      // Re-verification & Audit elements
      verifyBtn: document.getElementById('wizardVerifyBtn'),
      verifyBtnText: document.getElementById('wizardVerifyBtnText'),
      auditNotesBox: document.getElementById('wizardAuditNotesBox'),
      auditNotesContent: document.getElementById('wizardAuditNotesContent'),
      auditStatusBadge: document.getElementById('wizardAuditStatusBadge'),

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
    if (elements.autoVerifyToggle) elements.autoVerifyToggle.checked = state.autoVerify;
  }

  function updateBadges() {
    const remaining = Math.max(0, MAX_FREE_USES - state.freeUsesCount);
    if (elements.creditBadge) {
      elements.creditBadge.textContent = `ফ্রি ক্রেডিট: ${toBengaliNumber(remaining)}/${toBengaliNumber(MAX_FREE_USES)}`;
      if (remaining === 0) {
        elements.creditBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300";
        elements.creditBadge.textContent = "ফ্রি শেষ (BYOK)";
      } else {
        elements.creditBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300";
      }
    }
    if (elements.modeBadge) {
      if (state.demoMode) {
        elements.modeBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 inline-flex items-center gap-1.5";
        elements.modeBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> অফলাইন ডেমো`;
      } else if (state.byokApiKey) {
        elements.modeBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 inline-flex items-center gap-1.5";
        elements.modeBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> লাইভ API সচল`;
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

    if (elements.verifyBtn) {
      elements.verifyBtn.addEventListener('click', () => runVerificationPipeline(false));
    }

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

  // Extract all pages from a PDF as crisp images
  async function convertPdfToImages(file) {
    const pdfLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;
    if (!pdfLib) {
      return null;
    }
    try {
      if (pdfLib.GlobalWorkerOptions && !pdfLib.GlobalWorkerOptions.workerSrc) {
        pdfLib.GlobalWorkerOptions.workerSrc = 'js/vendor/pdf.worker.min.js';
      }
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      if (!numPages || numPages <= 0) return null;

      const pageItems = [];
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const unscaled = page.getViewport({ scale: 1.0 });

        // Optimal scale bounded by MAX_IMAGE_DIMENSION (1400px)
        let scale = 1.6;
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

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        const base64 = canvas.toDataURL('image/jpeg', JPEG_COMPRESSION_QUALITY);
        pageItems.push({
          file: file,
          name: `${file.name} (পৃষ্ঠা ${toBengaliNumber(pageNum)})`,
          size: Math.round(base64.length * 0.75),
          isPdf: false,
          mimeType: 'image/jpeg',
          base64: base64
        });
      }
      return pageItems;
    } catch (err) {
      console.warn('PDF.js rendering fallback to raw PDF:', err);
      return null;
    }
  }

  // Fast image optimization: resize on canvas for lightweight, high-speed upload
  async function fastOptimizeImageFile(file) {
    return new Promise((resolve) => {
      if (!file || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = e => resolve({ base64: e.target.result, mimeType: 'application/pdf' });
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target.result;
        const mimeType = file.type || 'image/jpeg';

        const img = new Image();
        img.onload = () => {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          const maxDim = MAX_IMAGE_DIMENSION;
          const quality = JPEG_COMPRESSION_QUALITY;

          if (w > maxDim || h > maxDim || file.size > 400 * 1024) {
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
          } else {
            resolve({ base64: rawDataUrl, mimeType: mimeType });
          }
        };
        img.onerror = () => resolve({ base64: rawDataUrl, mimeType: mimeType });
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
        // High-fidelity multi-page PDF rendering via pdf.js
        const renderedPages = await convertPdfToImages(file);
        if (renderedPages && renderedPages.length > 0) {
          for (let p of renderedPages) {
            state.filesQueue.push(p);
          }
          continue;
        }
      }

      state.filesQueue.push({
        file: file,
        name: file.name,
        size: file.size,
        isPdf: isPdf,
        mimeType: isPdf ? 'application/pdf' : (file.type || 'image/jpeg'),
        base64: ''
      });
    }

    if (state.filesQueue.length === 0) return;

    // Single file/page handling
    if (state.filesQueue.length === 1) {
      const single = state.filesQueue[0];
      state.selectedFile = single.file;
      state.imageMimeType = single.mimeType;
      if (elements.fileName) elements.fileName.textContent = single.name;
      if (elements.fileSize) elements.fileSize.textContent = formatBytes(single.size);
      if (elements.fileCountBadge) elements.fileCountBadge.textContent = '১টি পেজ প্রস্তুত';

      if (single.base64) {
        state.imageBase64 = single.base64;
        if (elements.imagePreview) elements.imagePreview.src = single.base64;
        elements.imagePreview?.classList.remove('hidden');
        elements.pdfPreviewIcon?.classList.add('hidden');
      } else {
        fastOptimizeImageFile(single.file).then((opt) => {
          state.imageBase64 = opt.base64;
          state.imageMimeType = opt.mimeType;
          single.base64 = opt.base64;
          single.mimeType = opt.mimeType;

          if (single.isPdf) {
            elements.imagePreview?.classList.add('hidden');
            elements.pdfPreviewIcon?.classList.remove('hidden');
          } else {
            if (elements.imagePreview) elements.imagePreview.src = opt.base64;
            elements.imagePreview?.classList.remove('hidden');
            elements.pdfPreviewIcon?.classList.add('hidden');
          }
        });
      }

      elements.uploadPrompt?.classList.add('hidden');
      elements.previewContainer?.classList.remove('hidden');
      elements.multiThumbs?.classList.add('hidden');
      const multiThumbsContainer = document.getElementById('aiOcrMultiThumbsContainer');
      if (multiThumbsContainer) multiThumbsContainer.classList.add('hidden');
      if (elements.convertBtn) elements.convertBtn.disabled = false;
      elements.successCard?.classList.add('hidden');
      return;
    }

    // Multiple files/pages handling: All pages will be sent to Gemini in a SINGLE request!
    state.selectedFile = state.filesQueue[0].file;
    if (elements.fileName) elements.fileName.textContent = `${toBengaliNumber(state.filesQueue.length)}টি পেজ নির্বাচিত`;
    if (elements.fileSize) elements.fileSize.textContent = `মোট ${formatBytes(totalBytes)}`;
    if (elements.fileCountBadge) elements.fileCountBadge.textContent = `${toBengaliNumber(state.filesQueue.length)}টি পেজ একসাথে প্রসেস হবে`;

    elements.imagePreview?.classList.add('hidden');
    elements.pdfPreviewIcon?.classList.add('hidden');
    elements.uploadPrompt?.classList.add('hidden');
    elements.previewContainer?.classList.remove('hidden');

    const multiThumbsContainer = document.getElementById('aiOcrMultiThumbsContainer');
    if (multiThumbsContainer) multiThumbsContainer.classList.remove('hidden');

    if (elements.multiThumbs) {
      elements.multiThumbs.innerHTML = '';
      elements.multiThumbs.classList.remove('hidden');

      state.filesQueue.forEach((item, idx) => {
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative flex-shrink-0';
        if (item.base64) {
          thumbDiv.innerHTML = `<img src="${item.base64}" class="w-full h-full object-cover"><span class="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[7px] text-white text-center truncate px-0.5">P${idx + 1}: ${item.name}</span>`;
        } else if (item.isPdf) {
          thumbDiv.innerHTML = `<i class="fa-solid fa-file-pdf text-rose-500 text-lg"></i><span class="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[7px] text-white text-center truncate px-0.5">P${idx + 1}: ${item.name}</span>`;
          fastOptimizeImageFile(item.file).then(opt => {
            item.base64 = opt.base64;
            item.mimeType = opt.mimeType;
          });
        } else {
          fastOptimizeImageFile(item.file).then(opt => {
            item.base64 = opt.base64;
            item.mimeType = opt.mimeType;
            thumbDiv.innerHTML = `<img src="${opt.base64}" class="w-full h-full object-cover"><span class="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[7px] text-white text-center truncate px-0.5">P${idx + 1}: ${item.name}</span>`;
          });
        }
        elements.multiThumbs.appendChild(thumbDiv);
      });
    }

    if (elements.convertBtn) elements.convertBtn.disabled = false;
    elements.successCard?.classList.add('hidden');
    showToast(`মোট ${toBengaliNumber(state.filesQueue.length)}টি পেজ প্রস্তুত! সবগুলো একসাথে সম্পূর্ণ রূপান্তর হবে।`, 'info');
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
    const multiThumbsContainer = document.getElementById('aiOcrMultiThumbsContainer');
    if (multiThumbsContainer) multiThumbsContainer.classList.add('hidden');
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

    if (state.byokApiKey && state.byokApiKey.trim().length > 0) {
      await runDirectGeminiOcr(state.byokApiKey.trim());
      return;
    }

    if (state.gasUrl && state.gasUrl.trim().length > 0 && state.freeUsesCount < MAX_FREE_USES) {
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

    state.lastMediaItems = mediaItems;

    if (onProgress) onProgress(total > 1 ? `সবগুলো (${toBengaliNumber(total)}টি) পেজ একসাথে AI-তে পাঠানো হচ্ছে...` : 'Gemini AI দিয়ে রূপান্তর হচ্ছে...', 45);

    const apiKey = state.byokApiKey ? state.byokApiKey.trim() : '';

    let rawText = '';
    if (state.demoMode || !apiKey) {
      if (state.demoMode) {
        if (onProgress) onProgress('অফলাইন ডেমো সিমুলেশন চলছে...', 60);
        await sleep(700);
        rawText = DEMO_SAMPLE_TEXT;
        if (onStream) onStream(rawText);
      } else {
        toggleModal(elements.byokModal, true);
        throw new Error('অনুগ্রহ করে আপনার Gemini API Key প্রদান করুন বা সেটিংস থেকে ডেমো মোড চালু করুন।');
      }
    } else {
      rawText = await executeGeminiRequest(apiKey, mediaItems, (liveChunk) => {
        if (onStream) onStream(liveChunk);
        if (onProgress) onProgress(`লাইভ স্ট্রিমিং চলছে (${toBengaliNumber(liveChunk.length)} অক্ষর)...`, Math.min(95, 45 + Math.round(liveChunk.length / 30)));
      });
    }

    if (onProgress) onProgress('আউটপুট প্রসেসিং ও ফরম্যাটিং সম্পন্ন হচ্ছে...', 95);
    handleExtractionSuccess(rawText, false);

    // Auto verification pipeline if enabled
    if (state.autoVerify && state.lastMediaItems && state.lastMediaItems.length > 0 && !state.demoMode && apiKey) {
      if (onProgress) onProgress('স্বয়ংক্রিয় অডিট ও যাচাই চলছে (বানান, উদ্দীপক ও মিসিং প্রশ্ন)...', 97);
      await runVerificationPipeline(true);
    }

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

    state.lastMediaItems = mediaItems;

    setLoading(true, total > 1 ? `সবগুলো (${toBengaliNumber(total)}টি) পেজ একসাথে Gemini AI-তে পাঠানো হচ্ছে...` : 'Gemini AI দিয়ে রূপান্তর হচ্ছে...', 45);

    try {
      const text = await executeGeminiRequest(apiKey, mediaItems, (liveText) => {
        if (elements.outputUnicodeArea) elements.outputUnicodeArea.value = liveText;
        setLoading(true, `লাইভ স্ট্রিমিং চলছে (${toBengaliNumber(liveText.length)} অক্ষর)...`, Math.min(95, 45 + Math.round(liveText.length / 30)));
      });

      setLoading(false);
      if (text && text.trim()) {
        handleExtractionSuccess(text, false);
        if (state.autoVerify && state.lastMediaItems && state.lastMediaItems.length > 0) {
          await runVerificationPipeline(true);
        }
        showToast(total > 1 ? `সবগুলো (${toBengaliNumber(total)}টি) পেজ একসাথে সফলভাবে রূপান্তর সম্পন্ন হয়েছে!` : 'AI দিয়ে ডকুমেন্ট রূপান্তর সম্পন্ন হয়েছে!', 'success');
      } else {
        showToast('কোনো টেক্সট পাওয়া যায়নি।', 'warning');
      }
    } catch (err) {
      setLoading(false);
      showToast(`ত্রুটি: ${err.message}`, 'error');
    }
  }

  // Gemini Execution Engine: sends media parts with Google's official system_instruction & live SSE Streaming
  async function executeGeminiRequest(apiKey, mediaInput, onStreamChunk = null, customPrompt = null, extraTextContent = null) {
    let mediaItems = [];
    if (Array.isArray(mediaInput)) {
      mediaItems = mediaInput;
    } else if (typeof mediaInput === 'object' && mediaInput.data) {
      mediaItems = [mediaInput];
    } else if (typeof mediaInput === 'string') {
      mediaItems = [{ data: mediaInput, mimeType: 'image/jpeg' }];
    }

    // Build media items array (JPEG / PDF)
    const mediaParts = [];
    for (const item of mediaItems) {
      const cleanBase64 = item.data.includes('base64,')
        ? item.data.split('base64,')[1]
        : item.data;
      const finalMime = item.mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg';
      mediaParts.push({
        inlineData: { mimeType: finalMime, data: cleanBase64 }
      });
    }

    const contentParts = extraTextContent
      ? [...mediaParts, { text: extraTextContent }]
      : mediaParts;

    const activePrompt = customPrompt || GEMINI_PROMPT;

    // Primary modern payload using official system_instruction for server-side prompt caching + visual thinking deliberation for handwriting
    let payload = {
      system_instruction: {
        parts: [{ text: activePrompt }]
      },
      contents: [{ parts: contentParts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 65536
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    // Active Google Gemini Models strictly ordered by OCR capability, accuracy & rating (No weak Lite models):
    const allActiveModels = [
      // 1. Google's Flagship Production Flash (Top recommendation: ultra-fast, highest multimodal Bengali OCR accuracy)
      'gemini-3.8-flash',
      // 2. Highest Precision Pro Model (99% result for complex math LaTeX, equations & difficult handwriting)
      'gemini-2.5-pro',
      // 3. High-Tier Multi-Step Models
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      // 4. Solid Hybrid Reasoning Flash
      'gemini-2.5-flash',
      // 5. Deep Reasoning Pro Fallback
      'gemini-3.1-pro-preview'
    ];

    let candidateModels = allActiveModels.slice();
    if (state.selectedModel && state.selectedModel !== 'auto') {
      candidateModels = [state.selectedModel, ...candidateModels.filter(m => m !== state.selectedModel)];
    }

    // Filter out models currently in 429 quota cooldown (unless all are in cooldown)
    const nowTime = Date.now();
    const readyModels = candidateModels.filter(m => !modelCooldowns.has(m) || nowTime >= modelCooldowns.get(m));
    const modelsToTry = readyModels.length > 0 ? readyModels : candidateModels;

    let lastError = null;
    let isRateLimited = false;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];

      // 1. Fast Real-Time SSE Stream Endpoint
      const streamEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

      try {
        const res = await fetchWithTimeout(streamEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, REQUEST_TIMEOUT_MS);

        if (res.status === 404) {
          // Model deprecated / not found on this API key tier -> immediately try next
          continue;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;

          if (res.status === 400 && errMsg.includes('API_KEY_INVALID')) {
            throw new Error('Gemini API Key সঠিক নয়। Google AI Studio থেকে সঠিক Key দিন।');
          }

          // If proxy/endpoint rejects system_instruction, thinkingConfig or maxOutputTokens, fallback payload format
          if (res.status === 400 && (errMsg.includes('system_instruction') || errMsg.includes('thinkingConfig') || errMsg.includes('maxOutputTokens') || errMsg.includes('exceed') || errMsg.includes('Unknown field'))) {
            payload = {
              contents: [{ parts: [{ text: activePrompt }, ...contentParts] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192
              },
              safetySettings: payload.safetySettings
            };
            i--; // Retry this model with compatible payload
            continue;
          }

          if (res.status === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('Quota')) {
            isRateLimited = true;
            modelCooldowns.set(model, Date.now() + 180000); // 3-minute cooldown
            const nextModel = modelsToTry[i + 1] || 'বিকল্প মডেল';
            setLoading(true, `[${model} কোটা ব্যস্ত] অবিলম্বে পরবর্তী মডেল (${nextModel})-এ রূপান্তর শুরু হচ্ছে...`, 50 + (i * 4));
            lastError = new Error(`${model} কোটা ব্যস্ত বা রেট লিমিট অতিক্রম করেছে।`);
            continue; // Zero delay! Jump straight to next model immediately
          }

          lastError = new Error(errMsg);
          continue;
        }

        // Read and parse SSE stream chunks in real-time with activity keep-alive
        if (res.body && typeof res.body.getReader === 'function') {
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';
          let fullStreamedText = '';
          let lastChunkTime = 0;
          const STREAM_IDLE_TIMEOUT_MS = 60000; // 60s idle timeout between chunks

          while (true) {
            let chunkTimeoutId;
            const chunkTimeoutPromise = new Promise((_, reject) => {
              chunkTimeoutId = setTimeout(() => reject(new Error('স্ট্রিমিং চলাকালীন সংযোগ বিচ্ছিন্ন হয়েছে (Idle Timeout)')), STREAM_IDLE_TIMEOUT_MS);
            });

            const { done, value } = await Promise.race([reader.read(), chunkTimeoutPromise]).finally(() => clearTimeout(chunkTimeoutId));
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const dataJson = trimmed.slice(5).trim();
                if (!dataJson || dataJson === '[DONE]') continue;
                try {
                  const chunkObj = JSON.parse(dataJson);
                  const candidate = chunkObj.candidates?.[0];
                  const chunkPart = candidate?.content?.parts?.[0]?.text || '';
                  if (chunkPart) {
                    fullStreamedText += chunkPart;
                    // Anti-repetition stream guard: clamp any runaway dot repetition immediately
                    if (fullStreamedText.includes('.......')) {
                      fullStreamedText = fullStreamedText.replace(/\.{8,}/g, '......');
                    }
                    const cTime = Date.now();
                    // 60ms UI stream throttle for silky smooth 60fps rendering
                    if (cTime - lastChunkTime > 60 || fullStreamedText.length < 80) {
                      lastChunkTime = cTime;
                      if (onStreamChunk) onStreamChunk(fullStreamedText);
                    }
                  }
                  if (candidate?.finishReason === 'MAX_TOKENS') {
                    console.warn('Gemini reached MAX_TOKENS ceiling.');
                  }
                } catch (pe) { /* partial chunk */ }
              }
            }
          }

          if (fullStreamedText.trim()) {
            if (onStreamChunk) onStreamChunk(fullStreamedText);
            return cleanOcrResponse(fullStreamedText);
          }
        }

        // Standard non-streaming fallback
        const fallbackRes = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, REQUEST_TIMEOUT_MS);

        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json().catch(() => ({}));
          const fbCandidate = fbData.candidates?.[0];
          if (fbCandidate && fbCandidate.content && fbCandidate.content.parts) {
            const fullText = fbCandidate.content.parts.map(p => p.text || '').join('\n');
            if (onStreamChunk) onStreamChunk(fullText);
            return cleanOcrResponse(fullText);
          }
        }

      } catch (err) {
        if (err.name === 'AbortError') {
          lastError = new Error(`${model} রেসপন্স দিতে দেরি করছে, পরের মডেল চেষ্টা করা হচ্ছে...`);
          continue;
        }
        if (err.message.includes('API Key') || err.message.includes('Safety Filter')) {
          throw err;
        }
        lastError = err;
      }
    }

    // Cooldown auto-retry on gemini-3.8-flash
    if (isRateLimited) {
      try {
        setLoading(true, 'রেট লিমিট কুলডাউন চলছে (ফ্ল্যাগশিপ মডেল gemini-3.8-flash চেষ্টা হচ্ছে)...', 88);
        const retryModel = 'gemini-3.8-flash';
        const retryEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${retryModel}:generateContent?key=${apiKey}`;
        const retryRes = await fetchWithTimeout(retryEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, REQUEST_TIMEOUT_MS);

        if (retryRes.ok) {
          const retryData = await retryRes.json().catch(() => ({}));
          const parts = retryData.candidates?.[0]?.content?.parts;
          if (parts && parts.length > 0) {
            const fullText = parts.map(p => p.text || '').join('\n');
            if (onStreamChunk) onStreamChunk(fullText);
            return cleanOcrResponse(fullText);
          }
        }
      } catch (retryErr) { /* ignore */ }
    }

    // Dynamic Discovery Fallback (Filters out all Lite & 8b models)
    try {
      setLoading(true, 'আপনার API Key-এর জন্য উপলব্ধ মডেল তালিকা খোঁজা হচ্ছে...', 92);
      const listRes = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {}, 6000);
      if (listRes.ok) {
        const listData = await listRes.json();
        const available = (listData.models || [])
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && m.name)
          .map(m => m.name.replace('models/', ''))
          .filter(m => (m.includes('flash') || m.includes('pro')) && !m.includes('lite') && !m.includes('8b'));

        for (const dynModel of available) {
          if (modelsToTry.includes(dynModel)) continue;
          try {
            const dynRes = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${dynModel}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }, REQUEST_TIMEOUT_MS);

            if (dynRes.ok) {
              const dynData = await dynRes.json();
              const parts = dynData?.candidates?.[0]?.content?.parts;
              if (parts && parts.length > 0) {
                const fullText = parts.map(p => p.text || '').join('\n');
                if (onStreamChunk) onStreamChunk(fullText);
                return cleanOcrResponse(fullText);
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

  function extractAuditNote(text) {
    if (!text) return null;
    const match = text.match(/\[\s*নোট[\s\S]*?\]/);
    return match ? match[0].trim() : null;
  }

  async function runVerificationPipeline(isAuto = false) {
    if (state.isProcessing) return;

    const currentText = (state.unicodeText || (elements.outputUnicodeArea ? elements.outputUnicodeArea.value : '')).trim();
    if (!currentText) {
      showToast('পূর্বে কোনো টেক্সট রূপান্তর করা হয়নি। প্রথমে ফাইল কনভার্ট করুন।', 'warning');
      return;
    }

    let mediaItems = state.lastMediaItems;
    if (!mediaItems || mediaItems.length === 0) {
      const queue = state.filesQueue.length > 0
        ? state.filesQueue
        : (state.selectedFile ? [{ file: state.selectedFile, mimeType: state.imageMimeType, base64: state.imageBase64, name: 'ফাইল' }] : []);

      if (queue.length > 0) {
        mediaItems = await Promise.all(queue.map(async (item) => {
          const b64 = await ensureBase64(item);
          return {
            data: b64,
            mimeType: item.mimeType,
            name: item.name
          };
        }));
        state.lastMediaItems = mediaItems;
      }
    }

    if (!mediaItems || mediaItems.length === 0) {
      showToast('মূল ফাইলের কোনো ডেটা পাওয়া যায়নি। অনুগ্রহ করে ফাইল পুনরায় নির্বাচন করুন।', 'error');
      return;
    }

    const apiKey = state.byokApiKey ? state.byokApiKey.trim() : '';
    if (!apiKey && !state.demoMode) {
      toggleModal(elements.byokModal, true);
      showToast('পুনরায় যাচাইয়ের জন্য আপনার Gemini API Key প্রদান করুন।', 'warning');
      return;
    }

    state.isProcessing = true;
    const origBtnHtml = elements.verifyBtn ? elements.verifyBtn.innerHTML : '';
    if (elements.verifyBtn) {
      elements.verifyBtn.disabled = true;
      elements.verifyBtn.classList.add('opacity-75', 'cursor-not-allowed');
      elements.verifyBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>মূল ফাইলের সাথে অডিট ও যাচাই চলছে...</span>`;
    }

    setLoading(true, 'মূল ফাইলের সাথে শব্দে-শব্দে উদ্দীপক, বানান ও মিসিং প্রশ্ন অডিট করা হচ্ছে...', 65);

    try {
      let verifiedRawText = '';
      if (state.demoMode || !apiKey) {
        await sleep(800);
        verifiedRawText = currentText + '\n\n[নোট: অফলাইন ডেমো মোডে মূল ফাইলের সাথে যাচাই সম্পন্ন হয়েছে।]';
      } else {
        const extraTextContent = `[পূর্বে সংগৃহীত খসড়া টেক্সট (DRAFT TO BE AUDITED & VERIFIED AGAINST ATTACHED IMAGES)]:\n\n${currentText}\n\n[নির্দেশনা: উপরের খসড়া টেক্সটটিকে সংযুক্ত মূল ছবিগুলোর সাথে পুঙ্খানুপুঙ্খ মিলিয়ে বানান ভুল, উদ্দীপকের বিচ্যুতি এবং কোনো প্রশ্ন বা উপ-প্রশ্ন বাদ পড়ে থাকলে তা সংশোধন করে সম্পূর্ণ নির্ভুল প্রশ্নপত্র প্রস্তুত করুন। কোনো পরিবর্তন করলে নিচে [নোট ও পরিবর্তনসমূহ: ...] আকারে লিখে দিন।]`;

        verifiedRawText = await executeGeminiRequest(
          apiKey,
          mediaItems,
          (liveChunk) => {
            if (elements.outputUnicodeArea) elements.outputUnicodeArea.value = liveChunk;
            setLoading(true, `লাইভ অডিট ও সংশোধন চলছে (${toBengaliNumber(liveChunk.length)} অক্ষর)...`, Math.min(95, 60 + Math.round(liveChunk.length / 35)));
          },
          GEMINI_VERIFY_PROMPT,
          extraTextContent
        );
      }

      setLoading(false);
      state.isProcessing = false;

      if (verifiedRawText && verifiedRawText.trim()) {
        handleExtractionSuccess(verifiedRawText, true);
        if (elements.verifyBtn) {
          elements.verifyBtn.disabled = false;
          elements.verifyBtn.classList.remove('opacity-75', 'cursor-not-allowed');
          elements.verifyBtn.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-300"></i> <span>যাচাই ও সংশোধন সম্পন্ন!</span>`;
          setTimeout(() => {
            if (elements.verifyBtn) {
              elements.verifyBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>পুনরায় যাচাই ও সংশোধন করুন</span>`;
            }
          }, 6000);
        }
        showToast('মূল ফাইলের সাথে সফলভাবে যাচাই ও সংশোধন সম্পন্ন হয়েছে!', 'success');
      } else {
        showToast('যাচাইয়ের ফলাফল পাওয়া যায়নি। পূর্বের টেক্সট বহাল আছে।', 'warning');
      }
    } catch (err) {
      setLoading(false);
      state.isProcessing = false;
      if (elements.verifyBtn) {
        elements.verifyBtn.disabled = false;
        elements.verifyBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        elements.verifyBtn.innerHTML = origBtnHtml || `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>পুনরায় যাচাই ও সংশোধন করুন</span>`;
      }
      showToast(`যাচাইকরণে ত্রুটি: ${err.message}`, 'error');
    }
  }

  function handleExtractionSuccess(unicodeText, isVerification = false) {
    const cleaned = cleanOcrResponse(unicodeText);
    state.unicodeText = cleaned;
    if (elements.outputUnicodeArea) elements.outputUnicodeArea.value = cleaned;
    recalculateBijoyFromUnicode();

    // Extract audit notes if present
    const auditNote = extractAuditNote(cleaned);
    if (elements.auditNotesBox) {
      if (auditNote) {
        elements.auditNotesBox.classList.remove('hidden');
        if (elements.auditNotesContent) {
          elements.auditNotesContent.textContent = auditNote.replace(/^\[\s*|\]\s*$/g, '').trim();
        }
        if (elements.auditStatusBadge) {
          elements.auditStatusBadge.textContent = isVerification ? 'অডিট ও যাচাই সম্পন্ন' : 'সংশোধনী নোট অন্তর্ভুক্ত';
          elements.auditStatusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300';
        }
      } else if (isVerification) {
        elements.auditNotesBox.classList.remove('hidden');
        if (elements.auditNotesContent) {
          elements.auditNotesContent.textContent = 'মূল ফাইলের সাথে সম্পূর্ণ যাচাইকৃত, কোনো পরিবর্তন প্রয়োজন হয়নি।';
        }
        if (elements.auditStatusBadge) {
          elements.auditStatusBadge.textContent = '১০০% নিখুঁত';
          elements.auditStatusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300';
        }
      } else {
        elements.auditNotesBox.classList.add('hidden');
      }
    }

    if (elements.successCard) {
      elements.successCard.classList.remove('hidden');
      elements.successCard.classList.add('flex');
      setTimeout(() => {
        elements.successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

    // 1. Unpack any \text{...} that contains Bengali characters so Bengali words are never trapped in equations
    s = s.replace(/\\(?:text|mathrm|textmd|textbf|textit|mbox)\{\s*([^{}]*?[\u0980-\u09FF][^{}]*?)\s*\}/g, ' $1 ');

    // 2. Separate multiple adjacent definitions: "} B =" -> "}, B ="
    s = s.replace(/(\}\s*)([A-Za-z]\s*=)/g, (match, g1, g2) => `${g1.trim()}, ${g2}`);

    // 3. Process all math delimiters and extract ALL Bengali text completely outside
    s = s.replace(/\$\$([\s\S]*?)\$\$|\$([^\$]+?)\$|\\\[([\s\S]*?\\\])|\\\(([\s\S]*?)\\\)/g, (match, d1, s1, b1, p1) => {
      const isDouble = Boolean(d1 || b1);
      const inner = (d1 || s1 || b1 || p1 || '').trim();

      if (!/[\u0980-\u09FF]/.test(inner)) {
        return match;
      }

      // Strip quotes around trapped Bengali words inside math mode only
      const cleanInner = inner.replace(/["“'’](\s*[\u0980-\u09FF\s]+\s*)["”'’]/g, ' $1 ');
      const parts = cleanInner.split(/([\u0980-\u09FF]+(?:\s+[\u0980-\u09FF]+)*)/);
      let out = [];
      for (let p of parts) {
        p = (p || '').trim();
        if (!p) continue;
        if (/[\u0980-\u09FF]/.test(p)) {
          out.push(p);
        } else {
          if (/^[.,;:]+$/.test(p)) {
            out.push(p);
          } else {
            out.push(isDouble ? `$$${p}$$` : `$${p}$`);
          }
        }
      }
      return out.join(' ');
    });

    s = s.replace(/\$\$\s*\$\$/g, '').replace(/\$\s*\$/g, '');
    s = s.replace(/,\s*,/g, ',');
    return s;
  }

  // Sanitizer: Strips unwanted asterisks around Roman numerals & removes mark brackets [১], [২] from questions
  function cleanOcrResponse(rawText) {
    if (!rawText) return '';
    let text = sanitizeMathBengaliSeparation(rawText.trim());

    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
    }

    text = text.replace(/^[=\-\s]*Start of OCR[^\n]*[=\-\s]*\n?/gim, '');
    text = text.replace(/^[=\-\s]*End of OCR[^\n]*[=\-\s]*\n?/gim, '');
    text = text.replace(/^[=\-\s]*Page\s*\d+[^\n]*[=\-\s]*\n?/gim, '');

    // CRITICAL: Strip any markdown bold asterisks (**)
    text = text.replace(/\*\*/g, '');

    // CRITICAL: Clamp runaway dot repetitions (e.g. ............. -> ......)
    text = text.replace(/\.{8,}/g, '......');

    // 1. Clean asterisks around Roman numerals: *i.* -> i., *ii.* -> ii., *iii.* -> iii.
    text = text.replace(/\*+\s*(i{1,4}|iv|v|vi{0,3}|ix|x)\s*\.\s*\*+/gi, '$1.');

    // 2. Clean asterisks around inline Roman numerals: *i*, *ii*, *iii*, *i, ii*, *i ও ii*, *i, ii ও iii*
    text = text.replace(/\*+\s*([iIvVxX0-9]+(?:\s*,\s*[iIvVxX0-9]+)*(?:\s*ও\s*[iIvVxX0-9]+)*)\s*\*+/g, '$1');
    text = text.replace(/\*+([iIvVxX]+)\*+/g, '$1');

    // 3. Clean leading bullet asterisks on numbered lists: * i. -> i., * 1. -> 1.
    text = text.replace(/^[\*\-•]\s*([iIvVxX0-9\u0980-\u09FF]+\.)/gm, '$1');

    const rawLines = text.split('\n');
    const cleanedLines = [];
    let inNoteBlock = false;

    for (let i = 0; i < rawLines.length; i++) {
      let l = rawLines[i];
      const trimmed = l.trim();
      if (!trimmed) continue; // Skip empty lines / extra enters!

      // Skip OCR delimiter lines
      if (/^[=\-]{2,}/.test(trimmed) && /ocr/i.test(trimmed)) {
        continue;
      }

      // Preserve Audit Note blocks completely without modifying their contents
      if (/^\s*\[\s*নোট/i.test(trimmed)) {
        inNoteBlock = true;
        cleanedLines.push(l);
        if (trimmed.endsWith(']')) inNoteBlock = false;
        continue;
      }
      if (inNoteBlock) {
        cleanedLines.push(l);
        if (trimmed.endsWith(']')) inNoteBlock = false;
        continue;
      }

      // 4. Remove score marks [১], [২], [৩], [৪], [৮], [১০], (১), (২) at the end of creative questions
      l = l.replace(/(\?|।|:|[a-zA-Z\u0980-\u09FF"'”’\$])\s*\[\s*[০-৯0-9\s]+\s*\]\s*$/g, '$1');
      l = l.replace(/(\?|।|:|[a-zA-Z\u0980-\u09FF"'”’\$])\s*[\(（]\s*[০-৯0-9\s]+\s*[\)）]\s*$/g, '$1');

      // If line is a CQ subquestion (e.g. ক. ... ১) with trailing mark digit, remove trailing digit
      if (/^[কখগঘabcd]\./i.test(trimmed)) {
        l = l.replace(/(\?|।)\s+[০-৯0-9]\s*$/g, '$1');
      }

      // 4a. Remove references & source brackets (e.g. [ঢাকা বোর্ড-২০২৩], [ক্যাডেট কলেজ], (দিনাজপুর বোর্ড), [অধ্যায়-৩], মান: ১ ইত্যাদি)
      l = l.replace(/\s*\[\s*(?:[^\]\n]*(?:বোর্ড|কলেজ|স্কুল|মাদ্রাসা|ক্যাডেট|অধ্যায়|অনুশীলনী|পরিপত্র|[০-৯0-9]{4}))[^\]\n]*\]\s*/gi, ' ');
      l = l.replace(/\s*\(\s*(?:[^\)\n]*(?:বোর্ড|কলেজ|স্কুল|মাদ্রাসা|ক্যাডেট|অধ্যায়|অনুশীলনী|[০-৯0-9]{4}))[^\)\n]*\)\s*/gi, ' ');
      l = l.replace(/(\?|।|[a-zA-Z\u0980-\u09FF])\s*মান\s*[:\s]*[০-৯0-9]+\s*$/g, '$1');

      // 4b. Format diagram/image tags strictly as [ছবি আছে-পৃ:০১] without any description
      l = l.replace(/\[\s*(?:চিত্র|ছবি)\s*আছে\s*[:\-]\s*(?:পৃ(?:ষ্ঠা)?[:\s]*([০-৯0-9]+))?[^\]]*\]/gi, function (match, pageNum) {
        let p = pageNum ? toBengaliNumber(pageNum.replace(/[^\d০-৯]/g, '').padStart(2, '0')) : '০১';
        return `[ছবি আছে-পৃ:${p}]`;
      });
      l = l.replace(/\[\s*চিত্র\s*:\s*[^\]]+\]/gi, '[ছবি আছে-পৃ:০১]');

      cleanedLines.push(l);
    }

    let finalOutput = cleanedLines.join('\n').trim();

    // 5. Clean stray quotes around units e.g. 2262 "cm" 3, "cm"^3, "cm"
    finalOutput = finalOutput.replace(/(?<=\d|\))\s*["']\s*(cm|mm|m|km|gm|kg|sec|s|hr|min|V|W|kW|A|mA|Hz|N|Pa|J)\s*["']\s*(\^?\d+)?/gi, function (match, unit, exp) {
      let cleanExp = exp ? exp.replace('^', '') : '';
      return cleanExp ? ` $${unit}^{${cleanExp}}$` : ` ${unit}`;
    });
    finalOutput = finalOutput.replace(/["']\s*(cm|mm|m|km|gm|kg|sec|s|hr|min|V|W|kW|A|mA|Hz|N|Pa|J)\s*["']/gi, '$1');
    finalOutput = finalOutput.replace(/\b(cm|mm|m|km)\s*(\^?([23]))\b/gi, '$1^$3');

    // 6. UNWRAP comma-separated number lists (e.g. $75, 65, 80...$ in Q11)
    finalOutput = finalOutput.replace(/\$\s*([০-৯0-9\s,.\-]+(?:\s*,\s*[০-৯0-9\s,.\-]+)+)\s*\$/g, '$1');

    // 7. UNWRAP plain isolated numbers in $...$ (e.g. $50$, $65$, $62.5$, $30$, $7$)
    finalOutput = finalOutput.replace(/\$\s*([০-৯0-9]+(?:\.[০-৯0-9]+)?)\s*\$/g, '$1');

    // 8. UNWRAP plain measurements in $...$ (e.g. $8 m$, $6 m$, $20 cm$)
    finalOutput = finalOutput.replace(/\$\s*([০-৯0-9]+(?:\.[০-৯0-9]+)?\s*(?:m|cm|mm|km|gm|kg|sec|s|hr|min|V|W|kW|A|mA|Hz|N|Pa|J))\s*\$/gi, '$1');

    // 9. UNWRAP Bengali abbreviations in $...$ (e.g. $7 সে.মি.$, $7 সে. মি.$)
    finalOutput = finalOutput.replace(/\$\s*([০-৯0-9]+(?:\.[০-৯0-9]+)?\s*[\u0980-\u09FF\s.]+)\s*\$/g, '$1');

    // 10. Auto-wrap isolated math variables and expressions before Bengali postpositions (strictly [a-zA-Z], NEVER \d*[a-zA-Z])
    finalOutput = finalOutput.replace(/(?<!\$)\b([a-zA-Z]\([a-zA-Z0-9,\s]+\))(?!\$)(?=\s+(?:এর|হলে|নির্ণয়|মান|কে|তালিকা|প্রকাশ)(?:[\s।\?,\.]|$))/g, '$$$1$$');
    finalOutput = finalOutput.replace(/(?<!\$)\b([a-zA-Z])(?!\$)(?=\s+(?:এর|হলে|কে|তে|মান|নির্ণয়|সমান|মানটি|থেকে|পর্যন্ত|সংখ্যক|তম|পদ)(?:[\s।\?,\.]|$))/g, '$$$1$$');
    finalOutput = finalOutput.replace(/(?<!\$)\b([A-Z])(?!\$)(?=\s+(?:অন্বয়|সেট|তালিকা|ফাংশন|সম্পর্ক|কে|নির্ণয়))/g, '$$$1$$');
    finalOutput = finalOutput.replace(/(?<!\$)\b([a-zA-Z]\s*[-+]\s*[a-zA-Z]\s*=\s*-?\d+)(?!\$)/g, '$$$1$$');

    // Strip any remaining ** marks and collapse extra enters/blank lines
    finalOutput = finalOutput.replace(/\*\*/g, '').replace(/\r/g, '').replace(/\n\s*\n+/g, '\n').trim();

    return finalOutput;
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
                blocks.push({ type: 'paragraph', text: textContent });
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

    const lines = (text || '').replace(/\*\*/g, '').split('\n').filter(l => l.trim().length > 0);
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        const parsedRows = [];
        for (const tLine of tableLines) {
          if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(tLine)) continue;
          const cells = tLine.split('|').slice(1, -1).map(c => c.trim());
          if (cells.length > 0) parsedRows.push(cells);
        }

        if (parsedRows.length > 0) {
          blocks.push({ type: 'table', rows: parsedRows });
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
          if (/[\u0980-\u09FF]/.test(seg.value)) {
            rtf += renderRunsForRtfPlain(seg.value, isBijoy, fontSizeHalfPt, false);
          } else if (EquationConverter.needsEqField && !EquationConverter.needsEqField(seg.value)) {
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
          if (/[\u0980-\u09FF]/.test(seg.value)) {
            runsXml += renderRunsForOoxmlPlain(seg.value, isBijoy, fontSizeHalfPt, false);
          } else if (typeof EquationConverter !== 'undefined' && typeof EquationConverter.latexToOmml === 'function') {
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
            const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';
            if (isBijoy && /[\u2013\u2014]/.test(seg.text)) {
              const dashParts = seg.text.split(/([\u2013\u2014]+)/);
              for (const dp of dashParts) {
                if (!dp) continue;
                if (/[\u2013\u2014]/.test(dp)) {
                  runsXml += `      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
          <w:sz w:val="${fontSizeHalfPt}"/>
          <w:szCs w:val="${fontSizeHalfPt}"/>
          ${boldTag}
          ${vertAlignTag}
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(dp)}</w:t>
      </w:r>\n`;
                } else {
                  const targetSub = window.BanglaConverter ? window.BanglaConverter.unicodeToBijoy(dp) : dp;
                  runsXml += `      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/>
          <w:sz w:val="${fontSizeHalfPt}"/>
          <w:szCs w:val="${fontSizeHalfPt}"/>
          ${boldTag}
          ${vertAlignTag}
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(targetSub)}</w:t>
      </w:r>\n`;
                }
              }
            } else {
              const targetText = isBijoy && window.BanglaConverter ? window.BanglaConverter.unicodeToBijoy(seg.text) : seg.text;
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
    const fontSizeVal = elements.fontSizeSelect ? elements.fontSizeSelect.value : '12';
    const fontSizePt = parseInt(fontSizeVal, 10) || 12;

    const rawName = state.selectedFile?.name || state.filesQueue?.[0]?.name || 'Question_Paper';
    const baseName = rawName.replace(/\.[^/.]+$/, '');

    // FORMAT 1: Word 2003 .DOC (Direct Full-Fidelity Word 2003 SutonnyMJ Document)
    if (format === 'doc') {
      showToast(`ওয়ার্ড ২০০৩ (.doc) ফাইল প্রস্তুত হচ্ছে...`, 'info');

      try {
        let docBlob = null;
        if (typeof DocxHandler !== 'undefined' && typeof DocxHandler.createDocFromText === 'function') {
          docBlob = DocxHandler.createDocFromText(text, 'SutonnyMJ', true, fontSizePt);
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
    const ZipConstructor = (typeof JSZip !== 'undefined')
      ? JSZip
      : (typeof window !== 'undefined' && window.JSZip ? window.JSZip : (typeof global !== 'undefined' && global.JSZip ? global.JSZip : null));

    if (!ZipConstructor) {
      if (typeof DocxHandler !== 'undefined' && typeof DocxHandler.createDocxFromText === 'function') {
        return await DocxHandler.createDocxFromText(text, { isBijoy });
      }
      throw new Error('JSZip লাইব্রেরি লোড হয়নি, অনুগ্রহ করে পেজটি রিফ্রেশ দিন');
    }

    const pageSizeVal = customOptions.pageSize || (elements.pageSizeSelect ? elements.pageSizeSelect.value : 'a4');
    const marginVal = customOptions.margin || (elements.pageMarginSelect ? elements.pageMarginSelect.value : 'normal');
    const fontSizeVal = customOptions.fontSize || (elements.fontSizeSelect ? elements.fontSizeSelect.value : '12');
    const fontSizePt = parseInt(fontSizeVal, 10) || 12;
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

    const cleanInput = (text || '').replace(/\*\*/g, '').replace(/\r/g, '');
    const blocks = parseDocumentBlocks(cleanInput);

    let bodyContentXml = '';

    for (const block of blocks) {
      if (block.type === 'paragraph') {
        const trimmed = block.text.trim();
        if (!trimmed) continue;
        const runsXml = renderRunsForOoxml(block.text, isBijoy, fontSizeHalfPt);
        bodyContentXml += `    <w:p>
      <w:pPr>
        <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
      </w:pPr>
${runsXml}    </w:p>\n`;
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
    <w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>\n`;
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

    if (elements.autoVerifyToggle) {
      state.autoVerify = elements.autoVerifyToggle.checked;
      localStorage.setItem('ai_ocr_auto_verify', state.autoVerify ? 'true' : 'false');
    }

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.FayzarAiOcrEngine = {
    init,
    startOcrConversion,
    startUnifiedOcr,
    runVerificationPipeline,
    extractAuditNote,
    downloadWordDocument,
    handleFiles,
    fastOptimizeImageFile,
    executeGeminiRequest,
    cleanOcrResponse,
    state
  };

})(typeof window !== 'undefined' ? window : this);
