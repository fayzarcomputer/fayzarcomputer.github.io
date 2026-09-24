/**
 * ============================================================================
 * Fayzar Layout Engine - Modern Word (.docx) OOXML Layout Builder v2.0
 * ============================================================================
 * Generates genuine, fully compliant modern Word (.docx) packages using OOXML
 * with native 2-column sections (<w:cols>), headers, tables, right-aligned marks,
 * OMML math equations, SutonnyMJ (Bijoy) or Unicode font mappings.
 *
 * FULL ENGLISH & BILINGUAL FIDELITY GUARANTEE:
 * - Pure English documents are automatically detected and kept 100% in Times New Roman.
 * - Bilingual documents keep English words, formulas & marks in Times New Roman,
 *   converting ONLY Bengali words into SutonnyMJ.
 * ============================================================================
 */

(function(global) {
  'use strict';

  class DocxLayoutBuilder {

    /**
     * Detect if the parsed AST contains any Bengali characters
     */
    static hasBengali(parsedAst) {
      const textSamples = [];
      if (parsedAst.metadata) {
        Object.values(parsedAst.metadata).forEach(v => typeof v === 'string' && textSamples.push(v));
      }
      if (parsedAst.blocks) {
        parsedAst.blocks.forEach(b => {
          if (b.text) textSamples.push(b.text);
          if (b.stimulus) textSamples.push(b.stimulus);
          if (b.subQuestions) b.subQuestions.forEach(sq => textSamples.push(sq.text));
          if (b.headers) b.headers.forEach(h => textSamples.push(h));
          if (b.rows) b.rows.forEach(r => r.forEach(c => textSamples.push(c)));
          if (b.items) b.items.forEach(it => textSamples.push(typeof it === 'string' ? it : (it.text || '')));
        });
      }
      const fullSample = textSamples.join(' ');
      if (typeof BanglaConverter !== 'undefined' && typeof BanglaConverter.hasBengaliText === 'function') {
        return BanglaConverter.hasBengaliText(fullSample);
      }
      return /[\u0980-\u09FF]/.test(fullSample);
    }

    /**
     * Escape XML characters
     */
    static esc(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    /**
     * Helper to convert text if Bijoy selected
     */
    static cvt(str, isBijoy) {
      if (!str) return '';
      if (isBijoy) {
        if (typeof BanglaConverter !== 'undefined' && typeof BanglaConverter.unicodeToBijoy === 'function') {
          return BanglaConverter.unicodeToBijoy(str);
        }
        if (typeof BanglaConverterEngine !== 'undefined' && typeof BanglaConverterEngine.convertUnicodeToBijoy === 'function') {
          return BanglaConverterEngine.convertUnicodeToBijoy(str);
        }
      }
      return str;
    }

    /**
     * Render Smart Runs supporting mixed Bengali (SutonnyMJ) and English (Times New Roman)
     */
    static renderSmartRuns(text, isBijoy, isBold = false, isItalic = false, sz = '24', isPureEnglish = false, extraRPr = '') {
      if (!text) return '';
      const esc = DocxLayoutBuilder.esc;
      const cvt = DocxLayoutBuilder.cvt;

      // Handle inline markdown bold (**bold text**)
      if (text.includes('**')) {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        let combinedXml = '';
        for (const part of parts) {
          if (!part) continue;
          if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            const innerText = part.slice(2, -2);
            combinedXml += DocxLayoutBuilder.renderSmartRuns(innerText, isBijoy, true, isItalic, sz, isPureEnglish, extraRPr);
          } else {
            combinedXml += DocxLayoutBuilder.renderSmartRuns(part, isBijoy, isBold, isItalic, sz, isPureEnglish, extraRPr);
          }
        }
        return combinedXml;
      }

      const boldTag = isBold ? '<w:b/><w:bCs/>' : '';
      const italicTag = isItalic ? '<w:i/><w:iCs/>' : '';
      const szTag = `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;

      // Clean LaTeX arrows to standard Unicode arrow
      text = text.replace(/\\rightarrow\b|\\to\b/g, '→');

      // Auto-wrap bare LaTeX \frac and \sqrt with $ if not wrapped
      text = text.replace(/(?<!\$)(?:\\frac\{[^{}]*\}\{[^{}]*\}|\\sqrt\{[^{}]*\})(?!\$)/g, '$$$&$$');

      // Math & Chemical Formula Handling ($CO_2$, $NO_2$, $O_2$, $\rightarrow$, etc.)
      const EqConv = (typeof EquationConverter !== 'undefined') ? EquationConverter : (typeof globalThis !== 'undefined' && globalThis.EquationConverter ? globalThis.EquationConverter : null);
      if (EqConv && /\$|\\frac|\\sqrt|\^|_/.test(text)) {
        const mathSegments = EqConv.splitTextAndMath(text);
        let mathXml = '';
        for (const mSeg of mathSegments) {
          if (mSeg.type === 'math') {
            let mVal = mSeg.value.trim().replace(/\\rightarrow\b|\\to\b/g, '→');
            const chemSubMatch = mVal.match(/^([a-zA-Z0-9]+)_\{?([0-9a-zA-Z]+)\}?$/);
            if (chemSubMatch) {
              const chemBase = chemSubMatch[1];
              const chemSub = chemSubMatch[2];
              mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(chemBase)}</w:t></w:r>`;
              mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:vertAlign w:val="subscript"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(chemSub)}</w:t></w:r>`;
            } else if (mVal === '→' || mVal.includes('→')) {
              mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve"> ${esc(mVal)} </w:t></w:r>`;
            } else if (typeof EqConv.latexToOmml === 'function') {
              mathXml += EqConv.latexToOmml(mVal, isBijoy);
            } else {
              // Fallback for simple Math subscript/superscript
              let fallbackText = mVal.replace(/\$/g, '');
              let fbSub = fallbackText.match(/_\{([^}]+)\}|_([a-zA-Z0-9]+)/);
              let fbSup = fallbackText.match(/\^\{([^}]+)\}|\^([a-zA-Z0-9]+)/);
              
              if (fbSub) {
                let base = fallbackText.split('_')[0];
                let sub = fbSub[1] || fbSub[2];
                mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(base)}</w:t></w:r>`;
                mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:vertAlign w:val="subscript"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(sub)}</w:t></w:r>`;
              } else if (fbSup) {
                let base = fallbackText.split('^')[0];
                let sup = fbSup[1] || fbSup[2];
                mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(base)}</w:t></w:r>`;
                mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:vertAlign w:val="superscript"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(sup)}</w:t></w:r>`;
              } else {
                mathXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(fallbackText)}</w:t></w:r>`;
              }
            }
          } else {
            mathXml += DocxLayoutBuilder.renderSmartRuns(mSeg.value, isBijoy, isBold, isItalic, sz, isPureEnglish, extraRPr);
          }
        }
        return mathXml;
      }

      // 1. If Pure English Document: Keep 100% Times New Roman, NEVER apply Bijoy conversion!
      if (isPureEnglish || !isBijoy) {
        const font = isPureEnglish ? 'Times New Roman' : 'Kalpurush';
        const rPr = `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>${boldTag}${italicTag}${szTag}${extraRPr}</w:rPr>`;
        return `<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
      }

      // 2. Bilingual Bijoy Mode: Split into Bengali and English segments
      let segments = [];
      if (typeof BanglaConverter !== 'undefined' && typeof BanglaConverter.splitMixedBengaliAndEnglish === 'function') {
        segments = BanglaConverter.splitMixedBengaliAndEnglish(text);
      } else {
        const hasBn = /[\u0980-\u09FF]/.test(text);
        segments = [{ type: hasBn ? 'bengali' : 'english', text }];
      }

      let xml = '';
      for (const seg of segments) {
        if (!seg.text) continue;
        if (seg.type === 'english') {
          // English Segment: Always Times New Roman, NO Bijoy translation!
          const rPr = `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${boldTag}${italicTag}${szTag}${extraRPr}</w:rPr>`;
          xml += `<w:r>${rPr}<w:t xml:space="preserve">${esc(seg.text)}</w:t></w:r>`;
        } else {
          // Bengali Segment: SutonnyMJ with clean Bijoy translation
          const converted = cvt(seg.text, true);
          const rPr = `<w:rPr><w:rFonts w:ascii="SutonnyMJ" w:hAnsi="SutonnyMJ" w:cs="SutonnyMJ"/>${boldTag}${italicTag}${szTag}${extraRPr}</w:rPr>`;
          xml += `<w:r>${rPr}<w:t xml:space="preserve">${esc(converted)}</w:t></w:r>`;
        }
      }
      return xml;
    }

    /**
     * Build Modern Word .docx Blob from parsed AST
     */
    static async build(parsedAst, options = {}) {
      const JSZipLib = (typeof JSZip !== 'undefined') ? JSZip : (typeof globalThis !== 'undefined' && globalThis.JSZip ? globalThis.JSZip : (typeof window !== 'undefined' ? window.JSZip : null));
      if (!JSZipLib) {
        throw new Error('JSZip লাইব্রেরি লোড হয়নি।');
      }

      const opts = Object.assign({
        font: 'SutonnyMJ', // 'SutonnyMJ' (Bijoy) or 'Kalpurush' (Unicode)
        onProgress: (pct, msg) => {}
      }, options);

      opts.onProgress(10, 'আধুনিক ওয়ার্ড প্যাকেজ কাঠামো তৈরি হচ্ছে...');

      // Smart Language & Archetype Profile Detection
      const profile = parsedAst.profile || (parsedAst.layoutSettings && parsedAst.layoutSettings.profile);
      const isPureEnglish = (profile && typeof profile.isPureEnglish === 'boolean')
        ? profile.isPureEnglish
        : !DocxLayoutBuilder.hasBengali(parsedAst);
      const isBijoy = !isPureEnglish && opts.font === 'SutonnyMJ';
      const defaultDocFont = isPureEnglish ? 'Times New Roman' : (isBijoy ? 'SutonnyMJ' : 'Kalpurush');

      const meta = parsedAst.metadata || {};
      const layout = parsedAst.layoutSettings || {};

      opts.onProgress(25, 'ডকুমেন্ট হেডার ও মেটাডাটা এক্সএমএল প্রস্তুত হচ্ছে...');

      // 1. Generate Header Paragraphs
      const headerXml = DocxLayoutBuilder.generateHeaderXml(meta, layout, isBijoy, isPureEnglish);

      // 2. Generate Body Elements
      opts.onProgress(50, 'প্রশ্নপত্র ও সেকশন এক্সএমএল প্রসেসিং হচ্ছে...');
      const bodyElementsXml = [];

      for (const block of parsedAst.blocks) {
        bodyElementsXml.push(DocxLayoutBuilder.renderBlockXml(block, isBijoy, isPureEnglish, layout));
      }

      // 3. Section Properties (Columns, Page Size, Margins)
      opts.onProgress(75, 'কলাম ও মার্জিন স্পেসিফিকেশন যুক্ত হচ্ছে...');
      const sectPrXml = DocxLayoutBuilder.generateSectionProperties(layout);

      const archetypeId = (layout.profile && layout.profile.archetypeId) || '';
      const isMcqPaper = archetypeId === 'bengali_mcq_paper' || layout.templateId === 'mcq-grid' || layout.templateId === 'bengali-mcq-paper' || layout.templateId === 'bengali_mcq_paper';
      const isCqPaper = archetypeId === 'bengali_cq_paper' || layout.orientation === 'landscape' || layout.templateId === 'bengali-cq-paper' || layout.templateId === 'bengali_cq_paper' || layout.templateId === 'creative-cq';
      const isCombined = archetypeId === 'bengali_combined_exam_paper' || layout.templateId === 'bengali-combined-exam' || layout.templateId === 'bengali_combined_exam_paper' || (Array.isArray(parsedAst.blocks) && parsedAst.blocks.some(b => b && b.type === 'section_break' && b.target === 'mcq'));
      const isStandardQuestionPaper = archetypeId === 'bengali_standard_question_paper' || layout.templateId === 'question-2col' || layout.templateId === 'bengali_standard_question_paper' || layout.templateId === 'bengali-standard-question';

      let bodyContentXml = '';

      if (isCombined) {
        // Combined Exam Paper:
        // Section 1 (CQ): Landscape 2-page booklet, 2 cols, 0.7in gap (1008 dxa), initial col break, 0.5in margins (720 dxa)
        // Next-page section break
        // Section 2 (MCQ Header): Portrait 1 col, 0.5in margins (720 dxa)
        // Continuous section break
        // Section 3 (MCQ Questions): Portrait 2 cols, 0.2in gap (288 dxa), solid separator (w:sep="1"), 0.5in margins (720 dxa)

        const breakIdx = parsedAst.blocks.findIndex(b => b.type === 'section_break');
        if (breakIdx !== -1) {
          const cqBlocks = parsedAst.blocks.slice(0, breakIdx);
          const breakBlock = parsedAst.blocks[breakIdx];
          const mcqBlocks = parsedAst.blocks.slice(breakIdx + 1);

          const cqXmlList = cqBlocks.map(b => DocxLayoutBuilder.renderBlockXml(b, isBijoy, isPureEnglish, layout));
          const mcqXmlList = mcqBlocks.map(b => DocxLayoutBuilder.renderBlockXml(b, isBijoy, isPureEnglish, layout));

          let mcqHeaderXml = '';
          if (breakBlock && breakBlock.mcqHeader) {
            mcqHeaderXml = DocxLayoutBuilder.renderMcqHeaderXml(breakBlock.mcqHeader, isBijoy, isPureEnglish);
          } else {
            mcqHeaderXml = `
            <w:p>
              <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="80"/></w:pPr>
              ${DocxLayoutBuilder.renderSmartRuns('বহুনির্বাচনী অভীক্ষা', isBijoy, true, false, '26', isPureEnglish)}
            </w:p>`;
          }

          const initialColBreak = `
          <w:p>
            <w:r><w:br w:type="column"/></w:r>
          </w:p>`;

          const cqSectBreak = `
          <w:p>
            <w:pPr>
              <w:sectPr>
                <w:type w:val="nextPage"/>
                <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
                <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
                <w:cols w:num="2" w:space="1008" w:equalWidth="1"/>
                <w:docGrid w:linePitch="360"/>
              </w:sectPr>
            </w:pPr>
          </w:p>`;

          const mcqHeaderSectBreak = `
          <w:p>
            <w:pPr>
              <w:sectPr>
                <w:type w:val="continuous"/>
                <w:pgSz w:w="11906" w:h="16838"/>
                <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
                <w:cols w:num="1" w:space="720"/>
                <w:docGrid w:linePitch="360"/>
              </w:sectPr>
            </w:pPr>
          </w:p>`;

          const mcqQuestionsSectPr = `
          <w:sectPr>
            <w:pgSz w:w="11906" w:h="16838"/>
            <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
            <w:cols w:num="2" w:space="288" w:sep="1" w:equalWidth="1"/>
            <w:docGrid w:linePitch="360"/>
          </w:sectPr>`;

          bodyContentXml = `${headerXml}\n${initialColBreak}\n${cqXmlList.join('\n')}\n${cqSectBreak}\n${mcqHeaderXml}\n${mcqHeaderSectBreak}\n${mcqXmlList.join('\n')}\n${mcqQuestionsSectPr}`;
        } else {
          bodyContentXml = `${headerXml}\n${bodyElementsXml.join('\n')}\n${sectPrXml}`;
        }
      } else if (isMcqPaper) {
        // Standalone MCQ Paper (Strict 20-30 MCQs):
        // Section 1: Header (1 Column, 0.5in margins = 720 dxa) ending with continuous section break
        // Section 2: Questions (2 Columns, 0.2in gap = 288 dxa, solid separator, 0.5in margins = 720 dxa)
        const headerSectPr = `
        <w:p>
          <w:pPr>
            <w:sectPr>
              <w:type w:val="continuous"/>
              <w:pgSz w:w="11906" w:h="16838"/>
              <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
              <w:cols w:num="1" w:space="720"/>
              <w:docGrid w:linePitch="360"/>
            </w:sectPr>
          </w:pPr>
        </w:p>`;

        const questionsSectPr = `
        <w:sectPr>
          <w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
          <w:cols w:num="2" w:space="288" w:sep="1" w:equalWidth="1"/>
          <w:docGrid w:linePitch="360"/>
        </w:sectPr>`;

        bodyContentXml = `${headerXml}\n${headerSectPr}\n${bodyElementsXml.join('\n')}\n${questionsSectPr}`;
      } else if (isStandardQuestionPaper || (layout.columns === 2 && !isCqPaper)) {
        // Standard 2-Column Bengali Question Paper (Class 1-5 / Short Questions / General):
        // Section 1: Header (1 Column, 0.5in margins = 720 dxa) ending with continuous section break
        // Section 2: Questions (2 Columns, 0.25in gap = 360 dxa, solid separator w:sep="1", 0.5in margins = 720 dxa)
        const headerSectPr = `
        <w:p>
          <w:pPr>
            <w:sectPr>
              <w:type w:val="continuous"/>
              <w:pgSz w:w="11906" w:h="16838"/>
              <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
              <w:cols w:num="1" w:space="720"/>
              <w:docGrid w:linePitch="360"/>
            </w:sectPr>
          </w:pPr>
        </w:p>`;

        const questionsSectPr = `
        <w:sectPr>
          <w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
          <w:cols w:num="2" w:space="360" w:sep="1" w:equalWidth="1"/>
          <w:docGrid w:linePitch="360"/>
        </w:sectPr>`;

        bodyContentXml = `${headerXml}\n${headerSectPr}\n${bodyElementsXml.join('\n')}\n${questionsSectPr}`;
      } else if (isCqPaper) {
        // Creative Question Paper (Landscape 2-Page Booklet):
        // Starts with initial column break so text begins in Page 1 Right column!
        const initialColBreak = `
        <w:p>
          <w:r><w:br w:type="column"/></w:r>
        </w:p>`;

        const cqSectPr = `
        <w:sectPr>
          <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
          <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
          <w:cols w:num="2" w:space="1008" w:equalWidth="1"/>
          <w:docGrid w:linePitch="360"/>
        </w:sectPr>`;

        bodyContentXml = `${headerXml}\n${initialColBreak}\n${bodyElementsXml.join('\n')}\n${cqSectPr}`;
      } else {
        bodyContentXml = `${headerXml}\n${bodyElementsXml.join('\n')}\n${sectPrXml}`;
      }

      // 4. Assemble word/document.xml
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    ${bodyContentXml}
  </w:body>
</w:document>`;

      // 5. Pack everything into JSZip container
      opts.onProgress(85, 'ওয়ার্ড জিপ কন্টেইনার কম্প্রেস হচ্ছে...');
      const zip = new JSZipLib();

      zip.file('[Content_Types].xml', DocxLayoutBuilder.getContentTypesXml());
      zip.file('_rels/.rels', DocxLayoutBuilder.getRootRelsXml());
      zip.file('word/_rels/document.xml.rels', DocxLayoutBuilder.getDocumentRelsXml());
      zip.file('word/styles.xml', DocxLayoutBuilder.getStylesXml(defaultDocFont));
      zip.file('word/document.xml', documentXml);

      opts.onProgress(95, 'চূড়ান্ত ফাইল ব্লব জেনারেট হচ্ছে...');
      const docxBlob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      opts.onProgress(100, 'আধুনিক ওয়ার্ড (.docx) ফাইল প্রস্তুত সম্পন্ন!');
      return docxBlob;
    }

    /**
     * Generates header XML for modern Word document
     */
    static generateHeaderXml(meta, layout, isBijoy, isPureEnglish) {
      let xml = '';
      const renderRuns = (txt, isBold, isItalic, sz) => DocxLayoutBuilder.renderSmartRuns(txt, isBijoy, isBold, isItalic, sz, isPureEnglish);

      if (layout.templateId === 'official-notice') {
        const institute = meta.institute || (isPureEnglish ? 'Government of the People\'s Republic of Bangladesh' : 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার');
        const subHeader = meta.subHeader || (isPureEnglish ? 'Office of the Upazila Nirbahi Officer' : 'উপজেলা নির্বাহী অফিসারের কার্যালয়');

        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
          ${renderRuns(institute, true, false, '30')}
        </w:p>
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr>
          ${renderRuns(subHeader, true, false, '22')}
        </w:p>`;

        if (meta.memoNo || meta.date) {
          const memoLabel = isPureEnglish ? 'Memo No: ' : 'স্মারক নং: ';
          const dateLabel = isPureEnglish ? 'Date: ' : 'তারিখ: ';
          xml += `
          <w:tbl>
            <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>
            <w:tr>
              <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/></w:pPr>${renderRuns(memoLabel, true, false, '22')}${renderRuns(meta.memoNo || '—', false, false, '22')}</w:p></w:tc>
              <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/></w:pPr>${renderRuns(dateLabel, true, false, '22')}${renderRuns(meta.date || '—', false, false, '22')}</w:p></w:tc>
            </w:tr>
          </w:tbl>`;
        }

        if (meta.subject) {
          const subjLabel = isPureEnglish ? 'Subject: ' : 'বিষয়: ';
          xml += `
          <w:p>
            <w:pPr><w:spacing w:before="180" w:after="140"/></w:pPr>
            ${renderRuns(subjLabel + meta.subject, true, false, '24')}
          </w:p>`;
        }

        return xml;
      }

      // Academic Question Paper Header
      if (meta.institute) {
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
          ${renderRuns(meta.institute, true, false, '30')}
        </w:p>`;
      }

      if (meta.exam) {
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
          ${renderRuns(meta.exam, true, false, '26')}
        </w:p>`;
      }

      if (meta.grade || meta.subject) {
        const gradeText = meta.grade ? (isPureEnglish ? `Class: ${meta.grade}` : `শ্রেণি: ${meta.grade}`) : '';
        const subjText = meta.subject ? (isPureEnglish ? `Subject: ${meta.subject}` : `বিষয়: ${meta.subject}`) : '';
        const middle = (gradeText && subjText) ? '  |  ' : '';
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>
          ${renderRuns(gradeText + middle + subjText, true, false, '24')}
        </w:p>`;
      }

      if (meta.subjectCode) {
        const digits = String(meta.subjectCode).replace(/\D/g, '').split('');
        const codeDigits = digits.length > 0 ? digits : ['১', '০', '১'];
        const cellsXml = codeDigits.map(d => `<w:tc><w:tcPr><w:tcW w:w="320" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr>${renderRuns(d, true, false, '20')}</w:p></w:tc>`).join('');
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:after="20"/></w:pPr>
          ${renderRuns('বিষয় কোড: ', false, false, '20')}
        </w:p>
        <w:tbl>
          <w:tblPr><w:jc w:val="center"/><w:tblW w:w="0" w:type="auto"/></w:tblPr>
          <w:tr>${cellsXml}</w:tr>
        </w:tbl>`;
      }

      if (meta.time || meta.fullMarks) {
        const timeText = meta.time ? (isPureEnglish ? `Time: ${meta.time}` : `সময়: ${meta.time}`) : '';
        const marksText = meta.fullMarks ? (isPureEnglish ? `Full Marks: ${meta.fullMarks}` : `পূর্ণমান: ${meta.fullMarks}`) : '';

        xml += `
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders><w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/></w:tblBorders>
          </w:tblPr>
          <w:tr>
            <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>${renderRuns(timeText, true, false, '24')}</w:p></w:tc>
            <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/><w:spacing w:after="40"/></w:pPr>${renderRuns(marksText, true, false, '24')}</w:p></w:tc>
          </w:tr>
        </w:tbl>`;
      }

      if (meta.note) {
        xml += `
        <w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="120"/></w:pPr>
          ${renderRuns(meta.note, false, true, '19')}
        </w:p>`;
      }

      return xml;
    }

    /**
     * Renders standalone MCQ Header block for DOCX
     */
    static renderMcqHeaderXml(h, isBijoy, isPureEnglish) {
      let xml = '';
      const renderRuns = (txt, isBold, isItalic, sz) => DocxLayoutBuilder.renderSmartRuns(txt, isBijoy, isBold, isItalic, sz, isPureEnglish);

      if (h.institute) {
        xml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>${renderRuns(h.institute, true, false, '28')}</w:p>`;
      }
      if (h.exam) {
        xml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>${renderRuns(h.exam, true, false, '24')}</w:p>`;
      }
      if (h.grade) {
        xml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>${renderRuns(h.grade, true, false, '22')}</w:p>`;
      }
      if (h.subjectCode) {
        const digits = String(h.subjectCode).replace(/\D/g, '').split('');
        const codeDigits = digits.length > 0 ? digits : ['১', '০', '১'];
        let cellsXml = codeDigits.map(d => `
        <w:tc>
          <w:tcPr><w:tcW w:w="360" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="8" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="8" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="8" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="8" w:space="0" w:color="auto"/></w:tcBorders></w:tcPr>
          <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>${renderRuns(d, true, false, '20')}</w:p>
        </w:tc>`).join('');

        xml += `
        <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="40"/></w:pPr>${renderRuns('বিষয় কোড: ', false, false, '20')}</w:p>
        <w:tbl>
          <w:tblPr><w:jc w:val="center"/><w:tblW w:w="0" w:type="auto"/></w:tblPr>
          <w:tr>${cellsXml}</w:tr>
        </w:tbl>`;
      }
      if (h.title) {
        xml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="40"/></w:pPr>${renderRuns(h.title, true, false, '26')}</w:p>`;
      }
      if (h.timeMarks) {
        xml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>${renderRuns(h.timeMarks, true, false, '21')}</w:p>`;
      }
      if (h.note) {
        xml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>${renderRuns(h.note, false, true, '19')}</w:p>`;
      }
      xml += `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="auto"/></w:pBdr><w:spacing w:after="120"/></w:pPr></w:p>`;
      return xml;
    }

    /**
     * Extracts MCQ options from subQuestions
     */
    static extractMcqOptions(subQuestions) {
      if (!subQuestions || subQuestions.length === 0) return null;

      // If any item has explicit marks, it is a creative subquestion, NOT MCQ!
      const hasMarks = subQuestions.some(s => s.marks && String(s.marks).trim().length > 0);
      if (hasMarks) return null;

      // If any subquestion ends in '?' or contains question words, it is a real question, NOT an MCQ option choice!
      const hasQuestionSentences = subQuestions.some(s => {
        const t = (s.text || '').trim();
        return t.endsWith('?') || t.endsWith('?।') || (t.length > 40 && (t.includes('কী') || t.includes('কি') || t.includes('কেন') || t.includes('কোথায়') || t.includes('কাকে বলে') || t.includes('ব্যাখ্যা কর') || t.includes('আলোচনা কর')));
      });
      if (hasQuestionSentences) return null;

      // If there are subquestions beyond 'ঘ' (e.g. ঙ, চ, ছ or e, f, g), it's a list of questions, not 4-choice MCQ!
      const hasExtendedSubQuestions = subQuestions.some(s => /^(?:\([ঙ-হe-z]\)|[ঙ-হe-z][\.\)])/i.test((s.subId || '').trim()));
      if (hasExtendedSubQuestions) return null;

      // Check average length of items: MCQ options are short answers (average <= 45 chars)
      const avgLen = subQuestions.reduce((sum, s) => sum + (s.text || '').trim().length, 0) / subQuestions.length;
      if (avgLen > 45) return null;

      const pattern = /(\([ক-ঘa-d]\)|[ক-ঘa-d][\.\)])/gi;

      // Case 1: Check distinct subQuestions representing options (handling isMcqOptionsRow)
      const optionSubs = subQuestions.filter(s =>
        /^(?:\([ক-ঘa-d]\)|[ক-ঘa-d][\.\)])/i.test((s.subId || '').trim()) ||
        (s.isMcqOptionsRow && /^(?:\([ক-ঘa-d]\)|[ক-ঘa-d][\.\)])/i.test((s.text || '').trim()))
      );
      if (optionSubs.length >= 4) {
        return optionSubs.slice(0, 4).map(s => ({
          label: s.subId || '',
          text: s.text || ''
        }));
      }

      // Case 2: embedded options in 1 or more rows containing (ক)...(খ)...(গ)...(ঘ)
      const fullText = subQuestions.map(s => (s.subId ? s.subId + ' ' : '') + s.text).join(' ');
      const matches = [...fullText.matchAll(pattern)];
      if (matches.length >= 4) {
        const optMatches = matches.length === 4 ? matches : matches.slice(-4);
        const opts = [];
        for (let i = 0; i < 4; i++) {
          const lbl = optMatches[i][0];
          const start = optMatches[i].index + lbl.length;
          const end = (i + 1 < 4) ? optMatches[i + 1].index : fullText.length;
          opts.push({
            label: lbl,
            text: fullText.substring(start, end).trim()
          });
        }
        return opts;
      }

      // Case 3: Check isMcqOptionsRow flag fallback
      const mcqRows = subQuestions.filter(s => s.isMcqOptionsRow && !s.isPromptText);
      if (mcqRows.length >= 4) {
        return mcqRows.slice(0, 4).map(s => ({
          label: s.subId || '',
          text: s.text || ''
        }));
      }

      return null;
    }

    /**
     * Formats MCQ options in 4 equal columns (or 2 columns across 2 lines when long)
     */
    static formatMcqOptionsXml(optionsList, isBijoy, isPureEnglish) {
      if (!optionsList || optionsList.length === 0) return '';
      const renderRuns = (txt, isBold, isItalic, sz = '24', extra = '') => DocxLayoutBuilder.renderSmartRuns(txt, isBijoy, isBold, isItalic, sz, isPureEnglish, extra);

      const getVisualLength = (str) => {
        if (!str) return 0;
        return str.replace(/[\u09BE-\u09CC\u09CD\u0981-\u0983\u09D7]/g, '').length;
      };

      const totalLen = optionsList.reduce((sum, o) => sum + getVisualLength(o.text || ''), 0);
      const maxSingleLen = Math.max(...optionsList.map(o => getVisualLength(o.text || '')));

      // 4 Options fit on 1 line across 4 equal columns (short options)
      if (optionsList.length === 4 && totalLen <= 48 && maxSingleLen <= 14) {
        return `
        <w:p>
          <w:pPr>
            <w:ind w:left="234"/>
            <w:tabs>
              <w:tab w:val="left" w:pos="1447"/>
              <w:tab w:val="left" w:pos="2660"/>
              <w:tab w:val="left" w:pos="3873"/>
            </w:tabs>
            <w:spacing w:before="10" w:after="20" w:line="240" w:lineRule="auto"/>
          </w:pPr>
          ${renderRuns(optionsList[0].label + ' ' + optionsList[0].text, false, false, '24')}
          <w:r><w:tab/></w:r>
          ${renderRuns(optionsList[1].label + ' ' + optionsList[1].text, false, false, '24')}
          <w:r><w:tab/></w:r>
          ${renderRuns(optionsList[2].label + ' ' + optionsList[2].text, false, false, '24')}
          <w:r><w:tab/></w:r>
          ${renderRuns(optionsList[3].label + ' ' + optionsList[3].text, false, false, '24')}
        </w:p>`;
      }

      // 4 Options split into 2 lines x 2 columns (medium/long options)
      if (optionsList.length === 4 && totalLen <= 110 && maxSingleLen <= 32) {
        return `
        <w:p>
          <w:pPr>
            <w:ind w:left="234"/>
            <w:tabs>
              <w:tab w:val="left" w:pos="2660"/>
            </w:tabs>
            <w:spacing w:before="10" w:after="10" w:line="240" w:lineRule="auto"/>
          </w:pPr>
          ${renderRuns(optionsList[0].label + ' ' + optionsList[0].text, false, false, '24')}
          <w:r><w:tab/></w:r>
          ${renderRuns(optionsList[1].label + ' ' + optionsList[1].text, false, false, '24')}
        </w:p>
        <w:p>
          <w:pPr>
            <w:ind w:left="234"/>
            <w:tabs>
              <w:tab w:val="left" w:pos="2660"/>
            </w:tabs>
            <w:spacing w:before="10" w:after="20" w:line="240" w:lineRule="auto"/>
          </w:pPr>
          ${renderRuns(optionsList[2].label + ' ' + optionsList[2].text, false, false, '24')}
          <w:r><w:tab/></w:r>
          ${renderRuns(optionsList[3].label + ' ' + optionsList[3].text, false, false, '24')}
        </w:p>`;
      }

      // Very long options: each on its own line
      return optionsList.map(opt => `
      <w:p>
        <w:pPr>
          <w:ind w:left="234"/>
          <w:spacing w:before="10" w:after="10" w:line="240" w:lineRule="auto"/>
        </w:pPr>
        ${renderRuns(opt.label + ' ' + opt.text, false, false, '24')}
      </w:p>`).join('\n');
    }

    /**
     * Render an individual AST block to Word XML
     */
    static renderBlockXml(block, isBijoy, isPureEnglish, layout = {}) {
      const renderRuns = (txt, isBold, isItalic, sz = '24', extra = '') => DocxLayoutBuilder.renderSmartRuns(txt, isBijoy, isBold, isItalic, sz, isPureEnglish, extra);

      const is2Col = layout && layout.columns === 2;
      const isLegal = layout && layout.pageSize === 'legal';
      const isLandscape = layout && layout.orientation === 'landscape';
      const rightTabPos = isLandscape
        ? (is2Col ? '7050' : '15300')
        : (is2Col ? (isLegal ? '5130' : '4960') : (isLegal ? '10800' : '10460'));

      switch (block.type) {
        case 'header_time_marks': {
          const timeText = block.time || '';
          const marksText = block.marks || '';
          return `
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="5000" w:type="pct"/>
              <w:tblBorders><w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/></w:tblBorders>
            </w:tblPr>
            <w:tr>
              <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>${renderRuns(timeText, true, false, '22')}</w:p></w:tc>
              <w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/><w:spacing w:after="40"/></w:pPr>${renderRuns(marksText, true, false, '22')}</w:p></w:tc>
            </w:tr>
          </w:tbl>`;
        }

        case 'heading': {
          const sz = block.level === 1 ? '26' : '24';
          return `
          <w:p>
            <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="60"/></w:pPr>
            ${renderRuns(block.text, true, false, sz)}
          </w:p>`;
        }

        case 'section_break': {
          const isLegal = layout && layout.pageSize === 'legal';
          const isLandscape = layout && layout.orientation === 'landscape';
          const pW = isLegal ? '12240' : (isLandscape ? '16838' : '11906');
          const pH = isLegal ? '20160' : (isLandscape ? '11906' : '16838');
          const topM = Math.round(((layout && layout.margins && layout.margins.top) || 0.5) * 1440);
          const rightM = Math.round(((layout && layout.margins && layout.margins.right) || 0.5) * 1440);
          const bottomM = Math.round(((layout && layout.margins && layout.margins.bottom) || 0.5) * 1440);
          const leftM = Math.round(((layout && layout.margins && layout.margins.left) || 0.5) * 1440);

          let xml = `
          <w:p>
            <w:pPr>
              <w:sectPr>
                <w:pgSz w:w="${pW}" w:h="${pH}" ${isLandscape ? 'w:orient="landscape"' : ''}/>
                <w:pgMar w:top="${topM}" w:right="${rightM}" w:bottom="${bottomM}" w:left="${leftM}" w:header="720" w:footer="720" w:gutter="0"/>
                <w:cols w:num="1" w:space="720"/>
                <w:docGrid w:linePitch="360"/>
              </w:sectPr>
            </w:pPr>
          </w:p>`;

          // If MCQ Section has header metadata, render it centered across the full page!
          if (block.mcqHeader) {
            const h = block.mcqHeader;
            if (h.institute) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="40"/></w:pPr>
                ${renderRuns(h.institute, true, false, '30')}
              </w:p>`;
            }
            if (h.exam) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
                ${renderRuns(h.exam, true, false, '26')}
              </w:p>`;
            }
            if (h.grade) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
                ${renderRuns(h.grade, true, false, '22')}
              </w:p>`;
            }
            if (h.subjectCode) {
              const digits = String(h.subjectCode).replace(/\D/g, '').split('');
              const codeDigits = digits.length > 0 ? digits : ['১', '০', '১'];
              const cellsXml = codeDigits.map(d => `<w:tc><w:tcPr><w:tcW w:w="320" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr>${renderRuns(d, true, false, '20')}</w:p></w:tc>`).join('');
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:after="20"/></w:pPr>
                ${renderRuns('বিষয় কোড: ', false, false, '20')}
              </w:p>
              <w:tbl>
                <w:tblPr><w:jc w:val="center"/><w:tblW w:w="0" w:type="auto"/></w:tblPr>
                <w:tr>${cellsXml}</w:tr>
              </w:tbl>`;
            }
            if (h.title) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="40"/></w:pPr>
                ${renderRuns(h.title, true, false, '26')}
              </w:p>`;
            }
            if (h.timeMarks) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>
                ${renderRuns(h.timeMarks, true, false, '22')}
              </w:p>`;
            }
            if (h.note) {
              xml += `
              <w:p>
                <w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="60"/></w:pPr>
                ${renderRuns(h.note, false, true, '19')}
              </w:p>`;
            }

            // Continuous break into 2 columns for MCQ questions with divider
            xml += `
            <w:p>
              <w:pPr>
                <w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="000000"/></w:pBdr>
                <w:sectPr>
                  <w:type w:val="continuous"/>
                  <w:pgSz w:w="${pW}" w:h="${pH}" ${isLandscape ? 'w:orient="landscape"' : ''}/>
                  <w:pgMar w:top="${topM}" w:right="${rightM}" w:bottom="${bottomM}" w:left="${leftM}" w:header="720" w:footer="720" w:gutter="0"/>
                  <w:cols w:num="2" w:space="288" w:sep="1" w:equalWidth="1"/>
                  <w:docGrid w:linePitch="360"/>
                </w:sectPr>
              </w:pPr>
            </w:p>`;
          }

          return xml;
        }

        case 'question': {
          let xml = '';
          const isMcq = (block.subQuestions && DocxLayoutBuilder.extractMcqOptions(block.subQuestions) != null);
          const rawDelim = block.delimiter || (isPureEnglish ? '.' : (isMcq ? '।' : '.'));
          const qNumDelim = (isPureEnglish || rawDelim === '.') ? '.' : rawDelim.trim();

          const numPrefix = block.number + qNumDelim;
          const formattedMarks = block.marks
            ? ((isPureEnglish || block.marks.includes('=')) ? `[${block.marks}]` : block.marks)
            : '';

          if (isMcq) {
            // MCQ Question: Simple space after serial number without tab jump to avoid wide gaps on 2-digit numbers (10+)
            xml += `
            <w:p>
              <w:pPr>
                <w:spacing w:before="40" w:after="20" w:line="240" w:lineRule="auto"/>
              </w:pPr>
              ${renderRuns(numPrefix + ' ', true, false, '24')}${renderRuns(block.text, false, false, '24')}${formattedMarks ? `<w:r><w:tab/></w:r>${renderRuns(formattedMarks, true, false, '24')}` : ''}
            </w:p>`;
          } else {
            // CQ Question: Native hanging indent (432 dxa = 0.3 in)
            // Left margin = 432 dxa, hanging = 432 dxa
            // Serial number (১।) sits at left margin (0 dxa), text/stimulus flows from 432 dxa.
            // NO text wraps under the question serial!
            const qIndent = 432;
            let firstLineText = (block.text || '').trim();
            let remainingStimLines = [];

            if (block.stimulus) {
              const allStimLines = block.stimulus.split('\n').map(l => l.trim()).filter(Boolean);
              if (!firstLineText && allStimLines.length > 0) {
                firstLineText = allStimLines[0];
                remainingStimLines = allStimLines.slice(1);
              } else {
                remainingStimLines = allStimLines;
              }
            }

            xml += `
            <w:p>
              <w:pPr>
                <w:ind w:left="${qIndent}" w:hanging="${qIndent}"/>
                <w:tabs>
                  <w:tab w:val="left" w:pos="${qIndent}"/>
                  <w:tab w:val="right" w:pos="${rightTabPos}"/>
                </w:tabs>
                <w:spacing w:before="60" w:after="20" w:line="240" w:lineRule="auto"/>
              </w:pPr>
              ${renderRuns(numPrefix, true, false, '24')}
              <w:r><w:tab/></w:r>
              ${renderRuns(firstLineText, false, false, '24')}
              ${formattedMarks ? `<w:r><w:tab/></w:r>${renderRuns(formattedMarks, true, false, '24')}` : ''}
            </w:p>`;

            // Remaining Stimulus lines (if multi-line stimulus/passage)
            // Left-aligned at qIndent (432 dxa), NO text under question number! NO border boxes!
            if (remainingStimLines.length > 0) {
              for (const sLine of remainingStimLines) {
                xml += `
                <w:p>
                  <w:pPr>
                    <w:ind w:left="${qIndent}"/>
                    <w:spacing w:before="15" w:after="20" w:line="240" w:lineRule="auto"/>
                  </w:pPr>
                  ${renderRuns(sLine, false, false, '24')}
                </w:p>`;
              }
            }
          }

          // Sub-questions (a, b, c, d or ক, খ, গ, ঘ) or MCQ Options
          if (block.subQuestions && block.subQuestions.length > 0) {
            const mcqOptions = DocxLayoutBuilder.extractMcqOptions(block.subQuestions);
            if (mcqOptions && mcqOptions.length >= 2) {
              // Extract any non-option prompts (like 'নিচের কোনটি সঠিক?' or Roman numeral statements)
              for (const sub of block.subQuestions) {
                const isOptionLine = /(\([ক-ঘa-d]\)|[ক-ঘa-d][\.\)])/i.test((sub.subId || '') + ' ' + (sub.text || ''));
                if (!isOptionLine) {
                  if (sub.isPromptText) {
                    xml += `
                    <w:p>
                      <w:pPr>
                        <w:ind w:left="234"/>
                        <w:spacing w:before="10" w:after="10" w:line="240" w:lineRule="auto"/>
                      </w:pPr>
                      ${renderRuns(sub.text, true, false, '24')}
                    </w:p>`;
                  } else if (/^[iIvVxX0-9]+[\.\)]/.test(sub.subId || '')) {
                    xml += `
                    <w:p>
                      <w:pPr>
                        <w:ind w:left="468" w:hanging="234"/>
                        <w:spacing w:before="10" w:after="10" w:line="240" w:lineRule="auto"/>
                      </w:pPr>
                      ${renderRuns(sub.subId + ' ', true, false, '24')}
                      ${renderRuns(sub.text, false, false, '24')}
                    </w:p>`;
                  } else {
                    xml += `
                    <w:p>
                      <w:pPr>
                        <w:ind w:left="234"/>
                        <w:spacing w:before="10" w:after="10" w:line="240" w:lineRule="auto"/>
                      </w:pPr>
                      ${renderRuns((sub.subId ? sub.subId + ' ' : '') + sub.text, false, false, '24')}
                    </w:p>`;
                  }
                }
              }

              // Render MCQ Options formatted in 4 equal columns (or 2 columns if long)
              xml += DocxLayoutBuilder.formatMcqOptionsXml(mcqOptions, isBijoy, isPureEnglish);
            } else {
              // Standard Creative Sub-questions ((ক), (খ), (গ), (ঘ)) with marks
              for (const sub of block.subQuestions) {
                const subFormattedMarks = sub.marks
                  ? ((isPureEnglish || sub.marks.includes('=')) ? `[${sub.marks}]` : sub.marks)
                  : '';
                if (sub.isPromptText) {
                  xml += `
                  <w:p>
                    <w:pPr>
                      <w:ind w:left="234"/>
                      <w:spacing w:before="10" w:after="10" w:line="240" w:lineRule="auto"/>
                    </w:pPr>
                    ${renderRuns(sub.text, true, false, '24')}
                  </w:p>`;
                } else {
                  xml += `
                  <w:p>
                    <w:pPr>
                      <w:ind w:left="468" w:hanging="234"/>
                      <w:tabs>
                        <w:tab w:val="left" w:pos="468"/>
                        <w:tab w:val="right" w:pos="${rightTabPos}"/>
                      </w:tabs>
                      <w:spacing w:before="15" w:after="15" w:line="240" w:lineRule="auto"/>
                    </w:pPr>
                    ${renderRuns(sub.subId || '', true, false, '24')}
                    <w:r><w:tab/></w:r>
                    ${renderRuns(sub.text, false, false, '24')}
                    ${subFormattedMarks ? `<w:r><w:tab/></w:r>${renderRuns(subFormattedMarks, true, false, '24')}` : ''}
                  </w:p>`;
                }
              }
            }
          }

          return xml;
        }

        case 'figure': {
          const figText = block.text || (isPureEnglish ? '[Image / Figure Box]' : '[চিত্র/ডায়াগ্রামের স্থান]');
          return `
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="5000" w:type="pct"/>
              <w:jc w:val="center"/>
              <w:tblBorders>
                <w:top w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                <w:left w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                <w:bottom w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                <w:right w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                <w:insideH w:val="none"/><w:insideV w:val="none"/>
              </w:tblBorders>
            </w:tblPr>
            <w:tr>
              <w:tc>
                <w:tcPr>
                  <w:tcW w:w="5000" w:type="pct"/>
                  <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
                  <w:tcMar><w:top w:w="240" w:type="dxa"/><w:bottom w:w="240" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>
                </w:tcPr>
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr>
                  ${renderRuns(figText, false, true, '18', '<w:color w:val="475569"/>')}
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>`;
        }

        case 'stimulus_box': {
          return `
          <w:p>
            <w:pPr>
              <w:ind w:left="432"/>
              <w:spacing w:before="30" w:after="30" w:line="240" w:lineRule="auto"/>
            </w:pPr>
            ${renderRuns(block.text, false, false, '24')}
          </w:p>`;
        }

        case 'table': {
          let tblXml = `
          <w:tbl>
            <w:tblPr>
              <w:tblW w:w="0" w:type="auto"/>
              <w:jc w:val="left"/>
              <w:tblBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
              </w:tblBorders>
              <w:tblCellMar>
                <w:top w:w="40" w:type="dxa"/>
                <w:bottom w:w="40" w:type="dxa"/>
                <w:left w:w="100" w:type="dxa"/>
                <w:right w:w="100" w:type="dxa"/>
              </w:tblCellMar>
            </w:tblPr>`;

          // Standard plain Word table: Headers row has NO gray shading and NO tblHeader tag
          if (block.headers && block.headers.length > 0) {
            tblXml += '<w:tr>';
            block.headers.forEach((h, idx) => {
              const align = (block.alignments && block.alignments[idx]) || 'left';
              tblXml += `
              <w:tc>
                <w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>${renderRuns(h, false, false, '22')}</w:p>
              </w:tc>`;
            });
            tblXml += '</w:tr>';
          }

          if (block.rows && block.rows.length > 0) {
            block.rows.forEach(row => {
              tblXml += '<w:tr>';
              row.forEach((cell, idx) => {
                const align = (block.alignments && block.alignments[idx]) || 'left';
                tblXml += `
                <w:tc>
                  <w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>${renderRuns(cell, false, false, '22')}</w:p>
                </w:tc>`;
              });
              tblXml += '</w:tr>';
            });
          }

          tblXml += '</w:tbl>';
          return tblXml;
        }

        case 'unordered_list': {
          let listXml = '';
          block.items.forEach(item => {
            listXml += `
            <w:p>
              <w:pPr><w:ind w:left="360"/><w:spacing w:after="40"/></w:pPr>
              <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t>• </w:t></w:r>
              ${renderRuns(item, false, false, '24')}
            </w:p>`;
          });
          return listXml;
        }

        case 'ordered_list': {
          let listXml = '';
          block.items.forEach(item => {
            listXml += `
            <w:p>
              <w:pPr><w:ind w:left="360"/><w:spacing w:after="40"/></w:pPr>
              ${renderRuns(item.number + '. ', true, false, '24')}
              ${renderRuns(item.text, false, false, '24')}
            </w:p>`;
          });
          return listXml;
        }

        case 'hr': {
          return `
          <w:p>
            <w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="666666"/></w:pBdr><w:spacing w:before="100" w:after="100"/></w:pPr>
          </w:p>`;
        }

        case 'paragraph':
        default: {
          const txt = block.text || '';
          if (/\[\s*(?:চিত্র|ছবি)\s*আছে[^\]]*\]/i.test(txt)) {
            return `
            <w:tbl>
              <w:tblPr>
                <w:tblW w:w="5000" w:type="pct"/>
                <w:jc w:val="center"/>
                <w:tblBorders>
                  <w:top w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                  <w:left w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                  <w:bottom w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                  <w:right w:val="dashed" w:sz="6" w:space="0" w:color="64748B"/>
                  <w:insideH w:val="none"/><w:insideV w:val="none"/>
                </w:tblBorders>
              </w:tblPr>
              <w:tr>
                <w:tc>
                  <w:tcPr>
                    <w:tcW w:w="5000" w:type="pct"/>
                    <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
                    <w:tcMar><w:top w:w="240" w:type="dxa"/><w:bottom w:w="240" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>
                  </w:tcPr>
                  <w:p>
                    <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr>
                    ${renderRuns(txt, false, true, '18', '<w:color w:val="475569"/>')}
                  </w:p>
                </w:tc>
              </w:tr>
            </w:tbl>`;
          }

          return `
          <w:p>
            <w:pPr><w:jc w:val="both"/><w:spacing w:after="60" w:line="240" w:lineRule="auto"/></w:pPr>
            ${renderRuns(txt, false, false, '24')}
          </w:p>`;
        }
      }
    }

    /**
     * Generate OOXML Section Properties (<w:sectPr>) for columns, page size, margins
     */
    static generateSectionProperties(layout) {
      const isLegal = layout.pageSize === 'legal';
      const isLandscape = layout.orientation === 'landscape';

      const pageW = isLegal ? '12240' : (isLandscape ? '16838' : '11906');
      const pageH = isLegal ? '20160' : (isLandscape ? '11906' : '16838');

      const isExam = (layout.profile && (layout.profile.archetypeId === 'bengali_combined_exam_paper' || layout.profile.archetypeId === 'bengali_mcq_paper' || layout.profile.archetypeId === 'bengali_cq_paper')) ||
                     layout.templateId === 'mcq-grid' || layout.templateId === 'question-2col' || layout.templateId === 'creative-cq';

      const mTop = isExam ? 720 : Math.round(((layout.margins && layout.margins.top) || 0.5) * 1440);
      const mBottom = isExam ? 720 : Math.round(((layout.margins && layout.margins.bottom) || 0.5) * 1440);
      const mLeft = isExam ? 720 : Math.round(((layout.margins && layout.margins.left) || 0.5) * 1440);
      const mRight = isExam ? 720 : Math.round(((layout.margins && layout.margins.right) || 0.5) * 1440);

      const isTwoCol = layout.columns === 2 || (layout.profile && (layout.profile.archetypeId === 'bengali_combined_exam_paper' || layout.profile.archetypeId === 'bengali_mcq_paper' || layout.profile.archetypeId === 'bengali_cq_paper'));
      const isMcq = (layout.profile && layout.profile.archetypeId === 'bengali_mcq_paper') || layout.templateId === 'mcq-grid';
      const isCq = (layout.profile && layout.profile.archetypeId === 'bengali_cq_paper') || isLandscape;

      const colGap = isCq ? '1008' : (isMcq ? '288' : '540');
      const colsXml = isTwoCol
        ? `<w:cols w:num="2" w:space="${colGap}" ${isMcq ? 'w:sep="1"' : ''} w:equalWidth="1"/>`
        : '<w:cols w:num="1" w:space="720"/>';

      return `
      <w:sectPr>
        <w:pgSz w:w="${pageW}" w:h="${pageH}" ${isLandscape ? 'w:orient="landscape"' : ''}/>
        <w:pgMar w:top="${mTop}" w:right="${mRight}" w:bottom="${mBottom}" w:left="${mLeft}" w:header="720" w:footer="720" w:gutter="0"/>
        ${colsXml}
        <w:docGrid w:linePitch="360"/>
      </w:sectPr>`;
    }

    // --- Standard OOXML Boilerplate Part XMLs ---

    static getContentTypesXml() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
    }

    static getRootRelsXml() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
    }

    static getDocumentRelsXml() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
    }

    static getStylesXml(defaultFont = 'Times New Roman') {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="${defaultFont}" w:hAnsi="${defaultFont}" w:cs="${defaultFont}"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
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
    }
  }

  global.DocxLayoutBuilder = DocxLayoutBuilder;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocxLayoutBuilder;
  }

})(typeof window !== 'undefined' ? window : globalThis);
