/**
 * Fayzar Computer Online Result Management - Admin Panel Script
 * 3-Tier RBAC (Web Super Admin, School Master Admin, Subject Teacher)
 * Concurrency-safe field update with updateMask, Firestore REST sync,
 * Web Admin Exclusive Publish Control, Excel Export & A4 Batch Print Engine.
 */

(function () {
  'use strict';

  let config = null;
  let allStudents = [];
  let currentUser = null;
  let currentClassId = '';
  let activeSchoolId = 'dreamland-school';
  let currentYear = '2026';
  let currentExamId = 'first_term_2026';

  // DOM Elements
  const authOverlay = document.getElementById('adminAuthOverlay');
  const pinForm = document.getElementById('adminPinForm');
  const pinInput = document.getElementById('adminPinInput');
  const adminThemeToggleBtn = document.getElementById('adminThemeToggleBtn');
  const adminUserRoleBadge = document.getElementById('adminUserRoleBadge');
  const adminRoleText = document.getElementById('adminRoleText');
  const adminInstitutionSelect = document.getElementById('adminInstitutionSelect');
  const lockedSchoolNameBadge = document.getElementById('lockedSchoolNameBadge');
  const lockedSchoolText = document.getElementById('lockedSchoolText');

  // Tabs
  const adminTabButtons = document.querySelectorAll('.admin-tab-btn');
  const batchPrintTabContent = document.getElementById('batchPrintTabContent');
  const spreadsheetTabContent = document.getElementById('spreadsheetTabContent');
  const excelImportTabContent = document.getElementById('excelImportTabContent');
  const settingsTabContent = document.getElementById('settingsTabContent');

  // Batch Print Tab
  const batchPrintMainCard = document.getElementById('batchPrintMainCard');
  const batchPreviewSection = document.getElementById('batchPreviewSection');
  const batchYearSelect = document.getElementById('batchYearSelect');
  const batchExamSelect = document.getElementById('batchExamSelect');
  const batchClassSelect = document.getElementById('batchClassSelect');
  const executeBatchPrintBtn = document.getElementById('executeBatchPrintBtn');
  const batchStudentCount = document.getElementById('batchStudentCount');
  const batchPreviewGrid = document.getElementById('batchPreviewGrid');
  const batchPrintContainer = document.getElementById('batchPrintContainer');

  // Spreadsheet Editor Tab
  const editorYearSelect = document.getElementById('editorYearSelect');
  const editorExamSelect = document.getElementById('editorExamSelect');
  const editorClassSelect = document.getElementById('editorClassSelect');
  const editorRoleInstruction = document.getElementById('editorRoleInstruction');
  const publishControlContainer = document.getElementById('publishControlContainer');
  const classPublishStatusBadge = document.getElementById('classPublishStatusBadge');
  const togglePublishBtn = document.getElementById('togglePublishBtn');
  const togglePublishBtnText = document.getElementById('togglePublishBtnText');
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  const addNewStudentBtn = document.getElementById('addNewStudentBtn');
  const saveEditorChangesBtn = document.getElementById('saveEditorChangesBtn');
  const editorTableHead = document.getElementById('editorTableHead');
  const editorTableBody = document.getElementById('editorTableBody');

  // Excel Import Tab
  const importYearSelect = document.getElementById('importYearSelect');
  const importExamSelect = document.getElementById('importExamSelect');
  const importClassSelect = document.getElementById('importClassSelect');
  const downloadSampleExcelBtn = document.getElementById('downloadSampleExcelBtn');
  const excelFileInput = document.getElementById('excelFileInput');
  const excelDropzone = document.getElementById('excelDropzone');
  const importResultStatus = document.getElementById('importResultStatus');

  // Manage & Edit Exams Modal
  const manageExamsModal = document.getElementById('manageExamsModal');
  const manageExamForm = document.getElementById('manageExamForm');
  const editingExamOriginalId = document.getElementById('editingExamOriginalId');
  const manageExamFormTitle = document.getElementById('manageExamFormTitle');
  const cancelEditExamBtn = document.getElementById('cancelEditExamBtn');
  const examFormYear = document.getElementById('examFormYear');
  const examFormNameBn = document.getElementById('examFormNameBn');
  const examFormSubmitBtn = document.getElementById('examFormSubmitBtn');
  const examFormSubmitText = document.getElementById('examFormSubmitText');
  const manageExamsTableBody = document.getElementById('manageExamsTableBody');
  const activeSchoolExamCountBadge = document.getElementById('activeSchoolExamCountBadge');

  // Publish Schedule Modal
  const publishScheduleModal = document.getElementById('publishScheduleModal');
  const publishScheduleForm = document.getElementById('publishScheduleForm');
  const publishScheduleDate = document.getElementById('publishScheduleDate');
  const publishScheduleTime = document.getElementById('publishScheduleTime');
  const publishNoticeText = document.getElementById('publishNoticeText');
  const publishModalTargetText = document.getElementById('publishModalTargetText');

  // Add Student Modal
  const addStudentModal = document.getElementById('addStudentModal');
  const newStudentForm = document.getElementById('newStudentForm');
  const newStudentRoll = document.getElementById('newStudentRoll');
  const newStudentSection = document.getElementById('newStudentSection');
  const newStudentNameBn = document.getElementById('newStudentNameBn');
  const newStudentFather = document.getElementById('newStudentFather');
  const newStudentMother = document.getElementById('newStudentMother');

  // Settings Tab
  const settingsForm = document.getElementById('settingsForm');
  const cfgInstNameBn = document.getElementById('cfgInstNameBn');
  const cfgInstNameEn = document.getElementById('cfgInstNameEn');
  const cfgInstAddress = document.getElementById('cfgInstAddress');
  const cfgExamName = document.getElementById('cfgExamName');
  const resetDefaultDataBtn = document.getElementById('resetDefaultDataBtn');

  // Initialize
  async function init() {
    initTheme();
    bindEvents();

    config = await ResultEngine.Storage.loadConfig();
    allStudents = await ResultEngine.Storage.loadStudents();

    // Auto-normalize legacy students missing year or exam_id (e.g. Amdungi Madrasah 2025)
    let needsSave = false;
    allStudents.forEach(s => {
      if (!s.year && s.academic_year) { s.year = s.academic_year; needsSave = true; }
      if (!s.year) { s.year = '2025'; needsSave = true; }
      if (!s.academic_year) { s.academic_year = s.year; needsSave = true; }
      if (!s.exam_id) {
        if (s.exam_name_bn && (s.exam_name_bn.includes('টেস্ট') || s.exam_name_bn.includes('Test'))) {
          s.exam_id = 'dakhil_test_2025';
        } else {
          s.exam_id = 'annual_2025';
        }
        needsSave = true;
      }
    });
    if (needsSave) {
      ResultEngine.Storage.saveStudents(allStudents);
    }

    // Check URL parameters for Direct Navigation & Single Sign-On (SSO)
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    const schoolParam = urlParams.get('school');
    const tabParam = urlParams.get('tab');

    const isWebAdminLoggedIn = 
      (authParam === 'super') ||
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('fayzar_admin_session') === 'true') ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('fayzar_admin_session') === 'true');

    if (isWebAdminLoggedIn) {
      currentUser = {
        role: 'super_admin',
        role_title: 'ওয়েব সুপার অ্যাডমিন (ফয়জার কম্পিউটার)',
        name: 'ফয়জার কম্পিউটার অ্যাডমিন',
        canBatchPrint: true,
        canPublish: true,
        canSwitchSchool: true,
        canManageUsers: true,
        school_id: null
      };
      ResultEngine.Storage.setCurrentUser(currentUser);
    } else {
      currentUser = ResultEngine.Storage.getCurrentUser();
    }

    if (schoolParam) {
      activeSchoolId = schoolParam;
    }

    if (!currentUser) {
      showAuthOverlay();
    } else {
      hideAuthOverlay();
      applyUserPermissions(currentUser);

      if (schoolParam && adminInstitutionSelect) {
        adminInstitutionSelect.value = schoolParam;
      }

      // If requested directly into spreadsheet or coming from admin
      if (tabParam === 'spreadsheet' || tabParam === 'spreadsheetTab') {
        switchAdminTab('spreadsheetTab');
      } else if (tabParam) {
        switchAdminTab(tabParam);
      }
    }
  }

  function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    adminThemeToggleBtn?.addEventListener('click', () => {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      }
    });
  }

  function showAuthOverlay() {
    if (authOverlay) {
      authOverlay.classList.remove('hidden');
      authOverlay.style.display = 'flex';
      setTimeout(() => pinInput?.focus(), 100);
    }
  }

  function hideAuthOverlay() {
    if (authOverlay) {
      authOverlay.classList.add('hidden');
      authOverlay.style.display = 'none';
    }
  }

  // 3-Tier Permission Enforcer
  function applyUserPermissions(user) {
    if (!user) return;

    // 1. Set Role Badge
    if (adminRoleText) {
      adminRoleText.textContent = user.role_title || user.name;
    }

    // 2. School Switcher Control
    if (user.role === 'super_admin') {
      // Super Admin: Can switch to any school
      if (adminInstitutionSelect) {
        adminInstitutionSelect.classList.remove('hidden');
        adminInstitutionSelect.disabled = false;
        populateInstitutionDropdown();
        adminInstitutionSelect.value = activeSchoolId;
      }
      if (lockedSchoolNameBadge) lockedSchoolNameBadge.classList.add('hidden');
    } else {
      // School Master or Teacher: School is locked!
      activeSchoolId = user.school_id;
      if (adminInstitutionSelect) adminInstitutionSelect.classList.add('hidden');
      if (lockedSchoolNameBadge) {
        lockedSchoolNameBadge.classList.remove('hidden');
        if (lockedSchoolText) lockedSchoolText.textContent = user.school_name || 'নিজ বিদ্যালয়';
      }
    }

    // 3. Batch Print Tab Control (Accessible to all authenticated users)
    if (batchPrintMainCard) batchPrintMainCard.classList.remove('hidden');
    if (batchPreviewSection) batchPreviewSection.classList.remove('hidden');

    // 4. Publish / Draft Control (Web Admin ONLY)
    if (publishControlContainer) {
      if (user.canPublish) {
        publishControlContainer.classList.remove('hidden');
        if (togglePublishBtn) togglePublishBtn.classList.remove('hidden');
      } else {
        publishControlContainer.classList.remove('hidden');
        // School Master & Teachers can only see status badge, cannot toggle!
        if (togglePublishBtn) togglePublishBtn.classList.add('hidden');
      }
    }

    // 5. Editor Role Instruction
    if (editorRoleInstruction) {
      if (user.role === 'teacher') {
        editorRoleInstruction.textContent = `(আপনার দায়িত্ব: ${user.assigned_subjects.join(', ')} এর নম্বর এন্ট্রি)`;
      } else if (user.role === 'school_master') {
        editorRoleInstruction.textContent = `(${user.school_name} এর সকল মার্কস নিয়ন্ত্রণ)`;
      } else {
        editorRoleInstruction.textContent = '(ওয়েব সুপার অ্যাডমিন - সর্বময় নিয়ন্ত্রণ)';
      }
    }

    populateYearAndExamDropdowns();
    populateClassDropdowns();
    renderSpreadsheet();
    renderBatchPreview();
    loadSettingsForm();
  }

  function populateInstitutionDropdown() {
    if (!adminInstitutionSelect || !config || !Array.isArray(config.institutions)) return;
    adminInstitutionSelect.innerHTML = '';
    config.institutions.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.id;
      opt.textContent = `${inst.id.includes('madrasah') ? '🕌' : '🏫'} ${inst.name_bn}`;
      adminInstitutionSelect.appendChild(opt);
    });
  }

  function getActiveSchool() {
    return (config.institutions || []).find(i => i.id === activeSchoolId) || config.institution || {};
  }

  function populateYearAndExamDropdowns() {
    const school = getActiveSchool();
    const years = school.academic_years || ['2026', '2025'];

    const yearSelects = [editorYearSelect, batchYearSelect, importYearSelect].filter(Boolean);
    yearSelects.forEach(sel => {
      sel.innerHTML = '';
      years.forEach(yr => {
        const opt = document.createElement('option');
        opt.value = yr;
        opt.textContent = `${ResultEngine.toBnDigit(yr)} (${yr})`;
        sel.appendChild(opt);
      });
      if (years.includes(currentYear)) {
        sel.value = currentYear;
      } else if (years.length > 0) {
        currentYear = years[0];
        sel.value = currentYear;
      }
    });

    updateExamDropdownsForYear();
  }

  function updateExamDropdownsForYear() {
    const school = getActiveSchool();
    const allExams = school.exams || [];
    const relevantExams = allExams.filter(e => !e.year || String(e.year) === String(currentYear));
    const examsToShow = relevantExams.length > 0 ? relevantExams : allExams;

    const examSelects = [editorExamSelect, batchExamSelect, importExamSelect].filter(Boolean);
    examSelects.forEach(sel => {
      sel.innerHTML = '';
      examsToShow.forEach(ex => {
        const opt = document.createElement('option');
        opt.value = ex.id;
        opt.textContent = ex.name_bn;
        sel.appendChild(opt);
      });
      if (examsToShow.some(e => e.id === currentExamId)) {
        sel.value = currentExamId;
      } else if (examsToShow.length > 0) {
        currentExamId = examsToShow[0].id;
        sel.value = currentExamId;
      }
    });
  }

  function populateClassDropdowns() {
    const school = getActiveSchool();
    const classes = school.classes || config.classes || [];

    if (editorClassSelect) {
      editorClassSelect.innerHTML = '';
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name_bn;
        editorClassSelect.appendChild(opt);
      });
      if (classes.length > 0) {
        currentClassId = classes[0].id;
        editorClassSelect.value = currentClassId;
      }
    }

    if (batchClassSelect) {
      batchClassSelect.innerHTML = '';
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name_bn;
        batchClassSelect.appendChild(opt);
      });
      if (classes.length > 0) {
        batchClassSelect.value = classes[0].id;
      }
    }

    if (importClassSelect) {
      importClassSelect.innerHTML = '';
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name_bn;
        importClassSelect.appendChild(opt);
      });
      if (classes.length > 0) {
        importClassSelect.value = currentClassId;
      }
    }
  }

  // Check Class Publish Status
  function updateClassPublishStatusUI() {
    const studentsInClass = getStudentsInCurrentClass();
    if (studentsInClass.length === 0) {
      if (classPublishStatusBadge) {
        classPublishStatusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        classPublishStatusBadge.textContent = 'কোনো শিক্ষার্থী নেই';
      }
      return;
    }

    const isPublished = studentsInClass.some(s => s.publish_status === 'published');
    const isScheduled = studentsInClass.some(s => s.publish_status === 'scheduled');
    const sampleSt = studentsInClass.find(s => s.published_date_bn) || {};

    if (classPublishStatusBadge) {
      if (isPublished) {
        classPublishStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
        classPublishStatusBadge.textContent = sampleSt.published_date_bn ? `প্রকাশিত (${sampleSt.published_date_bn})` : 'প্রকাশিত (Published)';
      } else if (isScheduled) {
        classPublishStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300';
        classPublishStatusBadge.textContent = sampleSt.published_date_bn ? `নির্ধারিত (${sampleSt.published_date_bn})` : 'নির্ধারিত (Scheduled)';
      } else {
        classPublishStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300';
        classPublishStatusBadge.textContent = 'ড্রাফট (পর্যালোচনায়)';
      }
    }

    if (togglePublishBtnText) {
      togglePublishBtnText.textContent = isPublished ? 'ড্রাফট করুন (Unpublish)' : 'পাবলিশ করুন (Publish)';
    }
  }

  function getStudentsInCurrentClass() {
    return allStudents.filter(s => {
      const matchSchool = (s.institution_id === activeSchoolId) || (!s.institution_id && activeSchoolId === 'dreamland-school');
      const matchClass = String(s.class_id) === String(currentClassId);
      const sYear = String(s.year || s.academic_year || '2025');
      const sExamId = s.exam_id || (s.exam_name_bn && s.exam_name_bn.includes('টেস্ট') ? 'dakhil_test_2025' : 'annual_2025');
      const matchYear = !currentYear || sYear === String(currentYear);
      const matchExam = !currentExamId || sExamId === currentExamId || s.exam_id === currentExamId;
      return matchSchool && matchClass && matchYear && matchExam;
    });
  }

  // Render Live Spreadsheet Editor
  function renderSpreadsheet() {
    if (!editorTableHead || !editorTableBody) return;

    updateClassPublishStatusUI();
    const studentsInClass = getStudentsInCurrentClass();

    // Sort by roll ascending
    studentsInClass.sort((a, b) => (parseInt(a.roll, 10) || 0) - (parseInt(b.roll, 10) || 0));

    if (studentsInClass.length === 0) {
      const school = getActiveSchool();
      const currentExamObj = (school.exams || []).find(e => e.id === currentExamId);
      const examTitle = currentExamObj ? currentExamObj.name_bn : `${ResultEngine.toBnDigit(currentYear)} সালের পরীক্ষা`;

      editorTableHead.innerHTML = `
        <tr>
          <th class="p-3 text-center text-xs font-bold text-slate-700 dark:text-slate-200">
            ${ResultEngine.toBnDigit(currentYear)} সালের "${examTitle}"-এ এখনো কোনো শিক্ষার্থী নেই
          </th>
        </tr>
      `;

      editorTableBody.innerHTML = `
        <tr>
          <td class="p-6 sm:p-10 text-center bg-slate-50/50 dark:bg-slate-900/40">
            <div class="max-w-3xl mx-auto space-y-6">
              <div class="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
                <i class="fas fa-sparkles"></i>
              </div>
              <div class="space-y-1">
                <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  ${ResultEngine.toBnDigit(currentYear)} সালের রেজাল্ট শুরু করার ৩টি সহজ পদ্ধতি
                </h3>
                <p class="text-xs text-slate-500 max-w-lg mx-auto">
                  আপনার সুবিধা অনুযায়ী নিচের যেকোনো একটি মাধ্যমে শিক্ষার্থী ও নম্বর অন্তর্ভুক্ত করুন:
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <!-- Method 1: Clone from 2025 -->
                <div class="p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div class="space-y-2">
                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      <i class="fas fa-clone"></i> পদ্ধতি ১ (দ্রুততম)
                    </div>
                    <h4 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white">পূর্ববর্তী সাল থেকে কপি</h4>
                    <p class="text-[11px] text-slate-500">
                      ২০২৫ সালের ছাত্রছাত্রীদের নাম ও রোল হুবহু ২০২৬ সালে কপি হয়ে যাবে। নম্বরগুলো খালি (০) থাকবে, শুধু নতুন নম্বর ইনপুট দিন।
                    </p>
                  </div>
                  <button type="button" onclick="window.cloneStudentsFromPreviousYear()" class="w-full py-2.5 px-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                    <i class="fas fa-copy"></i> ছাত্রছাত্রী কপি করুন
                  </button>
                </div>

                <!-- Method 2: Excel Import -->
                <div class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div class="space-y-2">
                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                      <i class="fas fa-file-excel"></i> পদ্ধতি ২ (এক্সেল ফাইল)
                    </div>
                    <h4 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white">এক্সেল ফাইল ইমপোর্ট</h4>
                    <p class="text-[11px] text-slate-500">
                      নমুনা এক্সেল ফাইল ডাউনলোড করে তাতে রোল, নাম ও প্রাপ্ত নম্বর বসিয়ে আপলোড দিন। এক ক্লিকে সব চলে আসবে।
                    </p>
                  </div>
                  <button type="button" onclick="window.switchAdminTab('excelImportTab')" class="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                    <i class="fas fa-upload"></i> এক্সেলে আপলোড দিন
                  </button>
                </div>

                <!-- Method 3: Manual Entry -->
                <div class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div class="space-y-2">
                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      <i class="fas fa-user-plus"></i> পদ্ধতি ৩ (ম্যানুয়াল)
                    </div>
                    <h4 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white">এক এক করে যোগ</h4>
                    <p class="text-[11px] text-slate-500">
                      শিক্ষার্থীর রোল, নাম ও অভিভাবকের নাম সরাসরি ফরম পূরণ করে এক এক করে নতুন শিক্ষার্থী অন্তর্ভুক্ত করুন।
                    </p>
                  </div>
                  <button type="button" onclick="window.openAddStudentModal()" class="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                    <i class="fas fa-plus"></i> শিক্ষার্থী যোগ করুন
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Determine all distinct subjects across ALL students in the class
    const subjectMap = new Map();
    studentsInClass.forEach(st => {
      (st.subjects || []).forEach(sub => {
        const key = sub.code || sub.name_bn;
        if (!subjectMap.has(key)) {
          subjectMap.set(key, {
            code: sub.code,
            name_bn: sub.name_bn,
            name_en: sub.name_en,
            full_marks: sub.full_marks || 100,
            is_optional: sub.is_optional || false
          });
        }
      });
    });
    const subjects = Array.from(subjectMap.values());

    // Build Table Header
    let theadHtml = `
      <tr>
        <th class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-14">রোল</th>
        <th class="py-3 px-4 border-r border-slate-200 dark:border-slate-700 w-44">শিক্ষার্থীর নাম</th>
    `;

    subjects.forEach(sub => {
      const isTeacherSubject = isSubjectAssignedToUser(sub);
      const thStyle = isTeacherSubject ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black' : '';
      theadHtml += `
        <th class="py-3 px-2 border-r border-slate-200 dark:border-slate-700 text-center min-w-[95px] ${thStyle}">
          <div class="text-[11px] leading-tight">${sub.name_bn || sub.name_en}</div>
          <div class="text-[9px] font-mono text-slate-400 font-normal">পূর্ণ: ${sub.full_marks || 100} ${sub.is_optional ? '(ঐচ্ছিক)' : ''}</div>
        </th>
      `;
    });

    theadHtml += `
        <th class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-20">মোট নম্বর</th>
        <th class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-16">GPA</th>
        <th class="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-16">গ্রেড</th>
        <th class="py-3 px-3 text-center w-20">স্ট্যাটাস</th>
      </tr>
    `;
    editorTableHead.innerHTML = theadHtml;

    // Build Table Rows
    let tbodyHtml = '';
    studentsInClass.forEach((st, sIdx) => {
      const calculated = ResultEngine.calculateStudent(st);
      const isPassed = calculated.status === 'Passed';
      const rowBg = sIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/40';

      let trHtml = `
        <tr class="${rowBg} hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors" data-student-id="${st.id}">
          <td class="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-bold font-mono text-slate-800 dark:text-slate-200">
            ${ResultEngine.toBnDigit(st.roll)}
          </td>
          <td class="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 font-semibold text-slate-950 dark:text-white">
            <div class="flex items-center justify-between gap-1">
              <span>${st.student_name_bn}</span>
              ${st.religion ? `<span class="text-[9px] px-1.5 py-0.2 rounded font-mono ${st.religion === 'hindu' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">${st.religion === 'hindu' ? 'সনাতন' : 'ইসলাম'}</span>` : ''}
            </div>
          </td>
      `;

      subjects.forEach((sub, subIdx) => {
        const studentSub = (st.subjects || []).find(s => s.code === sub.code || s.name_bn === sub.name_bn);

        if (!studentSub) {
          // This subject is not taken by this student (e.g. Islam for Hindu, or Higher Math for Agri student)
          trHtml += `
            <td class="py-1.5 px-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-slate-100/70 dark:bg-slate-800/60 select-none" title="এই শিক্ষার্থীর জন্য এ বিষয়টি প্রযোজ্য নয়">
              <span class="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 text-[10px] font-bold text-slate-400 font-mono">N/A</span>
            </td>
          `;
        } else {
          const isEditable = isSubjectAssignedToUser(sub);
          const marksVal = studentSub.is_absent ? 'ABS' : (studentSub.marks_obtained !== undefined ? studentSub.marks_obtained : '');

          if (isEditable) {
            trHtml += `
              <td class="py-1.5 px-1.5 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                <input type="text" 
                  data-student-id="${st.id}" 
                  data-sub-code="${sub.code || sub.name_bn}" 
                  value="${marksVal}" 
                  placeholder="0"
                  class="mark-input w-full py-1 text-center font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                >
              </td>
            `;
          } else {
            // Read-only cell for unauthorized subjects
            trHtml += `
              <td class="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center text-slate-400 font-mono text-xs">
                ${marksVal !== '' ? marksVal : '--'}
              </td>
            `;
          }
        }
      });

      trHtml += `
          <td class="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-slate-700 dark:text-slate-300 row-total">
            ${ResultEngine.toBnDigit(calculated.total_marks)}
          </td>
          <td class="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-emerald-600 row-gpa">
            ${isPassed ? ResultEngine.formatGpa(calculated.gpa) : '0.00'}
          </td>
          <td class="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-bold row-grade ${isPassed ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600'}">
            ${isPassed ? calculated.grade : 'F'}
          </td>
          <td class="py-2.5 px-3 text-center row-status">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isPassed ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}">
              ${isPassed ? 'উত্তীর্ণ' : 'অকৃতকার্য'}
            </span>
          </td>
        </tr>
      `;
      tbodyHtml += trHtml;
    });

    editorTableBody.innerHTML = tbodyHtml;
    bindMarkInputEvents();
  }

  function isSubjectAssignedToUser(sub) {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin' || currentUser.role === 'school_master') return true;
    if (currentUser.role === 'teacher') {
      const assigned = (currentUser.assigned_subjects || []).map(s => String(s).toLowerCase().trim());
      const subCode = String(sub.code || '').toLowerCase().trim();
      const subNameBn = String(sub.name_bn || '').toLowerCase().trim();
      const subNameEn = String(sub.name_en || '').toLowerCase().trim();
      return assigned.some(a => subCode.includes(a) || subNameBn.includes(a) || subNameEn.includes(a) || a.includes(subNameBn));
    }
    return false;
  }

  // Handle Mark Input change & live calculation
  function bindMarkInputEvents() {
    const inputs = document.querySelectorAll('.mark-input');
    inputs.forEach(inp => {
      inp.addEventListener('input', (e) => {
        const studentId = e.target.getAttribute('data-student-id');
        const subCode = e.target.getAttribute('data-sub-code');
        let val = e.target.value.trim();

        const student = allStudents.find(s => s.id === studentId);
        if (!student) return;

        const sub = (student.subjects || []).find(s => s.code === subCode || s.name_bn === subCode);
        if (!sub) return;

        const isAbsent = val.toUpperCase() === 'ABS' || val === 'অনুপস্থিত';
        if (isAbsent) {
          sub.is_absent = true;
          sub.marks_obtained = 'ABS';
        } else {
          sub.is_absent = false;
          let numVal = parseFloat(ResultEngine.toEnDigit(val)) || 0;
          if (numVal < 0) numVal = 0;
          if (numVal > (sub.full_marks || 100)) numVal = sub.full_marks || 100;
          sub.marks_obtained = numVal;
        }

        // Recalculate row live
        const updated = ResultEngine.calculateStudent(student);
        Object.assign(student, updated);

        const tr = e.target.closest('tr');
        if (tr) {
          const totalEl = tr.querySelector('.row-total');
          const gpaEl = tr.querySelector('.row-gpa');
          const gradeEl = tr.querySelector('.row-grade');
          const statusEl = tr.querySelector('.row-status');

          const isPassed = updated.status === 'Passed';
          if (totalEl) totalEl.textContent = ResultEngine.toBnDigit(updated.total_marks);
          if (gpaEl) gpaEl.textContent = isPassed ? ResultEngine.formatGpa(updated.gpa) : '0.00';
          if (gradeEl) {
            gradeEl.textContent = isPassed ? updated.grade : 'F';
            gradeEl.className = `py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center font-bold row-grade ${isPassed ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600'}`;
          }
          if (statusEl) {
            statusEl.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isPassed ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}">${isPassed ? 'উত্তীর্ণ' : 'অকৃতকার্য'}</span>`;
          }
        }
      });
    });
  }

  // Concurrency-Safe Save to Local & Firebase
  async function saveSpreadsheetChanges() {
    if (saveEditorChangesBtn) {
      saveEditorChangesBtn.disabled = true;
      saveEditorChangesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> সংরক্ষণ হচ্ছে...';
    }

    try {
      // 1. Recalculate class merit positions
      const studentsInClass = getStudentsInCurrentClass();
      const ranked = ResultEngine.calculateClassPositions(studentsInClass);
      ranked.forEach(r => {
        const target = allStudents.find(s => s.id === r.id);
        if (target) Object.assign(target, r);
      });

      // 2. Save locally
      ResultEngine.Storage.saveStudents(allStudents);

      // 3. Sync changed students to Firebase with updateMask for concurrency safety
      const syncPromises = studentsInClass.map(st => {
        const mask = (currentUser.role === 'teacher') ? ['subjects', 'total_marks', 'gpa', 'grade', 'status'] : null;
        return ResultEngine.Firestore.saveStudentToFirestore(st, mask);
      });

      await Promise.allSettled(syncPromises);

      // 4. Save to local backend if running
      try {
        await fetch('/api/results/save-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(allStudents)
        });
      } catch (e) {}

      alert('সফল! সমস্ত নম্বর সফলভাবে সংরক্ষিত এবং ব্যাকএন্ডে সিঙ্ক করা হয়েছে।');
    } catch (err) {
      console.error('Save error:', err);
      alert('সংরক্ষণে সমস্যা: ' + err.message);
    } finally {
      if (saveEditorChangesBtn) {
        saveEditorChangesBtn.disabled = false;
        saveEditorChangesBtn.innerHTML = '<i class="fas fa-save"></i> পরিবর্তন সংরক্ষণ';
      }
      renderSpreadsheet();
    }
  }

  // Bengali Date & Time formatters for Result Publishing
  function formatBengaliDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const bnMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const monthBn = bnMonths[month - 1] || parts[1];
    return `${ResultEngine.toBnDigit(day)} ${monthBn}, ${ResultEngine.toBnDigit(year)}`;
  }

  function formatBengaliTime(timeStr) {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    let ampm = 'সকাল';
    if (h >= 12) {
      ampm = h >= 15 && h < 18 ? 'বিকাল' : h >= 18 && h < 20 ? 'সন্ধ্যা' : h >= 20 ? 'রাত' : 'দুপুর';
      if (h > 12) h -= 12;
    } else {
      if (h === 0) h = 12;
      ampm = h < 6 ? 'রাত' : 'সকাল';
    }
    return `${ampm} ${ResultEngine.toBnDigit(h)}:${ResultEngine.toBnDigit(m < 10 ? '0' + m : m)} মিনিট`;
  }

  // Web Admin Exclusive: Toggle Publish / Draft & Publish Modal
  window.openPublishModal = function () {
    if (!currentUser || currentUser.role !== 'super_admin') {
      alert('অনুমতি নেই! ফলাফল পাবলিশ করার একক ক্ষমতা শুধুমাত্র ফয়জার কম্পিউটার (ওয়েব অ্যাডমিন)-এর কাছে সংরক্ষিত।');
      return;
    }

    const studentsInClass = getStudentsInCurrentClass();
    if (studentsInClass.length === 0) {
      alert('নির্বাচিত ক্লাসে কোনো শিক্ষার্থী নেই।');
      return;
    }

    const school = getActiveSchool();
    const currentClass = (school.classes || config.classes || []).find(c => c.id === currentClassId);
    const currentExam = (school.exams || []).find(x => x.id === currentExamId);

    if (publishModalTargetText) {
      publishModalTargetText.innerHTML = `
        <div class="font-bold text-sm text-emerald-950 dark:text-emerald-200">
          <i class="fas fa-school mr-1"></i> ${school.name_bn}
        </div>
        <div class="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
          <strong>শ্রেণি:</strong> ${currentClass ? currentClass.name_bn : currentClassId} &nbsp;|&nbsp; 
          <strong>পরীক্ষা:</strong> ${currentExam ? currentExam.name_bn : currentExamId} (${ResultEngine.toBnDigit(currentYear)}) &nbsp;|&nbsp; 
          <strong>মোট শিক্ষার্থী:</strong> ${ResultEngine.toBnDigit(studentsInClass.length)} জন
        </div>
      `;
    }

    // Prefill date & time
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const sample = studentsInClass.find(s => s.published_date) || {};
    if (publishScheduleDate) publishScheduleDate.value = sample.published_date || todayStr;
    if (publishScheduleTime) publishScheduleTime.value = sample.published_time || timeStr;
    if (publishNoticeText) publishNoticeText.value = sample.publish_notice || 'প্রধান শিক্ষকের অনুমোদনক্রমে ফলাফল আনুষ্ঠানিকভাবে প্রকাশিত হলো।';

    if (publishScheduleModal) publishScheduleModal.classList.remove('hidden');
  };

  window.closePublishModal = function () {
    if (publishScheduleModal) publishScheduleModal.classList.add('hidden');
  };

  window.confirmPublishWithDateTime = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentUser || currentUser.role !== 'super_admin') {
      alert('অনুমতি নেই! ফলাফল পাবলিশ করার একক ক্ষমতা শুধুমাত্র ফয়জার কম্পিউটার (ওয়েব অ্যাডমিন)-এর কাছে সংরক্ষিত।');
      return;
    }

    const studentsInClass = getStudentsInCurrentClass();
    if (studentsInClass.length === 0) {
      alert('নির্বাচিত ক্লাসে কোনো শিক্ষার্থী নেই।');
      return;
    }

    const dateVal = publishScheduleDate ? publishScheduleDate.value : '';
    const timeVal = publishScheduleTime ? publishScheduleTime.value : '';
    const noticeVal = publishNoticeText ? publishNoticeText.value.trim() : '';
    const modeRadio = document.querySelector('input[name="publishModeRadio"]:checked');
    const publishMode = modeRadio ? modeRadio.value : 'immediate';

    if (!dateVal || !timeVal) {
      alert('অনুগ্রহ করে প্রকাশের তারিখ ও সময় নির্বাচন করুন!');
      return;
    }

    const dateBn = formatBengaliDate(dateVal);
    const timeBn = formatBengaliTime(timeVal);

    studentsInClass.forEach(s => {
      s.publish_status = publishMode === 'scheduled' ? 'scheduled' : 'published';
      s.published_date = dateVal;
      s.published_time = timeVal;
      s.published_date_bn = dateBn;
      s.published_time_bn = timeBn;
      s.publish_notice = noticeVal;
      s.published_at = `${dateVal}T${timeVal}:00`;
    });

    ResultEngine.Storage.saveStudents(allStudents);

    // Sync to Firestore
    studentsInClass.forEach(st => {
      ResultEngine.Firestore.saveStudentToFirestore(st, [
        'publish_status',
        'published_date',
        'published_time',
        'published_date_bn',
        'published_time_bn',
        'publish_notice',
        'published_at'
      ]);
    });

    window.closePublishModal();

    const successMsg = publishMode === 'scheduled'
      ? `ফলাফল প্রকাশের সময় নির্ধারিত হয়েছে!\nতারিখ: ${dateBn}\nসময়: ${timeBn}\n(শিক্ষার্থীরা নির্ধারিত সময়ে ফলাফল দেখতে পাবে)`
      : `ফলাফল সফলভাবে অনলাইনে প্রকাশিত (Published) হয়েছে!\nপ্রকাশের সময়: ${dateBn}, ${timeBn}`;

    alert(successMsg);
    renderSpreadsheet();
  };

  async function toggleClassPublishStatus() {
    if (!currentUser || currentUser.role !== 'super_admin') {
      alert('অনুমতি নেই! ফলাফল পাবলিশ করার একক ক্ষমতা শুধুমাত্র ফয়জার কম্পিউটার (ওয়েব অ্যাডমিন)-এর কাছে সংরক্ষিত।');
      return;
    }

    const studentsInClass = getStudentsInCurrentClass();
    if (studentsInClass.length === 0) {
      alert('নির্বাচিত ক্লাসে কোনো শিক্ষার্থী নেই।');
      return;
    }

    const isCurrentlyPublished = studentsInClass.some(s => s.publish_status === 'published' || s.publish_status === 'scheduled');

    if (isCurrentlyPublished) {
      if (!confirm('আপনি কি নিশ্চিত যে এই শ্রেণির ফলাফল ড্রাফট (Draft) করতে চান? ড্রাফট করলে শিক্ষার্থীরা অনলাইনে রেজাল্ট দেখতে পারবে না।')) {
        return;
      }
      studentsInClass.forEach(s => {
        s.publish_status = 'draft';
      });
      ResultEngine.Storage.saveStudents(allStudents);
      studentsInClass.forEach(st => {
        ResultEngine.Firestore.saveStudentToFirestore(st, ['publish_status']);
      });
      alert('ফলাফল সফলভাবে ড্রাফট (Draft) অবস্থায় রাখা হয়েছে।');
      renderSpreadsheet();
    } else {
      window.openPublishModal();
    }
  }

  // 1-Click Excel Export via SheetJS
  function exportClassToExcel() {
    const studentsInClass = getStudentsInCurrentClass();
    if (studentsInClass.length === 0) {
      alert('এক্সেল এক্সপোর্ট করার মত কোনো শিক্ষার্থী নেই।');
      return;
    }

    if (typeof XLSX === 'undefined') {
      alert('SheetJS লাইব্রেরি লোড হয়নি। অনুগ্রহ করে পেজ রিফ্রেশ করুন।');
      return;
    }

    const sampleStudent = studentsInClass.find(s => Array.isArray(s.subjects) && s.subjects.length > 0) || studentsInClass[0];
    const subjects = sampleStudent.subjects || [];

    const excelData = studentsInClass.map(st => {
      const calculated = ResultEngine.calculateStudent(st);
      const row = {
        'মেধা স্থান': calculated.position ? `${calculated.position}` : '',
        'রোল নম্বর': st.roll,
        'শিক্ষার্থীর নাম': st.student_name_bn,
        'পিতার নাম': st.father_name_bn || '',
        'মাতার নাম': st.mother_name_bn || ''
      };

      subjects.forEach(sub => {
        const studentSub = (st.subjects || []).find(s => s.code === sub.code || s.name_bn === sub.name_bn) || sub;
        row[`${sub.name_bn} (প্রাপ্ত)`] = studentSub.is_absent ? 'ABS' : studentSub.marks_obtained;
        row[`${sub.name_bn} (গ্রেড)`] = studentSub.grade;
      });

      row['সর্বমোট নম্বর'] = calculated.total_marks;
      row['প্রাপ্ত GPA'] = ResultEngine.formatGpa(calculated.gpa);
      row['লেটার গ্রেড'] = calculated.grade;
      row['ফলাফল স্ট্যাটাস'] = calculated.status === 'Passed' ? 'উত্তীর্ণ' : 'অকৃতকার্য';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Class_${currentClassId}`);

    const school = getActiveSchool();
    const fileName = `Fayzar_Result_${(school.name_en || 'School').replace(/\s+/g, '_')}_${currentClassId}_${currentYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // Batch Print Engine (A4 Continuous Pages - Accessible to all authorized users)
  function renderBatchPreview(classId) {
    if (!batchPreviewGrid) return;

    classId = classId || batchClassSelect?.value || currentClassId;
    const year = batchYearSelect?.value || currentYear;
    const exam = batchExamSelect?.value || currentExamId;

    const students = allStudents.filter(s => {
      const matchSchool = (s.institution_id === activeSchoolId) || (!s.institution_id && activeSchoolId === 'dreamland-school');
      const matchClass = String(s.class_id) === String(classId);
      const sYear = String(s.year || s.academic_year || '2025');
      const sExamId = s.exam_id || (s.exam_name_bn && s.exam_name_bn.includes('টেস্ট') ? 'dakhil_test_2025' : 'annual_2025');
      const matchYear = !year || sYear === String(year);
      const matchExam = !exam || sExamId === exam || s.exam_id === exam;
      return matchSchool && matchClass && matchYear && matchExam;
    });

    if (batchStudentCount) batchStudentCount.textContent = ResultEngine.toBnDigit(students.length);

    batchPreviewGrid.innerHTML = '';
    if (students.length === 0) {
      batchPreviewGrid.innerHTML = `<div class="col-span-2 p-6 text-center text-slate-400">নির্বাচিত ক্লাসে ${ResultEngine.toBnDigit(year)} সালের কোনো শিক্ষার্থী পাওয়া যায়নি।</div>`;
      return;
    }

    students.slice(0, 4).forEach(st => {
      const calculated = ResultEngine.calculateStudent(st);
      const card = document.createElement('div');
      card.className = 'p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2';
      card.innerHTML = `
        <div class="flex items-center justify-between font-bold border-b border-slate-200 dark:border-slate-700 pb-2">
          <span>রোল: ${ResultEngine.toBnDigit(st.roll)} - ${st.student_name_bn}</span>
          <span class="font-mono text-emerald-600">GPA: ${ResultEngine.formatGpa(calculated.gpa)}</span>
        </div>
        <div class="text-[11px] text-slate-500">মোট নম্বর: ${ResultEngine.toBnDigit(calculated.total_marks)} | গ্রেড: ${calculated.grade} | স্ট্যাটাস: ${calculated.status}</div>
      `;
      batchPreviewGrid.appendChild(card);
    });
  }

  function executeBatchPrint() {
    const classId = batchClassSelect?.value || currentClassId;
    const year = batchYearSelect?.value || currentYear;
    const exam = batchExamSelect?.value || currentExamId;
    const school = getActiveSchool();

    const students = allStudents.filter(s => {
      const matchSchool = (s.institution_id === activeSchoolId) || (!s.institution_id && activeSchoolId === 'dreamland-school');
      const matchClass = String(s.class_id) === String(classId);
      const sYear = String(s.year || s.academic_year || '2025');
      const sExamId = s.exam_id || (s.exam_name_bn && s.exam_name_bn.includes('টেস্ট') ? 'dakhil_test_2025' : 'annual_2025');
      const matchYear = !year || sYear === String(year);
      const matchExam = !exam || sExamId === exam || s.exam_id === exam;
      return matchSchool && matchClass && matchYear && matchExam;
    });

    if (students.length === 0) {
      alert(`নির্বাচিত ক্লাসে ${ResultEngine.toBnDigit(year)} সালের প্রিন্ট করার মত কোনো শিক্ষার্থী নেই।`);
      return;
    }

    // Sort by roll
    students.sort((a, b) => (parseInt(a.roll, 10) || 0) - (parseInt(b.roll, 10) || 0));

    if (!batchPrintContainer) return;
    batchPrintContainer.innerHTML = '';

    const watermark = school.watermark_text || 'FAYZAR';

    students.forEach(st => {
      const calculated = ResultEngine.calculateStudent(st);
      const isPassed = calculated.status === 'Passed';
      const page = document.createElement('div');
      page.className = 'batch-student-page watermark-bg';
      page.setAttribute('data-watermark', watermark);

      let subjectsRows = '';
      let displaySerial = 1;
      (calculated.subjects || []).forEach((sub, idx) => {
        const isSubFail = sub.grade === 'F';
        const gradeColor = isSubFail ? 'text-rose-700 font-bold' : 'text-slate-900 font-bold';
        const bgRow = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';
        const isComposite = Array.isArray(sub.papers) && sub.papers.length >= 2;

        if (isComposite) {
          const p1 = sub.papers[0];
          const p2 = sub.papers[1];
          const p1MarksDisplay = (p1.is_absent || String(p1.marks_obtained).toUpperCase() === 'ABS') ? '<span class="text-rose-700 font-bold">ABS</span>' : ResultEngine.toBnDigit(p1.marks_obtained);
          const p2MarksDisplay = (p2.is_absent || String(p2.marks_obtained).toUpperCase() === 'ABS') ? '<span class="text-rose-700 font-bold">ABS</span>' : ResultEngine.toBnDigit(p2.marks_obtained);

          subjectsRows += `
            <tr class="${bgRow}">
              <td rowspan="2" class="py-1 px-2 border-r border-b border-slate-300 text-center font-mono text-slate-700 align-middle">${ResultEngine.toBnDigit(displaySerial)}</td>
              <td class="py-1 px-2.5 border-r border-b border-slate-200 font-bold text-slate-950">${p1.name_bn || p1.name_en}</td>
              <td class="py-1 px-2 border-r border-b border-slate-200 text-center font-mono text-slate-800">${ResultEngine.toBnDigit(p1.full_marks || 100)}</td>
              <td class="py-1 px-2 border-r border-b border-slate-200 text-center font-mono font-extrabold text-slate-950">${p1MarksDisplay}</td>
              <td rowspan="2" class="py-1 px-2 border-r border-b border-slate-300 text-center ${gradeColor} align-middle bg-slate-50/50">${sub.grade || 'F'}</td>
              <td rowspan="2" class="py-1 px-2 border-b border-slate-300 text-center font-mono font-bold ${gradeColor} align-middle bg-slate-50/50">${ResultEngine.formatGpa(sub.point)}</td>
            </tr>
            <tr class="${bgRow}">
              <td class="py-1 px-2.5 border-r border-b border-slate-300 font-bold text-slate-950">
                ${p2.name_bn || p2.name_en}
                <span class="text-[9px] text-slate-500 font-medium ml-1.5">(যৌথ মোট: ${ResultEngine.toBnDigit(sub.marks_obtained)} / ${ResultEngine.toBnDigit(sub.full_marks || 200)})</span>
              </td>
              <td class="py-1 px-2 border-r border-b border-slate-300 text-center font-mono text-slate-800">${ResultEngine.toBnDigit(p2.full_marks || 100)}</td>
              <td class="py-1 px-2 border-r border-b border-slate-300 text-center font-mono font-extrabold text-slate-950">${p2MarksDisplay}</td>
            </tr>
          `;
        } else {
          const marksDisplay = sub.is_absent ? '<span class="text-rose-700 font-bold">ABS</span>' : ResultEngine.toBnDigit(sub.marks_obtained);
          const showOptBadge = sub.is_optional && !sub.name_bn?.includes('৪র্থ') && !sub.name_bn?.includes('ঐচ্ছিক');
          subjectsRows += `
            <tr class="${bgRow}">
              <td class="py-1 px-2 border-r border-b border-slate-300 text-center font-mono text-slate-700">${ResultEngine.toBnDigit(displaySerial)}</td>
              <td class="py-1 px-2.5 border-r border-b border-slate-300 font-bold text-slate-950">
                ${sub.name_bn || sub.name_en}
                ${showOptBadge ? '<span class="text-[9px] text-amber-700 font-bold ml-1">(ঐচ্ছিক)</span>' : ''}
              </td>
              <td class="py-1 px-2 border-r border-b border-slate-300 text-center font-mono text-slate-800">${ResultEngine.toBnDigit(sub.full_marks || 100)}</td>
              <td class="py-1 px-2 border-r border-b border-slate-300 text-center font-mono font-extrabold text-slate-950">${marksDisplay}</td>
              <td class="py-1 px-2 border-r border-slate-300 text-center ${gradeColor}">${sub.grade || 'F'}</td>
              <td class="py-1 px-2 border-b border-slate-300 text-center font-mono font-bold ${gradeColor}">${ResultEngine.formatGpa(sub.point)}</td>
            </tr>
          `;
        }
        displaySerial++;
      });

      let remarksText = 'ফলাফল সন্তোষজনক। পরবর্তী শ্রেণিতে উত্তীর্ণ।';
      if (isPassed) {
        if (calculated.gpa >= 5.0) {
          remarksText = 'অনন্য ও অসাধারণ ফলাফল! পরবর্তী শ্রেণিতে প্রমোশন লাভ করেছে।';
        } else if (calculated.gpa >= 4.0) {
          remarksText = 'খুবই প্রশংসনীয় ফলাফল। পরবর্তী শ্রেণিতে প্রমোশন লাভ করেছে।';
        } else if (calculated.gpa >= 3.0) {
          remarksText = 'সন্তোষজনক ফলাফল। পরবর্তী শ্রেণিতে ভর্তি ও পাঠ গ্রহণের যোগ্যতা অর্জিত হয়েছে।';
        } else {
          remarksText = 'উত্তীর্ণ। তবে নিয়মিত অধ্যয়নে আরও মনোযোগী হওয়ার নির্দেশ দেওয়া যাচ্ছে।';
        }
      } else {
        remarksText = '<span class="text-rose-700 font-bold">অকৃতকার্য। সংশ্লিষ্ট বিষয়সমূহে বিশেষ ক্লাস ও পুনর্বিবেচনা প্রযোজ্য।</span>';
      }

      const verifyUrl = `${window.location.origin}/results.html?inst=${encodeURIComponent(school.id || st.institution_id || '')}&year=${encodeURIComponent(st.year || year)}&exam=${encodeURIComponent(st.exam_id || examId)}&class=${encodeURIComponent(st.class_id || classId)}&roll=${encodeURIComponent(st.roll)}`;
      const qrSvg = ResultEngine.generateVerificationQrSvg(verifyUrl, 64);
      const publishDateDisplay = st.published_date_bn || (st.published_date ? ResultEngine.toBnDigit(st.published_date) : `${new Date().toLocaleDateString('bn-BD')}`);
      const examDisplayTitle = st.exam_name_bn || (st.exam_name || `${ResultEngine.toBnDigit(year)} সালের পরীক্ষা`);
      const rankDisplay = st.position ? `${ResultEngine.toBnDigit(st.position)}ম` : '--';

      page.innerHTML = `
        <div class="certificate-inner-frame">
          <!-- Classical Corner Ornaments -->
          <div class="corner-ornament corner-tl"></div>
          <div class="corner-ornament corner-tr"></div>
          <div class="corner-ornament corner-bl"></div>
          <div class="corner-ornament corner-br"></div>

          <!-- 1. Institutional Header Area -->
          <div class="pb-2 border-b-2 border-slate-950 relative">
            <div class="flex items-center justify-between gap-2">
              <!-- Left Crest Logo -->
              <div class="w-16 h-16 flex-shrink-0 p-1 rounded-full border-2 border-slate-900 bg-white shadow-xs flex items-center justify-center">
                <img src="${school.logo_url || 'assets/images/school-logo.png'}" alt="School Logo" class="max-h-full max-w-full object-contain rounded-full" onerror="this.src='assets/favicon.svg'">
              </div>

              <!-- Center Institutional Details -->
              <div class="text-center flex-1 px-1">
                <h1 class="text-xl font-black text-slate-950 tracking-tight leading-tight">
                  ${school.name_bn || 'ড্রিমল্যান্ড রেসিডেন্সিয়াল মডেল স্কুল'}
                </h1>
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-0.5">
                  ${school.name_en || 'DREAMLAND RESIDENTIAL MODEL SCHOOL'}
                </div>
                <div class="text-[10px] text-slate-600 font-medium mt-0.5">
                  ${school.address_bn || 'বারাই, ফুলবাড়ী, দিনাজপুর'}
                </div>
                
                <!-- Certificate Title Ribbon -->
                <div class="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                  <div class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-slate-950 text-white font-black text-[10.5px] uppercase tracking-wider shadow-xs">
                    <span>ACADEMIC TRANSCRIPT / একাডেমিক ট্রান্সক্রিপ্ট</span>
                  </div>
                  <div class="inline-flex items-center px-2 py-0.5 rounded-md border border-slate-900 bg-slate-100 font-extrabold text-[10.5px] text-slate-900">
                    <span>${examDisplayTitle}</span>
                  </div>
                </div>
              </div>

              <!-- Right Grading Scale Matrix -->
              <div class="w-32 border border-slate-900 bg-white text-[8px] shadow-xs flex-shrink-0">
                <div class="bg-slate-950 text-white font-extrabold text-[8px] text-center py-0.5 uppercase tracking-wider">
                  Grading Scale
                </div>
                <table class="w-full border-collapse text-center leading-tight">
                  <thead>
                    <tr class="bg-slate-100 border-b border-slate-900 font-bold text-[7.5px]">
                      <th class="px-0.5 py-0.2 border-r border-slate-900">নম্বর</th>
                      <th class="px-0.5 py-0.2 border-r border-slate-900">গ্রেড</th>
                      <th class="px-0.5 py-0.2">GP</th>
                    </tr>
                  </thead>
                  <tbody class="text-[8px] font-mono divide-y divide-slate-300">
                    <tr><td class="px-0.5 py-0.2 border-r border-slate-300">৮০-১০০</td><td class="px-0.5 py-0.2 border-r border-slate-300 font-bold">A+</td><td class="px-0.5 py-0.2 font-bold text-emerald-800">5.0</td></tr>
                    <tr><td class="px-0.5 py-0.2 border-r border-slate-300">৭০-৭৯</td><td class="px-0.5 py-0.2 border-r border-slate-300 font-bold">A</td><td class="px-0.5 py-0.2 font-bold">4.0</td></tr>
                    <tr><td class="px-0.5 py-0.2 border-r border-slate-300">৬০-৬৯</td><td class="px-0.5 py-0.2 border-r border-slate-300 font-bold">A-</td><td class="px-0.5 py-0.2 font-bold">3.5</td></tr>
                    <tr><td class="px-0.5 py-0.2 border-r border-slate-300">৫০-৫৯</td><td class="px-0.5 py-0.2 border-r border-slate-300 font-bold">B</td><td class="px-0.5 py-0.2 font-bold">3.0</td></tr>
                    <tr><td class="px-0.5 py-0.2 border-r border-slate-300">৪০-৪৯</td><td class="px-0.5 py-0.2 border-r border-slate-300 font-bold">C</td><td class="px-0.5 py-0.2 font-bold">2.0</td></tr>
                    <tr><td class="px-0.5 py-0.2 border-r border-slate-300">৩৩-৩৯</td><td class="px-0.5 py-0.2 border-r border-slate-300 font-bold">D</td><td class="px-0.5 py-0.2 font-bold">1.0</td></tr>
                    <tr class="bg-rose-50 text-rose-800"><td class="px-0.5 py-0.2 border-r border-slate-300">০০-৩২</td><td class="px-0.5 py-0.2 border-r border-slate-300 font-bold">F</td><td class="px-0.5 py-0.2 font-bold">0.0</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 2. Student Profile Information Table (4x2 Grid) -->
          <div class="my-2 rounded-lg border-2 border-slate-900 bg-white overflow-hidden text-[11px]">
            <div class="grid grid-cols-4 divide-x divide-slate-300 border-b border-slate-300 bg-slate-50/80">
              <div class="p-1.5">
                <span class="text-slate-500 block text-[9.5px] font-bold">শিক্ষার্থীর নাম :</span>
                <span class="font-black text-slate-950 text-xs block truncate">${st.student_name_bn}</span>
              </div>
              <div class="p-1.5">
                <span class="text-slate-500 block text-[9.5px] font-bold">রোল নম্বর :</span>
                <span class="font-black text-slate-950 font-mono text-xs block">${ResultEngine.toBnDigit(st.roll)}</span>
              </div>
              <div class="p-1.5">
                <span class="text-slate-500 block text-[9.5px] font-bold">শ্রেণি :</span>
                <span class="font-extrabold text-slate-950 text-xs block">${st.class_name_bn || st.class_id}</span>
              </div>
              <div class="p-1.5">
                <span class="text-slate-500 block text-[9.5px] font-bold">শাখা / বিভাগ :</span>
                <span class="font-extrabold text-slate-950 text-xs block">${st.section || 'সাধারণ'}</span>
              </div>
            </div>
            <div class="grid grid-cols-4 divide-x divide-slate-300 bg-white">
              <div class="p-1.5">
                <span class="text-slate-500 block text-[9.5px] font-bold">পিতার নাম :</span>
                <span class="font-bold text-slate-800 block truncate text-[10.5px]">${st.father_name_bn || '--'}</span>
              </div>
              <div class="p-1.5">
                <span class="text-slate-500 block text-[9.5px] font-bold">মাতার নাম :</span>
                <span class="font-bold text-slate-800 block truncate text-[10.5px]">${st.mother_name_bn || '--'}</span>
              </div>
              <div class="p-1.5">
                <span class="text-slate-500 block text-[9.5px] font-bold">জন্ম তারিখ :</span>
                <span class="font-bold text-slate-800 font-mono block text-[10.5px]">${st.dob || '--'}</span>
              </div>
              <div class="p-1.5 flex flex-col justify-center">
                <span class="text-slate-500 block text-[9.5px] font-bold mb-0.5">ফলাফল স্ট্যাটাস :</span>
                <span class="inline-flex items-center w-fit px-2 py-0.2 rounded-full text-[10px] font-black ${isPassed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
                  ${isPassed ? '✓ উত্তীর্ণ (Passed)' : '✕ অকৃতকার্য (Failed)'}
                </span>
              </div>
            </div>
          </div>

          <!-- 3. Result Performance 4-Block Bar -->
          <div class="mb-2 grid grid-cols-4 border-2 border-slate-900 rounded-lg overflow-hidden divide-x-2 divide-slate-900 bg-white text-center shadow-xs">
            <div class="py-1.5 px-1 bg-emerald-50/40">
              <span class="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">প্রাপ্ত জিপিএ (GPA)</span>
              <span class="text-2xl font-black text-emerald-800 font-mono leading-none block mt-0.5">${isPassed ? ResultEngine.formatGpa(calculated.gpa) : '0.00'}</span>
            </div>
            <div class="py-1.5 px-1 bg-blue-50/40">
              <span class="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">লেটার গ্রেড (GRADE)</span>
              <span class="text-2xl font-black text-blue-800 font-mono leading-none block mt-0.5">${isPassed ? calculated.grade : 'F'}</span>
            </div>
            <div class="py-1.5 px-1 bg-amber-50/40">
              <span class="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">মেধা স্থান (RANK)</span>
              <span class="text-2xl font-black text-amber-800 leading-none block mt-0.5">${rankDisplay}</span>
            </div>
            <div class="py-1.5 px-1 bg-purple-50/40">
              <span class="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">মোট নম্বর (TOTAL)</span>
              <span class="text-2xl font-black text-purple-900 font-mono leading-none block mt-0.5">${ResultEngine.toBnDigit(calculated.total_marks)} / ${ResultEngine.toBnDigit(calculated.max_possible_marks || 600)}</span>
            </div>
          </div>

          <!-- 4. Subject Marks Details Table -->
          <div class="mb-2 border-2 border-slate-900 rounded-lg overflow-hidden bg-white">
            <table class="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr class="bg-slate-100 text-slate-950 font-black border-b-2 border-slate-900 text-[10.5px]">
                  <th class="py-1.5 px-2 border-r border-slate-900 text-center w-10">ক্র.</th>
                  <th class="py-1.5 px-2.5 border-r border-slate-900">বিষয়ের নাম (Subject Name)</th>
                  <th class="py-1.5 px-2 border-r border-slate-900 text-center w-16">পূর্ণমান</th>
                  <th class="py-1.5 px-2 border-r border-slate-900 text-center w-20">প্রাপ্ত নম্বর</th>
                  <th class="py-1.5 px-2 border-r border-slate-900 text-center w-16">লেটার গ্রেড</th>
                  <th class="py-1.5 px-2 text-center w-16">গ্রেড পয়েন্ট</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-300 text-slate-900 font-medium text-[10.5px]">
                ${subjectsRows}
              </tbody>
              <tfoot>
                <tr class="bg-slate-100 font-black border-t-2 border-slate-900 text-slate-950 text-[11px]">
                  <td colspan="2" class="py-1.5 px-2.5 border-r border-slate-900 text-right uppercase tracking-wide">সর্বমোট / চূড়ান্ত ফলাফল :</td>
                  <td class="py-1.5 px-2 border-r border-slate-900 text-center font-mono font-bold">${ResultEngine.toBnDigit(calculated.max_possible_marks || 600)}</td>
                  <td class="py-1.5 px-2 border-r border-slate-900 text-center font-mono font-extrabold text-emerald-800 text-xs">${ResultEngine.toBnDigit(calculated.total_marks)}</td>
                  <td class="py-1.5 px-2 border-r border-slate-900 text-center font-bold text-blue-800 text-xs">${isPassed ? calculated.grade : 'F'}</td>
                  <td class="py-1.5 px-2 text-center font-mono font-extrabold text-emerald-800 text-xs">${isPassed ? ResultEngine.formatGpa(calculated.gpa) : '0.00'}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- 5. Evaluation Remarks Strip -->
          <div class="mb-2 rounded-md border border-slate-300 p-1.5 bg-slate-50/50 flex items-center justify-between text-[11px]">
            <div class="flex items-center gap-1.5">
              <span class="font-black text-slate-900">শ্রেণি শিক্ষকের মন্তব্য:</span>
              <span class="text-slate-800 font-bold">${remarksText}</span>
            </div>
            <div class="text-[9.5px] text-slate-500 font-mono">
              উপস্থিতি: নিয়মিত
            </div>
          </div>

          <!-- 6. Bottom Signatures & Digital Verification -->
          <div class="grid grid-cols-3 gap-3 pt-2 border-t-2 border-slate-950 items-end">
            <!-- Left: QR Code & Verification -->
            <div class="flex items-center gap-2 text-left">
              <div class="w-14 h-14 p-0.5 border-2 border-slate-900 bg-white rounded-md flex-shrink-0 flex items-center justify-center">
                ${qrSvg}
              </div>
              <div class="text-[9px] text-slate-600 leading-tight space-y-0.5">
                <div class="font-black text-slate-950 text-[9.5px]">ডিজিটাল সত্যায়ন</div>
                <div class="font-mono text-slate-500 text-[8px]">FAYZAR-AUTH-VERIFIED</div>
                <div class="text-slate-800 font-bold text-[8.5px]">তারিখ: ${publishDateDisplay}</div>
              </div>
            </div>

            <!-- Middle: Class Teacher Signature -->
            <div class="text-center space-y-1">
              <div class="h-6 border-b-2 border-slate-800 border-dashed w-32 mx-auto"></div>
              <span class="text-[10px] font-bold text-slate-900 block">শ্রেণি শিক্ষকের স্বাক্ষর ও তারিখ</span>
            </div>

            <!-- Right: Principal Signature -->
            <div class="text-right space-y-1">
              <div class="h-6 border-b-2 border-slate-800 border-dashed w-36 ml-auto"></div>
              <span class="text-[10px] font-bold text-slate-900 block">প্রধান শিক্ষক / অধ্যক্ষের স্বাক্ষর ও সিল</span>
            </div>
          </div>

          <!-- 7. Mandatory Shop Branding & Credential Footer -->
          <div class="mt-2 pt-1.5 border-t border-dashed border-slate-400 flex items-center justify-between gap-1 text-[9px] text-slate-600 font-medium">
            <div class="flex items-center gap-1">
              <span>কম্পিউটারাইজড রেজাল্ট প্রস্তুত ও প্রক্রিয়াকরণে: <strong class="text-slate-950 font-bold">ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট</strong>, ফুলবাড়ী, দিনাজপুর</span>
            </div>
            <div class="font-mono font-bold text-slate-900">
              হেল্পলাইন: 01717-101919
            </div>
          </div>
        </div>
      `;

      batchPrintContainer.appendChild(page);
    });

    window.print();
  }

  // Method 1: 1-Click Roster Clone from Previous Year (2025 -> 2026)
  window.cloneStudentsFromPreviousYear = function () {
    const school = getActiveSchool();
    // Find students from previous year (2025) in this class
    const prevStudents = allStudents.filter(s => {
      const matchSchool = (s.institution_id === activeSchoolId) || (!s.institution_id && activeSchoolId === 'dreamland-school');
      const matchClass = String(s.class_id) === String(currentClassId);
      const sYear = String(s.year || s.academic_year || '2025');
      return matchSchool && matchClass && sYear === '2025';
    });

    if (prevStudents.length === 0) {
      alert('২০২৫ সালের এই শ্রেণিতে কোনো শিক্ষার্থী পাওয়া যায়নি। অনুগ্রহ করে "এক এক করে যোগ" অথবা "এক্সেল ফাইল ইমপোর্ট" ব্যবহার করুন।');
      return;
    }

    const currentExamObj = (school.exams || []).find(e => e.id === currentExamId);
    const examTitle = currentExamObj ? currentExamObj.name_bn : `${ResultEngine.toBnDigit(currentYear)} সালের পরীক্ষা`;

    if (!confirm(`২০২৫ সালের মোট ${ResultEngine.toBnDigit(prevStudents.length)} জন শিক্ষার্থীর তালিকা ${ResultEngine.toBnDigit(currentYear)} সালের "${examTitle}"-এ কপি করতে চান?`)) {
      return;
    }

    // Clone each student with blank marks
    const clonedList = prevStudents.map(st => {
      const blankSubjects = (st.subjects || []).map(sub => ({
        ...sub,
        marks_obtained: 0,
        grade: 'F',
        point: 0,
        is_absent: false
      }));

      const newId = `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      return {
        ...st,
        id: newId,
        year: String(currentYear),
        academic_year: String(currentYear),
        exam_id: currentExamId,
        exam_name_bn: examTitle,
        subjects: blankSubjects,
        total_marks: 0,
        gpa: 0,
        grade: 'F',
        status: 'Failed',
        position: null,
        merit_position: null,
        class_position: null,
        publish_status: 'draft'
      };
    });

    allStudents.push(...clonedList);
    ResultEngine.Storage.saveStudents(allStudents);

    // Sync to Firestore in background
    clonedList.forEach(cl => ResultEngine.Firestore.saveStudentToFirestore(cl));

    alert(`সফল! ২০২৫ সাল থেকে ${ResultEngine.toBnDigit(clonedList.length)} জন শিক্ষার্থী ${ResultEngine.toBnDigit(currentYear)} সালের "${examTitle}"-এ অন্তর্ভুক্ত হয়েছে। এখন সরাসরি নম্বর বসিয়ে সংরক্ষণ করুন।`);
    renderSpreadsheet();
    renderBatchPreview();
  };

  // Method 2: Excel Template Generation & Upload
  window.downloadSampleExcelTemplate = function () {
    if (typeof XLSX === 'undefined') {
      alert('SheetJS লাইব্রেরি পাওয়া যায়নি।');
      return;
    }

    const school = getActiveSchool();
    const classObj = (school.classes || config.classes || []).find(c => c.id === currentClassId) || { name_bn: currentClassId };
    
    // Find sample subjects
    const existingStudents = allStudents.filter(s => {
      const matchSchool = (s.institution_id === activeSchoolId) || (!s.institution_id && activeSchoolId === 'dreamland-school');
      return String(s.class_id) === String(currentClassId) && Array.isArray(s.subjects) && s.subjects.length > 0;
    });
    const sampleSubjects = existingStudents[0]?.subjects || [
      { name_bn: 'বাংলা', code: '101', full_marks: 100 },
      { name_bn: 'ইংরেজি', code: '102', full_marks: 100 },
      { name_bn: 'গণিত', code: '103', full_marks: 100 }
    ];

    const sampleRow1 = {
      'রোল': 1,
      'শিক্ষার্থীর নাম': 'মোছাঃ তাসফিয়া জাহান',
      'শাখা': 'সাধারণ',
      'পিতার নাম': 'মোঃ রফিকুল ইসলাম',
      'মাতার নাম': 'মোছাঃ শামীমা আক্তার'
    };
    sampleSubjects.forEach(sub => {
      sampleRow1[`${sub.name_bn} (${sub.full_marks || 100})`] = 85;
    });

    const sampleRow2 = {
      'রোল': 2,
      'শিক্ষার্থীর নাম': 'মোঃ আরিয়ান হোসেন',
      'শাখা': 'সাধারণ',
      'পিতার নাম': 'মোঃ জয়নাল আবেদীন',
      'মাতার নাম': 'মোছাঃ ফাতেমা বেগম'
    };
    sampleSubjects.forEach(sub => {
      sampleRow2[`${sub.name_bn} (${sub.full_marks || 100})`] = 75;
    });

    const ws = XLSX.utils.json_to_sheet([sampleRow1, sampleRow2]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${classObj.name_bn || 'Class'}`);

    const fileName = `Sample_Result_${(school.name_en || 'School').replace(/\s+/g, '_')}_${currentClassId}_${currentYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  function handleExcelUpload(file) {
    if (!file) return;
    if (typeof XLSX === 'undefined') {
      alert('SheetJS লাইব্রেরি লোড হয়নি!');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (!Array.isArray(rows) || rows.length === 0) {
          alert('এক্সেল ফাইলটিতে কোনো তথ্য পাওয়া যায়নি!');
          return;
        }

        const school = getActiveSchool();
        const classObj = (school.classes || config.classes || []).find(c => c.id === currentClassId) || { name_bn: currentClassId };
        const currentExamObj = (school.exams || []).find(e => e.id === currentExamId);
        const examTitle = currentExamObj ? currentExamObj.name_bn : `${ResultEngine.toBnDigit(currentYear)} সালের পরীক্ষা`;

        // Determine subjects
        const sampleExisting = allStudents.find(s => {
          const matchSchool = (s.institution_id === activeSchoolId) || (!s.institution_id && activeSchoolId === 'dreamland-school');
          return String(s.class_id) === String(currentClassId) && Array.isArray(s.subjects) && s.subjects.length > 0;
        });
        const templateSubjects = sampleExisting ? sampleExisting.subjects : [];

        let importedCount = 0;
        const newStudents = [];

        rows.forEach((row, idx) => {
          const roll = parseInt(ResultEngine.toEnDigit(String(row['রোল নম্বর'] || row['রোল'] || row['Roll'] || row['roll'] || (idx + 1))), 10);
          const name = String(row['শিক্ষার্থীর নাম'] || row['নাম'] || row['Name'] || row['name'] || '').trim();
          if (!name) return;

          const father = String(row['পিতার নাম'] || row['পিতা'] || row['Father'] || '').trim();
          const mother = String(row['মাতার নাম'] || row['মাতা'] || row['Mother'] || '').trim();
          const section = String(row['শাখা'] || row['Section'] || 'সাধারণ').trim();

          let studentSubjects = [];
          if (templateSubjects.length > 0) {
            studentSubjects = templateSubjects.map(ts => {
              let marks = 0;
              for (const [key, val] of Object.entries(row)) {
                if (key.includes(ts.name_bn) || (ts.name_en && key.toLowerCase().includes(ts.name_en.toLowerCase())) || (ts.code && key.includes(ts.code))) {
                  marks = parseFloat(ResultEngine.toEnDigit(String(val))) || 0;
                  break;
                }
              }
              return {
                ...ts,
                marks_obtained: marks,
                is_absent: false
              };
            });
          } else {
            const metaKeys = ['রোল', 'রোল নম্বর', 'Roll', 'roll', 'নাম', 'শিক্ষার্থীর নাম', 'Name', 'name', 'পিতা', 'পিতার নাম', 'Father', 'মাতা', 'মাতার নাম', 'Mother', 'শাখা', 'Section'];
            for (const [k, v] of Object.entries(row)) {
              if (!metaKeys.some(mk => k.toLowerCase().includes(mk.toLowerCase()))) {
                const subName = k.replace(/\(.*\)/g, '').trim();
                const marks = parseFloat(ResultEngine.toEnDigit(String(v))) || 0;
                studentSubjects.push({
                  name_bn: subName,
                  name_en: subName,
                  code: String(studentSubjects.length + 101),
                  full_marks: 100,
                  marks_obtained: marks,
                  is_absent: false
                });
              }
            }
          }

          const stObj = {
            id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            institution_id: activeSchoolId,
            institution_name_bn: school.name_bn,
            year: String(currentYear),
            academic_year: String(currentYear),
            exam_id: currentExamId,
            exam_name_bn: examTitle,
            class_id: currentClassId,
            class_name_bn: classObj.name_bn,
            roll: roll,
            student_name_bn: name,
            father_name_bn: father,
            mother_name_bn: mother,
            section: section,
            subjects: studentSubjects,
            publish_status: 'draft'
          };

          const calculated = ResultEngine.calculateStudent(stObj);
          Object.assign(stObj, calculated);
          newStudents.push(stObj);
          importedCount++;
        });

        if (newStudents.length === 0) {
          alert('কোনো বৈধ শিক্ষার্থীর তথ্য পাওয়া যায়নি!');
          return;
        }

        const ranked = ResultEngine.calculateClassPositions(newStudents);
        allStudents.push(...ranked);
        ResultEngine.Storage.saveStudents(allStudents);

        ranked.forEach(st => ResultEngine.Firestore.saveStudentToFirestore(st));

        if (importResultStatus) {
          importResultStatus.classList.remove('hidden');
          importResultStatus.innerHTML = `
            <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
              <i class="fas fa-check-circle text-lg"></i>
              <span>সফল! মোট ${ResultEngine.toBnDigit(importedCount)} জন শিক্ষার্থীর ফলাফল এক্সেল থেকে সফলভাবে ইমপোর্ট করা হয়েছে।</span>
            </div>
            <div class="mt-2">
              <button type="button" onclick="window.switchAdminTab('spreadsheetTab')" class="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer">
                <i class="fas fa-table mr-1"></i> লাইভ স্প্রেডশিটে ফলাফল দেখুন
              </button>
            </div>
          `;
        }

        alert(`সফল! মোট ${ResultEngine.toBnDigit(importedCount)} জন শিক্ষার্থীর তথ্য ও প্রাপ্ত নম্বর এক্সেল থেকে যুক্ত হয়েছে।`);
        switchAdminTab('spreadsheetTab');
        renderSpreadsheet();
      } catch (err) {
        console.error('Excel parse error:', err);
        alert('এক্সেল ফাইল প্রক্রিয়াকরণে সমস্যা: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Manage & Edit Exams Modal functions
  window.openManageExamsModal = function () {
    if (manageExamsModal) manageExamsModal.classList.remove('hidden');
    window.resetExamForm();
    renderManageExamsList();
  };

  window.closeManageExamsModal = function () {
    if (manageExamsModal) manageExamsModal.classList.add('hidden');
    window.resetExamForm();
  };

  function renderManageExamsList() {
    const school = getActiveSchool();
    const exams = school.exams || [];
    if (activeSchoolExamCountBadge) {
      activeSchoolExamCountBadge.textContent = `${ResultEngine.toBnDigit(exams.length)} টি পরীক্ষা`;
    }
    if (!manageExamsTableBody) return;

    if (exams.length === 0) {
      manageExamsTableBody.innerHTML = `
        <tr>
          <td colspan="3" class="py-6 text-center text-slate-400 font-bold">
            কোনো পরীক্ষা পাওয়া যায়নি। ওপরের ফর্ম ব্যবহার করে নতুন পরীক্ষা যোগ করুন।
          </td>
        </tr>
      `;
      return;
    }

    manageExamsTableBody.innerHTML = exams.map(ex => {
      const isCurrent = ex.id === currentExamId;
      const count = allStudents.filter(s => {
        const matchSchool = (s.institution_id === activeSchoolId) || (!s.institution_id && activeSchoolId === 'dreamland-school');
        return matchSchool && (s.exam_id === ex.id || s.exam_name_bn === ex.name_bn);
      }).length;

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isCurrent ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''}">
          <td class="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
            ${ResultEngine.toBnDigit(ex.year || '2026')}
          </td>
          <td class="py-3 px-3">
            <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>${ex.name_bn || ex.name_en || ex.id}</span>
              ${isCurrent ? '<span class="text-[10px] bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded-sm font-bold">বর্তমান সক্রিয়</span>' : ''}
            </div>
            <div class="text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <span>ID: ${ex.id}</span>
              ${count > 0 ? `<span class="text-emerald-600 font-sans">(${ResultEngine.toBnDigit(count)} জন শিক্ষার্থী)</span>` : ''}
            </div>
          </td>
          <td class="py-3 px-3 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button type="button" onclick="window.editExam('${ex.id}')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/60 dark:hover:bg-sky-800 text-sky-700 dark:text-sky-300 cursor-pointer flex items-center gap-1" title="নাম বা সাল এডিট করুন">
                <i class="fas fa-edit"></i> <span>এডিট</span>
              </button>
              <button type="button" onclick="window.deleteExam('${ex.id}')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-800 text-rose-700 dark:text-rose-300 cursor-pointer flex items-center gap-1" title="মুছে ফেলুন">
                <i class="fas fa-trash-alt"></i> <span>ডিলিট</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.editExam = function (examId) {
    const school = getActiveSchool();
    const exam = (school.exams || []).find(x => x.id === examId);
    if (!exam) return;

    if (editingExamOriginalId) editingExamOriginalId.value = exam.id;
    if (examFormYear) examFormYear.value = exam.year || '2026';
    if (examFormNameBn) {
      examFormNameBn.value = exam.name_bn || exam.name_en || '';
      examFormNameBn.focus();
    }
    if (manageExamFormTitle) {
      manageExamFormTitle.innerHTML = `<i class="fas fa-edit"></i> পরীক্ষা এডিট করুন: "${exam.name_bn || exam.id}"`;
    }
    if (examFormSubmitText) {
      examFormSubmitText.textContent = 'পরিবর্তন সংরক্ষণ করুন';
    }
    if (cancelEditExamBtn) {
      cancelEditExamBtn.classList.remove('hidden');
    }
  };

  window.resetExamForm = function () {
    if (manageExamForm) manageExamForm.reset();
    if (editingExamOriginalId) editingExamOriginalId.value = '';
    if (examFormYear) examFormYear.value = currentYear || '2026';
    if (manageExamFormTitle) {
      manageExamFormTitle.innerHTML = `<i class="fas fa-plus-circle"></i> নতুন পরীক্ষা যোগ করুন`;
    }
    if (examFormSubmitText) {
      examFormSubmitText.textContent = 'পরীক্ষা সংরক্ষণ';
    }
    if (cancelEditExamBtn) {
      cancelEditExamBtn.classList.add('hidden');
    }
  };

  window.handleSaveExamForm = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const originalId = editingExamOriginalId ? editingExamOriginalId.value.trim() : '';
    const year = (examFormYear?.value || '2026').trim();
    const nameBn = (examFormNameBn?.value || '').trim();

    if (!year || !nameBn) {
      alert('শিক্ষাবর্ষ এবং পরীক্ষার নাম আবশ্যক!');
      return;
    }

    const school = getActiveSchool();
    if (!school.exams) school.exams = [];
    if (!school.academic_years) school.academic_years = ['2026', '2025'];

    if (!school.academic_years.includes(year)) {
      school.academic_years.unshift(year);
    }

    if (originalId) {
      // EDITING EXISTING EXAM
      const examIdx = school.exams.findIndex(x => x.id === originalId);
      if (examIdx >= 0) {
        const oldExam = school.exams[examIdx];
        school.exams[examIdx] = {
          ...oldExam,
          name_bn: nameBn,
          name_en: nameBn,
          year: year
        };

        // Also update any existing students who had this exam_id or exam_name_bn
        let updatedStudentCount = 0;
        allStudents.forEach(st => {
          const matchSchool = (st.institution_id === activeSchoolId) || (!st.institution_id && activeSchoolId === 'dreamland-school');
          if (matchSchool && (st.exam_id === originalId || st.exam_name_bn === oldExam.name_bn)) {
            st.exam_name_bn = nameBn;
            st.year = year;
            st.academic_year = year;
            updatedStudentCount++;
          }
        });
        if (updatedStudentCount > 0) {
          ResultEngine.Storage.saveStudents(allStudents);
        }

        ResultEngine.Storage.saveConfig(config);
        alert(`পরীক্ষার নাম ও তথ্য সফলভাবে আপডেট করা হয়েছে!\nনতুন নাম: "${nameBn}" (${year})`);
      }
    } else {
      // ADDING NEW EXAM
      const examId = `exam_${year}_${Date.now().toString(36)}`;
      const newExamObj = {
        id: examId,
        name_bn: nameBn,
        name_en: nameBn,
        year: year,
        is_published: false
      };
      school.exams.unshift(newExamObj);
      ResultEngine.Storage.saveConfig(config);
      currentYear = year;
      currentExamId = examId;
      alert(`নতুন পরীক্ষা "${nameBn}" (${year}) সফলভাবে তৈরি ও সক্রিয় করা হয়েছে!`);
    }

    window.resetExamForm();
    renderManageExamsList();
    populateYearAndExamDropdowns();
    renderSpreadsheet();
    renderBatchPreview();
  };

  window.deleteExam = function (examId) {
    const school = getActiveSchool();
    const exam = (school.exams || []).find(x => x.id === examId);
    if (!exam) return;

    const countStudents = allStudents.filter(s => {
      const matchSchool = (s.institution_id === activeSchoolId) || (!s.institution_id && activeSchoolId === 'dreamland-school');
      return matchSchool && (s.exam_id === examId || s.exam_name_bn === exam.name_bn);
    }).length;

    let confirmMsg = `আপনি কি নিশ্চিত যে "${exam.name_bn || exam.id}" (${exam.year || '2026'}) পরীক্ষাটি তালিকা থেকে মুছে ফেলতে চান?`;
    if (countStudents > 0) {
      confirmMsg += `\n\nসতর্কতা: এই পরীক্ষার অধীনে বর্তমানে ${ResultEngine.toBnDigit(countStudents)} জন শিক্ষার্থীর ফলাফল সংরক্ষিত আছে!`;
    }

    if (!confirm(confirmMsg)) return;

    school.exams = school.exams.filter(x => x.id !== examId);
    ResultEngine.Storage.saveConfig(config);

    if (currentExamId === examId) {
      currentExamId = school.exams.length > 0 ? school.exams[0].id : '';
    }

    window.resetExamForm();
    renderManageExamsList();
    populateYearAndExamDropdowns();
    renderSpreadsheet();
    renderBatchPreview();
    alert('পরীক্ষাটি তালিকা থেকে মুছে ফেলা হয়েছে।');
  };

  // Backward-compatibility aliases
  window.openCreateExamModal = window.openManageExamsModal;
  window.closeCreateExamModal = window.closeManageExamsModal;
  window.handleCreateExamSubmit = window.handleSaveExamForm;

  // Method 3: Add New Student Modal & Submit
  function openAddStudentModal() {
    if (addStudentModal) addStudentModal.classList.remove('hidden');
    if (newStudentRoll) {
      const students = getStudentsInCurrentClass();
      const maxRoll = students.reduce((max, s) => Math.max(max, parseInt(s.roll, 10) || 0), 0);
      newStudentRoll.value = maxRoll + 1;
      newStudentRoll.focus();
    }
  }

  window.openAddStudentModal = openAddStudentModal;

  window.closeAddStudentModal = function () {
    if (addStudentModal) addStudentModal.classList.add('hidden');
    if (newStudentForm) newStudentForm.reset();
  };

  function handleCreateNewStudent(e) {
    e.preventDefault();
    const roll = parseInt(newStudentRoll?.value, 10);
    const nameBn = newStudentNameBn?.value.trim();
    if (!roll || !nameBn) {
      alert('রোল ও নাম আবশ্যক!');
      return;
    }

    const school = getActiveSchool();
    const classObj = (school.classes || config.classes || []).find(c => c.id === currentClassId) || { name_bn: currentClassId };
    const currentExamObj = (school.exams || []).find(e => e.id === currentExamId);
    const examTitle = currentExamObj ? currentExamObj.name_bn : `${ResultEngine.toBnDigit(currentYear)} সালের পরীক্ষা`;

    // Find sample subjects
    const existing = allStudents.filter(s => {
      const matchSchool = (s.institution_id === activeSchoolId) || (!s.institution_id && activeSchoolId === 'dreamland-school');
      return String(s.class_id) === String(currentClassId) && Array.isArray(s.subjects) && s.subjects.length > 0;
    });
    const sample = existing[0] || {};
    const defaultSubjects = (sample.subjects || [
      { name_bn: 'বাংলা', code: '101', full_marks: 100 },
      { name_bn: 'ইংরেজি', code: '102', full_marks: 100 },
      { name_bn: 'গণিত', code: '103', full_marks: 100 }
    ]).map(s => ({
      ...s,
      marks_obtained: 0,
      grade: 'F',
      point: 0,
      is_absent: false
    }));

    const religion = document.getElementById('newStudentReligion')?.value || 'islam';
    const fourthSubject = document.getElementById('newStudentFourthSubject')?.value || '';

    const customizedSubjects = defaultSubjects.filter(s => {
      const isRel = s.code === '111' || s.code === '112' || s.code === '113' || s.code === '114' || s.name_bn?.includes('ধর্ম');
      const isFourth = s.is_optional || s.name_bn?.includes('৪র্থ') || s.code === '134' || s.code === '126';
      return !isRel && !isFourth;
    });

    if (fourthSubject === 'higher_math') {
      customizedSubjects.push({ code: '126', name_bn: 'উচ্চতর গণিত (৪র্থ বিষয়)', name_en: 'Higher Mathematics (4th Subject)', full_marks: 100, marks_obtained: 0, grade: 'F', point: 0, is_optional: true });
    } else if (fourthSubject === 'agriculture') {
      customizedSubjects.push({ code: '134', name_bn: 'কৃষি শিক্ষা (৪র্থ বিষয়)', name_en: 'Agriculture Studies (4th Subject)', full_marks: 100, marks_obtained: 0, grade: 'F', point: 0, is_optional: true });
    }

    if (religion === 'hindu') {
      customizedSubjects.push({ code: '112', name_bn: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', name_en: 'Hindu Religion & Moral Education', full_marks: 100, marks_obtained: 0, grade: 'F', point: 0, is_optional: false });
    } else if (religion === 'christian') {
      customizedSubjects.push({ code: '113', name_bn: 'খ্রিস্টধর্ম ও নৈতিক শিক্ষা', name_en: 'Christian Religion & Moral Education', full_marks: 100, marks_obtained: 0, grade: 'F', point: 0, is_optional: false });
    } else if (religion === 'buddhist') {
      customizedSubjects.push({ code: '114', name_bn: 'বৌদ্ধধর্ম ও নৈতিক শিক্ষা', name_en: 'Buddhist Religion & Moral Education', full_marks: 100, marks_obtained: 0, grade: 'F', point: 0, is_optional: false });
    } else {
      customizedSubjects.push({ code: '111', name_bn: 'ইসলাম ও নৈতিক শিক্ষা', name_en: 'Islam & Moral Education', full_marks: 100, marks_obtained: 0, grade: 'F', point: 0, is_optional: false });
    }

    const newStudent = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      institution_id: activeSchoolId,
      institution_name_bn: school.name_bn,
      year: String(currentYear),
      academic_year: String(currentYear),
      exam_id: currentExamId,
      exam_name_bn: examTitle,
      class_id: currentClassId,
      class_name_bn: classObj.name_bn,
      roll: roll,
      student_name_bn: nameBn,
      father_name_bn: newStudentFather?.value.trim() || '',
      mother_name_bn: newStudentMother?.value.trim() || '',
      section: newStudentSection?.value.trim() || 'সাধারণ',
      dob: '',
      religion: religion,
      fourth_subject: fourthSubject,
      subjects: customizedSubjects,
      publish_status: 'draft',
      status: 'Failed'
    };

    allStudents.push(newStudent);
    ResultEngine.Storage.saveStudents(allStudents);
    ResultEngine.Firestore.saveStudentToFirestore(newStudent);

    window.closeAddStudentModal();
    alert(`রোল ${roll} (${nameBn}) ${ResultEngine.toBnDigit(currentYear)} সালের "${examTitle}"-এ সফলভাবে যোগ করা হয়েছে!`);
    renderSpreadsheet();
    renderBatchPreview();
  }

  // Settings tab form
  function loadSettingsForm() {
    const school = getActiveSchool();
    if (cfgInstNameBn) cfgInstNameBn.value = school.name_bn || '';
    if (cfgInstNameEn) cfgInstNameEn.value = school.name_en || '';
    if (cfgInstAddress) cfgInstAddress.value = school.address_bn || '';
    if (cfgExamName) cfgExamName.value = `${ResultEngine.toBnDigit(currentYear)} সালের পরীক্ষা`;

    // Security PIN Management
    const superAdminPinInput = document.getElementById('cfgSuperAdminPin');
    const schoolMasterPinInput = document.getElementById('cfgSchoolMasterPin');
    const activeSchoolBadge = document.getElementById('cfgActiveSchoolBadge');

    if (superAdminPinInput) {
      const storedSuperPin = (typeof localStorage !== 'undefined' && localStorage.getItem('fayzar_admin_pin')) 
        || (config.super_admin_pins && config.super_admin_pins[0]) 
        || '101919';
      superAdminPinInput.value = storedSuperPin;
    }

    if (schoolMasterPinInput) {
      schoolMasterPinInput.value = school.master_pin || '';
    }

    if (activeSchoolBadge) {
      activeSchoolBadge.textContent = school.name_bn || 'প্রতিষ্ঠান';
    }

    renderTeachersTable();
  }

  function renderTeachersTable() {
    const school = getActiveSchool();
    const tableBody = document.getElementById('cfgTeachersTableBody');
    if (!tableBody) return;

    const teachers = school.teachers || [];
    if (teachers.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="p-4 text-center text-slate-400">
            এই প্রতিষ্ঠানের কোনো শিক্ষক একাউন্ট যুক্ত করা হয়নি। উপরের '+ নতুন শিক্ষক যুক্ত করুন' বাটনে ক্লিক করুন।
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = teachers.map((teacher, idx) => {
      const subjects = (teacher.assigned_subjects || []).join(', ') || 'সকল বিষয়';
      const pin = teacher.pin || '----';
      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
          <td class="p-3 font-bold text-slate-800 dark:text-slate-200">
            <i class="fas fa-chalkboard-user text-emerald-600 mr-1.5"></i> ${teacher.name}
          </td>
          <td class="p-3 text-slate-600 dark:text-slate-300">
            <span class="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono text-[11px]">${subjects}</span>
          </td>
          <td class="p-3">
            <span class="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md tracking-wider border border-slate-200 dark:border-slate-700">${pin}</span>
          </td>
          <td class="p-3 text-right space-x-1.5 whitespace-nowrap">
            <button type="button" onclick="openCfgTeacherModal(${idx})" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold text-xs transition cursor-pointer">
              <i class="fas fa-pen-to-square mr-1"></i> এডিট
            </button>
            <button type="button" onclick="deleteCfgTeacher(${idx})" class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 font-bold text-xs transition cursor-pointer">
              <i class="fas fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Teacher modal management
  window.openCfgTeacherModal = function (idx = -1) {
    const modal = document.getElementById('cfgTeacherModal');
    const form = document.getElementById('cfgTeacherForm');
    const title = document.getElementById('cfgTeacherModalTitle');
    const editIndexInput = document.getElementById('cfgTeacherEditIndex');
    const nameInput = document.getElementById('cfgTeacherName');
    const pinInput = document.getElementById('cfgTeacherPin');
    const subjectsInput = document.getElementById('cfgTeacherSubjects');
    if (!modal || !form) return;

    editIndexInput.value = idx;
    if (idx >= 0) {
      const school = getActiveSchool();
      const teacher = (school.teachers || [])[idx];
      if (teacher) {
        if (title) title.innerHTML = '<i class="fas fa-user-pen text-emerald-600"></i> শিক্ষক তথ্য ও পিন সম্পাদনা';
        if (nameInput) nameInput.value = teacher.name || '';
        if (pinInput) pinInput.value = teacher.pin || '';
        if (subjectsInput) subjectsInput.value = (teacher.assigned_subjects || []).join(', ');
      }
    } else {
      if (title) title.innerHTML = '<i class="fas fa-user-plus text-emerald-600"></i> নতুন শিক্ষক ও পিন যুক্ত করুন';
      form.reset();
      editIndexInput.value = -1;
    }
    modal.classList.remove('hidden');
  };

  window.closeCfgTeacherModal = function () {
    const modal = document.getElementById('cfgTeacherModal');
    if (modal) modal.classList.add('hidden');
  };

  window.deleteCfgTeacher = function (idx) {
    const school = getActiveSchool();
    if (!school.teachers || !school.teachers[idx]) return;
    const tName = school.teachers[idx].name;
    if (confirm(`আপনি কি নিশ্চিত যে শিক্ষক "${tName}" এর একাউন্ট ও পিন মুছে ফেলতে চান?`)) {
      school.teachers.splice(idx, 1);
      ResultEngine.Storage.saveConfig(config);
      renderTeachersTable();
    }
  };

  window.togglePasswordVisibility = function (inputId, iconId) {
    const el = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!el) return;
    if (el.type === 'password') {
      el.type = 'text';
      if (icon) icon.className = 'fas fa-eye-slash';
    } else {
      el.type = 'password';
      if (icon) icon.className = 'fas fa-eye';
    }
  };

  // Global Logout
  window.adminLogout = function () {
    ResultEngine.Storage.logout();
    location.reload();
  };

  // Tab switching
  function switchAdminTab(tabName) {
    adminTabButtons.forEach(btn => {
      if (btn.getAttribute('data-admin-tab') === tabName) {
        btn.classList.add('active', 'bg-emerald-600', 'text-white');
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('active', 'bg-emerald-600', 'text-white');
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      }
    });

    if (batchPrintTabContent) batchPrintTabContent.classList.toggle('hidden', tabName !== 'batchPrintTab');
    if (spreadsheetTabContent) spreadsheetTabContent.classList.toggle('hidden', tabName !== 'spreadsheetTab');
    if (excelImportTabContent) excelImportTabContent.classList.toggle('hidden', tabName !== 'excelImportTab');
    if (settingsTabContent) settingsTabContent.classList.toggle('hidden', tabName !== 'settingsTab');

    if (tabName === 'batchPrintTab') renderBatchPreview();
    if (tabName === 'spreadsheetTab') renderSpreadsheet();
  }

  window.switchAdminTab = switchAdminTab;

  // Event Listeners
  function bindEvents() {
    pinForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawPin = pinInput?.value || '';
      const authRes = await ResultEngine.authenticatePin(rawPin);
      if (authRes.success) {
        currentUser = authRes.user;
        hideAuthOverlay();
        applyUserPermissions(currentUser);
      } else {
        alert(authRes.error);
        if (pinInput) {
          pinInput.value = '';
          pinInput.focus();
        }
      }
    });

    adminInstitutionSelect?.addEventListener('change', (e) => {
      activeSchoolId = e.target.value;
      populateYearAndExamDropdowns();
      populateClassDropdowns();
      renderSpreadsheet();
      renderBatchPreview();
      loadSettingsForm();
    });

    // Year and Exam selection changes
    editorYearSelect?.addEventListener('change', (e) => {
      currentYear = e.target.value;
      updateExamDropdownsForYear();
      if (batchYearSelect) batchYearSelect.value = currentYear;
      if (importYearSelect) importYearSelect.value = currentYear;
      renderSpreadsheet();
      renderBatchPreview();
    });

    editorExamSelect?.addEventListener('change', (e) => {
      currentExamId = e.target.value;
      if (batchExamSelect) batchExamSelect.value = currentExamId;
      if (importExamSelect) importExamSelect.value = currentExamId;
      renderSpreadsheet();
      renderBatchPreview();
    });

    batchYearSelect?.addEventListener('change', (e) => {
      currentYear = e.target.value;
      updateExamDropdownsForYear();
      if (editorYearSelect) editorYearSelect.value = currentYear;
      if (importYearSelect) importYearSelect.value = currentYear;
      renderBatchPreview();
      renderSpreadsheet();
    });

    batchExamSelect?.addEventListener('change', (e) => {
      currentExamId = e.target.value;
      if (editorExamSelect) editorExamSelect.value = currentExamId;
      if (importExamSelect) importExamSelect.value = currentExamId;
      renderBatchPreview();
      renderSpreadsheet();
    });

    importYearSelect?.addEventListener('change', (e) => {
      currentYear = e.target.value;
      updateExamDropdownsForYear();
      if (editorYearSelect) editorYearSelect.value = currentYear;
      if (batchYearSelect) batchYearSelect.value = currentYear;
    });

    importExamSelect?.addEventListener('change', (e) => {
      currentExamId = e.target.value;
      if (editorExamSelect) editorExamSelect.value = currentExamId;
      if (batchExamSelect) batchExamSelect.value = currentExamId;
    });

    importClassSelect?.addEventListener('change', (e) => {
      currentClassId = e.target.value;
      if (editorClassSelect) editorClassSelect.value = currentClassId;
      if (batchClassSelect) batchClassSelect.value = currentClassId;
    });

    // Tab buttons
    adminTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-admin-tab');
        if (tab) switchAdminTab(tab);
      });
    });

    editorClassSelect?.addEventListener('change', (e) => {
      currentClassId = e.target.value;
      if (batchClassSelect) batchClassSelect.value = currentClassId;
      if (importClassSelect) importClassSelect.value = currentClassId;
      renderSpreadsheet();
    });

    batchClassSelect?.addEventListener('change', (e) => {
      currentClassId = e.target.value;
      if (editorClassSelect) editorClassSelect.value = currentClassId;
      if (importClassSelect) importClassSelect.value = currentClassId;
      renderBatchPreview(e.target.value);
    });

    executeBatchPrintBtn?.addEventListener('click', executeBatchPrint);
    saveEditorChangesBtn?.addEventListener('click', saveSpreadsheetChanges);
    togglePublishBtn?.addEventListener('click', toggleClassPublishStatus);
    exportExcelBtn?.addEventListener('click', exportClassToExcel);
    addNewStudentBtn?.addEventListener('click', openAddStudentModal);
    newStudentForm?.addEventListener('submit', handleCreateNewStudent);

    // Excel import events
    downloadSampleExcelBtn?.addEventListener('click', window.downloadSampleExcelTemplate);
    
    excelDropzone?.addEventListener('click', () => {
      excelFileInput?.click();
    });

    excelDropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      excelDropzone.classList.add('border-emerald-500', 'bg-emerald-50/50');
    });

    excelDropzone?.addEventListener('dragleave', () => {
      excelDropzone.classList.remove('border-emerald-500', 'bg-emerald-50/50');
    });

    excelDropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      excelDropzone.classList.remove('border-emerald-500', 'bg-emerald-50/50');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleExcelUpload(e.dataTransfer.files[0]);
      }
    });

    excelFileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleExcelUpload(e.target.files[0]);
      }
    });

    settingsForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const school = getActiveSchool();
      if (cfgInstNameBn) school.name_bn = cfgInstNameBn.value.trim();
      if (cfgInstNameEn) school.name_en = cfgInstNameEn.value.trim();
      if (cfgInstAddress) school.address_bn = cfgInstAddress.value.trim();

      ResultEngine.Storage.saveConfig(config);
      alert('স্কুল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    });

    resetDefaultDataBtn?.addEventListener('click', async () => {
      if (confirm('আপনি কি নিশ্চিত যে সমস্ত ডেটা রিসেট করতে চান?')) {
        await ResultEngine.Storage.resetToDefault();
        location.reload();
      }
    });

    // PIN and Teacher Security Management Event Listeners
    const saveSuperAdminPinBtn = document.getElementById('saveSuperAdminPinBtn');
    saveSuperAdminPinBtn?.addEventListener('click', () => {
      const input = document.getElementById('cfgSuperAdminPin');
      const val = input?.value.trim();
      if (!val || val.length < 4) {
        alert('সুপার অ্যাডমিন পিন কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে!');
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('fayzar_admin_pin', val);
      }
      if (!Array.isArray(config.super_admin_pins)) {
        config.super_admin_pins = ['101919', 'fayzar', '1234', 'admin'];
      }
      if (!config.super_admin_pins.includes(val)) {
        config.super_admin_pins.unshift(val);
      }
      ResultEngine.Storage.saveConfig(config);
      alert('সুপার অ্যাডমিন মাস্টার পাসকি সফলভাবে আপডেট করা হয়েছে!');
    });

    const saveSchoolMasterPinBtn = document.getElementById('saveSchoolMasterPinBtn');
    saveSchoolMasterPinBtn?.addEventListener('click', () => {
      const input = document.getElementById('cfgSchoolMasterPin');
      const val = input?.value.trim();
      if (!val) {
        alert('স্কুল মাস্টার পিন খালি রাখা যাবে না!');
        return;
      }
      const school = getActiveSchool();
      school.master_pin = val;
      ResultEngine.Storage.saveConfig(config);
      alert(`${school.name_bn} এর মাস্টার পিন সফলভাবে আপডেট করা হয়েছে!`);
    });

    const openAddTeacherBtn = document.getElementById('openAddTeacherBtn');
    openAddTeacherBtn?.addEventListener('click', () => {
      window.openCfgTeacherModal(-1);
    });

    const cfgTeacherForm = document.getElementById('cfgTeacherForm');
    cfgTeacherForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const school = getActiveSchool();
      if (!Array.isArray(school.teachers)) school.teachers = [];

      const idx = parseInt(document.getElementById('cfgTeacherEditIndex')?.value, 10);
      const name = document.getElementById('cfgTeacherName')?.value.trim();
      const pin = document.getElementById('cfgTeacherPin')?.value.trim();
      const subjectsStr = document.getElementById('cfgTeacherSubjects')?.value.trim();
      const subjects = subjectsStr ? subjectsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

      if (!name || !pin || subjects.length === 0) {
        alert('অনুগ্রহ করে শিক্ষকের নাম, পিন এবং অন্তত একটি বিষয় লিখুন!');
        return;
      }

      if (idx >= 0 && school.teachers[idx]) {
        school.teachers[idx].name = name;
        school.teachers[idx].pin = pin;
        school.teachers[idx].assigned_subjects = subjects;
      } else {
        const newTeacher = {
          id: `teacher_${Date.now()}`,
          name: name,
          pin: pin,
          assigned_subjects: subjects,
          classes: ['all']
        };
        school.teachers.push(newTeacher);
      }

      ResultEngine.Storage.saveConfig(config);
      renderTeachersTable();
      window.closeCfgTeacherModal();
      alert('শিক্ষক তথ্য ও ব্যক্তিগত পিন সফলভাবে সংরক্ষণ করা হয়েছে!');
    });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
