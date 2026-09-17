/**
 * DOCX to DOC (Word 97-2003) Full Fidelity Converter Engine v2.0
 * Deep Style Inheritance, Theme Color Resolution, Font Sizing, Tables & SutonnyMJ / Unicode Typography
 * 100% Compatible with Microsoft Office Word 2003, 2007, 2010, 2013, 2016, 2019, 2021 & Office 365
 */

(function (global) {
  'use strict';

  // Standard Microsoft Office Theme Color Palette Fallbacks
  const THEME_COLORS = {
    'dark1': '000000',
    'light1': 'FFFFFF',
    'dark2': '1F497D',
    'light2': 'EEECE1',
    'accent1': '4F81BD', // Standard Blue
    'accent2': 'C0504D', // Standard Red
    'accent3': '9BBB59', // Standard Green
    'accent4': '8064A2', // Standard Purple
    'accent5': '4BACC6', // Standard Aqua
    'accent6': 'F79646', // Standard Orange
    'hyperlink': '0000FF',
    'followedHyperlink': '800080'
  };

  class DocxToDocConverter {
    constructor() {
      this.domParser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
    }

    /**
     * Convert a .docx File/Blob into Word 2003 compatible .doc Blob
     * @param {File|Blob} file 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    async convertDocxToDoc(file, options = {}) {
      const opts = Object.assign({
        pageSize: 'a4',        // 'a4', 'legal', 'letter'
        preserveSutonny: true,
        optimizeForQuestionPaper: true,
        includeImages: true,
        onProgress: (percent, msg) => {}
      }, options);

      opts.onProgress(5, "ডকুমেন্ট প্যাকেজ লোড ও আনপ্যাক করা হচ্ছে...");
      let fileData = file;
      if (typeof Blob !== 'undefined' && file instanceof Blob) {
        fileData = await file.arrayBuffer();
      }
      const zip = await JSZip.loadAsync(fileData);

      opts.onProgress(20, "ডকুমেন্ট রিলেশন ও ইমেজ মেটাডাটা প্রসেস হচ্ছে...");
      const relsMap = await this._parseRelationships(zip);
      const mediaMap = await this._loadMediaFiles(zip, relsMap);

      opts.onProgress(35, "স্টাইল শিট ও থিম কালার বিশ্লেষণ হচ্ছে...");
      const stylesXmlStr = await this._getZipFileContent(zip, "word/styles.xml") || "";
      const styleResolver = this._buildStyleResolver(stylesXmlStr);

      opts.onProgress(50, "মূল টেক্সট, প্রশ্নপত্র ও টেবিল স্ট্রাকচার রূপান্তর হচ্ছে...");
      const docXmlStr = await this._getZipFileContent(zip, "word/document.xml");
      if (!docXmlStr) {
        throw new Error("অকার্যকর ওয়ার্ড ফাইল: word/document.xml পাওয়া যায়নি।");
      }

      const docXml = this.domParser.parseFromString(docXmlStr, "application/xml");
      const parsedBody = this._parseDocumentBody(docXml, styleResolver, mediaMap, opts);

      opts.onProgress(85, "অফিস ২০০৩ কমপ্লায়েন্ট (.doc) আর্কিটেকচার তৈরি হচ্ছে...");
      const docHtml = this._buildWord2003Document(parsedBody, opts);

      const docBlob = new Blob([docHtml], { type: "application/msword;charset=utf-8" });

      const baseName = file.name ? file.name.replace(/\.docx$/i, '') : 'Question_Paper';
      const outputFileName = `${baseName}_Word2003.doc`;

      opts.onProgress(100, "রূপান্তর সফলভাবে সম্পন্ন হয়েছে!");

      return {
        originalName: file.name || 'document.docx',
        outputFileName: outputFileName,
        blob: docBlob,
        convertedBlob: docBlob,
        preview: parsedBody.preview,
        stats: {
          paragraphs: parsedBody.stats.paragraphs,
          tables: parsedBody.stats.tables,
          runs: parsedBody.stats.runs,
          images: Object.keys(mediaMap).length
        }
      };
    }

    async _getZipFileContent(zip, path) {
      const entry = zip.file(path);
      if (!entry) return null;
      return await entry.async("string");
    }

    async _parseRelationships(zip) {
      const relsStr = await this._getZipFileContent(zip, "word/_rels/document.xml.rels");
      const relsMap = {};
      if (!relsStr) return relsMap;

      const relsDoc = this.domParser.parseFromString(relsStr, "application/xml");
      const rels = relsDoc.querySelectorAll("Relationship");
      for (let rel of rels) {
        const id = rel.getAttribute("Id");
        const target = rel.getAttribute("Target");
        const type = rel.getAttribute("Type");
        if (id && target) {
          relsMap[id] = { target, type };
        }
      }
      return relsMap;
    }

    async _loadMediaFiles(zip, relsMap) {
      const mediaMap = {};
      for (let id in relsMap) {
        const rel = relsMap[id];
        if (rel.type && rel.type.includes('/image')) {
          let targetPath = rel.target;
          if (targetPath.startsWith('/')) {
            targetPath = targetPath.substring(1);
          } else if (!targetPath.startsWith('word/')) {
            targetPath = 'word/' + targetPath;
          }

          const imgFile = zip.file(targetPath);
          if (imgFile) {
            try {
              const base64Data = await imgFile.async("base64");
              let mime = "image/png";
              if (targetPath.endsWith('.jpg') || targetPath.endsWith('.jpeg')) mime = "image/jpeg";
              else if (targetPath.endsWith('.gif')) mime = "image/gif";
              else if (targetPath.endsWith('.bmp')) mime = "image/bmp";
              
              mediaMap[id] = `data:${mime};base64,${base64Data}`;
            } catch (e) {
              console.warn("Failed to load image:", targetPath, e);
            }
          }
        }
      }
      return mediaMap;
    }

    _buildStyleResolver(stylesXmlStr) {
      const styles = {};
      const docDefaults = {
        fontFamily: 'SutonnyMJ',
        fontSizePt: 12,
        color: '000000',
        lineHeight: 1.15,
        spaceAfterPt: 0
      };

      if (!stylesXmlStr) {
        return { styles, docDefaults, resolve: () => ({}) };
      }

      const stylesDoc = this.domParser.parseFromString(stylesXmlStr, "application/xml");

      // Document Defaults
      const rPrDef = stylesDoc.querySelector("docDefaults > rPrDefault > rPr");
      if (rPrDef) {
        const sz = rPrDef.querySelector("sz");
        if (sz) {
          const v = parseInt(sz.getAttribute("w:val") || sz.getAttribute("val"), 10);
          if (v) docDefaults.fontSizePt = v / 2;
        }
        const col = rPrDef.querySelector("color");
        if (col) {
          const v = col.getAttribute("w:val") || col.getAttribute("val");
          if (v && v !== 'auto') docDefaults.color = v;
        }
        const rFonts = rPrDef.querySelector("rFonts");
        if (rFonts) {
          const ascii = rFonts.getAttribute("w:ascii") || rFonts.getAttribute("ascii");
          if (ascii) docDefaults.fontFamily = ascii;
        }
      }

      // Named Styles
      const styleNodes = stylesDoc.querySelectorAll("style");
      for (let sNode of styleNodes) {
        const styleId = sNode.getAttribute("w:styleId") || sNode.getAttribute("styleId");
        const type = sNode.getAttribute("w:type") || sNode.getAttribute("type");
        if (!styleId) continue;

        const sData = {
          styleId,
          type,
          isBold: false,
          isItalic: false,
          isUnderline: false,
          fontSizePt: null,
          color: null,
          fontFamily: null,
          align: null,
          spaceBeforePt: null,
          spaceAfterPt: null,
          lineHeight: null
        };

        const rPr = sNode.querySelector("rPr");
        if (rPr) {
          if (rPr.querySelector("b")) sData.isBold = true;
          if (rPr.querySelector("i")) sData.isItalic = true;
          if (rPr.querySelector("u")) sData.isUnderline = true;

          const sz = rPr.querySelector("sz");
          if (sz) {
            const v = parseInt(sz.getAttribute("w:val") || sz.getAttribute("val"), 10);
            if (v) sData.fontSizePt = v / 2;
          }

          const col = rPr.querySelector("color");
          if (col) {
            const v = col.getAttribute("w:val") || col.getAttribute("val");
            const themeCol = col.getAttribute("w:themeColor") || col.getAttribute("themeColor");
            if (v && v !== 'auto') {
              sData.color = v;
            } else if (themeCol && THEME_COLORS[themeCol]) {
              sData.color = THEME_COLORS[themeCol];
            }
          }

          const rFonts = rPr.querySelector("rFonts");
          if (rFonts) {
            sData.fontFamily = rFonts.getAttribute("w:ascii") || rFonts.getAttribute("ascii") || rFonts.getAttribute("w:cs");
          }
        }

        const pPr = sNode.querySelector("pPr");
        if (pPr) {
          const jc = pPr.querySelector("jc");
          if (jc) {
            const val = jc.getAttribute("w:val") || jc.getAttribute("val");
            if (val === 'center') sData.align = 'center';
            else if (val === 'right') sData.align = 'right';
            else if (val === 'both' || val === 'justify') sData.align = 'justify';
            else if (val === 'left') sData.align = 'left';
          }

          const spacing = pPr.querySelector("spacing");
          if (spacing) {
            const before = spacing.getAttribute("w:before") || spacing.getAttribute("before");
            const after = spacing.getAttribute("w:after") || spacing.getAttribute("after");
            const line = spacing.getAttribute("w:line") || spacing.getAttribute("line");
            if (before) sData.spaceBeforePt = parseInt(before, 10) / 20;
            if (after) sData.spaceAfterPt = parseInt(after, 10) / 20;
            if (line) sData.lineHeight = parseInt(line, 10) / 240;
          }
        }

        styles[styleId] = sData;
      }

      return {
        styles,
        docDefaults,
        resolve: (styleId) => styles[styleId] || null
      };
    }

    _parseDocumentBody(docXml, styleResolver, mediaMap, opts) {
      const body = docXml ? (docXml.querySelector("body") || docXml.documentElement) : null;
      let htmlParts = [];
      let previewLines = [];
      let stats = { paragraphs: 0, tables: 0, runs: 0 };

      // Page Setup & Margins from sectPr
      const sectPr = body ? body.querySelector("sectPr") : null;
      let pageSettings = this._parseSectionProperties(sectPr, opts);

      const children = body ? body.childNodes : [];
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.nodeType !== 1) continue;

        const nodeName = node.localName || node.nodeName.split(':').pop();

        if (nodeName === 'p') {
          const pData = this._parseParagraph(node, styleResolver, mediaMap, opts);
          htmlParts.push(pData.html);
          stats.paragraphs++;
          stats.runs += pData.runCount;
          if (pData.text && previewLines.length < 20) {
            previewLines.push(pData.text);
          }
        } else if (nodeName === 'tbl') {
          const tblData = this._parseTable(node, styleResolver, mediaMap, opts);
          htmlParts.push(tblData.html);
          stats.tables++;
          stats.paragraphs += tblData.stats.paragraphs;
          stats.runs += tblData.stats.runs;
        }
      }

      return {
        bodyHtml: htmlParts.join('\n'),
        pageSettings: pageSettings,
        preview: previewLines,
        stats: stats
      };
    }

    _parseSectionProperties(sectPr, opts) {
      let width = "8.27in";  // A4 default
      let height = "11.69in";
      let marginTop = "0.6in"; // Optimized for question papers
      let marginBottom = "0.6in";
      let marginLeft = "0.6in";
      let marginRight = "0.6in";
      let cols = 1;

      if (opts.pageSize === 'legal') {
        width = "8.5in";
        height = "14in";
      } else if (opts.pageSize === 'letter') {
        width = "8.5in";
        height = "11in";
      }

      if (sectPr) {
        const pgSz = sectPr.querySelector("pgSz");
        if (pgSz) {
          const wTwips = parseInt(pgSz.getAttribute("w:w") || pgSz.getAttribute("w"), 10);
          const hTwips = parseInt(pgSz.getAttribute("w:h") || pgSz.getAttribute("h"), 10);
          if (wTwips) width = (wTwips / 1440).toFixed(2) + "in";
          if (hTwips) height = (hTwips / 1440).toFixed(2) + "in";
        }

        const pgMar = sectPr.querySelector("pgMar");
        if (pgMar) {
          const topTwips = parseInt(pgMar.getAttribute("w:top") || pgMar.getAttribute("top"), 10);
          const bottomTwips = parseInt(pgMar.getAttribute("w:bottom") || pgMar.getAttribute("bottom"), 10);
          const leftTwips = parseInt(pgMar.getAttribute("w:left") || pgMar.getAttribute("left"), 10);
          const rightTwips = parseInt(pgMar.getAttribute("w:right") || pgMar.getAttribute("right"), 10);

          if (topTwips) marginTop = (topTwips / 1440).toFixed(2) + "in";
          if (bottomTwips) marginBottom = (bottomTwips / 1440).toFixed(2) + "in";
          if (leftTwips) marginLeft = (leftTwips / 1440).toFixed(2) + "in";
          if (rightTwips) marginRight = (rightTwips / 1440).toFixed(2) + "in";
        }

        const colsEl = sectPr.querySelector("cols");
        if (colsEl) {
          cols = parseInt(colsEl.getAttribute("w:num") || colsEl.getAttribute("num") || "1", 10);
        }
      }

      return {
        width,
        height,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        cols
      };
    }

    _parseParagraph(pNode, styleResolver, mediaMap, opts) {
      let pStyles = [];
      let align = 'left';
      let runCount = 0;
      let textContent = "";
      let inheritedStyle = null;

      const pPr = pNode.querySelector("pPr");
      if (pPr) {
        const pStyleNode = pPr.querySelector("pStyle");
        if (pStyleNode) {
          const sId = pStyleNode.getAttribute("w:val") || pStyleNode.getAttribute("val");
          inheritedStyle = styleResolver.resolve(sId);
          if (inheritedStyle) {
            if (inheritedStyle.align) align = inheritedStyle.align;
            if (inheritedStyle.spaceBeforePt !== null) pStyles.push(`margin-top:${inheritedStyle.spaceBeforePt}pt`);
            if (inheritedStyle.spaceAfterPt !== null) pStyles.push(`margin-bottom:${inheritedStyle.spaceAfterPt}pt`);
            if (inheritedStyle.lineHeight !== null) pStyles.push(`line-height:${inheritedStyle.lineHeight}`);
          }
        }

        const jc = pPr.querySelector("jc");
        if (jc) {
          const val = jc.getAttribute("w:val") || jc.getAttribute("val");
          if (val === 'center') align = 'center';
          else if (val === 'right') align = 'right';
          else if (val === 'both' || val === 'justify') align = 'justify';
          else if (val === 'left') align = 'left';
        }

        const spacing = pPr.querySelector("spacing");
        if (spacing) {
          const before = spacing.getAttribute("w:before") || spacing.getAttribute("before");
          const after = spacing.getAttribute("w:after") || spacing.getAttribute("after");
          const line = spacing.getAttribute("w:line") || spacing.getAttribute("line");

          if (before) pStyles.push(`margin-top:${(parseInt(before, 10)/20).toFixed(1)}pt`);
          if (after) pStyles.push(`margin-bottom:${(parseInt(after, 10)/20).toFixed(1)}pt`);
          if (line) pStyles.push(`line-height:${(parseInt(line, 10)/240).toFixed(2)}`);
        }

        const ind = pPr.querySelector("ind");
        if (ind) {
          const left = ind.getAttribute("w:left") || ind.getAttribute("left");
          const right = ind.getAttribute("w:right") || ind.getAttribute("right");
          const firstLine = ind.getAttribute("w:firstLine") || ind.getAttribute("firstLine");

          if (left) pStyles.push(`margin-left:${(parseInt(left, 10)/20).toFixed(1)}pt`);
          if (right) pStyles.push(`margin-right:${(parseInt(right, 10)/20).toFixed(1)}pt`);
          if (firstLine) pStyles.push(`text-indent:${(parseInt(firstLine, 10)/20).toFixed(1)}pt`);
        }
      }

      if (align !== 'left') {
        pStyles.push(`text-align:${align}`);
      }

      let runsHtml = [];
      const childNodes = pNode.childNodes;
      let inField = false;
      let fieldCode = "";

      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child.nodeType !== 1) continue;

        const childName = child.localName || child.nodeName.split(':').pop();

        if (childName === 'r') {
          const fldCharNode = child.querySelector("fldChar");
          const instrTextNode = child.querySelector("instrText");

          if (fldCharNode) {
            const type = fldCharNode.getAttribute("w:fldCharType") || fldCharNode.getAttribute("fldCharType");
            if (type === "begin") {
              inField = true;
              fieldCode = "";
              continue;
            } else if (type === "end") {
              if (inField) {
                const rawEq = fieldCode.trim();
                const cleanEq = rawEq.startsWith('EQ ') ? rawEq.slice(3).trim() : rawEq;
                const mathHtml = (typeof EquationConverter !== 'undefined' && typeof EquationConverter.latexToHtmlMath === 'function')
                  ? EquationConverter.latexToHtmlMath(cleanEq, isBijoy)
                  : `<span lang="EN-US" style="font-family:'Times New Roman',Arial,serif;">${this._escapeHtml(cleanEq)}</span>`;
                runsHtml.push(mathHtml);
                inField = false;
                fieldCode = "";
                runCount++;
                continue;
              }
            } else if (type === "separate") {
              continue;
            }
          }

          if (inField) {
            if (instrTextNode) {
              fieldCode += instrTextNode.textContent || "";
            } else {
              fieldCode += child.textContent || "";
            }
            continue;
          }

          const rData = this._parseRun(child, inheritedStyle, styleResolver, mediaMap, opts);
          runsHtml.push(rData.html);
          textContent += rData.text;
          runCount++;
        } else if (childName === 'hyperlink') {
          const rList = child.querySelectorAll("r");
          for (let r of rList) {
            const rData = this._parseRun(r, inheritedStyle, styleResolver, mediaMap, opts);
            runsHtml.push(rData.html);
            textContent += rData.text;
            runCount++;
          }
        }
      }

      // If empty paragraph, keep spacing
      if (runsHtml.length === 0) {
        runsHtml.push('&nbsp;');
      }

      const styleAttr = pStyles.length > 0 ? ` style="${pStyles.join(';')}"` : '';
      const html = `<p class="MsoNormal"${styleAttr}>${runsHtml.join('')}</p>`;

      return {
        html: html,
        text: textContent.trim(),
        runCount: runCount
      };
    }

    _parseRun(rNode, inheritedPStyle, styleResolver, mediaMap, opts) {
      let rStyles = [];
      
      // Start with Style Hierarchy: Doc Defaults -> Paragraph Style -> Run Style -> Direct Run Formatting
      let isBold = inheritedPStyle ? inheritedPStyle.isBold : false;
      let isItalic = inheritedPStyle ? inheritedPStyle.isItalic : false;
      let isUnderline = inheritedPStyle ? inheritedPStyle.isUnderline : false;
      let fontSizePt = inheritedPStyle ? inheritedPStyle.fontSizePt : (styleResolver.docDefaults.fontSizePt || 12);
      let colorHex = inheritedPStyle ? inheritedPStyle.color : (styleResolver.docDefaults.color || null);
      let fontFamily = inheritedPStyle ? (inheritedPStyle.fontFamily || 'SutonnyMJ') : 'SutonnyMJ';
      let bgColor = null;

      const rPr = rNode.querySelector("rPr");
      if (rPr) {
        // Run Style inheritance
        const rStyleNode = rPr.querySelector("rStyle");
        if (rStyleNode) {
          const rStyleId = rStyleNode.getAttribute("w:val") || rStyleNode.getAttribute("val");
          const rStyle = styleResolver.resolve(rStyleId);
          if (rStyle) {
            if (rStyle.isBold) isBold = true;
            if (rStyle.isItalic) isItalic = true;
            if (rStyle.isUnderline) isUnderline = true;
            if (rStyle.fontSizePt) fontSizePt = rStyle.fontSizePt;
            if (rStyle.color) colorHex = rStyle.color;
            if (rStyle.fontFamily) fontFamily = rStyle.fontFamily;
          }
        }

        // Direct Formatting overrides
        const b = rPr.querySelector("b");
        if (b) {
          const val = b.getAttribute("w:val") || b.getAttribute("val");
          isBold = (val !== '0' && val !== 'false');
        }

        const it = rPr.querySelector("i");
        if (it) {
          const val = it.getAttribute("w:val") || it.getAttribute("val");
          isItalic = (val !== '0' && val !== 'false');
        }

        const u = rPr.querySelector("u");
        if (u) {
          const val = u.getAttribute("w:val") || u.getAttribute("val");
          isUnderline = (val && val !== 'none');
        }

        const sz = rPr.querySelector("sz, szCs");
        if (sz) {
          const halfPoints = parseInt(sz.getAttribute("w:val") || sz.getAttribute("val"), 10);
          if (halfPoints) {
            fontSizePt = halfPoints / 2;
          }
        }

        const color = rPr.querySelector("color");
        if (color) {
          const colVal = color.getAttribute("w:val") || color.getAttribute("val");
          const themeCol = color.getAttribute("w:themeColor") || color.getAttribute("themeColor");
          if (colVal && colVal !== 'auto') {
            colorHex = colVal;
          } else if (themeCol && THEME_COLORS[themeCol]) {
            colorHex = THEME_COLORS[themeCol];
          }
        }

        const rFonts = rPr.querySelector("rFonts");
        if (rFonts) {
          const ascii = rFonts.getAttribute("w:ascii") || rFonts.getAttribute("ascii");
          const cs = rFonts.getAttribute("w:cs") || rFonts.getAttribute("cs");
          const hAnsi = rFonts.getAttribute("w:hAnsi") || rFonts.getAttribute("hAnsi");
          fontFamily = ascii || cs || hAnsi || fontFamily;
        }

        const highlight = rPr.querySelector("highlight");
        if (highlight) {
          const hlVal = highlight.getAttribute("w:val") || highlight.getAttribute("val");
          if (hlVal && hlVal !== 'none') bgColor = hlVal;
        }

        const shd = rPr.querySelector("shd");
        if (shd) {
          const fill = shd.getAttribute("w:fill") || shd.getAttribute("fill");
          if (fill && fill !== 'auto' && fill !== 'none') bgColor = `#${fill}`;
        }
      }

      // Format Specifications for Word 2003
      if (fontSizePt) {
        rStyles.push(`font-size:${fontSizePt}pt`);
        rStyles.push(`mso-bidi-font-size:${fontSizePt}pt`);
        rStyles.push(`mso-font-size:${fontSizePt}pt`);
      }

      if (colorHex) {
        const safeHex = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
        rStyles.push(`color:${safeHex}`);
        rStyles.push(`mso-color:${safeHex}`);
      }

      if (bgColor) {
        rStyles.push(`background-color:${bgColor}`);
        rStyles.push(`mso-highlight:${bgColor}`);
      }

      // Extract Text Content
      let textContent = "";
      let htmlContent = "";
      const textNodes = rNode.querySelectorAll("t, tab, br");

      for (let t of textNodes) {
        const tName = t.localName || t.nodeName.split(':').pop();
        if (tName === 't') {
          textContent += t.textContent || "";
          htmlContent += this._escapeHtml(t.textContent || "");
        } else if (tName === 'tab') {
          textContent += "\t";
          htmlContent += '<span style="mso-tab-count:1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
        } else if (tName === 'br') {
          textContent += "\n";
          htmlContent += '<br/>\n';
        }
      }

      // Ensure SutonnyMJ / Bijoy font family is preserved with full fidelity for Word 2003 (.doc)
      if (!fontFamily) {
        fontFamily = opts.preserveSutonny ? 'SutonnyMJ' : 'Times New Roman';
      }

      // Check if run is SutonnyMJ/Bijoy vs English/Math
      const isSutonnyRun = (fontFamily && (fontFamily.includes('Sutonny') || fontFamily.includes('Bijoy') || fontFamily.includes('Bangla'))) || (opts.preserveSutonny && fontFamily !== 'Times New Roman' && fontFamily !== 'Cambria Math');
      const effectiveAsciiFont = isSutonnyRun ? 'SutonnyMJ' : 'Times New Roman';
      const effectiveBidiFont = isSutonnyRun ? 'SutonnyMJ' : (fontFamily || 'Kalpurush');

      // Font family declarations with proper dual-font binding
      rStyles.push(`font-family:'${effectiveAsciiFont}',SutonnyMJ,Arial,sans-serif`);
      rStyles.push(`mso-ascii-font-family:'${effectiveAsciiFont}'`);
      rStyles.push(`mso-hansi-font-family:'${effectiveAsciiFont}'`);
      rStyles.push(`mso-bidi-font-family:'${effectiveBidiFont}'`);

      if (isBold) rStyles.push(`font-weight:bold;mso-bidi-font-weight:bold`);
      if (isItalic) rStyles.push(`font-style:italic;mso-bidi-font-style:italic`);
      if (isUnderline) rStyles.push(`text-decoration:underline`);

      // Check for Drawings / Images inside Run
      let imagesHtml = "";
      const blips = rNode.querySelectorAll("blip, [r\\:embed]");
      for (let blip of blips) {
        const embedId = blip.getAttribute("r:embed") || blip.getAttribute("embed");
        if (embedId && mediaMap[embedId]) {
          imagesHtml += `<img src="${mediaMap[embedId]}" style="max-width:100%;height:auto;display:inline-block;margin:3pt 0;" alt="Question Image" />`;
        }
      }

      let escapedText = htmlContent;

      const styleAttr = rStyles.length > 0 ? ` style="${rStyles.join(';')}"` : '';
      const html = `${imagesHtml}<span${styleAttr}>${escapedText}</span>`;

      return {
        html: html,
        text: textContent
      };
    }

    _parseTable(tblNode, styleResolver, mediaMap, opts) {
      const tblPr = tblNode.querySelector("tblPr");
      let hasBorders = false;
      if (tblPr) {
        const tblBorders = tblPr.querySelector("tblBorders");
        if (tblBorders) {
          const borders = tblBorders.querySelectorAll("top, left, bottom, right, insideH, insideV");
          for (let b of Array.from(borders)) {
            const val = b.getAttribute("w:val") || b.getAttribute("val");
            if (val && val !== 'none' && val !== 'nil') {
              hasBorders = true;
              break;
            }
          }
        }
        const tblStyle = tblPr.querySelector("tblStyle");
        if (tblStyle) {
          const styleVal = (tblStyle.getAttribute("w:val") || tblStyle.getAttribute("val") || '').toLowerCase();
          if (styleVal.includes('grid') || styleVal.includes('tablegrid') || styleVal.includes('border')) {
            hasBorders = true;
          }
        }
      }

      let tblStyles = [
        'border-collapse:collapse',
        'mso-table-layout-alt:fixed',
        hasBorders ? 'border:solid windowtext 1.0pt' : 'border:none',
        hasBorders ? 'mso-border-alt:solid windowtext .5pt' : 'mso-border-alt:none',
        'mso-padding-alt:0in 5.4pt 0in 5.4pt',
        'width:100%'
      ];

      let stats = { paragraphs: 0, runs: 0 };
      let rowsHtml = [];

      const rows = tblNode.querySelectorAll(":scope > tr, :scope > tblRow, tr");
      for (let r = 0; r < rows.length; r++) {
        const trNode = rows[r];
        let cellsHtml = [];

        const cells = trNode.querySelectorAll(":scope > tc, :scope > tblCell, tc");
        for (let c = 0; c < cells.length; c++) {
          const tcNode = cells[c];
          let tcStyles = [
            'padding:3.5pt 5.5pt',
            hasBorders ? 'border:solid windowtext 1.0pt' : 'border:none',
            hasBorders ? 'mso-border-alt:solid windowtext .5pt' : 'mso-border-alt:none',
            'vertical-align:top'
          ];
          let colSpanAttr = '';
          let rowSpanAttr = '';

          // Parse cell properties
          const tcPr = tcNode.querySelector("tcPr");
          if (tcPr) {
            const shd = tcPr.querySelector("shd");
            if (shd) {
              const fill = shd.getAttribute("w:fill") || shd.getAttribute("fill");
              if (fill && fill !== 'auto' && fill !== 'none') {
                tcStyles.push(`background-color:#${fill}`);
                tcStyles.push(`mso-shading:#${fill}`);
              }
            }

            const tcW = tcPr.querySelector("tcW");
            if (tcW) {
              const w = tcW.getAttribute("w:w") || tcW.getAttribute("w");
              if (w && parseInt(w, 10) > 0) {
                tcStyles.push(`width:${(parseInt(w, 10)/20).toFixed(1)}pt`);
              }
            }

            const vAlign = tcPr.querySelector("vAlign");
            if (vAlign) {
              const va = vAlign.getAttribute("w:val") || vAlign.getAttribute("val");
              if (va === 'center') tcStyles.push('vertical-align:middle');
              else if (va === 'bottom') tcStyles.push('vertical-align:bottom');
            }

            const gridSpan = tcPr.querySelector("gridSpan");
            if (gridSpan) {
              const spanVal = gridSpan.getAttribute("w:val") || gridSpan.getAttribute("val");
              if (spanVal && parseInt(spanVal, 10) > 1) {
                colSpanAttr = ` colspan="${spanVal}"`;
              }
            }
          }

          // Parse cell paragraphs
          let pList = tcNode.querySelectorAll("p");
          let cellInnerHtml = [];

          for (let p of pList) {
            const pData = this._parseParagraph(p, styleResolver, mediaMap, opts);
            cellInnerHtml.push(pData.html);
            stats.paragraphs++;
            stats.runs += pData.runCount;
          }

          if (cellInnerHtml.length === 0) {
            cellInnerHtml.push('<p class="MsoNormal">&nbsp;</p>');
          }

          cellsHtml.push(`<td${colSpanAttr}${rowSpanAttr} style="${tcStyles.join(';')}">${cellInnerHtml.join('')}</td>`);
        }

        rowsHtml.push(`<tr>${cellsHtml.join('')}</tr>`);
      }

      const html = `<table class="MsoNormalTable" style="${tblStyles.join(';')}">${rowsHtml.join('\n')}</table>`;

      return {
        html: html,
        stats: stats
      };
    }

    _buildWord2003Document(parsedBody, opts) {
      const page = parsedBody.pageSettings;

      return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 11">
<meta name="Originator" content="Microsoft Word 11">
<!--[if gte mso 9]>
<xml>
 <o:DocumentProperties>
  <o:Author>Fayzar Computer</o:Author>
  <o:LastAuthor>Fayzar Computer</o:LastAuthor>
  <o:Revision>1</o:Revision>
  <o:TotalTime>1</o:TotalTime>
  <o:Created>${new Date().toISOString()}</o:Created>
  <o:LastSaved>${new Date().toISOString()}</o:LastSaved>
  <o:Pages>1</o:Pages>
  <o:Words>100</o:Words>
  <o:Characters>600</o:Characters>
  <o:Company>Fayzar Computer</o:Company>
  <o:Lines>30</o:Lines>
  <o:Paragraphs>15</o:Paragraphs>
  <o:CharactersWithSpaces>750</o:CharactersWithSpaces>
  <o:Version>11.9999</o:Version>
 </o:DocumentProperties>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:SpellingState>Clean</w:SpellingState>
  <w:GrammarState>Clean</w:GrammarState>
  <w:ValidateAgainstSubstances/>
  <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
  <w:IgnoreMarketStoreErrors>false</w:IgnoreMarketStoreErrors>
  <w:Compatibility>
   <w:BreakWrappedTables/>
   <w:SnapToGridInCell/>
   <w:WrapTextWithPunct/>
   <w:UseAsianBreakRules/>
   <w:DontGrowAutofit/>
   <w:UseFELayout/>
  </w:Compatibility>
  <w:BrowserLevel>MicrosoftInternetExplorer4</w:BrowserLevel>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
<!--
 /* Font Definitions */
 @font-face
	{font-family:SutonnyMJ;
	panose-1:2 11 6 4 2 2 2 2 2 4;
	mso-font-alt:"SutonnyMJ";
	mso-font-charset:0;
	mso-generic-font-family:auto;
	mso-font-pitch:variable;
	mso-font-signature:3 0 0 0 1 0;}
 @font-face
	{font-family:SutonnyOMJ;
	panose-1:2 11 6 4 2 2 2 2 2 4;
	mso-font-alt:"SutonnyOMJ";
	mso-font-charset:0;
	mso-generic-font-family:auto;
	mso-font-pitch:variable;
	mso-font-signature:3 0 0 0 1 0;}
 @font-face
	{font-family:Kalpurush;
	panose-1:2 11 6 4 2 2 2 2 2 4;
	mso-font-alt:"Kalpurush";
	mso-font-charset:0;
	mso-generic-font-family:auto;
	mso-font-pitch:variable;
	mso-font-signature:3 0 0 0 1 0;}
 @font-face
	{font-family:"Times New Roman";
	panose-1:2 2 6 3 5 4 5 2 3 4;
	mso-font-charset:0;
	mso-generic-font-family:roman;
	mso-font-pitch:variable;
	mso-font-signature:-536870145 1107305727 0 0 415 0;}

 /* Style Definitions */
 p.MsoNormal, li.MsoNormal, div.MsoNormal
	{mso-style-parent:"";
	margin:0in;
	margin-bottom:.0001pt;
	mso-pagination:widow-orphan;
	font-size:12.0pt;
	font-family:"SutonnyMJ",Arial,sans-serif;
	mso-ascii-font-family:"Times New Roman";
	mso-hansi-font-family:"Times New Roman";
	mso-fareast-font-family:"Times New Roman";
	mso-bidi-font-family:"SutonnyMJ";}
 table.MsoNormalTable
	{mso-style-name:"Table Normal";
	mso-tstyle-rowband-size:0;
	mso-tstyle-colband-size:0;
	mso-style-noshow:yes;
	mso-style-parent:"";
	mso-padding-alt:0in 5.4pt 0in 5.4pt;
	mso-para-margin:0in;
	mso-para-margin-bottom:.0001pt;
	mso-pagination:widow-orphan;
	font-size:10.0pt;
	font-family:"Times New Roman";
	mso-ansi-language:#0400;
	mso-fareast-language:#0400;
	mso-bidi-language:#0400;}
 @page Section1
	{size:${page.width} ${page.height};
	margin:${page.marginTop} ${page.marginRight} ${page.marginBottom} ${page.marginLeft};
	mso-header-margin:.5in;
	mso-footer-margin:.5in;
	mso-paper-source:0;}
 div.Section1
	{page:Section1;}
-->
</style>
</head>
<body lang="EN-US" style="tab-interval:.5in">
<div class="Section1">
${parsedBody.bodyHtml}
</div>
</body>
</html>`;
    }

    _escapeHtml(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  const docxToDocEngine = new DocxToDocConverter();
  DocxToDocConverter.convertDocxToDoc = (docxInput, opts) => docxToDocEngine.convertDocxToDoc(docxInput, opts);

  if (typeof window !== 'undefined') {
    window.DocxToDocConverter = DocxToDocConverter;
    window.docxToDocEngine = docxToDocEngine;
  }
  if (typeof global !== 'undefined') {
    global.DocxToDocConverter = DocxToDocConverter;
    global.docxToDocEngine = docxToDocEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocxToDocConverter;
  }

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
