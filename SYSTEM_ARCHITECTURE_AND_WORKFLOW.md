# SYSTEM INSTRUCTIONS: Fayzar Computer Architectural Blueprint

> **CORE DIRECTIVE:**  
> Work quickly, directly, and efficiently. Avoid unnecessary bureaucratic plans or redundant pauses. Always preserve 100% offline compliance and data integrity.

---

# PART 2: BUSINESS PROFILE & DOMAIN IDENTITY

- **Business Name:** ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট (Fayzar Computer & Photostat)
- **Tagline:** ডিজিটাল, অনলাইন ও ভূমিসেবা কেন্দ্র (Digital, Online & Land Services Center)
- **Proprietor:** মোঃ ফয়জার আলী (Md. Fayzar Ali)
- **Government Accreditation:** Land Services Facilitating Centre (LSFC) / সরকার অনুমোদিত ভূমিসেবা কেন্দ্র (উন্মুক্ত)
- **Government Approval No:** দিনাজ/ফুল/এলএসএসএফসি-০৭/২০২৫ (Dinajpur/Phulbari/LSFC-07/2025)
- **Physical Location:** ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে, ফুলবাড়ী, দিনাজপুর (West side of Phulbari Govt. College Gate, Phulbari, Dinajpur)
- **Google Maps Location:** [LSFC Fayzar Computer on Google Maps](https://www.google.com/maps/place/Land+Services+Facilitating+Centre+(LSFC),+Fayzar+Computer+%26+Photostat,+Phulbari,+DInajpur/@25.49824,88.9506273,17z)
- **Direct Phone:** `01717-101919`
- **WhatsApp Support:** `+8801717101919` (Direct pre-filled WhatsApp chat triggers embedded in UI)
- **Operating Hours:**
  - শনিবার - বৃহস্পতিবার: সকাল ১০:০০ - রাত ৯:০০
  - শুক্রবার: বিকাল ৪:০০ - রাত ৯:০০

---

# PART 3: ARCHITECTURAL INVENTORY OF CURRENT SYSTEMS & PAGES

The Fayzar Computer web platform is a hybrid system designed for both **Live Online Web Hosting** (GitHub Pages: `fayzarcomputer.github.io`) and **100% Offline Air-Gapped Operation** inside the physical computer shop.

### 1. Homepage (`index.html`)
- **Header & Navigation:** Responsive navbar with mobile drawer, direct links to Services, Converter, Portal, Notices, Results, Tools, and Admin. Includes Dark/Light theme toggle (persisted via `localStorage`).
- **Hero Section:** Official government LSFC certification badge, headline, service summary, and quick action buttons (Explore Services, Open Converter, Contact).
- **Live Notice & Circulars Ticker:** Dynamic marquee/carousel showing urgent job deadlines and university exam/admission updates.
- **Top 19 Services Showcase:** Tabbed categorized grid (Land Services, Online Citizen Services, Computer/Studio Services) with pricing badges, govt fees, and direct detail modals.
- **Tools Gateway:** Instant access cards to Teletalk photo resizer, Unicode converter, DOCX engine, and background remover.
- **Requirements Checklist:** Interactive accordion/modal guiding citizens on what physical documents to bring to the shop.
- **Customer Reviews & Testimonials:** Slider with verified customer feedback and public feedback submission form.
- **Footer & Shop Profile:** Address, map, hours, emergency contact, and developer credits.

### 2. The Flagship Converter Suite (`converter.html`)
This is the core technical crown jewel of the website, used daily to prepare question papers, legal documents, and official forms:
- **Bi-Directional Bengali Converter:**
  - Unicode ⇄ Bijoy (SutonnyMJ) with ligature correction (`kÖhyy³`, `A¨vwmW`, `mË¡`, `we›`y`, etc.).
  - Custom spell-check dictionary (`data/converter_dict.json`) dynamically loaded.
- **LaTeX & Word Equation (EQ Field) Converter:**
  - Converts mathematical and scientific formulas into native Microsoft Word `EQ` field codes (`\F()`, `\R()`, `\S()`, etc.).
  - Preserves standard scientific units (`cm`, `mm`, `m`, `km`, `kg`, `kW`, `Hz`, `Pa`, `J`, etc.) without unwanted quotation marks or font distortions.
  - Supports calculus operators ($\sum, \int, \iint, \oint, \partial, \nabla, \dots$) and matrix arrays.
- **Gemini AI OCR Engine (`js/ai-ocr-engine.js`):**
  - High-resolution (up to 2560px, JPEG 0.95) multi-page PDF and image OCR processing.
  - Uses Gemini active model failover cascade (Gemini 2.5/3.x flash) with 429 quota exhaustion cooldown tracking.
  - **Category-Based Independent Question Numbering:**
    - Creative Questions (CQ / সৃজনশীল): 1. ক, খ, গ, ঘ; 2. ক, খ, গ, ঘ...
    - Multiple Choice Questions (MCQ / বহুনির্বাচনী): 1. ক, খ, গ, ঘ; 2. ক, খ, গ, ঘ...
    - Short Questions (সংক্ষিপ্ত প্রশ্ন): independent sequence starting from ১.
  - **Zero-Hallucination & Source Fidelity Mandate:** Transcribes strictly what is physically visible in the image without fabricating unwritten questions.
  - **180-second timeout & 65k token window** with keep-alive streaming.
- **AI Re-Verification & Audit System (`wizardAuditNotesBox`):**
  - Dedicated audit bar in UI allowing 1-click spelling and fidelity checks against the source document.
- **Native DOCX Export Engine (`js/docx-handler.js`, `js/docx-to-doc-engine.js`):**
  - Generates downloadable `.docx` files formatted with SutonnyMJ, Kalpurush, or SolaimanLipi.
  - Embeds Word `EQ` equation fields and 2-column question layouts.

### 3. Services Directory (`services.html`)
Detailed directory of all 19 services offered by the shop across 3 major pillars:
- **Pillar 1: ডিজিটাল ভূমিসেবা (Land Services):**
  1. ই-নামজারি ও রেকর্ড খারিজ (E-Mutation)
  2. অনলাইনে জমির খাজনা পরিশোধ (LD Tax)
  3. খতিয়ান/পর্চা অনুসন্ধান ও সার্টিফাইড কপি (CS, SA, RS, BS, City)
  4. মৌজা ম্যাপ ও ডিজিটাল সিট আবেদন (DLRS)
  5. রেকর্ড সংশোধন ও বিবিধ মিস কেস আবেদন
- **Pillar 2: নাগরিক অনলাইন সেবা (Online Citizen Services):**
  6. ই-পাসপোর্ট (E-Passport) নতুন ও রিনিউ
  7. পুলিশ ক্লিয়ারেন্স সার্টিফিকেট (PCC)
  8. অনলাইন সাধারণ ডায়েরি (Online GD)
  9. এনআইডি (NID) সংশোধন ও রি-ইস্যু
  10. অনলাইন ভোটার আইডি ডাউনলোড ও লেমিনেশন
  11. ই-টিন (e-TIN) নতুন ও সংশোধন
  12. বার্ষিক আয়কর ই-রিটার্ন দাখিল (e-Return Dakhil)
  13. ইউনিয়ন/পৌরসভা ই-ট্রেড লাইসেন্স
  14. ড্রাইভিং লাইসেন্স ও বিআরটিএ সেবা (BRTA)
- **Pillar 3: কম্পিউটার ও স্টুডিও সেবা (Computer & Studio Services):**
  15. সরকারি চাকরি ও বিশ্ববিদ্যালয়ে ভর্তির অনলাইন আবেদন
  16. স্কুল-কলেজ-মাদ্রাসার ডিজিটাল পিভিসি (PVC) আইডি কার্ড ও ফিতা
  17. বাংলা ও ইংরেজি কম্পিউটার কম্পোজ
  18. ডিজিটাল ফটোস্ট্যাট ও লেজার কালার প্রিন্ট
  19. স্টুডিও কোয়ালিটি ছবি প্রিন্ট ও হার্ড লেমিনেটিং
*Each service item details: Portal URL, Government Fee, Shop Service Fee, Estimated Processing Duration, and Exact Required Documents List.*

### 4. Citizen Land Services Portal (`portal.html`)
- Dedicated step-by-step assistant for land-related procedures.
- Fee calculator for mutation and land tax.
- Required documents pre-screening checklist.
- Direct external portal launching links.

### 5. Examination Results System (`results.html` & `result-admin.html`)
- **Public Search (`results.html`):** Students/parents can search institutional examination results by Roll Number and Registration Number. Displays marksheet, GPA, grade breakdown, and printable certificate.
- **Admin Management (`result-admin.html`):** Allows importing school/madrasah grade sheets directly from Excel/CSV dumps (`data/raw_excel_dump.json`, `data/raw_madrasah_dump.json`).

### 6. Notice Board & Circulars (`notices.html`)
- Searchable, filterable board for government job circulars, bank recruitment, primary teacher exams, defense circulars, and university admission/exam dates.
- Features urgent deadline badges ("জরুরি আবেদন", "আজ শেষ দিন"), fee details, and downloadable circular PDFs.

### 7. Online Tools Hub (`tools.html`)
- **Teletalk Photo & Signature Resizer:** Canvas-based image processor formatting photos to exactly 300x300 px (<100 KB) and signatures to 300x80 px (<60 KB).
- **Instant Unicode ⇄ Bijoy Converter.**
- **Background Remover (`bg-remover-engine.js`).**
- **Legacy DOCX to binary DOC converter (`docx-to-doc.html`, `doc-converter.html`).**

### 8. Admin Control Panel (`admin.html`)
- Protected administration interface with offline fallback authorization.
- Real-time management of Notices (Add, Edit, Delete, Pin to Hero).
- Services Editor (Update fees, requirements, processing duration).
- Candidate Profiles Manager (stored in `data/candidates.json` for autofill extension integration).
- Custom Dictionary Manager (Bijoy/Unicode special spelling rules).
- Customer Feedback Moderation (Approve, Reject, Delete).
- Full Site Backup Exporter & Importer (1-click JSON backup/restore).

---

# PART 4: DATA MODELS & SCHEMA SPECIFICATION

All application data resides in lightweight, human-readable JSON files in the `data/` folder, with an exact in-memory mirror in `js/offline-data.js` (`window.OFFLINE_DATA`):

1. **`site_config.json`**:
   - `shop`: Name, tagline, phone, whatsapp, address, mapUrl, proprietor, approvalNo, hoursWeekdays, hoursFriday.
   - `hero`: Badge, title, subtitle.
   - `sections`: Toggles for heroNotices, checklist, services, toolsGateway, quickRequest, feedback.
2. **`services.json`**:
   - Array of 19 service objects: `{ id, category, title, badge, badgeColor, icon, summary, portal, govtFee, serviceFee, duration, documents: [] }`.
3. **`notices.json`**:
   - Array of notice objects: `{ id, category, type, title, org, vacancies, qualification, deadline, daysLeft, badgeClass, fee, details, sourceName, sourceUrl, pdfUrl }`.
4. **`converter_dict.json`**:
   - Array of dictionary rules: `{ id, unicode, bijoy, note }`.
5. **`candidates.json`**:
   - Array of applicant profiles: `{ id, name, updatedAt, semanticMap: { applicant_name, applicant_name_bn, mobile_no, ... } }`.
6. **`feedbacks.json`**:
   - Array of reviews: `{ id, name, contact, category, message, rating, status, date }`.
7. **`results_config.json` & `results_data.json`**:
   - Institutional exam configurations and student result matrices.

---

# PART 5: 100% OFFLINE-FIRST ARCHITECTURE

To ensure the website operates flawlessly in remote areas without internet or during network outages:

1. **Zero External CDN Dependencies:**
   - **Tailwind CSS:** Served locally from `js/vendor/tailwindcss.js`.
   - **Font Awesome 6.5.1:** Served locally from `css/font-awesome/` and `webfonts/`.
   - **Fonts:** Hind Siliguri, Noto Sans Bengali, Outfit, Plus Jakarta Sans embedded locally in `.woff2` inside `fonts/` and declared in `css/google-fonts.css`.
   - **Libraries:** `pdf.min.js`, `pdf.worker.min.js`, `xlsx.full.min.js`, `jszip.min.js` all local inside `js/vendor/` and `js/`.
2. **Zero-CORS Offline Data (`js/offline-data.js`):**
   - When opened directly via `file:///` protocol (where browser security blocks `fetch('data/*.json')`), the entire site automatically falls back to `window.OFFLINE_DATA`.
3. **Standalone Local Servers:**
   - **`serve_offline.py`:** Pure Python 3 standard library server (no pip install required) listening on `http://localhost:3000/`. Handles static assets and all `/api/*` REST endpoints (`/api/config`, `/api/notices`, `/api/services`, `/api/candidates`, `/api/save-notices`, `/api/export-backup`, etc.).
   - **`START_OFFLINE.bat`:** Launches `serve_offline.py` and automatically opens the user's default browser.
   - **`OPEN_OFFLINE_DIRECT.bat`:** Launches `index.html` directly in browser for instant zero-server use.
4. **1-Click GitHub Cloud Synchronization:**
   - **`pull-from-github.bat` / `pull-from-github.ps1`:** Downloads latest commits from GitHub repository `fayzarcomputer.github.io` and updates local files in 1-click.
   - **`sync-to-github.bat` / `sync-to-github.ps1`:** Uploads local changes to GitHub in 1-click.
   - **Protected Files:** `github-config.json`, `sync-to-github.*`, `pull-from-github.*`, and local shop configurations are guarded against accidental overwrite.

---

# PART 6: REDESIGN OBJECTIVES & TECHNICAL MANDATES

When executing the redesign in this new workspace:

### 1. Visual & UI/UX Excellence
- **Vibrant & Premium Aesthetics:** Move beyond standard templates. Implement subtle glassmorphism, refined gradients, clean borders (`slate-200/dark:slate-800`), and curated typography.
- **Flawless Dark & Light Mode:** Seamless transition without flash of unstyled content (FOUC). All text must have high contrast and readability in both modes.
- **Dynamic Micro-Interactions:** Smooth hover transitions, tactile button press states, polished modals, accessible accordion transitions.
- **Mobile-First Responsiveness:** Fully responsive across mobile smartphones, tablets, laptops, and ultra-wide desktop screens.

### 2. Architecture & Code Quality
- **Separation of Concerns:** Keep HTML semantic, CSS structured and modular, and JavaScript clean and event-driven.
- **DRY & Modular Structure:** Share reusable components (Navbar, Footer, Service Cards, Notice Modals, Toast Notifications, Theme Toggles).
- **No Heavy Framework Bloat:** Keep the site lightning-fast. Use vanilla JavaScript and modular CSS/Tailwind. Do not introduce heavy dependencies that break offline operation.
- **Preserve All Business Logic:** Every single feature of the current 19 services, the Equation Converter, DOCX generator, AI OCR prompt rules, and result search must be preserved with 100% fidelity.

---

# PART 7: MANDATORY ANTIGRAVITY PRE-FLIGHT CHECKLIST

Before responding to ANY user request or editing any file:
- [ ] Have I identified which phase of the **Superpowers Workflow** this task belongs to?
- [ ] If Phase 1 (Brainstorming & Specification): Have I proposed the design and **waited for explicit approval** before generating code?
- [ ] If Phase 2 (Writing Plans): Have I broken the task into small 2-5 min atomic steps with exact file paths?
- [ ] If Phase 3 (TDD): Is there a verification step or test defined before writing the implementation?
- [ ] Does my proposed solution preserve **100% offline capability** (no external CDNs)?
- [ ] Does my solution maintain backward compatibility with existing JSON schemas (`data/*.json`) and `window.OFFLINE_DATA`?
- [ ] Have I double-checked that no sensitive local configuration files (`github-config.json`) will be corrupted?

---
*End of Master Architecture and Workflow Specification.*
