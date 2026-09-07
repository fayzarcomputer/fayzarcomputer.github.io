/**
 * Fayzar Computer Online Result Portal - Public UI Script
 * Supports Multi-Institution, Cascading Dropdowns, Dynamic Watermarks & Logos,
 * Draft vs Published Protection, and Real-time Verification.
 */

(function () {
  'use strict';

  let config = null;
  let allStudents = [];
  let currentStudent = null;

  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const searchForm = document.getElementById('resultSearchForm');
  const searchInstitution = document.getElementById('searchInstitution');
  const searchYear = document.getElementById('searchYear');
  const searchExam = document.getElementById('searchExam');
  const searchClass = document.getElementById('searchClass');
  const searchRoll = document.getElementById('searchRoll');
  const resetSearchBtn = document.getElementById('resetSearchBtn');

  // Welcome & Marksheet Containers
  const searchWelcomeCard = document.getElementById('searchWelcomeCard');
  const draftWarningAlert = document.getElementById('draftWarningAlert');
  const topActionToolbar = document.getElementById('topActionToolbar');
  const marksheetContainer = document.getElementById('marksheetContainer');
  const activeResultTitle = document.getElementById('activeResultTitle');
  const heroInstName = document.getElementById('heroInstName');

  // Marksheet Elements
  const msLogoContainer = document.getElementById('msLogoContainer');
  const msSchoolLogoImg = document.getElementById('msSchoolLogoImg');
  const msInstNameBn = document.getElementById('msInstNameBn');
  const msInstNameEn = document.getElementById('msInstNameEn');
  const msInstAddress = document.getElementById('msInstAddress');
  const msExamName = document.getElementById('msExamName');
  const msStudentName = document.getElementById('msStudentName');
  const msRoll = document.getElementById('msRoll');
  const msClass = document.getElementById('msClass');
  const msSection = document.getElementById('msSection');
  const msFatherName = document.getElementById('msFatherName');
  const msMotherName = document.getElementById('msMotherName');
  const msDob = document.getElementById('msDob');
  const msStatusBadge = document.getElementById('msStatusBadge');
  const msGpa = document.getElementById('msGpa');
  const msGrade = document.getElementById('msGrade');
  const msRank = document.getElementById('msRank');
  const msTotalMarks = document.getElementById('msTotalMarks');
  const msSubjectsTableBody = document.getElementById('msSubjectsTableBody');
  const msTotalFullMarksFoot = document.getElementById('msTotalFullMarksFoot');
  const msTotalMarksFoot = document.getElementById('msTotalMarksFoot');
  const msGradeFoot = document.getElementById('msGradeFoot');
  const msGpaFoot = document.getElementById('msGpaFoot');
  const msQrCodeBox = document.getElementById('msQrCodeBox');
  const msPublishDate = document.getElementById('msPublishDate');

  // Tabs & Actions
  const tabButtons = document.querySelectorAll('.result-tab-btn');
  const marksheetTabContent = document.getElementById('marksheetTabContent');
  const tabulationTabContent = document.getElementById('tabulationTabContent');
  const analyticsTabContent = document.getElementById('analyticsTabContent');
  const printSingleMarksheetBtn = document.getElementById('printSingleMarksheetBtn');
  const copyResultLinkBtn = document.getElementById('copyResultLinkBtn');
  const tabulationClassSelect = document.getElementById('tabulationClassSelect');
  const tabulationTableBody = document.getElementById('tabulationTableBody');
  const printTabulationBtn = document.getElementById('printTabulationBtn');

  // Initialize
  async function init() {
    initTheme();
    bindEvents();

    config = await ResultEngine.Storage.loadConfig();
    allStudents = await ResultEngine.Storage.loadStudents();

    populateInstitutionDropdown();

    // Check URL parameters for direct link lookup
    const urlParams = new URLSearchParams(window.location.search);
    const qInst = urlParams.get('inst');
    const qYear = urlParams.get('year');
    const qExam = urlParams.get('exam');
    const qClass = urlParams.get('class');
    const qRoll = urlParams.get('roll');

    if (qInst && searchInstitution) {
      searchInstitution.value = qInst;
      onInstitutionChange(qInst);

      if (qYear && searchYear) searchYear.value = qYear;
      if (qExam && searchExam) searchExam.value = qExam;
      if (qClass && searchClass) searchClass.value = qClass;
      if (qRoll && searchRoll) {
        searchRoll.value = qRoll;
        executeSearch(qInst, qYear, qExam, qClass, qRoll);
      }
    } else {
      // Default initial state: All dropdowns stay clean and unselected!
      resetToWelcomeState();
    }
  }

  function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    themeToggleBtn?.addEventListener('click', () => {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      }
    });
  }

  function resetToWelcomeState() {
    if (searchWelcomeCard) searchWelcomeCard.classList.remove('hidden');
    if (draftWarningAlert) draftWarningAlert.classList.add('hidden');
    if (topActionToolbar) topActionToolbar.classList.add('hidden');
    if (marksheetContainer) marksheetContainer.classList.add('hidden');
    currentStudent = null;
  }

  // Populate Institution Dropdown with clean default placeholder
  function populateInstitutionDropdown() {
    if (!searchInstitution || !config || !Array.isArray(config.institutions)) return;

    searchInstitution.innerHTML = '<option value="">-- প্রতিষ্ঠান নির্বাচন করুন --</option>';
    config.institutions.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.id;
      opt.textContent = `${inst.id.includes('madrasah') ? '🕌' : '🏫'} ${inst.name_bn}`;
      searchInstitution.appendChild(opt);
    });

    // Reset subordinate dropdowns to placeholder
    resetSubordinateDropdowns();
  }

  function resetSubordinateDropdowns() {
    if (searchYear) searchYear.innerHTML = '<option value="">-- সাল নির্বাচন করুন --</option>';
    if (searchExam) searchExam.innerHTML = '<option value="">-- পরীক্ষার নাম নির্বাচন করুন --</option>';
    if (searchClass) searchClass.innerHTML = '<option value="">-- শ্রেণি ও শাখা নির্বাচন করুন --</option>';
    if (searchRoll) searchRoll.value = '';
    if (tabulationClassSelect) tabulationClassSelect.innerHTML = '<option value="">-- শ্রেণি নির্বাচন করুন --</option>';
  }

  // When Institution is selected -> Cascading load of Years, Exams & Classes
  function onInstitutionChange(schoolId) {
    if (!schoolId) {
      resetSubordinateDropdowns();
      if (heroInstName) heroInstName.textContent = 'প্রতিষ্ঠানের নাম নির্বাচন করুন';
      return;
    }

    const inst = (config.institutions || []).find(i => i.id === schoolId);
    if (!inst) return;

    if (heroInstName) heroInstName.textContent = inst.name_bn;

    // 1. Populate Years
    if (searchYear) {
      searchYear.innerHTML = '<option value="">-- সাল নির্বাচন করুন --</option>';
      const years = inst.academic_years || ['2026', '2025'];
      years.forEach(yr => {
        const opt = document.createElement('option');
        opt.value = yr;
        opt.textContent = `${ResultEngine.toBnDigit(yr)} (${yr})`;
        searchYear.appendChild(opt);
      });
      // Select latest year by default if available
      if (years.length > 0) searchYear.value = years[0];
    }

    // 2. Populate Exams filtered by Year
    updatePublicExamsForYear(schoolId, searchYear?.value);

    // 3. Populate Classes
    if (searchClass) {
      searchClass.innerHTML = '<option value="">-- শ্রেণি ও শাখা নির্বাচন করুন --</option>';
      const classes = inst.classes || config.classes || [];
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name_bn;
        searchClass.appendChild(opt);
      });
    }

    // 4. Tabulation class select
    if (tabulationClassSelect) {
      tabulationClassSelect.innerHTML = '<option value="">-- শ্রেণি নির্বাচন করুন --</option>';
      const classes = inst.classes || config.classes || [];
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name_bn;
        tabulationClassSelect.appendChild(opt);
      });
      if (classes.length > 0) {
        tabulationClassSelect.value = classes[0].id;
        renderTabulation(schoolId, classes[0].id);
      }
    }
  }

  function updatePublicExamsForYear(schoolId, selectedYear) {
    if (!searchExam) return;
    const inst = (config.institutions || []).find(i => i.id === schoolId);
    if (!inst) return;

    searchExam.innerHTML = '<option value="">-- পরীক্ষার নাম নির্বাচন করুন --</option>';
    const allExams = inst.exams || [
      { id: 'first_term_2026', name_bn: '১ম সাময়িক পরীক্ষা-২০২৬', year: '2026' },
      { id: 'annual_2025', name_bn: 'বার্ষিক পরীক্ষা-২০২৫', year: '2025' }
    ];
    const relevantExams = allExams.filter(e => !selectedYear || !e.year || String(e.year) === String(selectedYear));
    const examsToShow = relevantExams.length > 0 ? relevantExams : allExams;

    examsToShow.forEach(ex => {
      const opt = document.createElement('option');
      opt.value = ex.id;
      opt.textContent = ex.name_bn;
      searchExam.appendChild(opt);
    });
    if (examsToShow.length > 0) searchExam.value = examsToShow[0].id;
  }

  // Execute Search for a Student
  async function executeSearch(schoolId, year, examId, classId, rawRoll) {
    if (!schoolId) {
      alert('অনুগ্রহ করে প্রতিষ্ঠান নির্বাচন করুন।');
      searchInstitution?.focus();
      return;
    }
    if (!classId) {
      alert('অনুগ্রহ করে শ্রেণি ও শাখা নির্বাচন করুন।');
      searchClass?.focus();
      return;
    }
    if (!rawRoll) {
      alert('অনুগ্রহ করে শিক্ষার্থীর রোল নম্বর লিখুন।');
      searchRoll?.focus();
      return;
    }

    const cleanRoll = ResultEngine.toEnDigit(String(rawRoll).trim());
    const rollNum = parseInt(cleanRoll, 10);
    if (isNaN(rollNum) || rollNum <= 0) {
      alert('অনুগ্রহ করে একটি সঠিক রোল নম্বর প্রদান করুন (যেমন: 1, 2, 10)।');
      return;
    }

    // 1. Direct search in local cache or Firestore
    let found = allStudents.find(s => {
      const matchesSchool = (s.institution_id === schoolId) || (!s.institution_id && schoolId === 'dreamland-school');
      const matchesClass = String(s.class_id) === String(classId);
      const matchesRoll = parseInt(ResultEngine.toEnDigit(String(s.roll)), 10) === rollNum;
      const matchesYear = !year || String(s.year) === String(year) || String(s.academic_year) === String(year);
      return matchesSchool && matchesClass && matchesRoll && matchesYear;
    });

    // If not found in cache, attempt direct Firestore lookup
    if (!found) {
      try {
        const docId = ResultEngine.Firestore.getStudentDocId(schoolId, year, examId, classId, rollNum);
        const res = await fetch(`${ResultEngine.Firestore.baseUrl}/results_students/${docId}?key=${ResultEngine.Firestore.apiKey}`);
        if (res.ok) {
          const doc = await res.json();
          found = ResultEngine.Firestore.fromFirestoreDoc(doc);
          if (found) allStudents.push(found);
        }
      } catch (e) {
        console.warn('Firestore direct fetch error:', e);
      }
    }

    if (!found) {
      alert(`দুঃখিত! রোল নম্বর '${rawRoll}' এর কোনো ফলাফল পাওয়া যায়নি। অনুগ্রহ করে শ্রেণি ও রোল নম্বর পুনরায় মিলিয়ে দেখুন।`);
      return;
    }

    // Check Publish Lifecycle: Draft vs Published vs Scheduled
    if (found.publish_status === 'draft') {
      if (searchWelcomeCard) searchWelcomeCard.classList.remove('hidden');
      if (draftWarningAlert) {
        draftWarningAlert.classList.remove('hidden');
        const h4 = draftWarningAlert.querySelector('h4');
        const p = draftWarningAlert.querySelector('p');
        if (h4) h4.textContent = 'ফলাফল এখনও প্রকাশিত হয়নি (ড্রাফট মোড)';
        if (p) p.textContent = 'এই শ্রেণির ফলাফল বর্তমানে মূল্যায়ন ও যাচাই-বাছাই প্রক্রিয়ায় রয়েছে। অ্যাডমিন কর্তৃক অনুমোদিত ও প্রকাশিত হলে অনলাইনে দেখা যাবে।';
      }
      if (topActionToolbar) topActionToolbar.classList.add('hidden');
      if (marksheetContainer) marksheetContainer.classList.add('hidden');
      draftWarningAlert?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (found.publish_status === 'scheduled') {
      const pubTime = found.published_at ? new Date(found.published_at).getTime() : 0;
      const now = Date.now();
      if (pubTime && pubTime > now) {
        if (searchWelcomeCard) searchWelcomeCard.classList.remove('hidden');
        if (draftWarningAlert) {
          draftWarningAlert.classList.remove('hidden');
          const h4 = draftWarningAlert.querySelector('h4');
          const p = draftWarningAlert.querySelector('p');
          const dateText = found.published_date_bn || found.published_date;
          const timeText = found.published_time_bn || found.published_time;
          if (h4) h4.innerHTML = `<i class="fas fa-clock text-amber-600 mr-2"></i> ফলাফল প্রকাশের সময় নির্ধারিত রয়েছে (Scheduled)`;
          if (p) p.innerHTML = `এই শ্রেণির ফলাফল আনুষ্ঠানিকভাবে প্রকাশের নির্ধারিত তারিখ ও সময়: <strong>${dateText}${timeText ? ' (' + timeText + ')' : ''}</strong>। নির্ধারিত সময়ের পর অনলাইনে সম্পূর্ণ মার্কশীট ও ফলাফল দেখা যাবে।`;
        }
        if (topActionToolbar) topActionToolbar.classList.add('hidden');
        if (marksheetContainer) marksheetContainer.classList.add('hidden');
        draftWarningAlert?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Successful lookup of Published Result:
    currentStudent = ResultEngine.calculateStudent(found);
    renderMarksheet(currentStudent, schoolId);

    // Switch tab to marksheet if not active
    switchTab('marksheetTab');

    // Smooth scroll to marksheet
    marksheetContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Render Marksheet Card
  function renderMarksheet(student, schoolId) {
    if (!student) return;

    if (searchWelcomeCard) searchWelcomeCard.classList.add('hidden');
    if (draftWarningAlert) draftWarningAlert.classList.add('hidden');
    if (topActionToolbar) topActionToolbar.classList.remove('hidden');
    if (marksheetContainer) marksheetContainer.classList.remove('hidden');

    const inst = (config.institutions || []).find(i => i.id === (schoolId || student.institution_id)) || config.institution || {};

    // 1. Dynamic School Watermark & Theme Color
    const watermarkText = inst.watermark_text || (inst.name_en ? inst.name_en.split(' ')[0].toUpperCase() : 'FAYZAR');
    marksheetContainer.setAttribute('data-watermark', watermarkText);

    // 2. Dynamic School Logo
    if (msSchoolLogoImg) {
      msSchoolLogoImg.src = inst.logo_url || 'assets/images/school-logo.png';
      msSchoolLogoImg.alt = inst.name_bn || 'School Logo';
    }

    // 3. School Header Titles
    if (msInstNameBn) msInstNameBn.textContent = inst.name_bn || student.institution_name_bn || 'বিদ্যালয়ের নাম';
    if (msInstNameEn) msInstNameEn.textContent = inst.name_en || 'SCHOOL NAME';
    if (msInstAddress) msInstAddress.textContent = inst.address_bn || 'ফুলবাড়ী, দিনাজপুর';
    if (msExamName) msExamName.textContent = student.exam_name_bn || 'বার্ষিক পরীক্ষা - ২০২৫';

    // 4. Student Details
    if (msStudentName) msStudentName.textContent = student.student_name_bn || student.student_name_en || 'নাম পাওয়া যায়নি';
    if (msRoll) msRoll.textContent = ResultEngine.toBnDigit(student.roll);
    if (msClass) msClass.textContent = student.class_name_bn || student.class_id;
    if (msSection) msSection.textContent = student.section || 'সাধারণ';
    if (msFatherName) msFatherName.textContent = student.father_name_bn || '--';
    if (msMotherName) msMotherName.textContent = student.mother_name_bn || '--';
    if (msDob) msDob.textContent = student.dob ? ResultEngine.toBnDigit(student.dob) : '--';

    // 5. Result Stat Cards
    const isPassed = student.status === 'Passed';
    if (msStatusBadge) {
      if (isPassed) {
        msStatusBadge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
        msStatusBadge.innerHTML = '<i class="fas fa-check-circle mr-1"></i> উত্তীর্ণ (Passed)';
      } else {
        msStatusBadge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300';
        msStatusBadge.innerHTML = '<i class="fas fa-times-circle mr-1"></i> অকৃতকার্য (Failed)';
      }
    }

    if (msGpa) msGpa.textContent = isPassed ? ResultEngine.formatGpa(student.gpa) : '0.00';
    if (msGrade) msGrade.textContent = isPassed ? (student.grade || 'A+') : 'F';
    if (msRank) msRank.textContent = student.position ? `${ResultEngine.toBnDigit(student.position)}ম` : '--';
    if (msTotalMarks) msTotalMarks.textContent = `${ResultEngine.toBnDigit(student.total_marks)} / ${ResultEngine.toBnDigit(student.max_possible_marks || 600)}`;

    // 6. Subject Table Rows
    if (msSubjectsTableBody && Array.isArray(student.subjects)) {
      msSubjectsTableBody.innerHTML = '';
      let displaySerial = 1;
      student.subjects.forEach((sub, idx) => {
        const isSubFail = sub.grade === 'F';
        const gradeColor = isSubFail ? 'text-rose-700 font-black' : 'text-slate-900 font-extrabold';
        const isComposite = Array.isArray(sub.papers) && sub.papers.length >= 2;

        if (isComposite) {
          const p1 = sub.papers[0];
          const p2 = sub.papers[1];
          const p1MarksDisplay = (p1.is_absent || String(p1.marks_obtained).toUpperCase() === 'ABS') ? '<span class="text-rose-700 font-black">ABS</span>' : ResultEngine.toBnDigit(p1.marks_obtained);
          const p2MarksDisplay = (p2.is_absent || String(p2.marks_obtained).toUpperCase() === 'ABS') ? '<span class="text-rose-700 font-black">ABS</span>' : ResultEngine.toBnDigit(p2.marks_obtained);

          const tr1 = document.createElement('tr');
          tr1.className = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';
          tr1.innerHTML = `
            <td rowspan="2" class="py-1.5 px-2 print:py-0.8 border-r border-b border-slate-300 text-center font-mono text-slate-700 align-middle">${ResultEngine.toBnDigit(displaySerial)}</td>
            <td class="py-1.5 px-3 print:py-0.8 border-r border-b border-slate-200 font-bold text-slate-950">
              ${p1.name_bn || p1.name_en}
            </td>
            <td class="py-1.5 px-2.5 print:py-0.8 border-r border-b border-slate-200 text-center font-mono text-slate-800">${ResultEngine.toBnDigit(p1.full_marks || 100)}</td>
            <td class="py-1.5 px-2.5 print:py-0.8 border-r border-b border-slate-200 text-center font-mono font-black text-slate-950">${p1MarksDisplay}</td>
            <td rowspan="2" class="py-1.5 px-2.5 print:py-0.8 border-r border-b border-slate-300 text-center ${gradeColor} align-middle bg-slate-50/50">${sub.grade || 'F'}</td>
            <td rowspan="2" class="py-1.5 px-2.5 print:py-0.8 border-b border-slate-300 text-center font-mono font-bold ${gradeColor} align-middle bg-slate-50/50">${ResultEngine.formatGpa(sub.point)}</td>
          `;
          msSubjectsTableBody.appendChild(tr1);

          const tr2 = document.createElement('tr');
          tr2.className = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';
          tr2.innerHTML = `
            <td class="py-1.5 px-3 print:py-0.8 border-r border-b border-slate-300 font-bold text-slate-950">
              ${p2.name_bn || p2.name_en}
              <span class="text-[9.5px] print:text-[8px] text-slate-500 font-medium ml-1.5">(যৌথ মোট: ${ResultEngine.toBnDigit(sub.marks_obtained)} / ${ResultEngine.toBnDigit(sub.full_marks || 200)})</span>
            </td>
            <td class="py-1.5 px-2.5 print:py-0.8 border-r border-slate-300 text-center font-mono text-slate-800">${ResultEngine.toBnDigit(p2.full_marks || 100)}</td>
            <td class="py-1.5 px-2.5 print:py-0.8 border-r border-slate-300 text-center font-mono font-black text-slate-950">${p2MarksDisplay}</td>
          `;
          msSubjectsTableBody.appendChild(tr2);
        } else {
          const marksDisplay = sub.is_absent ? '<span class="text-rose-700 font-black">অনুপস্থিত (ABS)</span>' : ResultEngine.toBnDigit(sub.marks_obtained);
          const showOptBadge = sub.is_optional && !sub.name_bn?.includes('৪র্থ') && !sub.name_bn?.includes('ঐচ্ছিক');
          const tr = document.createElement('tr');
          tr.className = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';
          tr.innerHTML = `
            <td class="py-1.5 px-2 print:py-0.8 border-r border-b border-slate-300 text-center font-mono text-slate-700">${ResultEngine.toBnDigit(displaySerial)}</td>
            <td class="py-1.5 px-3 print:py-0.8 border-r border-slate-300 font-bold text-slate-950">
              ${sub.name_bn || sub.name_en}
              ${showOptBadge ? '<span class="text-[10px] text-amber-700 font-bold ml-1">(ঐচ্ছিক)</span>' : ''}
            </td>
            <td class="py-1.5 px-2.5 print:py-0.8 border-r border-slate-300 text-center font-mono text-slate-800">${ResultEngine.toBnDigit(sub.full_marks || 100)}</td>
            <td class="py-1.5 px-2.5 print:py-0.8 border-r border-slate-300 text-center font-mono font-black text-slate-950">${marksDisplay}</td>
            <td class="py-1.5 px-2.5 print:py-0.8 border-r border-slate-300 text-center ${gradeColor}">${sub.grade || 'F'}</td>
            <td class="py-1.5 px-2.5 print:py-0.8 border-b border-slate-300 text-center font-mono font-bold ${gradeColor}">${ResultEngine.formatGpa(sub.point)}</td>
          `;
          msSubjectsTableBody.appendChild(tr);
        }
        displaySerial++;
      });
    }

    // 7. Table Footer Totals
    if (msTotalFullMarksFoot) msTotalFullMarksFoot.textContent = ResultEngine.toBnDigit(student.max_possible_marks || 600);
    if (msTotalMarksFoot) msTotalMarksFoot.textContent = ResultEngine.toBnDigit(student.total_marks || 0);
    if (msGradeFoot) msGradeFoot.textContent = isPassed ? (student.grade || 'A+') : 'F';
    if (msGpaFoot) msGpaFoot.textContent = isPassed ? ResultEngine.formatGpa(student.gpa) : '0.00';

    // 8. Evaluation Remarks
    const msRemarks = document.getElementById('msRemarks');
    if (msRemarks) {
      if (isPassed) {
        if (student.gpa >= 5.0) {
          msRemarks.textContent = 'অনন্য ও অসাধারণ ফলাফল! পরবর্তী শ্রেণিতে প্রমোশন লাভ করেছে।';
        } else if (student.gpa >= 4.0) {
          msRemarks.textContent = 'খুবই প্রশংসনীয় ফলাফল। পরবর্তী শ্রেণিতে প্রমোশন লাভ করেছে।';
        } else if (student.gpa >= 3.0) {
          msRemarks.textContent = 'সন্তোষজনক ফলাফল। পরবর্তী শ্রেণিতে ভর্তি ও পাঠ গ্রহণের যোগ্যতা অর্জিত হয়েছে।';
        } else {
          msRemarks.textContent = 'উত্তীর্ণ। তবে নিয়মিত অধ্যয়নে আরও মনোযোগী হওয়ার নির্দেশ দেওয়া যাচ্ছে।';
        }
      } else {
        msRemarks.innerHTML = '<span class="text-rose-700 font-bold">অকৃতকার্য। সংশ্লিষ্ট বিষয়সমূহে বিশেষ ক্লাস ও পুনর্বিবেচনা প্রযোজ্য।</span>';
      }
    }

    // 9. Dynamic QR Code for Online Verification
    if (msQrCodeBox) {
      const verifyUrl = `${window.location.origin}${window.location.pathname}?inst=${encodeURIComponent(schoolId || student.institution_id)}&year=${encodeURIComponent(student.year || '2025')}&exam=${encodeURIComponent(student.exam_id || 'annual_2025')}&class=${encodeURIComponent(student.class_id)}&roll=${encodeURIComponent(student.roll)}`;
      msQrCodeBox.innerHTML = ResultEngine.generateVerificationQrSvg(verifyUrl, 80);
    }

    // 10. Official Published Date & Time Display
    if (msPublishDate) {
      if (student.published_date_bn || student.published_time_bn) {
        const timeText = student.published_time_bn ? ` (${student.published_time_bn})` : '';
        msPublishDate.innerHTML = `<span class="text-emerald-800 font-bold">প্রকাশ:</span> ${student.published_date_bn || student.published_date}${timeText}`;
      } else if (student.published_date) {
        msPublishDate.innerHTML = `<span class="text-emerald-800 font-bold">প্রকাশ:</span> ${student.published_date}`;
      } else {
        msPublishDate.textContent = `তারিখ: ৩১/১২/২০২৫`;
      }
    }
  }

  // Render Class Tabulation Sheet
  function renderTabulation(schoolId, classId) {
    if (!tabulationTableBody || !classId) return;

    schoolId = schoolId || searchInstitution?.value || 'dreamland-school';
    const studentsInClass = allStudents.filter(s => {
      const matchSchool = (s.institution_id === schoolId) || (!s.institution_id && schoolId === 'dreamland-school');
      const matchClass = String(s.class_id) === String(classId);
      const isPublished = (s.publish_status !== 'draft');
      return matchSchool && matchClass && isPublished;
    });

    const rankedStudents = ResultEngine.calculateClassPositions(studentsInClass);
    tabulationTableBody.innerHTML = '';

    if (rankedStudents.length === 0) {
      tabulationTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="py-8 text-center text-slate-400">
            এই শ্রেণির কোনো প্রকাশিত ফলাফল পাওয়া যায়নি। ফলাফল প্রস্তুত বা ড্রাফট অবস্থায় থাকতে পারে।
          </td>
        </tr>
      `;
      return;
    }

    rankedStudents.forEach((st, idx) => {
      const tr = document.createElement('tr');
      tr.className = idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-800/40';
      const isPassed = st.status === 'Passed';

      tr.innerHTML = `
        <td class="py-2.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400 font-mono">${ResultEngine.toBnDigit(st.position)}ম</td>
        <td class="py-2.5 px-3 text-center font-mono font-bold">${ResultEngine.toBnDigit(st.roll)}</td>
        <td class="py-2.5 px-4 font-bold text-slate-900 dark:text-white">${st.student_name_bn}</td>
        <td class="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">${isPassed ? ResultEngine.formatGpa(st.gpa) : '0.00'}</td>
        <td class="py-2.5 px-3 text-center font-bold">${isPassed ? st.grade : '<span class="text-rose-600">F</span>'}</td>
        <td class="py-2.5 px-3 text-center font-mono">${ResultEngine.toBnDigit(st.total_marks)}</td>
        <td class="py-2.5 px-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isPassed ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}">
            ${isPassed ? 'উত্তীর্ণ' : 'অকৃতকার্য'}
          </span>
        </td>
        <td class="py-2.5 px-3 text-center no-print">
          <button type="button" onclick="window.viewDirectStudent('${st.class_id}', '${st.roll}')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer">
            <i class="fas fa-eye"></i> মার্কশীট
          </button>
        </td>
      `;
      tabulationTableBody.appendChild(tr);
    });
  }

  // Global helper for clicking student in tabulation
  window.viewDirectStudent = function (classId, roll) {
    if (searchClass) searchClass.value = classId;
    if (searchRoll) searchRoll.value = roll;
    executeSearch(searchInstitution?.value, searchYear?.value, searchExam?.value, classId, roll);
  };

  // Tab Switching
  function switchTab(tabName) {
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active', 'bg-emerald-600', 'text-white');
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('active', 'bg-emerald-600', 'text-white');
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      }
    });

    if (marksheetTabContent) marksheetTabContent.classList.toggle('hidden', tabName !== 'marksheetTab');
    if (tabulationTabContent) tabulationTabContent.classList.toggle('hidden', tabName !== 'tabulationTab');
    if (analyticsTabContent) analyticsTabContent.classList.toggle('hidden', tabName !== 'analyticsTab');

    if (tabName === 'tabulationTab') {
      renderTabulation(searchInstitution?.value, tabulationClassSelect?.value || searchClass?.value);
    }
  }

  // Event Listeners
  function bindEvents() {
    searchInstitution?.addEventListener('change', (e) => {
      onInstitutionChange(e.target.value);
    });

    searchYear?.addEventListener('change', (e) => {
      updatePublicExamsForYear(searchInstitution?.value, e.target.value);
    });

    searchForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      executeSearch(
        searchInstitution?.value,
        searchYear?.value,
        searchExam?.value,
        searchClass?.value,
        searchRoll?.value
      );
    });

    resetSearchBtn?.addEventListener('click', () => {
      if (searchInstitution) searchInstitution.value = '';
      resetSubordinateDropdowns();
      resetToWelcomeState();
    });

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    tabulationClassSelect?.addEventListener('change', (e) => {
      renderTabulation(searchInstitution?.value, e.target.value);
    });

    printSingleMarksheetBtn?.addEventListener('click', () => {
      window.print();
    });

    printTabulationBtn?.addEventListener('click', () => {
      window.print();
    });

    copyResultLinkBtn?.addEventListener('click', () => {
      if (!currentStudent) return;
      const shareUrl = `${window.location.origin}${window.location.pathname}?inst=${encodeURIComponent(searchInstitution?.value || currentStudent.institution_id)}&year=${encodeURIComponent(currentStudent.year || '2025')}&exam=${encodeURIComponent(currentStudent.exam_id || 'annual_2025')}&class=${encodeURIComponent(currentStudent.class_id)}&roll=${encodeURIComponent(currentStudent.roll)}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('ফলাফলের সরাসরি লিঙ্ক কপি করা হয়েছে!');
      }).catch(() => {
        prompt('ফলাফলের সরাসরি লিঙ্ক:', shareUrl);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
