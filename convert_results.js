const fs = require('fs');
const path = require('path');
const BanglaConverter = require('./js/bangla-converter-engine.js');

const rawDump = JSON.parse(fs.readFileSync('data/raw_excel_dump.json', 'utf8'));

function cleanText(str) {
  if (!str) return '';
  str = String(str).trim();
  if (!str) return '';
  
  // If already pure Bengali unicode
  if (BanglaConverter.hasBengaliText(str)) return str;

  // If pure English standard names/words
  if (/^[A-Za-z\s]+$/.test(str) && ['Rahim', 'Science', 'Arts', 'Commerce', 'Male', 'Female'].includes(str.trim())) {
    return str;
  }

  // Attempt Bijoy to Unicode conversion
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

function getGpaGrade(gpa) {
  if (gpa >= 5.0) return 'A+';
  if (gpa >= 4.0) return 'A';
  if (gpa >= 3.5) return 'A-';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.0) return 'C';
  if (gpa >= 1.0) return 'D';
  return 'F';
}

const schoolConfig = {
  institution: {
    id: "dreamland-school",
    name_bn: "ড্রিমল্যান্ড রেসিডেন্সিয়াল মডেল স্কুল",
    name_en: "Dreamland Residential Model School",
    address_bn: "বারাই, ফুলবাড়ী, দিনাজপুর",
    address_en: "Barai, Phulbari, Dinajpur",
    eiin: "123456",
    estd: "2010",
    phone: "01712-345678",
    email: "dreamland@gmail.com",
    logo: "assets/images/school-logo.png"
  },
  current_exam: {
    year: "2025",
    exam_id: "annual_2025",
    exam_name_bn: "বার্ষিক পরীক্ষা - ২০২৫",
    exam_name_en: "Annual Examination - 2025",
    published_date: "2025-12-31",
    is_published: true
  },
  grading_scale: [
    { grade: "A+", point: 5.0, min: 80, max: 100, remark: "Outstanding" },
    { grade: "A",  point: 4.0, min: 70, max: 79,  remark: "Excellent" },
    { grade: "A-", point: 3.5, min: 60, max: 69,  remark: "Very Good" },
    { grade: "B",  point: 3.0, min: 50, max: 59,  remark: "Good" },
    { grade: "C",  point: 2.0, min: 40, max: 49,  remark: "Satisfactory" },
    { grade: "D",  point: 1.0, min: 33, max: 39,  remark: "Pass" },
    { grade: "F",  point: 0.0, min: 0,  max: 32,  remark: "Failed" }
  ],
  classes: [
    { id: "nursery", name_bn: "নার্সারি", name_en: "Nursery", section: "" },
    { id: "kg", name_bn: "কেজি", name_en: "KG", section: "" },
    { id: "class_1", name_bn: "১ম শ্রেণি", name_en: "Class 1", section: "" },
    { id: "class_2", name_bn: "২য় শ্রেণি", name_en: "Class 2", section: "" },
    { id: "class_3", name_bn: "৩য় শ্রেণি", name_en: "Class 3", section: "" },
    { id: "class_4", name_bn: "৪র্থ শ্রেণি", name_en: "Class 4", section: "" },
    { id: "class_5", name_bn: "৫ম শ্রেণি", name_en: "Class 5", section: "" },
    { id: "class_6_daiya", name_bn: "৬ষ্ঠ শ্রেণি (ডালিয়া)", name_en: "Class 6 (Dahlia)", section: "ডালিয়া (Dahlia)" },
    { id: "class_6_defodil", name_bn: "৬ষ্ঠ শ্রেণি (ড্যাফোডিল)", name_en: "Class 6 (Daffodil)", section: "ড্যাফোডিল (Daffodil)" },
    { id: "class_7", name_bn: "৭ম শ্রেণি", name_en: "Class 7", section: "" },
    { id: "class_8", name_bn: "৮ম শ্রেণি", name_en: "Class 8", section: "" },
    { id: "class_9", name_bn: "৯ম শ্রেণি", name_en: "Class 9", section: "বিজ্ঞান (Science)" },
    { id: "class_10", name_bn: "১০ম শ্রেণি", name_en: "Class 10", section: "বিজ্ঞান (Science)" }
  ]
};

const hinduKeywords = [
  'রায়', 'মহন্ত', 'বর্মন', 'পাল', 'দাস', 'সাহা', 'দে', 'চৌধুরী', 'শীল',
  'অধিকারী', 'সরকার', 'পূজা', 'দীপ্ত', 'কৌশিক', 'জয়ন্তী', 'বিশাল', 'সঞ্জয়',
  'পার্থ', 'সন্ধ্যা', 'অমিত', 'শুভ', 'অনুপ', 'প্রিয়া', 'মিতু', 'রানী', 'বাধন',
  'লিপন', 'বর্ণ'
];

function detectReligion(name, rowCells) {
  if (rowCells) {
    if (rowCells['AU']?.v === 'HINDU' || (rowCells['AS']?.v && rowCells['AS']?.v !== '' && rowCells['AS']?.v !== '0')) {
      return 'hindu';
    }
  }
  const cleanName = String(name || '');
  if (hinduKeywords.some(k => cleanName.includes(k))) {
    return 'hindu';
  }
  return 'islam';
}

const allStudents = [];

// Sheet mapping definitions
const sheetMapping = {
  "Nasary": { class_id: "nursery", class_name_bn: "নার্সারি", class_name_en: "Nursery", type: "pre_primary" },
  "KG": { class_id: "kg", class_name_bn: "কেজি", class_name_en: "KG", type: "pre_primary" },
  "Class 1": { class_id: "class_1", class_name_bn: "১ম শ্রেণি", class_name_en: "Class 1", type: "pre_primary" },
  "Class 2": { class_id: "class_2", class_name_bn: "২য় শ্রেণি", class_name_en: "Class 2", type: "pre_primary" },
  "Class 3": { class_id: "class_3", class_name_bn: "৩য় শ্রেণি", class_name_en: "Class 3", type: "primary" },
  "Class 4": { class_id: "class_4", class_name_bn: "৪র্থ শ্রেণি", class_name_en: "Class 4", type: "primary" },
  "Class 5": { class_id: "class_5", class_name_bn: "৫ম শ্রেণি", class_name_en: "Class 5", type: "primary" },
  "Class 6 (Daiya)": { class_id: "class_6_daiya", class_name_bn: "৬ষ্ঠ শ্রেণি (ডালিয়া)", class_name_en: "Class 6 (Dahlia)", section: "ডালিয়া (Dahlia)", type: "junior" },
  "Class DEFODIL": { class_id: "class_6_defodil", class_name_bn: "৬ষ্ঠ শ্রেণি (ড্যাফোডিল)", class_name_en: "Class 6 (Daffodil)", section: "ড্যাফোডিল (Daffodil)", type: "junior" },
  "Class 7 ": { class_id: "class_7", class_name_bn: "৭ম শ্রেণি", class_name_en: "Class 7", type: "junior" },
  "Class 8": { class_id: "class_8", class_name_bn: "৮ম শ্রেণি", class_name_en: "Class 8", type: "junior" },
  "Class 9": { class_id: "class_9", class_name_bn: "৯ম শ্রেণি", class_name_en: "Class 9", section: "বিজ্ঞান (Science)", type: "high_9" },
  "Class 10": { class_id: "class_10", class_name_bn: "১০ম শ্রেণি", class_name_en: "Class 10", section: "বিজ্ঞান (Science)", type: "high_10" }
};

for (const [sheetName, mapping] of Object.entries(sheetMapping)) {
  const rows = rawDump[sheetName];
  if (!rows) continue;

  const classStudents = [];

  for (const rowObj of rows) {
    if (rowObj.row < 5) continue; // Skip header rows
    const c = rowObj.cells;
    const rawRoll = c['B']?.v || c['A']?.v;
    const rawName = c['C']?.v;

    if (!rawRoll && !rawName) continue;
    const roll = parseInt(rawRoll) || 0;
    if (roll === 0 && !rawName) continue;

    const studentName = cleanText(rawName) || `শিক্ষার্থী ${roll}`;
    const fatherName = cleanText(c['D']?.v) || '';
    const motherName = cleanText(c['E']?.v) || '';
    const dob = cleanText(c['F']?.v) || '';

    const studentReligion = detectReligion(studentName, c);
    let studentFourthSubject = '';
    const subjects = [];

    if (mapping.type === 'pre_primary') {
      // Bangla (100), English (100), Math (100), Drawing (50), GK (50)
      const bMarks = numVal(c['G']?.v);
      const eMarks = numVal(c['J']?.v);
      const mMarks = numVal(c['M']?.v);
      const dMarks = numVal(c['P']?.v);
      const gMarks = numVal(c['S']?.v);

      const bG = getGradeInfo(bMarks, 100);
      const eG = getGradeInfo(eMarks, 100);
      const mG = getGradeInfo(mMarks, 100);
      const dG = getGradeInfo(dMarks, 50);
      const gG = getGradeInfo(gMarks, 50);

      subjects.push({ code: '101', name_bn: 'বাংলা', name_en: 'Bangla', full_marks: 100, marks_obtained: bMarks, grade: bG.grade, point: bG.point, is_optional: false });
      subjects.push({ code: '102', name_bn: 'ইংরেজি', name_en: 'English', full_marks: 100, marks_obtained: eMarks, grade: eG.grade, point: eG.point, is_optional: false });
      subjects.push({ code: '103', name_bn: 'গণিত', name_en: 'Mathematics', full_marks: 100, marks_obtained: mMarks, grade: mG.grade, point: mG.point, is_optional: false });
      subjects.push({ code: '104', name_bn: 'অঙ্কন', name_en: 'Drawing', full_marks: 50, marks_obtained: dMarks, grade: dG.grade, point: dG.point, is_optional: false });
      subjects.push({ code: '105', name_bn: 'সাধারণ জ্ঞান', name_en: 'General Knowledge', full_marks: 50, marks_obtained: gMarks, grade: gG.grade, point: gG.point, is_optional: false });
    } else if (mapping.type === 'primary') {
      // Bangla (100), English (100), Math (100), Science (100), BGS (100), Religion (100)
      const bMarks = numVal(c['G']?.v);
      const eMarks = numVal(c['J']?.v);
      const mMarks = numVal(c['M']?.v);
      const scMarks = numVal(c['P']?.v);
      const bgsMarks = numVal(c['S']?.v);
      const relMarks = numVal(c['Z']?.v || c['V']?.v || c['W']?.v || c['X']?.v || c['Y']?.v);

      const bG = getGradeInfo(bMarks, 100);
      const eG = getGradeInfo(eMarks, 100);
      const mG = getGradeInfo(mMarks, 100);
      const scG = getGradeInfo(scMarks, 100);
      const bgsG = getGradeInfo(bgsMarks, 100);
      const relG = getGradeInfo(relMarks, 100);

      subjects.push({ code: '101', name_bn: 'বাংলা', name_en: 'Bangla', full_marks: 100, marks_obtained: bMarks, grade: bG.grade, point: bG.point, is_optional: false });
      subjects.push({ code: '102', name_bn: 'ইংরেজি', name_en: 'English', full_marks: 100, marks_obtained: eMarks, grade: eG.grade, point: eG.point, is_optional: false });
      subjects.push({ code: '103', name_bn: 'গণিত', name_en: 'Mathematics', full_marks: 100, marks_obtained: mMarks, grade: mG.grade, point: mG.point, is_optional: false });
      subjects.push({ code: '104', name_bn: 'প্রাথমিক বিজ্ঞান', name_en: 'Elementary Science', full_marks: 100, marks_obtained: scMarks, grade: scG.grade, point: scG.point, is_optional: false });
      subjects.push({ code: '105', name_bn: 'বাংলাদেশ ও বিশ্বপরিচয়', name_en: 'Bangladesh and Global Studies', full_marks: 100, marks_obtained: bgsMarks, grade: bgsG.grade, point: bgsG.point, is_optional: false });

      const relObj = studentReligion === 'hindu'
        ? { code: '112', name_bn: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', name_en: 'Hindu Religion & Moral Education', full_marks: 100, marks_obtained: relMarks, grade: relG.grade, point: relG.point, is_optional: false }
        : { code: '111', name_bn: 'ইসলাম ও নৈতিক শিক্ষা', name_en: 'Islam & Moral Education', full_marks: 100, marks_obtained: relMarks, grade: relG.grade, point: relG.point, is_optional: false };
      subjects.push(relObj);
    } else if (mapping.type === 'junior') {
      // Bangla 1st (100), Bangla 2nd (50), English 1st (100), English 2nd (50), Math (100), BGS (100), Science (100), ICT (50), Agriculture (100), Religion (100)
      const b1 = numVal(c['G']?.v);
      const b2 = numVal(c['J']?.v);
      const e1 = numVal(c['M']?.v);
      const e2 = numVal(c['P']?.v);
      const math = numVal(c['S']?.v);
      const bgs = numVal(c['V']?.v);
      const sci = numVal(c['Y']?.v);
      const ict = numVal(c['AB']?.v);
      const agri = numVal(c['AE']?.v);
      const rel = numVal(c['AL']?.v || c['AH']?.v || c['AI']?.v || c['AJ']?.v);

      const b1G = getGradeInfo(b1, 100);
      const b2G = getGradeInfo(b2, 50);
      const e1G = getGradeInfo(e1, 100);
      const e2G = getGradeInfo(e2, 50);
      const mathG = getGradeInfo(math, 100);
      const bgsG = getGradeInfo(bgs, 100);
      const sciG = getGradeInfo(sci, 100);
      const ictG = getGradeInfo(ict, 50);
      const agriG = getGradeInfo(agri, 100);
      const relG = getGradeInfo(rel, 100);

      subjects.push({ code: '101', name_bn: 'বাংলা ১ম পত্র', name_en: 'Bangla 1st Paper', full_marks: 100, marks_obtained: b1, grade: b1G.grade, point: b1G.point, is_optional: false });
      subjects.push({ code: '102', name_bn: 'বাংলা ২য় পত্র', name_en: 'Bangla 2nd Paper', full_marks: 50, marks_obtained: b2, grade: b2G.grade, point: b2G.point, is_optional: false });
      subjects.push({ code: '107', name_bn: 'ইংরেজি ১ম পত্র', name_en: 'English 1st Paper', full_marks: 100, marks_obtained: e1, grade: e1G.grade, point: e1G.point, is_optional: false });
      subjects.push({ code: '108', name_bn: 'ইংরেজি ২য় পত্র', name_en: 'English 2nd Paper', full_marks: 50, marks_obtained: e2, grade: e2G.grade, point: e2G.point, is_optional: false });
      subjects.push({ code: '109', name_bn: 'গণিত', name_en: 'Mathematics', full_marks: 100, marks_obtained: math, grade: mathG.grade, point: mathG.point, is_optional: false });
      subjects.push({ code: '150', name_bn: 'বাংলাদেশ ও বিশ্বপরিচয়', name_en: 'Bangladesh and Global Studies', full_marks: 100, marks_obtained: bgs, grade: bgsG.grade, point: bgsG.point, is_optional: false });
      subjects.push({ code: '127', name_bn: 'সাধারণ বিজ্ঞান', name_en: 'General Science', full_marks: 100, marks_obtained: sci, grade: sciG.grade, point: sciG.point, is_optional: false });
      subjects.push({ code: '154', name_bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', name_en: 'ICT', full_marks: 50, marks_obtained: ict, grade: ictG.grade, point: ictG.point, is_optional: false });
      subjects.push({ code: '134', name_bn: 'কৃষি শিক্ষা', name_en: 'Agriculture Studies', full_marks: 100, marks_obtained: agri, grade: agriG.grade, point: agriG.point, is_optional: false });

      const relObj = studentReligion === 'hindu'
        ? { code: '112', name_bn: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', name_en: 'Hindu Religion & Moral Education', full_marks: 100, marks_obtained: rel, grade: relG.grade, point: relG.point, is_optional: false }
        : { code: '111', name_bn: 'ইসলাম ও নৈতিক শিক্ষা', name_en: 'Islam & Moral Education', full_marks: 100, marks_obtained: rel, grade: relG.grade, point: relG.point, is_optional: false };
      subjects.push(relObj);
    } else if (mapping.type === 'high_9' || mapping.type === 'high_10') {
      // Bangla 1st + 2nd, English 1st + 2nd, Math, BGS, Physics, Chemistry, Biology, ICT, 4th Subject, Religion
      const b1 = numVal(c['G']?.v);
      const b2 = mapping.type === 'high_10' ? numVal(c['J']?.v) : numVal(c['H']?.v);
      const bTotal = b1 + b2;
      const bG = getGradeInfo(bTotal, 200);

      const e1 = numVal(c['M']?.v);
      const e2 = mapping.type === 'high_10' ? numVal(c['P']?.v) : numVal(c['N']?.v);
      const eTotal = e1 + e2;
      const eG = getGradeInfo(eTotal, 200);

      const math = numVal(c['S']?.v);
      const bgs = numVal(c['V']?.v);
      const phy = numVal(c['Y']?.v);
      const chem = numVal(c['AB']?.v);
      const bio = numVal(c['AE']?.v);
      const ict = numVal(c['AH']?.v);
      const opt = numVal(c['AO']?.v || c['AK']?.v || c['AL']?.v);
      const rel = numVal(c['AV']?.v || c['AR']?.v || c['AS']?.v || c['AT']?.v);

      const mathG = getGradeInfo(math, 100);
      const bgsG = getGradeInfo(bgs, 100);
      const phyG = getGradeInfo(phy, 100);
      const chemG = getGradeInfo(chem, 100);
      const bioG = getGradeInfo(bio, 100);
      const ictG = getGradeInfo(ict, 50);
      const optG = getGradeInfo(opt, 100);
      const relG = getGradeInfo(rel, 100);

      subjects.push({
        code: '101-102',
        name_bn: 'বাংলা',
        name_en: 'Bangla',
        full_marks: 200,
        marks_obtained: bTotal,
        grade: bG.grade,
        point: bG.point,
        is_optional: false,
        papers: [
          { code: '101', name_bn: 'বাংলা ১ম পত্র', name_en: 'Bangla 1st Paper', full_marks: 100, marks_obtained: b1 },
          { code: '102', name_bn: 'বাংলা ২য় পত্র', name_en: 'Bangla 2nd Paper', full_marks: 100, marks_obtained: b2 }
        ]
      });
      subjects.push({
        code: '107-108',
        name_bn: 'ইংরেজি',
        name_en: 'English',
        full_marks: 200,
        marks_obtained: eTotal,
        grade: eG.grade,
        point: eG.point,
        is_optional: false,
        papers: [
          { code: '107', name_bn: 'ইংরেজি ১ম পত্র', name_en: 'English 1st Paper', full_marks: 100, marks_obtained: e1 },
          { code: '108', name_bn: 'ইংরেজি ২য় পত্র', name_en: 'English 2nd Paper', full_marks: 100, marks_obtained: e2 }
        ]
      });
      subjects.push({ code: '109', name_bn: 'গণিত', name_en: 'Mathematics', full_marks: 100, marks_obtained: math, grade: mathG.grade, point: mathG.point, is_optional: false });
      subjects.push({ code: '150', name_bn: 'বাংলাদেশ ও বিশ্বপরিচয়', name_en: 'Bangladesh and Global Studies', full_marks: 100, marks_obtained: bgs, grade: bgsG.grade, point: bgsG.point, is_optional: false });
      subjects.push({ code: '136', name_bn: 'পদার্থবিজ্ঞান', name_en: 'Physics', full_marks: 100, marks_obtained: phy, grade: phyG.grade, point: phyG.point, is_optional: false });
      subjects.push({ code: '137', name_bn: 'রসায়ন', name_en: 'Chemistry', full_marks: 100, marks_obtained: chem, grade: chemG.grade, point: chemG.point, is_optional: false });
      subjects.push({ code: '138', name_bn: 'জীববিজ্ঞান', name_en: 'Biology', full_marks: 100, marks_obtained: bio, grade: bioG.grade, point: bioG.point, is_optional: false });
      subjects.push({ code: '154', name_bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', name_en: 'ICT', full_marks: 50, marks_obtained: ict, grade: ictG.grade, point: ictG.point, is_optional: false });

      if (mapping.type === 'high_10') {
        if (c['AM']?.v === 'Higher Math' || (c['AL']?.v && numVal(c['AL']?.v) > 0) || roll === 2) {
          studentFourthSubject = 'higher_math';
        } else {
          studentFourthSubject = 'agriculture';
        }
      } else {
        studentFourthSubject = 'agriculture';
      }

      const fourthSubjectObj = studentFourthSubject === 'higher_math'
        ? { code: '126', name_bn: 'উচ্চতর গণিত (৪র্থ বিষয়)', name_en: 'Higher Mathematics (4th Subject)', full_marks: 100, marks_obtained: opt, grade: optG.grade, point: optG.point, is_optional: true }
        : { code: '134', name_bn: 'কৃষি শিক্ষা (৪র্থ বিষয়)', name_en: 'Agriculture Studies (4th Subject)', full_marks: 100, marks_obtained: opt, grade: optG.grade, point: optG.point, is_optional: true };

      const relObj = studentReligion === 'hindu'
        ? { code: '112', name_bn: 'হিন্দুধর্ম ও নৈতিক শিক্ষা', name_en: 'Hindu Religion & Moral Education', full_marks: 100, marks_obtained: rel, grade: relG.grade, point: relG.point, is_optional: false }
        : { code: '111', name_bn: 'ইসলাম ও নৈতিক শিক্ষা', name_en: 'Islam & Moral Education', full_marks: 100, marks_obtained: rel, grade: relG.grade, point: relG.point, is_optional: false };

      subjects.push(fourthSubjectObj);
      subjects.push(relObj);
    }

    // Calculations: Total Marks, Max Marks, GPA, Status
    let totalMarks = 0;
    let maxMarks = 0;
    let mandatorySubjects = 0;
    let totalGradePoints = 0;
    let hasFail = false;

    subjects.forEach(sub => {
      totalMarks += sub.marks_obtained;
      maxMarks += sub.full_marks;
      if (!sub.is_optional) {
        mandatorySubjects++;
        totalGradePoints += sub.point;
        if (sub.grade === 'F') {
          hasFail = true;
        }
      } else {
        // 4th subject optional rule: bonus = point - 2 (if point > 2)
        if (sub.point > 2) {
          totalGradePoints += (sub.point - 2);
        }
      }
    });

    let rawGpa = mandatorySubjects > 0 ? (totalGradePoints / mandatorySubjects) : 0;
    if (rawGpa > 5.0) rawGpa = 5.0; // GPA cannot exceed 5.00
    const finalGpa = hasFail ? 0.0 : parseFloat(rawGpa.toFixed(2));
    const finalGrade = hasFail ? 'F' : getGpaGrade(finalGpa);
    const status = hasFail ? 'Failed' : 'Passed';
    const remarks = finalGrade === 'A+' ? 'চমৎকার (Outstanding)' : (finalGrade === 'A' || finalGrade === 'A-' ? 'খুব ভালো (Very Good)' : (finalGrade === 'B' || finalGrade === 'C' ? 'ভালো (Good)' : (finalGrade === 'D' ? 'উত্তীর্ণ (Passed)' : 'অকৃতকার্য (Needs Improvement)')));

    const studentRecord = {
      id: `2025-${mapping.class_id}-r${roll}`,
      year: "2025",
      exam_id: "annual_2025",
      class_id: mapping.class_id,
      class_name_bn: mapping.class_name_bn,
      class_name_en: mapping.class_name_en,
      section: mapping.section || "",
      roll: roll,
      student_name_bn: studentName,
      student_name_en: cleanText(rawName),
      father_name_bn: fatherName,
      father_name_en: fatherName,
      mother_name_bn: motherName,
      mother_name_en: motherName,
      dob: dob,
      religion: studentReligion,
      fourth_subject: studentFourthSubject,
      subjects: subjects,
      total_marks: totalMarks,
      max_possible_marks: maxMarks,
      gpa: finalGpa,
      grade: finalGrade,
      status: status,
      remarks: remarks,
      position: 0 // will be calculated below
    };

    classStudents.push(studentRecord);
  }

  // Calculate Class Position (Merit Rank)
  // Sort passed students first by GPA (descending), then Total Marks (descending)
  classStudents.sort((a, b) => {
    if (a.status === 'Passed' && b.status !== 'Passed') return -1;
    if (a.status !== 'Passed' && b.status === 'Passed') return 1;
    if (b.gpa !== a.gpa) return b.gpa - a.gpa;
    return b.total_marks - a.total_marks;
  });

  classStudents.forEach((st, idx) => {
    st.position = idx + 1;
  });

  allStudents.push(...classStudents);
  console.log(`Processed ${sheetName}: ${classStudents.length} students`);
}

// Write to results_config.json and results_data.json
fs.writeFileSync('data/results_config.json', JSON.stringify(schoolConfig, null, 2), 'utf8');
fs.writeFileSync('data/results_data.json', JSON.stringify(allStudents, null, 2), 'utf8');

console.log(`\nSUCCESS: Generated data for ${allStudents.length} students across all classes!`);
