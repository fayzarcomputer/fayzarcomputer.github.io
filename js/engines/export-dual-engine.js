/**
 * Fayzar Publishing Studio - Multi-Format Export Engine v4.0
 * Supports:
 *  1. Word 2003 (.doc) - বিজয় ৫০ (SutonnyMJ ANSI RTF)
 *  2. Word 2003 (.doc) - ইউনিকোড (Kalpurush Unicode RTF with \uN? escapes)
 *  3. আধুনিক Word (.docx) - ইউনিকোড (Word 2007-2024 / Office 365 OpenXML)
 *  4. আধুনিক Word (.docx) - বিজয় ৫০ (Word 2007-2024 / Office 365 SutonnyMJ)
 *  5. ভেক্টর PDF / প্রিন্ট (Vector PDF Browser Engine)
 */

(function(global) {
  'use strict';

  const ExportDualEngine = {

    /**
     * Helper to determine if target font is Bijoy (SutonnyMJ) or Unicode (Kalpurush).
     */
    isBijoyFont(options = {}) {
      if (!options || !options.font) return false; // default to Unicode unless specified
      const f = String(options.font).toLowerCase();
      return f.includes('bijoy') || f.includes('sutonny');
    },

    /**
     * Helper to convert Unicode Bengali text to Bijoy ANSI (SutonnyMJ).
     */
    toBijoy(text) {
      if (!text) return '';
      let engine = null;
      if (typeof global !== 'undefined' && global.BanglaConverter) {
        engine = global.BanglaConverter;
      } else if (typeof window !== 'undefined' && window.BanglaConverter) {
        engine = window.BanglaConverter;
      } else if (typeof require === 'function') {
        try {
          const fs = require('fs');
          const path = require('path');
          const vm = require('vm');
          const p = path.resolve(__dirname, '../bangla-converter-engine.js');
          if (fs.existsSync(p)) {
            const code = fs.readFileSync(p, 'utf8');
            const sandbox = { window: {}, console: console };
            vm.createContext(sandbox);
            vm.runInContext(code, sandbox);
            engine = sandbox.BanglaConverter || sandbox.window.BanglaConverter;
          }
        } catch(e) {}
      }
      return engine ? engine.unicodeToBijoy(String(text)) : String(text);
    },

    /**
     * Escapes text for Bijoy ANSI RTF.
     */
    escapeRtf(text) {
      if (!text) return '';
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code < 128) {
          if (text[i] === '\\') out += '\\\\';
          else if (text[i] === '{') out += '\\{';
          else if (text[i] === '}') out += '\\}';
          else out += text[i];
        } else {
          out += '\\u' + code + '?';
        }
      }
      return out;
    },

    /**
     * Escapes text for Unicode RTF (Standard 16-bit signed escapes for Word 2003-365).
     */
    escapeUnicodeRtf(text) {
      if (!text) return '';
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code < 128) {
          if (text[i] === '\\') out += '\\\\';
          else if (text[i] === '{') out += '\\{';
          else if (text[i] === '}') out += '\\}';
          else out += text[i];
        } else {
          const signed = code > 32767 ? code - 65536 : code;
          out += '\\u' + signed + '?';
        }
      }
      return out;
    },

    /**
     * Formats text for RTF based on font option (Bijoy vs Unicode).
     */
    formatRtfText(text, options = {}) {
      if (!text) return '';
      if (this.isBijoyFont(options)) {
        return this.escapeRtf(this.toBijoy(text));
      } else {
        return this.escapeUnicodeRtf(text);
      }
    },

    /**
     * Escapes text for OpenXML XML nodes.
     */
    xmlEscape(str) {
      if (!str) return '';
      return String(str)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    },

    /**
     * Formats text for OpenXML DOCX based on font option.
     */
    formatDocxText(text, options = {}) {
      if (!text) return '';
      const isBijoy = this.isBijoyFont(options);
      const txt = isBijoy ? this.toBijoy(text) : String(text);
      return this.xmlEscape(txt);
    },

    // -------------------------------------------------------------------------
    // PRIMARY EXPORT DISPATCHER (Word 2003 .doc / Modern .docx)
    // -------------------------------------------------------------------------

    /**
     * Main entry point for Word documents.
     * @param {string} rawText
     * @param {string} docType
     * @param {Object} options - { font: 'bijoy'|'unicode', format: 'doc'|'docx', ... }
     * @returns {Blob|Promise<Blob>}
     */
    generateWordDoc(rawText, docType = 'EXAM_CQ', options = {}) {
      const format = (options.format || 'doc').toLowerCase();
      if (format === 'docx') {
        return this.generateModernDocx(rawText, docType, options);
      }
      return this.generateLegacyDoc(rawText, docType, options);
    },

    /**
     * Generates Word 2003 (.doc) binary/RTF Blob.
     */
    generateLegacyDoc(rawText, docType = 'EXAM_CQ', options = {}) {
      let qEngine = this._getQuestionEngine();

      if (qEngine && (docType === 'EXAM_CQ' || docType === 'EXAM_MATH')) {
        const parsed = qEngine.parseQuestionPaper(rawText);
        const rtf = this.generateCqExamRtf(parsed, options);
        return new Blob([rtf], { type: 'application/msword' });
      }

      if (qEngine && docType === 'EXAM_MCQ') {
        const parsed = qEngine.parseQuestionPaper(rawText);
        const rtf = this.generateMcqExamRtf(parsed, options);
        return new Blob([rtf], { type: 'application/msword' });
      }

      let cEngine = this._getCertificateEngine();
      if (cEngine && docType === 'PROTTOYON') {
        const parsed = cEngine.parseCertificate(rawText);
        const rtf = this.generateCertificateRtf(parsed, options);
        return new Blob([rtf], { type: 'application/msword' });
      }

      const rtf = this.generateGenericRtf(rawText, docType, options);
      return new Blob([rtf], { type: 'application/msword' });
    },

    /**
     * Generates Modern Word (.docx) OpenXML Package.
     * Compatible with Word 2007, 2010, 2013, 2016, 2019, 2021, and Office 365.
     */
    async generateModernDocx(rawText, docType = 'EXAM_CQ', options = {}) {
      let qEngine = this._getQuestionEngine();

      if (qEngine && (docType === 'EXAM_CQ' || docType === 'EXAM_MATH')) {
        const parsed = qEngine.parseQuestionPaper(rawText);
        return await this.generateCqExamDocx(parsed, options);
      }

      if (qEngine && docType === 'EXAM_MCQ') {
        const parsed = qEngine.parseQuestionPaper(rawText);
        return await this.generateMcqExamDocx(parsed, options);
      }

      let cEngine = this._getCertificateEngine();
      if (cEngine && docType === 'PROTTOYON') {
        const parsed = cEngine.parseCertificate(rawText);
        return await this.generateCertificateDocx(parsed, options);
      }

      return await this.generateGenericDocx(rawText, docType, options);
    },

    _getQuestionEngine() {
      if (typeof global !== 'undefined' && global.QuestionEngine) return global.QuestionEngine;
      if (typeof window !== 'undefined' && window.QuestionEngine) return window.QuestionEngine;
      if (typeof require === 'function') {
        try { return require('./question-engine.js'); } catch(e){}
      }
      return null;
    },

    _getCertificateEngine() {
      if (typeof global !== 'undefined' && global.CertificateEngine) return global.CertificateEngine;
      if (typeof window !== 'undefined' && window.CertificateEngine) return window.CertificateEngine;
      if (typeof require === 'function') {
        try { return require('./certificate-engine.js'); } catch(e){}
      }
      return null;
    },

    _getJSZip() {
      if (typeof global !== 'undefined' && global.JSZip) return global.JSZip;
      if (typeof window !== 'undefined' && window.JSZip) return window.JSZip;
      if (typeof require === 'function') {
        try { return require('../jszip.min.js'); } catch(e){}
      }
      return null;
    },

    // -------------------------------------------------------------------------
    // 1. CREATIVE QUESTION (CQ) GENERATORS
    // -------------------------------------------------------------------------

    /**
     * Generates Board Standard Creative Question (CQ) Word RTF Document.
     */
    generateCqExamRtf(parsedData, options = {}) {
      const isBijoy = this.isBijoyFont(options);
      const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';

      let rtf = '{\\rtf1\\ansi\\deff0\n';
      rtf += `{\\fonttbl\n{\\f0\\fnil\\fcharset0 ${fontName};}\n{\\f1\\fnil\\fcharset0 Times New Roman;}\n}\n`;
      rtf += '{\\colortbl;\\red0\\green0\\blue0;}\n';

      const rightTab = 7050; // column right edge
      rtf += '\\landscape\\paperw16838\\paperh11906\\margl720\\margr720\\margt720\\margb720\\cols2\\colsx1008\n';

      if (options.skipFirstColumn) {
        rtf += '{\\column}\n';
      }

      // 1. Header Block
      const h = parsedData.header;
      if (h.institute) {
        rtf += '{\\qc\\b\\fs32\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.institute, options) + '\\par}\n';
      }
      if (h.location) {
        rtf += '{\\qc\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.location, options) + '\\par}\n';
      }
      if (h.exam) {
        rtf += '{\\qc\\b\\fs26\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.exam, options) + '\\par}\n';
      }
      if (h.classAndSubject) {
        rtf += '{\\qc\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.classAndSubject, options) + '\\par}\n';
      }
      if (h.time || h.marks || h.examType) {
        const tTxt = h.time ? this.formatRtfText('সময়: ' + h.time, options) : '';
        const mTxt = h.marks ? this.formatRtfText('পূর্ণমান: ' + h.marks, options) : '';
        if (h.examType) {
          const eTxt = this.formatRtfText(h.examType, options);
          const midX = Math.round(rightTab / 2);
          rtf += '{\\ql\\b\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0\\tqc\\tx' + midX + '\\tqr\\tx' + rightTab + ' ' + tTxt + '\\tab {\\b\\ul ' + eTxt + '}\\tab ' + mTxt + '\\par}\n';
        } else {
          rtf += '{\\ql\\b\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0\\tqr\\tx' + rightTab + ' ' + tTxt + '\\tab ' + mTxt + '\\par}\n';
        }
      }
      if (h.instructions) {
        rtf += '{\\qc\\i\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.instructions, options) + '\\par}\n';
      }
      // Divider line
      rtf += '{\\ql\\fs4\\f0\\sl100\\slmult1\\sb0\\sa40\\brdrb\\brdrs\\brdrw10\\brsp20 \\par}\n';

      // 2. Sections & Questions
      for (const sec of parsedData.sections) {
        if (sec.title) {
          rtf += '{\\qc\\b\\fs24\\f0\\sl240\\slmult1\\sb40\\sa40 ' + this.formatRtfText(sec.title, options) + '\\par}\n';
        }

        for (const q of sec.questions) {
          rtf += '{\\ql\\b\\fs24\\f0\\sl240\\slmult1\\sb30\\sa0\\li240\\fi-240 ' + this.formatRtfText(q.num + '. ' + q.text, options) + '\\par}\n';

          if (q.stimulus) {
            const stimLines = q.stimulus.split('\n').map(l => l.trim()).filter(Boolean);
            for (const sLine of stimLines) {
              rtf += '{\\ql\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0\\li240 ' + this.formatRtfText(sLine, options) + '\\par}\n';
            }
          }

          if (q.subQuestions && q.subQuestions.length > 0) {
            for (const sub of q.subQuestions) {
              if (sub.isAlternative) {
                rtf += '{\\qc\\b\\fs24\\f0\\sl240\\slmult1\\sb20\\sa20 --- অথবা ---\\par}\n';
                continue;
              }
              const subText = this.formatRtfText(sub.label + '. ' + sub.text, options);
              const subMark = this.formatRtfText(sub.mark || '', options);
              rtf += '{\\ql\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0\\li240\\tqr\\tx' + rightTab + ' ' + subText + '\\tab ' + subMark + '\\par}\n';
            }
          }
        }
      }

      rtf += '}\n';
      return rtf;
    },

    /**
     * Generates Board Standard Creative Question (CQ) Modern Word (.docx).
     */
    async generateCqExamDocx(parsedData, options = {}) {
      const isBijoy = this.isBijoyFont(options);
      const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';
      const rightTabPos = 7050;

      let bodyXml = '';

      if (options.skipFirstColumn) {
        bodyXml += '<w:p><w:r><w:br w:type="column"/></w:r></w:p>';
      }

      // Header Block
      const h = parsedData.header;
      if (h.institute) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.institute, options)}</w:t></w:r></w:p>`;
      }
      if (h.location) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.location, options)}</w:t></w:r></w:p>`;
      }
      if (h.exam) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.exam, options)}</w:t></w:r></w:p>`;
      }
      if (h.classAndSubject) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.classAndSubject, options)}</w:t></w:r></w:p>`;
      }
      if (h.time || h.marks || h.examType) {
        const tTxt = h.time ? this.formatDocxText('সময়: ' + h.time, options) : '';
        const mTxt = h.marks ? this.formatDocxText('পূর্ণমান: ' + h.marks, options) : '';
        const midPos = Math.round(rightTabPos / 2);

        if (h.examType) {
          const eTxt = this.formatDocxText(h.examType, options);
          bodyXml += `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/><w:tabs><w:tab w:val="center" w:pos="${midPos}"/><w:tab w:val="right" w:pos="${rightTabPos}"/></w:tabs></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${tTxt}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:b/><w:u w:val="single"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${eTxt}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${mTxt}</w:t></w:r></w:p>`;
        } else {
          bodyXml += `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/><w:tabs><w:tab w:val="right" w:pos="${rightTabPos}"/></w:tabs></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${tTxt}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${mTxt}</w:t></w:r></w:p>`;
        }
      }
      if (h.instructions) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.instructions, options)}</w:t></w:r></w:p>`;
      }

      // Divider line
      bodyXml += `<w:p><w:pPr><w:spacing w:before="0" w:after="60" w:line="100" w:lineRule="auto"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="000000"/></w:pBdr></w:pPr></w:p>`;

      // Sections & Questions
      for (const sec of parsedData.sections) {
        if (sec.title) {
          bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(sec.title, options)}</w:t></w:r></w:p>`;
        }

        for (const q of sec.questions) {
          bodyXml += `<w:p><w:pPr><w:spacing w:before="40" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="240" w:hanging="240"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(q.num + '. ' + q.text, options)}</w:t></w:r></w:p>`;

          if (q.stimulus) {
            const stimLines = q.stimulus.split('\n').map(l => l.trim()).filter(Boolean);
            for (const sLine of stimLines) {
              bodyXml += `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="240"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(sLine, options)}</w:t></w:r></w:p>`;
            }
          }

          if (q.subQuestions && q.subQuestions.length > 0) {
            for (const sub of q.subQuestions) {
              if (sub.isAlternative) {
                bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="30" w:after="30"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">--- অথবা ---</w:t></w:r></w:p>`;
                continue;
              }
              const subText = this.formatDocxText(sub.label + '. ' + sub.text, options);
              const subMark = this.formatDocxText(sub.mark || '', options);
              bodyXml += `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="240"/><w:tabs><w:tab w:val="right" w:pos="${rightTabPos}"/></w:tabs></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${subText}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${subMark}</w:t></w:r></w:p>`;
            }
          }
        }
      }

      // Landscape 2-column section
      const sectPr = `
        <w:sectPr>
          <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
          <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
          <w:cols w:num="2" w:space="1008"/>
        </w:sectPr>`;

      return await this._packageDocx(bodyXml + sectPr, fontName);
    },

    // -------------------------------------------------------------------------
    // 2. MULTIPLE CHOICE QUESTION (MCQ) GENERATORS
    // -------------------------------------------------------------------------

    renderMcqTextRtf(text, options = {}) {
      if (!text) return '';
      const isBijoy = this.isBijoyFont(options);

      let norm = text
        .replace(/(^|[\s,(])ররর(?=[\s,.)]|$)/g, '$1iii')
        .replace(/(^|[\s,(])রর(?=[\s,.)]|$)/g, '$1ii')
        .replace(/(^|[\s,(])র(?=[\s,.)]|$)/g, '$1i')
        .replace(/^ররর\./g, 'iii.')
        .replace(/^রর\./g, 'ii.')
        .replace(/^র\./g, 'i.');

      if (!isBijoy) {
        return '{\\f0 ' + this.escapeUnicodeRtf(norm) + '}';
      }

      if (!/\b(i{1,3}|iv)\b/i.test(norm)) {
        return '{\\f0 ' + this.escapeRtf(this.toBijoy(norm)) + '}';
      }

      const parts = norm.split(/\b(i{1,3}|iv)\b/i);
      let out = '';
      for (const part of parts) {
        if (/^(i{1,3}|iv)$/i.test(part)) {
          out += '{\\f1 ' + part.toLowerCase() + '}';
        } else if (part) {
          out += '{\\f0 ' + this.escapeRtf(this.toBijoy(part)) + '}';
        }
      }
      return out;
    },

    /**
     * Generates Board Standard MCQ Word RTF Document.
     */
    generateMcqExamRtf(parsedData, options = {}) {
      const isBijoy = this.isBijoyFont(options);
      const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';

      let rtf = '{\\rtf1\\ansi\\deff0\n';
      rtf += `{\\fonttbl\n{\\f0\\fnil\\fcharset0 ${fontName};}\n{\\f1\\fnil\\fcharset0 Times New Roman;}\n}\n`;
      rtf += '{\\colortbl;\\red0\\green0\\blue0;}\n';

      const marginTwips = options.margin === 0.4 ? 576 : 720;
      const pageWidth = 11906 - 2 * marginTwips;

      // Section 1: Single column for Header
      rtf += `\\paperw11906\\paperh16838\\margl${marginTwips}\\margr${marginTwips}\\margt${marginTwips}\\margb${marginTwips}\\cols1\n`;

      const h = parsedData.header;
      if (h.institute) {
        rtf += '{\\qc\\b\\fs32\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.institute, options) + '\\par}\n';
      }
      if (h.location) {
        rtf += '{\\qc\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.location, options) + '\\par}\n';
      }
      if (h.exam) {
        rtf += '{\\qc\\b\\fs26\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.exam, options) + '\\par}\n';
      }
      if (h.classAndSubject) {
        rtf += '{\\qc\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.classAndSubject, options) + '\\par}\n';
      }
      if (h.time || h.marks || h.examType) {
        const tTxt = h.time ? this.formatRtfText('সময়: ' + h.time, options) : '';
        const mTxt = h.marks ? this.formatRtfText('পূর্ণমান: ' + h.marks, options) : '';
        if (h.examType) {
          const eTxt = this.formatRtfText(h.examType, options);
          const midX = Math.round(pageWidth / 2);
          const rightX = pageWidth - 100;
          rtf += '{\\ql\\b\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0\\tqc\\tx' + midX + '\\tqr\\tx' + rightX + ' ' + tTxt + '\\tab {\\b\\ul ' + eTxt + '}\\tab ' + mTxt + '\\par}\n';
        } else {
          rtf += '{\\ql\\b\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0\\tqr\\tx' + (pageWidth - 100) + ' ' + tTxt + '\\tab ' + mTxt + '\\par}\n';
        }
      }
      if (h.instructions) {
        rtf += '{\\qc\\i\\fs22\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(h.instructions, options) + '\\par}\n';
      }
      rtf += '{\\ql\\fs4\\f0\\sl100\\slmult1\\sb0\\sa20\\brdrb\\brdrs\\brdrw10\\brsp20 \\par}\n';

      // Collect questions
      const allQuestions = [];
      for (const sec of parsedData.sections) {
        for (const q of sec.questions) allQuestions.push(q);
      }
      const N = allQuestions.length;

      let compactLines = 0;
      for (const q of allQuestions) {
        const titleLines = Math.ceil((q.num.length + 2 + q.text.length) / 38);
        compactLines += Math.max(1, titleLines);
        if (q.preContext) compactLines += q.preContext.split('\n').filter(Boolean).length;
        if (q.stimulus) compactLines += q.stimulus.split('\n').filter(Boolean).length;
        if (q.statements && q.statements.length > 0) compactLines += q.statements.length;
        if (q.options && q.options.length > 0) compactLines += 1;
      }
      let headerLines = 6;
      if (h.instructions) headerLines += Math.ceil(h.instructions.length / 75);
      const totalCompactLines = compactLines + headerLines;

      let layoutMode = options.layoutMode || 'AUTO';
      if (layoutMode === 'AUTO') {
        if (totalCompactLines > 102) layoutMode = 'C';
        else if (totalCompactLines < 70) layoutMode = 'B';
        else layoutMode = 'A';
      }

      const isTwoPage = layoutMode === 'C';
      const isTwoLineOptions = layoutMode === 'B' || isTwoPage;
      const lineMultiplier = isTwoPage ? 1.18 : (layoutMode === 'B' ? 1.20 : 1.0);
      const lineSpacingTwips = Math.round(240 * lineMultiplier);
      const lineSpacingRtf = `\\sl${lineSpacingTwips}\\slmult1`;

      // Section 2: Continuous 2 Columns
      rtf += `\\sect\\sbknone\\margl${marginTwips}\\margr${marginTwips}\\margt${marginTwips}\\margb${marginTwips}\\cols2\\colsx288\\linebetcol\n`;

      let p1End = N;
      let p1Col1End = Math.ceil(N / 2);

      if (isTwoPage) {
        if (options.splitIndex) {
          p1End = options.splitIndex;
          p1Col1End = options.col1End || Math.ceil(p1End / 2);
        } else {
          p1End = Math.min(N, 20);
          p1Col1End = Math.ceil(p1End / 2);
        }
      }

      const p1Col1Questions = allQuestions.slice(0, p1Col1End);
      const p1Col2Questions = allQuestions.slice(p1Col1End, p1End);
      const page2Questions = isTwoPage ? allQuestions.slice(p1End) : [];
      const p2Half = Math.ceil(page2Questions.length / 2);
      const page2Col1 = page2Questions.slice(0, p2Half);
      const page2Col2 = page2Questions.slice(p2Half);

      const renderQuestionsList = (questions) => {
        let block = '';
        for (const q of questions) {
          if (q.preContext) {
            const ctxLines = q.preContext.split('\n').map(l => l.trim()).filter(Boolean);
            for (const cLine of ctxLines) {
              block += `{\\ql\\b\\i\\fs24\\f0${lineSpacingRtf}\\sb20\\sa0\\li0\\fi0 ` + this.formatRtfText(cLine, options) + '\\par}\n';
            }
          }

          block += `{\\ql\\b\\fs24\\f0${lineSpacingRtf}\\sb${isTwoPage ? '10' : '0'}\\sa0\\li260\\fi-260 ` + this.formatRtfText(q.num + '. ' + q.text, options) + '\\par}\n';

          if (q.statements && q.statements.length > 0) {
            for (const stmt of q.statements) {
              block += `{\\ql\\fs24${lineSpacingRtf}\\sb0\\sa0\\li260 ` + this.renderMcqTextRtf(stmt, options) + '\\par}\n';
            }
          } else if (q.stimulus) {
            const stimLines = q.stimulus.split('\n').map(l => l.trim()).filter(Boolean);
            for (const sLine of stimLines) {
              block += `{\\ql\\b\\i\\fs24\\f0${lineSpacingRtf}\\sb0\\sa0\\li0\\fi0 ` + this.formatRtfText(sLine, options) + '\\par}\n';
            }
          }

          if (q.options && q.options.length > 0) {
            const opts = q.options;
            if (opts.length >= 4) {
              const maxLen = Math.max(...opts.map(o => o.text.length));
              const totalLen = opts.reduce((s, o) => s + o.text.length, 0);
              const isRoman = opts.every(o => /(?:^|[\s,(])(?:i{1,3}|iv|র{1,3})(?:[\s,.)]|$)/i.test(o.text));

              let o0 = '({\\f0 ' + this.formatRtfText(opts[0].label, options) + '}) ' + this.renderMcqTextRtf(opts[0].text, options);
              let o1 = '({\\f0 ' + this.formatRtfText(opts[1].label, options) + '}) ' + this.renderMcqTextRtf(opts[1].text, options);
              let o2 = '({\\f0 ' + this.formatRtfText(opts[2].label, options) + '}) ' + this.renderMcqTextRtf(opts[2].text, options);
              let o3 = '({\\f0 ' + this.formatRtfText(opts[3].label, options) + '}) ' + this.renderMcqTextRtf(opts[3].text, options);

              if (!isTwoLineOptions && (isRoman || (maxLen <= 14 && totalLen <= 48))) {
                block += `{\\ql\\fs24${lineSpacingRtf}\\sb0\\sa0\\li260\\tx1250\\tx2450\\tx3650 ` + o0 + '\\tab ' + o1 + '\\tab ' + o2 + '\\tab ' + o3 + '\\par}\n';
              } else {
                block += `{\\ql\\fs24${lineSpacingRtf}\\sb0\\sa0\\li260\\tx2450 ` + o0 + '\\tab ' + o1 + '\\par}\n';
                block += `{\\ql\\fs24${lineSpacingRtf}\\sb0\\sa${isTwoPage ? '15' : '0'}\\li260\\tx2450 ` + o2 + '\\tab ' + o3 + '\\par}\n';
              }
            } else {
              let optLine = '';
              for (let oi = 0; oi < opts.length; oi++) {
                const optRtf = '({\\f0 ' + this.formatRtfText(opts[oi].label, options) + '}) ' + this.renderMcqTextRtf(opts[oi].text, options);
                optLine += (oi > 0 ? '\\tab ' : '') + optRtf;
              }
              block += `{\\ql\\fs24${lineSpacingRtf}\\sb0\\sa0\\li260\\tx2450 ` + optLine + '\\par}\n';
            }
          }
        }
        return block;
      };

      rtf += renderQuestionsList(p1Col1Questions);

      if (isTwoPage && p1Col2Questions.length > 0) {
        rtf += `\\column\n`;
        rtf += renderQuestionsList(p1Col2Questions);
      } else if (!isTwoPage && p1Col2Questions.length > 0) {
        rtf += renderQuestionsList(p1Col2Questions);
      }

      if (isTwoPage && page2Questions.length > 0) {
        rtf += `\\page\n`;
        rtf += renderQuestionsList(page2Col1);
        rtf += `\\column\n`;
        rtf += renderQuestionsList(page2Col2);
      }

      rtf += '}\n';
      return rtf;
    },

    /**
     * Generates Board Standard MCQ Modern Word (.docx).
     */
    async generateMcqExamDocx(parsedData, options = {}) {
      const isBijoy = this.isBijoyFont(options);
      const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';
      const marginTwips = options.margin === 0.4 ? 576 : 720;
      const pageWidth = 11906 - 2 * marginTwips;

      let bodyXml = '';

      // 1. Header Block (Single Column)
      const h = parsedData.header;
      if (h.institute) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.institute, options)}</w:t></w:r></w:p>`;
      }
      if (h.location) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.location, options)}</w:t></w:r></w:p>`;
      }
      if (h.exam) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.exam, options)}</w:t></w:r></w:p>`;
      }
      if (h.classAndSubject) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.classAndSubject, options)}</w:t></w:r></w:p>`;
      }
      if (h.time || h.marks || h.examType) {
        const tTxt = h.time ? this.formatDocxText('সময়: ' + h.time, options) : '';
        const mTxt = h.marks ? this.formatDocxText('পূর্ণমান: ' + h.marks, options) : '';
        const midPos = Math.round(pageWidth / 2);
        const rightPos = pageWidth - 100;

        if (h.examType) {
          const eTxt = this.formatDocxText(h.examType, options);
          bodyXml += `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/><w:tabs><w:tab w:val="center" w:pos="${midPos}"/><w:tab w:val="right" w:pos="${rightPos}"/></w:tabs></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${tTxt}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:b/><w:u w:val="single"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${eTxt}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${mTxt}</w:t></w:r></w:p>`;
        } else {
          bodyXml += `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/><w:tabs><w:tab w:val="right" w:pos="${rightPos}"/></w:tabs></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${tTxt}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${mTxt}</w:t></w:r></w:p>`;
        }
      }
      if (h.instructions) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(h.instructions, options)}</w:t></w:r></w:p>`;
      }
      bodyXml += `<w:p><w:pPr><w:spacing w:before="0" w:after="40" w:line="100" w:lineRule="auto"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="000000"/></w:pBdr></w:pPr></w:p>`;

      // Section break to continuous 2-column layout
      bodyXml += `
        <w:p>
          <w:pPr>
            <w:sectPr>
              <w:type w:val="continuous"/>
              <w:pgSz w:w="11906" w:h="16838"/>
              <w:pgMar w:top="${marginTwips}" w:right="${marginTwips}" w:bottom="${marginTwips}" w:left="${marginTwips}"/>
              <w:cols w:num="1"/>
            </w:sectPr>
          </w:pPr>
        </w:p>`;

      // Collect all questions
      const allQuestions = [];
      for (const sec of parsedData.sections) {
        for (const q of sec.questions) allQuestions.push(q);
      }
      const N = allQuestions.length;
      const isTwoPage = N > 20 || options.layoutMode === 'C';
      const p1Split = options.splitIndex || (isTwoPage ? 20 : N);

      const renderDocxQuestion = (q) => {
        let qXml = '';
        if (q.preContext) {
          qXml += `<w:p><w:pPr><w:spacing w:before="40" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:b/><w:i/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(q.preContext, options)}</w:t></w:r></w:p>`;
        }
        qXml += `<w:p><w:pPr><w:spacing w:before="20" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="260" w:hanging="260"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(q.num + '. ' + q.text, options)}</w:t></w:r></w:p>`;

        if (q.statements && q.statements.length > 0) {
          for (const s of q.statements) {
            qXml += `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="260"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(s, options)}</w:t></w:r></w:p>`;
          }
        }

        if (q.options && q.options.length > 0) {
          const opts = q.options;
          if (opts.length >= 4) {
            const o0 = `(${this.formatDocxText(opts[0].label, options)}) ${this.formatDocxText(opts[0].text, options)}`;
            const o1 = `(${this.formatDocxText(opts[1].label, options)}) ${this.formatDocxText(opts[1].text, options)}`;
            const o2 = `(${this.formatDocxText(opts[2].label, options)}) ${this.formatDocxText(opts[2].text, options)}`;
            const o3 = `(${this.formatDocxText(opts[3].label, options)}) ${this.formatDocxText(opts[3].text, options)}`;

            qXml += `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="260"/><w:tabs><w:tab w:val="left" w:pos="2450"/></w:tabs></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${o0}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${o1}</w:t></w:r></w:p>`;
            qXml += `<w:p><w:pPr><w:spacing w:before="0" w:after="10" w:line="240" w:lineRule="auto"/><w:ind w:left="260"/><w:tabs><w:tab w:val="left" w:pos="2450"/></w:tabs></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${o2}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${o3}</w:t></w:r></w:p>`;
          } else {
            let runs = '';
            for (let oi = 0; oi < opts.length; oi++) {
              if (oi > 0) runs += '<w:r><w:tab/></w:r>';
              runs += `<w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">(${this.formatDocxText(opts[oi].label, options)}) ${this.formatDocxText(opts[oi].text, options)}</w:t></w:r>`;
            }
            qXml += `<w:p><w:pPr><w:spacing w:before="0" w:after="10" w:line="240" w:lineRule="auto"/><w:ind w:left="260"/><w:tabs><w:tab w:val="left" w:pos="2450"/></w:tabs></w:pPr>${runs}</w:p>`;
          }
        }
        return qXml;
      };

      for (let i = 0; i < allQuestions.length; i++) {
        if (isTwoPage && i === p1Split) {
          bodyXml += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
        }
        bodyXml += renderDocxQuestion(allQuestions[i]);
      }

      // Final 2-column Section Properties
      const sectPr = `
        <w:sectPr>
          <w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="${marginTwips}" w:right="${marginTwips}" w:bottom="${marginTwips}" w:left="${marginTwips}"/>
          <w:cols w:num="2" w:space="288" w:sep="1"/>
        </w:sectPr>`;

      return await this._packageDocx(bodyXml + sectPr, fontName);
    },

    // -------------------------------------------------------------------------
    // 3. CERTIFICATE / TESTIMONIAL (PROTTOYON) GENERATORS
    // -------------------------------------------------------------------------

    /**
     * Generates Institutional Letterhead Pad Certificate Word RTF Document.
     */
    generateCertificateRtf(cert, options = {}) {
      if (!cert) return '';
      const isBijoy = this.isBijoyFont(options);
      const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';

      let rtf = '{\\rtf1\\ansi\\deff0\n';
      rtf += `{\\fonttbl\n{\\f0\\fnil\\fcharset0 ${fontName};}\n{\\f1\\fnil\\fcharset0 Times New Roman;}\n}\n`;
      rtf += '{\\colortbl;\\red0\\green0\\blue0;}\n';

      const pageWidth = 11906 - 1728; // 10178 twips
      rtf += '\\paperw11906\\paperh16838\\margl864\\margr864\\margt864\\margb720\\cols1\n';

      if (cert.institute) {
        rtf += '{\\qc\\b\\fs50\\f0\\sl360\\slmult1\\sb0\\sa40 ' + this.formatRtfText(cert.institute, options) + '\\par}\n';
      }
      if (cert.location) {
        rtf += '{\\qc\\fs28\\f0\\sl260\\slmult1\\sb0\\sa20 ' + this.formatRtfText(cert.location, options) + '\\par}\n';
      }
      if (cert.details) {
        rtf += '{\\qc\\fs24\\f0\\sl240\\slmult1\\sb0\\sa40 ' + this.formatRtfText(cert.details, options) + '\\par}\n';
      }

      rtf += '{\\ql\\fs4\\f0\\sl100\\slmult1\\sb0\\sa40\\brdrb\\brdrdb\\brdrw20\\brsp40 \\par}\n';

      const memoText = cert.memoNo ? this.formatRtfText('স্মারক নং: ' + cert.memoNo, options) : this.formatRtfText('স্মারক নং: ........................................', options);
      const dateText = cert.date ? this.formatRtfText('তারিখ: ' + cert.date, options) : this.formatRtfText('তারিখ: ........................................', options);
      rtf += '{\\ql\\fs26\\f0\\sl280\\slmult1\\sb40\\sa140\\tqr\\tx' + pageWidth + ' ' + memoText + '\\tab ' + dateText + '\\par}\n';

      if (cert.title) {
        rtf += '{\\qc\\b\\fs36\\f0\\sl360\\slmult1\\sb240\\sa240\\ul ' + this.formatRtfText(cert.title, options) + '\\ulnone\\par}\n';
      }

      for (const p of cert.paragraphs) {
        rtf += '{\\qj\\fs30\\sl440\\slmult1\\sb100\\sa140\\fi720 ' + this.formatRtfText(p, options) + '\\par}\n';
      }

      rtf += '{\\ql\\fs12\\f0\\sl200\\slmult1\\sb240\\sa0 \\par}\n';

      const sigIndent = pageWidth - 3600;
      if (cert.signatory && cert.signatory.length > 0) {
        for (let i = 0; i < cert.signatory.length; i++) {
          const s = cert.signatory[i];
          const isBold = i === 0 || i === 1;
          const boldFlag = isBold ? '\\b' : '';
          rtf += '{\\ql\\fs26\\f0\\sl260\\slmult1\\sb0\\sa20\\li' + sigIndent + ' ' + boldFlag + ' ' + this.formatRtfText(s, options) + '\\par}\n';
        }
      } else {
        rtf += '{\\ql\\b\\fs26\\f0\\sl260\\slmult1\\sb0\\sa20\\li' + sigIndent + ' ' + this.formatRtfText('স্বাক্ষর ও সিলমোহর', options) + '\\par}\n';
      }

      rtf += '}\n';
      return rtf;
    },

    /**
     * Generates Institutional Letterhead Pad Certificate Modern Word (.docx).
     */
    async generateCertificateDocx(cert, options = {}) {
      if (!cert) return null;
      const isBijoy = this.isBijoyFont(options);
      const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';
      const pageWidth = 10178;

      let bodyXml = '';

      if (cert.institute) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="360" w:lineRule="auto" w:before="0" w:after="40"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="50"/><w:szCs w:val="50"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(cert.institute, options)}</w:t></w:r></w:p>`;
      }
      if (cert.location) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="260" w:lineRule="auto" w:before="0" w:after="20"/></w:pPr><w:r><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(cert.location, options)}</w:t></w:r></w:p>`;
      }
      if (cert.details) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="40"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(cert.details, options)}</w:t></w:r></w:p>`;
      }

      // Pad divider double border
      bodyXml += `<w:p><w:pPr><w:spacing w:before="0" w:after="80" w:line="100" w:lineRule="auto"/><w:pBdr><w:bottom w:val="double" w:sz="12" w:space="3" w:color="000000"/></w:pBdr></w:pPr></w:p>`;

      const memoText = cert.memoNo ? this.formatDocxText('স্মারক নং: ' + cert.memoNo, options) : this.formatDocxText('স্মারক নং: ........................................', options);
      const dateText = cert.date ? this.formatDocxText('তারিখ: ' + cert.date, options) : this.formatDocxText('তারিখ: ........................................', options);
      bodyXml += `<w:p><w:pPr><w:spacing w:line="280" w:lineRule="auto" w:before="40" w:after="140"/><w:tabs><w:tab w:val="right" w:pos="${pageWidth}"/></w:tabs></w:pPr><w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve">${memoText}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve">${dateText}</w:t></w:r></w:p>`;

      if (cert.title) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:line="360" w:lineRule="auto" w:before="240" w:after="240"/></w:pPr><w:r><w:rPr><w:b/><w:u w:val="single"/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(cert.title, options)}</w:t></w:r></w:p>`;
      }

      for (const p of cert.paragraphs) {
        bodyXml += `<w:p><w:pPr><w:jc w:val="both"/><w:ind w:firstLine="720"/><w:spacing w:line="440" w:lineRule="auto" w:before="100" w:after="140"/></w:pPr><w:r><w:rPr><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(p, options)}</w:t></w:r></w:p>`;
      }

      const sigIndent = pageWidth - 3600;
      if (cert.signatory && cert.signatory.length > 0) {
        for (let i = 0; i < cert.signatory.length; i++) {
          const s = cert.signatory[i];
          const isBold = i === 0 || i === 1;
          const boldXml = isBold ? '<w:b/>' : '';
          bodyXml += `<w:p><w:pPr><w:ind w:left="${sigIndent}"/><w:spacing w:line="260" w:lineRule="auto" w:before="0" w:after="20"/></w:pPr><w:r><w:rPr>${boldXml}<w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(s, options)}</w:t></w:r></w:p>`;
        }
      }

      const sectPr = `
        <w:sectPr>
          <w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="864" w:right="864" w:bottom="720" w:left="864" w:header="720" w:footer="720" w:gutter="0"/>
          <w:cols w:num="1"/>
        </w:sectPr>`;

      return await this._packageDocx(bodyXml + sectPr, fontName);
    },

    // -------------------------------------------------------------------------
    // 4. GENERIC / DEED / APPLICATION GENERATORS
    // -------------------------------------------------------------------------

    generateGenericRtf(rawText, docType = 'GENERAL', options = {}) {
      const isBijoy = this.isBijoyFont(options);
      const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';

      let rtf = '{\\rtf1\\ansi\\deff0\n';
      rtf += `{\\fonttbl\n{\\f0\\fnil\\fcharset0 ${fontName};}\n{\\f1\\fnil\\fcharset0 Times New Roman;}\n}\n`;
      rtf += '{\\colortbl;\\red0\\green0\\blue0;}\n';

      if (docType === 'STAMP_DEED') {
        rtf += '\\paperw12240\\paperh15840\\margl1440\\margr1440\\margt5040\\margb1440\n';
      } else {
        rtf += '\\paperw11906\\paperh16838\\margl1440\\margr1440\\margt1440\\margb1440\n';
      }

      const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          rtf += '\\par\n';
          continue;
        }
        rtf += '{\\ql\\fs24\\f0\\sl240\\slmult1\\sb0\\sa0 ' + this.formatRtfText(trimmed, options) + '\\par}\n';
      }

      rtf += '}\n';
      return rtf;
    },

    async generateGenericDocx(rawText, docType = 'GENERAL', options = {}) {
      const isBijoy = this.isBijoyFont(options);
      const fontName = isBijoy ? 'SutonnyMJ' : 'Kalpurush';

      let bodyXml = '';
      const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          bodyXml += '<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto"/></w:pPr></w:p>';
          continue;
        }
        bodyXml += `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="40"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${this.formatDocxText(trimmed, options)}</w:t></w:r></w:p>`;
      }

      const topMarg = docType === 'STAMP_DEED' ? '5040' : '1440';
      const pgW = docType === 'STAMP_DEED' ? '12240' : '11906';
      const pgH = docType === 'STAMP_DEED' ? '15840' : '16838';

      const sectPr = `
        <w:sectPr>
          <w:pgSz w:w="${pgW}" w:h="${pgH}"/>
          <w:pgMar w:top="${topMarg}" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
        </w:sectPr>`;

      return await this._packageDocx(bodyXml + sectPr, fontName);
    },

    // -------------------------------------------------------------------------
    // 5. DOCX OPENXML PACKAGER (JSZip)
    // -------------------------------------------------------------------------

    async _packageDocx(bodyAndSectXml, fontName = 'Kalpurush') {
      const JSZip = this._getJSZip();
      if (!JSZip) {
        throw new Error('JSZip library is not available.');
      }

      const zip = new JSZip();

      const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

      const relsMain = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

      const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

      const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="${fontName}" w:hAnsi="${fontName}" w:cs="${fontName}"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>`;

      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
${bodyAndSectXml}
  </w:body>
</w:document>`;

      zip.file("[Content_Types].xml", contentTypes);
      zip.file("_rels/.rels", relsMain);
      zip.file("word/_rels/document.xml.rels", wordRels);
      zip.file("word/styles.xml", stylesXml);
      zip.file("word/document.xml", documentXml);

      if (typeof Blob !== 'undefined') {
        return await zip.generateAsync({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
      } else {
        return await zip.generateAsync({ type: 'nodebuffer' });
      }
    },

    // -------------------------------------------------------------------------
    // 6. VECTOR PDF / BROWSER PRINT ENGINE
    // -------------------------------------------------------------------------

    triggerPdfPrint(containerElementId, title = 'Document') {
      const el = document.getElementById(containerElementId);
      if (!el) return;

      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <script src="js/vendor/tailwindcss.js"></script>
  <link rel="stylesheet" href="css/studio.css">
  <style>
    @page {
      margin: 8mm 10mm;
      size: auto;
    }
    body {
      background: white !important;
      color: black !important;
      font-family: 'Kalpurush', 'SutonnyMJ', sans-serif;
      margin: 0 !important;
      padding: 0 !important;
    }
    .sheet-label, .word-crop-marks, .word-page-break, #word-mini-toolbar {
      display: none !important;
    }
    .paper-sheet {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-height: auto !important;
      page-break-after: always;
      break-after: page;
    }
    .paper-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .stamp-header-spacer, .qp-col-skip-box {
      border: none !important;
      background: transparent !important;
      color: transparent !important;
    }
    .stamp-header-spacer *, .qp-col-skip-box * {
      visibility: hidden !important;
    }
  </style>
</head>
<body onload="setTimeout(() => { window.focus(); window.print(); }, 250);">
  ${el.innerHTML}
</body>
</html>`);
      frameDoc.close();

      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
        } catch(e){}
      }, 60000);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = ExportDualEngine;
  if (typeof window !== 'undefined') window.ExportDualEngine = ExportDualEngine;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
