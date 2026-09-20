import unittest
import subprocess
import json
import re

class TestDashHyphenPreservation(unittest.TestCase):
    def setUp(self):
        self.cwd = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web'

    def run_node_code(self, code):
        cmd = ['node', '-e', code]
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', cwd=self.cwd)
        if proc.returncode != 0:
            raise RuntimeError(f"Node execution failed: {proc.stderr}\nCode:\n{code}")
        return proc.stdout.strip()

    def test_split_bijoy_and_english_separates_hyphen(self):
        """splitBijoyAndEnglish must separate trailing or isolated hyphens into type english"""
        code = """
        const fs = require('fs');
        eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf-8'));
        const input = '20| mvjvZ Gi kvwãK/AwfavwbK A_©-';
        const segments = BanglaConverter.splitBijoyAndEnglish(input);
        console.log(JSON.stringify(segments));
        """
        out = json.loads(self.run_node_code(code))
        self.assertEqual(out[-1]['type'], 'english')
        self.assertIn('-', out[-1]['text'])

    def test_split_mixed_separates_en_and_em_dashes(self):
        """splitMixedBengaliAndEnglish must separate en-dash (–), em-dash (—), and hyphen (-) into type english"""
        code = """
        const fs = require('fs');
        eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf-8'));
        const cases = [
            'কোনটি সঠিক-',
            'কোনটি সঠিক\u2013', // en-dash
            'কোনটি সঠিক\u2014', // em-dash
            '২০। সালাত এর শাব্দিক/অভিধানিক অর্থ-'
        ];
        const res = cases.map(c => BanglaConverter.splitMixedBengaliAndEnglish(c));
        console.log(JSON.stringify(res));
        """
        out = json.loads(self.run_node_code(code))
        for segs in out:
            # Last segment must be english and contain a dash
            self.assertEqual(segs[-1]['type'], 'english')
            self.assertRegex(segs[-1]['text'], r'[-–—−‒―]')

    def test_create_doc_from_text_routes_hyphen_to_times_new_roman(self):
        """DocxHandler.createDocFromText with Bijoy and Unicode inputs must route dashes to Times New Roman, NOT SutonnyMJ"""
        code = """
        const fs = require('fs');
        eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf-8'));
        eval(fs.readFileSync('js/docx-handler.js', 'utf-8'));
        
        async function run() {
            // Test Case 1: Already Bijoy input
            const blob1 = DocxHandler.createDocFromText('20| mvjvZ Gi kvwãK/AwfavwbK A_©-');
            const html1 = await blob1.text();

            // Test Case 2: Unicode input converted to Bijoy
            const blob2 = DocxHandler.createDocFromText('২০। সালাত এর শাব্দিক/অভিধানিক অর্থ-', 'SutonnyMJ', true);
            const html2 = await blob2.text();

            // Test Case 3: En-dash and Em-dash in Unicode
            const blob3 = DocxHandler.createDocFromText('কোনটি সঠিক\u2013', 'SutonnyMJ', true);
            const html3 = await blob3.text();

            console.log(JSON.stringify({ html1, html2, html3 }));
        }
        run();
        """
        out = json.loads(self.run_node_code(code))
        for key in ['html1', 'html2', 'html3']:
            html = out[key]
            self.assertIn("font-family:'Times New Roman", html)
            # Ensure no SutonnyMJ span wraps a dash
            self.assertFalse(
                ">A_©-<" in html or ">mvjvZ Gi kvwãK/AwfavwbK A_©-<" in html or
                ("font-family:'SutonnyMJ" in html and "mwVK-" in html)
            )

    def test_create_docx_from_text_routes_hyphen_to_times_new_roman(self):
        """DocxHandler.createDocxFromText with Bijoy input must route hyphen to Times New Roman in word/document.xml"""
        code = """
        const fs = require('fs');
        global.JSZip = require('./js/jszip.min.js');
        eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf-8'));
        eval(fs.readFileSync('js/docx-handler.js', 'utf-8'));
        
        async function run() {
            const blob = await DocxHandler.createDocxFromText('20| mvjvZ Gi kvwãK/AwfavwbK A_©-', { isBijoy: true });
            const buf = await blob.arrayBuffer();
            const zip = await JSZip.loadAsync(buf);
            const xml = await zip.file('word/document.xml').async('string');
            console.log(JSON.stringify({ xml }));
        }
        run();
        """
        out = json.loads(self.run_node_code(code))
        xml = out['xml']
        self.assertNotIn('w:ascii="SutonnyMJ" w:hAnsi="SutonnyMJ" w:cs="SutonnyMJ" w:hint="ascii"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">20| mvjvZ Gi kvwãK/AwfavwbK A_©-</w:t>', xml)
        self.assertIn('w:ascii="Times New Roman"', xml)

    def test_user_exact_screenshot_questions(self):
        """User screenshot questions with hyphens must NEVER have SutonnyMJ on hyphens in DOC or DOCX"""
        code = """
        const fs = require('fs');
        global.JSZip = require('./js/jszip.min.js');
        eval(fs.readFileSync('js/bangla-converter-engine.js', 'utf-8'));
        eval(fs.readFileSync('js/docx-handler.js', 'utf-8'));
        
        const lines = [
            '২০। সালাত এর শাব্দিক/অভিধানিক অর্থ-',
            '২১। যথা সময়ে সালাত আদায় করা-',
            'কোনটি সঠিক-',
            '২২। কুরআন মজিদ কত বছরে নাযিল হয়েছিল-'
        ];

        async function run() {
            const results = [];
            for (const line of lines) {
                // Test 1: DOC export (Word 2003)
                const docBlob = DocxHandler.createDocFromText(line, 'SutonnyMJ', true);
                const html = await docBlob.text();

                // Test 2: DOCX export
                const docxBlob = await DocxHandler.createDocxFromText(line, { isBijoy: true });
                const buf = await docxBlob.arrayBuffer();
                const zip = await JSZip.loadAsync(buf);
                const xml = await zip.file('word/document.xml').async('string');

                results.push({ line, html, xml });
            }
            console.log(JSON.stringify(results));
        }
        run();
        """
        out = json.loads(self.run_node_code(code))
        for item in out:
            html = item['html']
            xml = item['xml']
            # DOC check
            self.assertIn("font-family:'Times New Roman", html, f"Times New Roman missing in doc for {item['line']}")
            self.assertNotIn("SutonnyMJ", html.split('<span lang="EN-US"')[-1], f"SutonnyMJ after dash in {item['line']}")
            # DOCX check
            self.assertIn('w:ascii="Times New Roman"', xml, f"Times New Roman missing in docx for {item['line']}")
            # Hyphen must NOT be in a SutonnyMJ run
            self.assertFalse(
                re.search(r'<w:rPr>[^<]*<w:rFonts[^>]*SutonnyMJ[^>]*>[^<]*<\/w:rPr>[^<]*<w:t[^>]*>[^<]*-+[^<]*<\/w:t>', xml),
                f"SutonnyMJ run contains hyphen in docx for {item['line']}"
            )

if __name__ == '__main__':
    unittest.main()

