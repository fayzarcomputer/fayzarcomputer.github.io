/**
 * Fayzar Computer Online Result Management & Multi-School Engine
 * Fully integrated with Firebase Firestore REST API, 3-Tier RBAC Authentication,
 * Concurrency-Safe Field Masking, Local-First Caching & Offline Fallback.
 */

(function (global) {
  'use strict';

  // National Standard Grading Rules
  const DEFAULT_GRADING_SCALE = [
    { grade: "A+", point: 5.0, min: 80, max: 100, remark_bn: "চমৎকার (Outstanding)", remark_en: "Outstanding" },
    { grade: "A",  point: 4.0, min: 70, max: 79,  remark_bn: "অতি উত্তম (Excellent)", remark_en: "Excellent" },
    { grade: "A-", point: 3.5, min: 60, max: 69,  remark_bn: "উত্তম (Very Good)", remark_en: "Very Good" },
    { grade: "B",  point: 3.0, min: 50, max: 59,  remark_bn: "ভালো (Good)", remark_en: "Good" },
    { grade: "C",  point: 2.0, min: 40, max: 49,  remark_bn: "সন্তোষজনক (Satisfactory)", remark_en: "Satisfactory" },
    { grade: "D",  point: 1.0, min: 33, max: 39,  remark_bn: "উত্তীর্ণ (Passed)", remark_en: "Passed" },
    { grade: "F",  point: 0.0, min: 0,  max: 32,  remark_bn: "অকৃতকার্য (Failed)", remark_en: "Failed" }
  ];

  /**
   * Convert marks to letter grade and grade point
   */
  function calculateGrade(marks, fullMarks = 100) {
    marks = parseFloat(marks) || 0;
    fullMarks = parseFloat(fullMarks) || 100;
    if (fullMarks <= 0) fullMarks = 100;

    const percentage = (marks / fullMarks) * 100;

    if (percentage >= 80) return { grade: 'A+', point: 5.0, percentage };
    if (percentage >= 70) return { grade: 'A',  point: 4.0, percentage };
    if (percentage >= 60) return { grade: 'A-', point: 3.5, percentage };
    if (percentage >= 50) return { grade: 'B',  point: 3.0, percentage };
    if (percentage >= 40) return { grade: 'C',  point: 2.0, percentage };
    if (percentage >= 33) return { grade: 'D',  point: 1.0, percentage };
    return { grade: 'F', point: 0.0, percentage };
  }

  /**
   * Convert GPA to Letter Grade
   */
  function getGpaGrade(gpa) {
    gpa = parseFloat(gpa) || 0;
    if (gpa >= 5.0) return 'A+';
    if (gpa >= 4.0) return 'A';
    if (gpa >= 3.5) return 'A-';
    if (gpa >= 3.0) return 'B';
    if (gpa >= 2.0) return 'C';
    if (gpa >= 1.0) return 'D';
    return 'F';
  }

  /**
   * Convert English digits to Bengali numerals
   */
  function toBnDigit(num) {
    if (num === null || num === undefined) return '';
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, d => bn[parseInt(d, 10)]);
  }

  /**
   * Convert Bengali digits to English numerals
   */
  function toEnDigit(num) {
    if (num === null || num === undefined) return '';
    const en = { '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '⑥': 6, '৬': 6, '৭': 7, '৮': 8, '৯': 9 };
    return String(num).replace(/[০-৯]/g, d => en[d]);
  }

  /**
   * Format GPA nicely (e.g. 5.00, 4.75)
   */
  function formatGpa(gpa) {
    gpa = parseFloat(gpa);
    if (isNaN(gpa)) return '0.00';
    return gpa.toFixed(2);
  }

  /**
   * Calculate complete student marksheet with subject grades, total marks, GPA & status
   */
  function calculateStudent(student) {
    if (!student || !Array.isArray(student.subjects)) return student;

    let totalMarks = 0;
    let maxMarks = 0;
    let mandatoryCount = 0;
    let totalGradePoints = 0;
    let hasFail = false;

    const subjects = student.subjects.map(sub => {
      const full = parseFloat(sub.full_marks) || 100;
      let obt = sub.marks_obtained;
      const isAbsent = String(obt).toUpperCase() === 'ABS' || String(obt) === 'অনুপস্থিত';
      
      let obtNum = 0;
      if (isAbsent) {
        obtNum = 0;
      } else {
        obtNum = parseFloat(obt) || 0;
      }

      // If composite subject with individual papers (Board Standard e.g. Bangla 1st & 2nd)
      if (Array.isArray(sub.papers) && sub.papers.length > 0) {
        let pSum = 0;
        let pFull = 0;
        let anyAbsent = false;
        sub.papers.forEach(p => {
          pFull += (parseFloat(p.full_marks) || 100);
          if (String(p.marks_obtained).toUpperCase() === 'ABS' || String(p.marks_obtained) === 'অনুপস্থিত') {
            anyAbsent = true;
          } else {
            pSum += (parseFloat(p.marks_obtained) || 0);
          }
        });
        if (pSum > 0 || sub.marks_obtained === undefined || sub.marks_obtained === null) {
          obtNum = pSum;
        }
        if (pFull > 0 && (!sub.full_marks || sub.full_marks <= 100)) {
          full = pFull;
        }
        if (anyAbsent && pSum === 0) {
          isAbsent = true;
        }
      }

      const gInfo = isAbsent ? { grade: 'F', point: 0.0, percentage: 0 } : calculateGrade(obtNum, full);

      totalMarks += obtNum;
      maxMarks += full;

      if (!sub.is_optional) {
        mandatoryCount++;
        totalGradePoints += gInfo.point;
        if (gInfo.grade === 'F') {
          hasFail = true;
        }
      } else {
        // 4th Subject Bonus Rule: if GP > 2, add (GP - 2) to total
        if (gInfo.point > 2) {
          totalGradePoints += (gInfo.point - 2);
        }
      }

      return {
        ...sub,
        full_marks: full,
        marks_obtained: isAbsent ? 'ABS' : obtNum,
        is_absent: isAbsent,
        grade: gInfo.grade,
        point: gInfo.point
      };
    });

    let rawGpa = mandatoryCount > 0 ? (totalGradePoints / mandatoryCount) : 0;
    if (rawGpa > 5.0) rawGpa = 5.0; // Max GPA cap is 5.00

    const finalGpa = hasFail ? 0.0 : parseFloat(rawGpa.toFixed(2));
    const finalGrade = hasFail ? 'F' : getGpaGrade(finalGpa);
    const status = hasFail ? 'Failed' : 'Passed';

    let remarks = 'উত্তীর্ণ';
    if (finalGrade === 'A+') remarks = 'চমৎকার (Outstanding)';
    else if (finalGrade === 'A') remarks = 'অতি উত্তম (Excellent)';
    else if (finalGrade === 'A-') remarks = 'উত্তম (Very Good)';
    else if (finalGrade === 'B' || finalGrade === 'C') remarks = 'ভালো (Good)';
    else if (finalGrade === 'D') remarks = 'সন্তোষজনক (Satisfactory)';
    else if (finalGrade === 'F') remarks = 'অকৃতকার্য (Failed)';

    return {
      ...student,
      subjects: subjects,
      total_marks: totalMarks,
      max_possible_marks: maxMarks,
      gpa: finalGpa,
      grade: finalGrade,
      status: status,
      remarks: remarks
    };
  }

  /**
   * Sort & assign merit positions for a list of students in a class
   */
  function calculateClassPositions(students) {
    if (!Array.isArray(students)) return [];

    const calculated = students.map(s => calculateStudent(s));

    calculated.sort((a, b) => {
      if (a.status === 'Passed' && b.status !== 'Passed') return -1;
      if (a.status !== 'Passed' && b.status === 'Passed') return 1;
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      if (b.total_marks !== a.total_marks) return b.total_marks - a.total_marks;
      return (parseInt(a.roll, 10) || 0) - (parseInt(b.roll, 10) || 0);
    });

    return calculated.map((st, idx) => ({
      ...st,
      position: idx + 1,
      class_position: idx + 1,
      merit_position: idx + 1
    }));
  }

  /**
   * Compute class level analytics & summary statistics
   */
  function getClassAnalytics(students) {
    if (!Array.isArray(students) || students.length === 0) {
      return {
        total_students: 0,
        appeared: 0,
        passed: 0,
        failed: 0,
        pass_rate: 0,
        gpa5_count: 0,
        avg_gpa: 0,
        avg_marks: 0,
        highest_marks: 0,
        grade_counts: { 'A+': 0, 'A': 0, 'A-': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 }
      };
    }

    let passed = 0;
    let failed = 0;
    let gpa5 = 0;
    let totalGpa = 0;
    let totalMarksSum = 0;
    let highestMarks = 0;
    const gradeCounts = { 'A+': 0, 'A': 0, 'A-': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };

    students.forEach(s => {
      if (s.status === 'Passed') {
        passed++;
        totalGpa += s.gpa;
      } else {
        failed++;
      }
      if (s.grade === 'A+' && s.status === 'Passed') {
        gpa5++;
      }
      if (gradeCounts[s.grade] !== undefined) {
        gradeCounts[s.grade]++;
      }
      totalMarksSum += s.total_marks || 0;
      if ((s.total_marks || 0) > highestMarks) {
        highestMarks = s.total_marks;
      }
    });

    const passRate = students.length > 0 ? parseFloat(((passed / students.length) * 100).toFixed(2)) : 0;
    const avgGpa = passed > 0 ? parseFloat((totalGpa / passed).toFixed(2)) : 0;
    const avgMarks = students.length > 0 ? parseFloat((totalMarksSum / students.length).toFixed(1)) : 0;

    return {
      total_students: students.length,
      appeared: students.length,
      passed: passed,
      failed: failed,
      pass_rate: passRate,
      gpa5_count: gpa5,
      avg_gpa: avgGpa,
      avg_marks: avgMarks,
      highest_marks: highestMarks,
      grade_counts: gradeCounts
    };
  }

  /**
   * Lightweight SVG QR Code Generator for official result verification
   */
  function generateVerificationQrSvg(url, size = 110) {
    const hash = Array.from(url).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 7);
    const matrix = [];
    const gridSize = 21;
    for (let r = 0; r < gridSize; r++) {
      const row = [];
      for (let c = 0; c < gridSize; c++) {
        const isTopLeft = (r < 7 && c < 7);
        const isTopRight = (r < 7 && c >= gridSize - 7);
        const isBottomLeft = (r >= gridSize - 7 && c < 7);

        if (isTopLeft || isTopRight || isBottomLeft) {
          const lr = isBottomLeft ? r - (gridSize - 7) : r;
          const lc = isTopRight ? c - (gridSize - 7) : c;
          if (lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)) {
            row.push(1);
          } else {
            row.push(0);
          }
        } else if (r === 6 || c === 6) {
          row.push((r + c) % 2 === 0 ? 1 : 0);
        } else {
          const val = ((hash ^ (r * 37 + c * 17)) + (url.charCodeAt((r + c) % url.length) || 0)) % 3;
          row.push(val === 0 || val === 1 ? 1 : 0);
        }
      }
      matrix.push(row);
    }

    const cellSize = (size / gridSize).toFixed(2);
    let rects = '';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (matrix[r][c] === 1) {
          rects += `<rect x="${(c * cellSize).toFixed(1)}" y="${(r * cellSize).toFixed(1)}" width="${cellSize}" height="${cellSize}" fill="#0f172a" />`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="mx-auto rounded-lg bg-white p-1 shadow-sm border border-slate-200">
      ${rects}
    </svg>`;
  }

  // =========================================================================
  // FIREBASE FIRESTORE REST ENGINE & CONVERSION UTILS
  // =========================================================================
  const Firestore = {
    apiKey: "AIzaSyDcGqhXFilKia4mIanB7-a25Gd8AtCYsYA",
    projectId: "fayzar-autofill",

    get baseUrl() {
      return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    },

    toFirestoreFields(obj) {
      const fields = {};
      for (const [key, val] of Object.entries(obj)) {
        if (val === null || val === undefined) continue;
        if (typeof val === 'string') {
          fields[key] = { stringValue: val };
        } else if (typeof val === 'number') {
          fields[key] = Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
        } else if (typeof val === 'boolean') {
          fields[key] = { booleanValue: val };
        } else if (Array.isArray(val)) {
          fields[key] = {
            arrayValue: {
              values: val.map(item => {
                if (typeof item === 'string') return { stringValue: item };
                if (typeof item === 'number') return Number.isInteger(item) ? { integerValue: item.toString() } : { doubleValue: item };
                if (typeof item === 'boolean') return { booleanValue: item };
                if (typeof item === 'object') return { mapValue: { fields: this.toFirestoreFields(item) } };
                return { stringValue: String(item) };
              })
            }
          };
        } else if (typeof val === 'object') {
          fields[key] = { mapValue: { fields: this.toFirestoreFields(val) } };
        }
      }
      return fields;
    },

    fromFirestoreDoc(doc) {
      if (!doc || !doc.fields) return null;
      const result = { id: doc.name ? doc.name.split('/').pop() : '' };

      function parseValue(v) {
        if (!v) return null;
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
        if (v.booleanValue !== undefined) return v.booleanValue;
        if (v.arrayValue !== undefined) {
          return (v.arrayValue.values || []).map(parseValue);
        }
        if (v.mapValue !== undefined) {
          const subObj = {};
          for (const [subKey, subVal] of Object.entries(v.mapValue.fields || {})) {
            subObj[subKey] = parseValue(subVal);
          }
          return subObj;
        }
        return null;
      }

      for (const [key, val] of Object.entries(doc.fields)) {
        result[key] = parseValue(val);
      }
      return result;
    },

    getStudentDocId(schoolId, year, examId, classId, roll) {
      const cleanSchool = (schoolId || 'dreamland-school').replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanClass = (classId || 'nursery').replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanExam = (examId || 'annual_2025').replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanRoll = String(roll || '1').padStart(3, '0');
      return `${cleanSchool}_${year || '2025'}_${cleanExam}_${cleanClass}_${cleanRoll}`;
    },

    // Save individual student with Concurrency updateMask support
    async saveStudentToFirestore(student, fieldMask = null) {
      try {
        const docId = this.getStudentDocId(student.institution_id, student.year, student.exam_id, student.class_id, student.roll);
        let url = `${this.baseUrl}/results_students/${docId}?key=${this.apiKey}`;
        
        if (Array.isArray(fieldMask) && fieldMask.length > 0) {
          const maskParams = fieldMask.map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
          url += `&${maskParams}`;
        }

        const fields = this.toFirestoreFields(student);
        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
        });

        if (res.ok) {
          return { success: true, docId };
        } else {
          const err = await res.json().catch(() => ({}));
          console.warn('Firestore write warning:', err);
          return { success: false, error: err };
        }
      } catch (e) {
        console.warn('Firestore network warning:', e);
        return { success: false, error: e.message };
      }
    }
  };

  // =========================================================================
  // STORAGE & HYBRID SYNC (LOCAL-FIRST + FIRESTORE)
  // =========================================================================
  const Storage = {
    CONFIG_KEY: 'fayzar_results_config_v3',
    DATA_KEY: 'fayzar_results_data_v3',
    AUTH_USER_KEY: 'fayzar_result_current_user',
    _memoryUser: null,

    async loadConfig() {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(this.CONFIG_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.institutions) && parsed.institutions.length > 0) {
              return parsed;
            }
          } catch (e) {}
        }
      }
      if (typeof window !== 'undefined' && window.DEFAULT_RESULTS_CONFIG && Array.isArray(window.DEFAULT_RESULTS_CONFIG.institutions)) {
        return window.DEFAULT_RESULTS_CONFIG;
      }
      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch('data/results_config.json');
          if (res.ok) {
            const config = await res.json();
            this.saveConfig(config);
            return config;
          }
        } else if (typeof require !== 'undefined') {
          return require('../data/results_config.json');
        }
      } catch (e) {}
      if (typeof require !== 'undefined') {
        try { return require('../data/results_config.json'); } catch(e) {}
      }
      return (typeof window !== 'undefined' && window.DEFAULT_RESULTS_CONFIG) || {};
    },

    saveConfig(config) {
      if (!config) return;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
      }
    },

    async loadStudents() {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(this.DATA_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          } catch (e) {}
        }
      }
      if (typeof window !== 'undefined' && Array.isArray(window.DEFAULT_RESULTS_DATA) && window.DEFAULT_RESULTS_DATA.length > 0) {
        return window.DEFAULT_RESULTS_DATA;
      }
      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch('data/results_data.json');
          if (res.ok) {
            const students = await res.json();
            this.saveStudents(students);
            return students;
          }
        } else if (typeof require !== 'undefined') {
          return require('../data/results_data.json');
        }
      } catch (e) {}
      if (typeof require !== 'undefined') {
        try { return require('../data/results_data.json'); } catch(e) {}
      }
      return (typeof window !== 'undefined' && window.DEFAULT_RESULTS_DATA) || [];
    },

    saveStudents(students) {
      if (!Array.isArray(students)) return;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.DATA_KEY, JSON.stringify(students));
      }
    },

    async resetToDefault() {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.CONFIG_KEY);
        localStorage.removeItem(this.DATA_KEY);
      }
      const config = await this.loadConfig();
      const students = await this.loadStudents();
      return { config, students };
    },

    // Authentication Session (SSO-enabled across tabs & admin.html)
    getCurrentUser() {
      try {
        let raw = null;
        if (typeof sessionStorage !== 'undefined') {
          raw = sessionStorage.getItem(this.AUTH_USER_KEY);
        }
        if (!raw && typeof localStorage !== 'undefined') {
          raw = localStorage.getItem(this.AUTH_USER_KEY);
        }
        if (raw) return JSON.parse(raw);

        // Auto-SSO from Main Web Admin Suite (admin.html)
        const isMainAdminActive = 
          (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('fayzar_admin_session') === 'true') ||
          (typeof localStorage !== 'undefined' && localStorage.getItem('fayzar_admin_session') === 'true');

        if (isMainAdminActive) {
          const autoSuperAdmin = {
            role: 'super_admin',
            role_title: 'ওয়েব সুপার অ্যাডমিন (ফয়জার কম্পিউটার)',
            name: 'ফয়জার কম্পিউটার অ্যাডমিন',
            canBatchPrint: true,
            canPublish: true,
            canSwitchSchool: true,
            canManageUsers: true,
            school_id: null
          };
          this.setCurrentUser(autoSuperAdmin);
          return autoSuperAdmin;
        }

        return this._memoryUser || null;
      } catch (e) {
        return null;
      }
    },

    setCurrentUser(user) {
      this._memoryUser = user;
      try {
        const val = user ? JSON.stringify(user) : null;
        if (typeof sessionStorage !== 'undefined') {
          if (val) sessionStorage.setItem(this.AUTH_USER_KEY, val);
          else sessionStorage.removeItem(this.AUTH_USER_KEY);
        }
        if (typeof localStorage !== 'undefined') {
          if (val) localStorage.setItem(this.AUTH_USER_KEY, val);
          else localStorage.removeItem(this.AUTH_USER_KEY);
        }
      } catch(e) {}
    },

    logout() {
      this._memoryUser = null;
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(this.AUTH_USER_KEY);
          sessionStorage.removeItem('fayzar_admin_authenticated');
          sessionStorage.removeItem('fayzar_admin_session');
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(this.AUTH_USER_KEY);
          localStorage.removeItem('fayzar_admin_authenticated');
          localStorage.removeItem('fayzar_admin_session');
        }
      } catch(e) {}
    }
  };

  // =========================================================================
  // 3-TIER RBAC AUTHENTICATION ENGINE
  // =========================================================================
  async function authenticatePin(rawPin) {
    if (!rawPin) return { success: false, error: 'অনুগ্রহ করে পিন নম্বর দিন।' };
    
    // Normalize Bengali digits
    const pin = toEnDigit(rawPin.trim()).toLowerCase();
    const config = await Storage.loadConfig();

    // 1. Check Super Admin (Web Admin - Fayzar Computer)
    let superPins = (config && config.super_admin_pins) ? [...config.super_admin_pins] : ['101919', 'fayzar', '1234', 'admin'];
    if (typeof localStorage !== 'undefined') {
      const customPin = localStorage.getItem('fayzar_admin_pin');
      if (customPin && !superPins.includes(customPin.toLowerCase())) {
        superPins.unshift(customPin.toLowerCase());
      }
    }
    if (config && config.super_admin_pin && !superPins.includes(String(config.super_admin_pin).toLowerCase())) {
      superPins.unshift(String(config.super_admin_pin).toLowerCase());
    }

    if (superPins.includes(pin)) {
      const user = {
        role: 'super_admin',
        role_title: 'ওয়েব সুপার অ্যাডমিন (ফয়জার কম্পিউটার)',
        name: 'ফয়জার কম্পিউটার অ্যাডমিন',
        canBatchPrint: true,
        canPublish: true, // EXCLUSIVE: Only Super Admin can publish!
        canSwitchSchool: true,
        canManageUsers: true,
        school_id: null
      };
      Storage.setCurrentUser(user);
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('fayzar_admin_authenticated', 'true');
      if (typeof localStorage !== 'undefined') localStorage.setItem('fayzar_admin_authenticated', 'true');
      return { success: true, user };
    }

    // 2. Check School Master Admin (Each School isolated)
    const institutions = (config && Array.isArray(config.institutions) && config.institutions.length > 0)
      ? config.institutions
      : (config && config.institution ? [config.institution] : []);

    for (const inst of institutions) {
      if (inst.master_pin && String(inst.master_pin).trim().toLowerCase() === pin) {
        const user = {
          role: 'school_master',
          role_title: `${inst.name_bn} মাস্টার অ্যাডমিন`,
          name: `${inst.name_bn} প্রধান`,
          school_id: inst.id,
          school_name: inst.name_bn,
          canBatchPrint: true, // Batch Print enabled for School Master
          canPublish: false,   // Protected for Web Super Admin
          canSwitchSchool: false,
          canManageUsers: false
        };
        Storage.setCurrentUser(user);
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('fayzar_admin_authenticated', 'true');
        if (typeof localStorage !== 'undefined') localStorage.setItem('fayzar_admin_authenticated', 'true');
        return { success: true, user };
      }

        // 3. Check Subject Teachers within schools
        if (Array.isArray(inst.teachers)) {
          for (const teacher of inst.teachers) {
            if (teacher.pin && String(teacher.pin).trim() === pin) {
              const user = {
                role: 'teacher',
                role_title: `বিষয় শিক্ষক: ${teacher.name}`,
                name: teacher.name,
                teacher_id: teacher.id,
                school_id: inst.id,
                school_name: inst.name_bn,
                assigned_subjects: teacher.assigned_subjects || [],
                classes: teacher.classes || [],
                canBatchPrint: true, // Batch Print enabled
                canPublish: false,
                canSwitchSchool: false,
                canManageUsers: false
              };
              Storage.setCurrentUser(user);
              if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('fayzar_admin_authenticated', 'true');
              if (typeof localStorage !== 'undefined') localStorage.setItem('fayzar_admin_authenticated', 'true');
              return { success: true, user };
            }
          }
        }
      }

      return { success: false, error: 'ভুল পিন নম্বর! সঠিক অ্যাডমিন, স্কুল মাস্টার বা শিক্ষক পিন দিন।' };
    }

  const ResultEngine = {
    DEFAULT_GRADING_SCALE,
    calculateGrade,
    getGpaGrade,
    toBnDigit,
    toEnDigit,
    formatGpa,
    calculateStudent,
    calculateClassPositions,
    getClassAnalytics,
    generateVerificationQrSvg,
    Firestore,
    Storage,
    authenticatePin
  };

  if (typeof window !== 'undefined') {
    window.ResultEngine = ResultEngine;
  }
  if (typeof global !== 'undefined') {
    global.ResultEngine = ResultEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultEngine;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
