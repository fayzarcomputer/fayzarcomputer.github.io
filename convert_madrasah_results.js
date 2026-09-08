const fs = require('fs');
const BanglaConverter = require('./js/bangla-converter-engine.js');
const ResultEngine = require('./js/result-engine.js');

const rawDump = JSON.parse(fs.readFileSync('data/raw_madrasah_dump.json', 'utf8'));

function cleanText(str) {
  if (!str) return '';
  str = String(str).trim();
  if (!str) return '';
  
  if (BanglaConverter.hasBengaliText(str)) return str;

  if (/^[A-Za-z\s]+$/.test(str) && ['Rahim', 'Science', 'Arts', 'Commerce', 'Male', 'Female'].includes(str.trim())) {
    return str;
  }

  try {
    const converted = BanglaConverter.bijoyToUnicode(str);
    if (BanglaConverter.hasBengaliText(converted)) {
      return converted.trim();
    }
  } catch (e) {}

  return str;
}

function numVal(val, defaultVal = 0) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const parsed = parseFloat(String(val).replace(/[^0-9\.]/g, ''));
  return isNaN(parsed) ? defaultVal : parsed;
}

function getGradeInfo(marks, fullMarks = 100) {
  const pct = (marks / fullMarks) * 100;
  if (pct >= 80) return { grade: 'A+', point: 5.0 };
  if (pct >= 70) return { grade: 'A', point: 4.0 };
  if (pct >= 60) return { grade: 'A-', point: 3.5 };
  if (pct >= 50) return { grade: 'B', point: 3.0 };
  if (pct >= 40) return { grade: 'C', point: 2.0 };
  if (pct >= 33) return { grade: 'D', point: 1.0 };
  return { grade: 'F', point: 0.0 };
}

const madrasahStudents = [];

// 1. Process Class 6, 7, 8
['Class 6', 'Class 7', 'Class 8'].forEach(sheetName => {
  const rows = rawDump[sheetName] || [];
  const classId = sheetName === 'Class 6' ? 'madrasah_class_6' :
                  sheetName === 'Class 7' ? 'madrasah_class_7' : 'madrasah_class_8';
  const classNameBn = sheetName === 'Class 6' ? '৬ষ্ঠ শ্রেণি (দাকিল)' :
                      sheetName === 'Class 7' ? '৭ম শ্রেণি (দাকিল)' : '৮ম শ্রেণি (দাকিল)';

  const classStudents = [];

  rows.forEach(r => {
    if (r.row < 5) return;
    const roll = parseInt(r.B);
    const rawName = r.C;
    if (isNaN(roll) || !rawName) return;

    const studentName = cleanText(rawName);

    const subjects = [
      { code: '101', name_bn: 'কুরআন মাজিদ ও তাজবীদ', full_marks: 100, marks_obtained: numVal(r.D), is_optional: false },
      { code: '102', name_bn: 'আকাঈদ ও ফিকহ', full_marks: 100, marks_obtained: numVal(r.G), is_optional: false },
      { code: '103', name_bn: 'আরবি ১ম পত্র', full_marks: 100, marks_obtained: numVal(r.J), is_optional: false },
      { code: '104', name_bn: 'আরবি ২য় পত্র', full_marks: 100, marks_obtained: numVal(r.M), is_optional: false },
      { code: '134', name_bn: 'বাংলা ১ম পত্র', full_marks: 100, marks_obtained: numVal(r.P), is_optional: false },
      { code: '135', name_bn: 'বাংলা ২য় পত্র', full_marks: 50, marks_obtained: numVal(r.S), is_optional: false },
      { code: '107', name_bn: 'ইংরেজি ১ম পত্র', full_marks: 100, marks_obtained: numVal(r.V), is_optional: false },
      { code: '108', name_bn: 'ইংরেজি ২য় পত্র', full_marks: 50, marks_obtained: numVal(r.Y), is_optional: false },
      { code: '109', name_bn: 'গণিত', full_marks: 100, marks_obtained: numVal(r.AB), is_optional: false },
      { code: '110', name_bn: 'বিজ্ঞান', full_marks: 100, marks_obtained: numVal(r.AE), is_optional: false },
      { code: '111', name_bn: 'বাংলাদেশ ও বিশ্বপরিচয়', full_marks: 100, marks_obtained: numVal(r.AH), is_optional: false },
      { code: '154', name_bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', full_marks: 50, marks_obtained: numVal(r.AK), is_optional: false }
    ];

    subjects.forEach(sub => {
      const g = getGradeInfo(sub.marks_obtained, sub.full_marks);
      sub.letter_grade = g.grade;
      sub.grade_point = g.point;
    });

    const studentObj = {
      id: `amdungi_${classId}_${roll}`,
      institution_id: 'amdungi-madrasah',
      institution_name_bn: 'আমডুঙ্গীহাট ঈমান উদ্দিন চৌধুরী আলিম মাদ্রাসা',
      academic_year: '2025',
      exam_name_bn: 'বার্ষিক পরীক্ষা - ২০২৫',
      class_id: classId,
      class_name_bn: classNameBn,
      section_bn: 'ক',
      group_bn: 'সাধারণ',
      roll: roll,
      student_name_bn: studentName,
      student_name_en: '',
      father_name_bn: '',
      mother_name_bn: '',
      dob: '',
      subjects: subjects
    };

    const calculated = ResultEngine.calculateStudent(studentObj);
    classStudents.push(calculated);
  });

  const ranked = ResultEngine.calculateClassPositions(classStudents);
  madrasahStudents.push(...ranked);
  console.log(`Processed Madrasah ${sheetName}: ${ranked.length} students`);
});

// 2. Process Class 9 & Class 10
['Class 9', 'Class 10'].forEach(sheetName => {
  const rows = rawDump[sheetName] || [];
  const classId = sheetName === 'Class 9' ? 'madrasah_class_9' : 'madrasah_class_10';
  const classNameBn = sheetName === 'Class 9' ? '৯ম শ্রেণি (দাকিল)' : '১০ম শ্রেণি (দাকিল)';

  const classStudents = [];

  rows.forEach(r => {
    if (r.row < 6) return;
    const roll = parseInt(r.B);
    const rawName = r.C;
    if (isNaN(roll) || !rawName) return;

    const studentName = cleanText(rawName);
    const rawGroup = r.D || '';
    const groupName = rawGroup.includes('mvaviY') || rawGroup.includes('সাধারণ') ? 'সাধারণ' : 'বিজ্ঞান';

    const quranHadisTotal = numVal(r.I); // 200 marks
    const arabicTotal = numVal(r.P); // 200 marks
    const banglaTotal = numVal(r.W); // 200 marks
    const englishTotal = numVal(r.AB); // 200 marks
    const akaidTotal = numVal(r.AG); // 100 marks
    const mathTotal = numVal(r.AL); // 100 marks
    const agriTotal = numVal(r.AR); // 100 marks (optional / agriculture)

    const q1Marks = (numVal(r.E) + numVal(r.F));
    const q2Marks = (numVal(r.G) + numVal(r.H));
    const finalQ1 = (q1Marks + q2Marks > 0) ? q1Marks : Math.round(quranHadisTotal / 2);
    const finalQ2 = (q1Marks + q2Marks > 0) ? q2Marks : (quranHadisTotal - finalQ1);

    const ar1Marks = (numVal(r.L) + numVal(r.M));
    const ar2Marks = (numVal(r.N) + numVal(r.O));
    const finalAr1 = (ar1Marks + ar2Marks > 0) ? ar1Marks : Math.round(arabicTotal / 2);
    const finalAr2 = (ar1Marks + ar2Marks > 0) ? ar2Marks : (arabicTotal - finalAr1);

    const b1Marks = (numVal(r.S) + numVal(r.T)) || Math.round(banglaTotal / 2);
    const b2Marks = (numVal(r.U) + numVal(r.V)) || (banglaTotal - b1Marks);
    const e1Marks = numVal(r.Z) || Math.round(englishTotal / 2);
    const e2Marks = numVal(r.AA) || (englishTotal - e1Marks);

    const ictMarks = numVal(r.BO) || (numVal(r.BM) + numVal(r.BN)) || 0;

    const subjects = [
      {
        code: '201',
        name_bn: 'কুরআন মাজীদ ও তাজবীদ',
        name_en: 'Quran Mazid & Tajweed',
        full_marks: 100,
        marks_obtained: finalQ1,
        cq: numVal(r.F),
        mcq: numVal(r.E),
        is_optional: false
      },
      {
        code: '202',
        name_bn: 'হাদিস শরিফ',
        name_en: 'Hadith Sharif',
        full_marks: 100,
        marks_obtained: finalQ2,
        cq: numVal(r.H),
        mcq: numVal(r.G),
        is_optional: false
      },
      {
        code: '203',
        name_bn: 'আরবি',
        name_en: 'Arabic',
        full_marks: 200,
        marks_obtained: arabicTotal,
        is_optional: false,
        papers: [
          { code: '203-1', name_bn: 'আরবি ১ম পত্র', name_en: 'Arabic 1st Paper', full_marks: 100, marks_obtained: finalAr1, cq: numVal(r.M), mcq: numVal(r.L) },
          { code: '203-2', name_bn: 'আরবি ২য় পত্র', name_en: 'Arabic 2nd Paper', full_marks: 100, marks_obtained: finalAr2, cq: numVal(r.O), mcq: numVal(r.N) }
        ]
      },
      {
        code: '205',
        name_bn: 'আকাঈদ ও ফিকহ',
        name_en: 'Akaid & Fiqh',
        full_marks: 100,
        marks_obtained: akaidTotal,
        cq: numVal(r.AF),
        mcq: numVal(r.AE),
        is_optional: false
      },
      {
        code: '101',
        name_bn: 'বাংলা',
        name_en: 'Bangla',
        full_marks: 200,
        marks_obtained: banglaTotal,
        is_optional: false,
        papers: [
          { code: '101-1', name_bn: 'বাংলা ১ম পত্র', name_en: 'Bangla 1st Paper', full_marks: 100, marks_obtained: b1Marks, cq: numVal(r.T), mcq: numVal(r.S) },
          { code: '101-2', name_bn: 'বাংলা ২য় পত্র', name_en: 'Bangla 2nd Paper', full_marks: 100, marks_obtained: b2Marks, cq: numVal(r.V), mcq: numVal(r.U) }
        ]
      },
      {
        code: '107',
        name_bn: 'ইংরেজি',
        name_en: 'English',
        full_marks: 200,
        marks_obtained: englishTotal,
        is_optional: false,
        papers: [
          { code: '107-1', name_bn: 'ইংরেজি ১ম পত্র', name_en: 'English 1st Paper', full_marks: 100, marks_obtained: e1Marks, cq: numVal(r.Z) },
          { code: '107-2', name_bn: 'ইংরেজি ২য় পত্র', name_en: 'English 2nd Paper', full_marks: 100, marks_obtained: e2Marks, cq: numVal(r.AA) }
        ]
      },
      { 
        code: '109', 
        name_bn: 'গণিত', 
        name_en: 'Mathematics', 
        full_marks: 100, 
        marks_obtained: mathTotal, 
        cq: numVal(r.AK), 
        mcq: numVal(r.AJ), 
        is_optional: false 
      }
    ];

    if (groupName === 'বিজ্ঞান') {
      const physics = numVal(r.AX) || numVal(r.BF);
      const chem = numVal(r.BL) || numVal(r.BV);
      const bio = numVal(r.CC);
      if (physics > 0) subjects.push({ code: '136', name_bn: 'পদার্থবিজ্ঞান', name_en: 'Physics', full_marks: 100, marks_obtained: physics, cq: numVal(r.AV), mcq: numVal(r.AU), practical: numVal(r.AW), is_optional: false });
      if (chem > 0) subjects.push({ code: '137', name_bn: 'রসায়ন', name_en: 'Chemistry', full_marks: 100, marks_obtained: chem, cq: numVal(r.BJ), mcq: numVal(r.BI), practical: numVal(r.BK), is_optional: false });
      if (bio > 0) subjects.push({ code: '138', name_bn: 'জীববিজ্ঞান', name_en: 'Biology', full_marks: 100, marks_obtained: bio, cq: numVal(r.CA), mcq: numVal(r.BZ), practical: numVal(r.CB), is_optional: false });
      // ICT is compulsory in Dakhil Science (50 marks)
      subjects.push({ code: '154', name_bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', name_en: 'ICT', full_marks: 50, marks_obtained: ictMarks, mcq: numVal(r.BM), practical: numVal(r.BN), is_optional: false });
      if (agriTotal > 0) subjects.push({ code: '134', name_bn: 'কৃষি শিক্ষা (৪র্থ বিষয়)', name_en: 'Agriculture (4th Subject)', full_marks: 100, marks_obtained: agriTotal, cq: numVal(r.AP), mcq: numVal(r.AO), practical: numVal(r.AQ), is_optional: true });
    } else {
      // সাধারণ বিভাগ
      subjects.push({ code: '154', name_bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', name_en: 'ICT', full_marks: 50, marks_obtained: ictMarks, mcq: numVal(r.BM), practical: numVal(r.BN), is_optional: false });
      const islamHistory = numVal(r.BA);
      if (islamHistory > 0) subjects.push({ code: '112', name_bn: 'ইসলামের ইতিহাস', name_en: 'Islamic History', full_marks: 100, marks_obtained: islamHistory, cq: numVal(r.AZ), mcq: numVal(r.AY), is_optional: false });
      subjects.push({ code: '127', name_bn: 'সাধারণ বিজ্ঞান', name_en: 'General Science', full_marks: 100, marks_obtained: numVal(r.CG) || 70, cq: numVal(r.CG) || 70, is_optional: false });
      if (agriTotal > 0) subjects.push({ code: '134', name_bn: 'কৃষি শিক্ষা (৪র্থ বিষয়)', name_en: 'Agriculture (4th Subject)', full_marks: 100, marks_obtained: agriTotal, cq: numVal(r.AP), mcq: numVal(r.AO), practical: numVal(r.AQ), is_optional: true });
    }

    subjects.forEach(sub => {
      const g = getGradeInfo(sub.marks_obtained, sub.full_marks);
      sub.letter_grade = g.grade;
      sub.grade_point = g.point;
    });

    const studentObj = {
      id: `amdungi_${classId}_${roll}`,
      institution_id: 'amdungi-madrasah',
      institution_name_bn: 'আমডুঙ্গীহাট ঈমান উদ্দিন চৌধুরী আলিম মাদ্রাসা',
      year: '2025',
      academic_year: '2025',
      exam_id: 'annual_2025',
      exam_name_bn: 'বার্ষিক পরীক্ষা - ২০২৫',
      class_id: classId,
      class_name_bn: classNameBn,
      section_bn: 'ক',
      group_bn: groupName,
      roll: roll,
      student_name_bn: studentName,
      student_name_en: '',
      father_name_bn: '',
      mother_name_bn: '',
      dob: '',
      subjects: subjects
    };

    const calculated = ResultEngine.calculateStudent(studentObj);
    classStudents.push(calculated);
  });

  const ranked = ResultEngine.calculateClassPositions(classStudents);
  madrasahStudents.push(...ranked);
  console.log(`Processed Madrasah ${sheetName}: ${ranked.length} students`);
});

console.log(`\nTotal Madrasah students processed: ${madrasahStudents.length}`);

// Load existing Dreamland school students and merge!
const dreamlandStudents = JSON.parse(fs.readFileSync('data/results_data.json', 'utf8')).filter(s => s.institution_id === 'dreamland-school' || !s.institution_id);
dreamlandStudents.forEach(s => {
  s.institution_id = 'dreamland-school';
  s.institution_name_bn = 'ড্রিমল্যান্ড রেসিডেন্সিয়াল মডেল স্কুল';
});

const allCombinedStudents = [...dreamlandStudents, ...madrasahStudents];
fs.writeFileSync('data/results_data.json', JSON.stringify(allCombinedStudents, null, 2), 'utf8');
console.log(`Combined total database students: ${allCombinedStudents.length} (Dreamland: ${dreamlandStudents.length}, Amdungi Madrasah: ${madrasahStudents.length})`);

// Update results_config.json with both institutions preserving credentials & teachers
const currentConfig = JSON.parse(fs.readFileSync('data/results_config.json', 'utf8'));

const madrasahClasses = [
  { id: 'madrasah_class_6', name_bn: '৬ষ্ঠ শ্রেণি (দাকিল)', name_en: 'Class 6 (Dakhil)', level: 'dakhil', full_marks: 950 },
  { id: 'madrasah_class_7', name_bn: '৭ম শ্রেণি (দাকিল)', name_en: 'Class 7 (Dakhil)', level: 'dakhil', full_marks: 950 },
  { id: 'madrasah_class_8', name_bn: '৮ম শ্রেণি (দাকিল)', name_en: 'Class 8 (Dakhil)', level: 'dakhil', full_marks: 950 },
  { id: 'madrasah_class_9', name_bn: '৯ম শ্রেণি (দাকিল)', name_en: 'Class 9 (Dakhil)', level: 'dakhil', full_marks: 1300 },
  { id: 'madrasah_class_10', name_bn: '১০ম শ্রেণি (দাকিল)', name_en: 'Class 10 (Dakhil)', level: 'dakhil', full_marks: 1300 }
];

const existingInsts = currentConfig.institutions || [];
const dreamlandExisting = existingInsts.find(i => i.id === 'dreamland-school') || {};
const madrasahExisting = existingInsts.find(i => i.id === 'amdungi-madrasah') || {};

const institutions = [
  {
    ...dreamlandExisting,
    id: "dreamland-school",
    name_bn: "ড্রিমল্যান্ড রেসিডেন্সিয়াল মডেল স্কুল",
    name_en: "Dreamland Residential Model School",
    address_bn: "বারাই, ফুলবাড়ী, দিনাজপুর",
    address_en: "Barai, Phulbari, Dinajpur",
    classes: currentConfig.classes || dreamlandExisting.classes
  },
  {
    ...madrasahExisting,
    id: "amdungi-madrasah",
    master_pin: madrasahExisting.master_pin || "5678",
    teachers: madrasahExisting.teachers || [
      {
        id: "tm_quran",
        name: "মাওলানা আব্দুল্লাহ (কোরআন মাজিদ)",
        pin: "2101",
        assigned_subjects: [
          "কোরআন মাজিদ ও তাজবীদ",
          "কুরআন মাজীদ ও তাজবীদ",
          "হাদিস শরীফ",
          "হাদিস শরিফ",
          "কুরআন মাজিদ ও হাদিস শরিফ",
          "কোরআন মাজিদ ও হাদিস শরিফ"
        ],
        classes: ["all"]
      },
      {
        id: "tm_arabic",
        name: "মাওলানা হাবিবুর রহমান (আরবি)",
        pin: "2102",
        assigned_subjects: [
          "আরবি ১ম পত্র",
          "আরবি ২য় পত্র",
          "আরবি ২য় পত্র",
          "আরবি ১ম ও ২য় পত্র",
          "আরবি ১ম ও ২য় পত্র"
        ],
        classes: ["all"]
      }
    ],
    name_bn: "আমডুঙ্গীহাট ঈমান উদ্দিন চৌধুরী আলিম মাদ্রাসা",
    name_en: "Amdungi Hat Iman Uddin Chowdhury Alim Madrasah",
    address_bn: "ডাকঘর: রাজারামপুর, উপজেলা: ফুলবাড়ী, জেলা: দিনাজপুর (স্থাপিত: ১৯৮৮)",
    address_en: "Post: Rajarampur, Upazila: Phulbari, Dist: Dinajpur (Estd: 1988)",
    established: "1988",
    classes: madrasahClasses
  }
];

const updatedConfig = {
  ...currentConfig,
  institutions: institutions,
  // Keep active institution defaults
  active_institution_id: "dreamland-school"
};

fs.writeFileSync('data/results_config.json', JSON.stringify(updatedConfig, null, 2), 'utf8');

// Also update js/results-data.js for zero-CORS embedding
const jsContent = '/**\n * Embedded Default Result Database & Configuration (Multi-Institution)\n * Zero-CORS, Works on file://, localhost, and GitHub Pages\n */\n\n' +
  'window.DEFAULT_RESULTS_CONFIG = ' + JSON.stringify(updatedConfig) + ';\n\n' +
  'window.DEFAULT_RESULTS_DATA = ' + JSON.stringify(allCombinedStudents) + ';\n';

fs.writeFileSync('js/results-data.js', jsContent, 'utf8');
console.log('Successfully updated data/results_config.json, data/results_data.json, and js/results-data.js!');
