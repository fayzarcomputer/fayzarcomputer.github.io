/**
 * Fayzar Publishing Studio - Document Classifier & Parser
 * Accurately classifies text and extracts structural metadata.
 */

(function(global) {
  'use strict';

  const DocClassifier = {
    DOC_TYPES: {
      EXAM_CQ: 'EXAM_CQ',
      EXAM_MCQ: 'EXAM_MCQ',
      EXAM_MATH: 'EXAM_MATH',
      STAMP_DEED: 'STAMP_DEED',
      GOVT_APP: 'GOVT_APP',
      PROTTOYON: 'PROTTOYON',
      OFFICE_PAD: 'OFFICE_PAD',
      ROUTINE: 'ROUTINE',
      CV_RESUME: 'CV_RESUME',
      GENERAL: 'GENERAL'
    },

    classify(text) {
      if (!text || typeof text !== 'string') return { type: this.DOC_TYPES.GENERAL, confidence: 0 };
      const t = text.trim();

      // Keyword & Pattern Scoring
      let cqScore = 0;
      let mcqScore = 0;
      let stampScore = 0;
      let appScore = 0;
      let certScore = 0;
      let padScore = 0;
      let routineScore = 0;

      // If document contains Creative Questions (সৃজনশীল), it is a full CQ paper (which may include MCQ sections)
      if (/সৃজনশীল/i.test(t)) {
        cqScore += 30;
      } else if (/বহুনির্বাচনি|বহুনির্বাচনী|নৈর্ব্যক্তিক|নৈর্ব¨|নৈর্ব|MCQ|সঠিক উত্তর/i.test(t)) {
        mcqScore += 25; // Pure MCQ paper
      }

      if (/ক\.\s*[^\n]+\s*খ\.\s*[^\n]+\s*গ\./.test(t) && !/সৃজনশীল/.test(t)) {
        cqScore += 8;
      }
      if (/শ্রেণি|বিষয়|সময়|পূর্ণমান|পরীক্ষা/.test(t)) { cqScore += 2; mcqScore += 2; }
      if (/[\u09E7-\u09EF\d]+\s*[+\-xX×=]\s*[\u09E7-\u09EF\d]+/.test(t)) cqScore += 3;

      // Count MCQ option clusters if not already determined by সৃজনশীল
      if (!/সৃজনশীল/.test(t)) {
        const mcqClusterMatches = t.match(/[ক-ঘ][\)\.]\s+[^\n]+[ক-ঘ][\)\.]/g);
        if (mcqClusterMatches && mcqClusterMatches.length >= 3) {
          mcqScore += Math.min(mcqClusterMatches.length * 2, 20);
        }
      }

      // Stamp patterns
      if (/৩০০|তিনশত|স্ট্যাম্প|অঙ্গীকার\s*নামা|বায়নানামা|চুক্তিপত্র|তফসিল|মৌজা|খতিয়ান|দাগ\s*নং/.test(t)) stampScore += 5;
      if (/১ম\s*পক্ষ|২য়\s*পক্ষ|প্রথম\s*পক্ষ|দ্বিতীয়\s*পক্ষ|লিখিতং|বরাবর/i.test(t)) stampScore += 3;

      // Application patterns
      if (/বরাবর[,:\s]/.test(t) && /বিষয়[:\s]/.test(t)) appScore += 6;
      if (/বিনীত\s*নিবেদন|মহোদয়|জনাব|অতএব,\s*বিনীত|নিবেদক/i.test(t)) appScore += 4;

      // Certificate patterns
      if (/প্রত্যয়নপত্র|অভিজ্ঞতার\s*সনদ|প্রশংসাপত্র|এই\s*মর্মে\s*প্রত্যয়ন|ছাড়পত্র/.test(t)) certScore += 7;

      // Pad patterns
      if (/মেসার্স|প্রোঃ|মোবাইলঃ|সূত্র[:\s\-]|বিসমিল্লাহির/i.test(t) && !/বরাবর/.test(t)) padScore += 5;

      // Routine patterns
      if (/ক্লাস\s*রুটিন|সময়সূচী|পিরিয়ড|১ম-ঘণ্টা|১ম\s*ঘণ্টা/.test(t)) routineScore += 6;

      const scores = [
        { type: this.DOC_TYPES.EXAM_CQ, score: cqScore },
        { type: this.DOC_TYPES.EXAM_MCQ, score: mcqScore },
        { type: this.DOC_TYPES.STAMP_DEED, score: stampScore },
        { type: this.DOC_TYPES.GOVT_APP, score: appScore },
        { type: this.DOC_TYPES.PROTTOYON, score: certScore },
        { type: this.DOC_TYPES.OFFICE_PAD, score: padScore },
        { type: this.DOC_TYPES.ROUTINE, score: routineScore }
      ];

      scores.sort((a, b) => b.score - a.score);

      if (scores[0].score >= 4) {
        return { type: scores[0].type, confidence: scores[0].score, allScores: scores };
      }

      return { type: this.DOC_TYPES.GENERAL, confidence: 1, allScores: scores };
    },

    extractMetadata(text, type) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const meta = {
        title: '',
        subtitle: '',
        institute: '',
        examName: '',
        subject: '',
        className: '',
        time: '',
        marks: '',
        date: '',
        memoNo: '',
        firstParty: '',
        secondParty: '',
        subjectText: ''
      };

      if (!lines.length) return meta;

      // Common extraction
      for (const line of lines.slice(0, 10)) {
        if (/স্কুল|কলেজ|মাদরাসা|বিদ্যালয়|একাডেমী|প্রতিষ্ঠান|মসজিদ|ট্রেডার্স|সমিতি/i.test(line) && !meta.institute) {
          meta.institute = line;
        }
        if (/পরীক্ষা/i.test(line) && !meta.examName) {
          meta.examName = line;
        }
        if (/শ্রেণি[ঃ:]\s*([^\s;]+)/.test(line) && !meta.className) {
          meta.className = line.match(/শ্রেণি[ঃ:]\s*([^\s;]+)/)[1];
        }
        if (/বিষয়[ঃ:]\s*([^\s;]+)/.test(line) && !meta.subject) {
          meta.subject = line.match(/বিষয়[ঃ:]\s*([^\s;]+)/)[1];
        }
        if (/সময়[ঃ:\-]\s*([^\n;]+?)(?:পূর্ণমান|মান|$)/.test(line) && !meta.time) {
          meta.time = line.match(/সময়[ঃ:\-]\s*([^\n;]+?)(?:পূর্ণমান|মান|$)/)[1].trim();
        }
        if (/(?:পূর্ণমান|মান)[ঃ:\-]\s*([\u09E6-\u09EF\d]+)/.test(line) && !meta.marks) {
          meta.marks = line.match(/(?:পূর্ণমান|মান)[ঃ:\-]\s*([\u09E6-\u09EF\d]+)/)[1].trim();
        }
        if (/তারিখ[ঃ:]\s*([^\n]+)/.test(line) && !meta.date) {
          meta.date = line.match(/তারিখ[ঃ:]\s*([^\n]+)/)[1].trim();
        }
        if (/বিষয়[ঃ:]\s*([^\n]+)/.test(line) && !meta.subjectText) {
          meta.subjectText = line.match(/বিষয়[ঃ:]\s*([^\n]+)/)[1].trim();
        }
      }

      return meta;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DocClassifier;
  if (typeof window !== 'undefined') window.DocClassifier = DocClassifier;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
