import unittest
import os
import subprocess
import json

class TestMcqStandardFormat(unittest.TestCase):
    def setUp(self):
        self.web_docx_handler = './js/docx-handler.js'
        self.web_ai_ocr = './js/ai-ocr-engine.js'

    def run_node_code(self, code):
        cmd = ['node', '-e', code]
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', cwd=r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web')
        if proc.returncode != 0:
            raise RuntimeError(f"Node execution failed: {proc.stderr}")
        return proc.stdout.strip()

    def test_mcq_brackets_to_dots_with_leading_tab(self):
        """(ক), (খ), (গ), (ঘ) must convert to \\tক. ...\\tখ. ...\\tগ. ...\\tঘ. ..."""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input = '(ক) ঢাকা (খ) চট্টগ্রাম (গ) রাজশাহী (ঘ) সিলেট';
        const output = DocxHandler.formatMcqLineTabs(input);
        console.log(JSON.stringify(output));
        """
        out = json.loads(self.run_node_code(code))
        expected = "\tক. ঢাকা\tখ. চট্টগ্রাম\tগ. রাজশাহী\tঘ. সিলেট"
        self.assertEqual(out, expected)

    def test_mcq_single_parenthesis_to_dots(self):
        """ক) ঢাকা খ) চট্টগ্রাম must convert to \\tক. ঢাকা\\tখ. চট্টগ্রাম"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input = 'ক) ঢাকা খ) চট্টগ্রাম';
        const output = DocxHandler.formatMcqLineTabs(input);
        console.log(JSON.stringify(output));
        """
        out = json.loads(self.run_node_code(code))
        expected = "\tক. ঢাকা\tখ. চট্টগ্রাম"
        self.assertEqual(out, expected)

    def test_mcq_two_line_layout(self):
        """Line 1: (ক) ঢাকা (খ) চট্টগ্রাম -> \\tক. ঢাকা\\tখ. চট্টগ্রাম
           Line 2: (গ) রাজশাহী (ঘ) সিলেট -> \\tগ. রাজশাহী\\tঘ. সিলেট"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const line1 = DocxHandler.formatMcqLineTabs('(ক) ঢাকা (খ) চট্টগ্রাম');
        const line2 = DocxHandler.formatMcqLineTabs('(গ) রাজশাহী (ঘ) সিলেট');
        console.log(JSON.stringify({{ line1, line2 }}));
        """
        out = json.loads(self.run_node_code(code))
        self.assertEqual(out['line1'], "\tক. ঢাকা\tখ. চট্টগ্রাম")
        self.assertEqual(out['line2'], "\tগ. রাজশাহী\tঘ. সিলেট")

    def test_bijoy_mcq_dots_and_tabs(self):
        """Bijoy (K) exR (L) Mevw` -> \\tK. exR\\tL. Mevw`"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input = '(K) exR (L) Mevw` cï (M) gvwU (N) KzVvi';
        const output = DocxHandler.formatMcqLineTabs(input);
        console.log(JSON.stringify(output));
        """
        out = json.loads(self.run_node_code(code))
        expected = "\tK. exR\tL. Mevw` cï\tM. gvwU\tN. KzVvi"
        self.assertEqual(out, expected)

    def test_bengali_question_serial_to_dari(self):
        """Bengali question serial: '১. প্রশ্ন...' or '১) প্রশ্ন...' -> '১। প্রশ্ন...' or Bijoy '1|'"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input1 = '১. মানুষ উৎপাদনের হাতিয়ার হিসেবে কী ব্যবহার করেছে?';
        const output1 = DocxHandler.formatQuestionNumber(input1);
        const input2 = '১) মানুষ উৎপাদনের হাতিয়ার...';
        const output2 = DocxHandler.formatQuestionNumber(input2);
        console.log(JSON.stringify({{ output1, output2 }}));
        """
        out = json.loads(self.run_node_code(code))
        self.assertTrue(out['output1'].startswith('১। '))
        self.assertTrue(out['output2'].startswith('১। '))

    def test_english_question_serial_preserved(self):
        """English question serial: '1. What is the capital of Bangladesh?' must remain '1. ' (NOT '1। ' or '1| ')"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input = '1. What is the capital of Bangladesh?';
        const output = DocxHandler.formatQuestionNumber(input);
        console.log(JSON.stringify(output));
        """
        out = json.loads(self.run_node_code(code))
        self.assertEqual(out, '1. What is the capital of Bangladesh?')

    def test_english_mcq_options_preserved_without_bangla_dots(self):
        """English options like '(a) Dhaka (b) Chittagong' should not force Bengali 'ক.'"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input = '(a) Dhaka (b) Chittagong (c) Rajshahi (d) Sylhet';
        const output = DocxHandler.formatMcqLineTabs(input);
        console.log(JSON.stringify(output));
        """
        out = json.loads(self.run_node_code(code))
        self.assertNotIn('ক.', out)

    def test_cq_sub_question_to_dot(self):
        """Creative question sub-question '(ক) উদ্দীপকের...' -> 'ক. উদ্দীপকের...'"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input = '(ক) উদ্দীপকের আলোকে ব্যাখ্যা কর।';
        const output = DocxHandler.formatCqSubQuestion(input);
        console.log(JSON.stringify(output));
        """
        out = json.loads(self.run_node_code(code))
        self.assertTrue(out.startswith('ক. '))

    def test_english_sub_questions_preserved(self):
        """English sub-questions e.g. '(a) Write a letter' should NOT convert to Bengali 'ক.'"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input = '(a) Write a letter to your friend about your aim in life.';
        const output = DocxHandler.formatCqSubQuestion(input);
        console.log(JSON.stringify(output));
        """
        out = json.loads(self.run_node_code(code))
        self.assertEqual(out, '(a) Write a letter to your friend about your aim in life.')

    def test_english_quoted_question_preserved(self):
        """English question starting with quotes '1. "Honesty is the best policy"' must remain untouched"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input = '1. "Honesty is the best policy" - Explain in 5 sentences.';
        const output = DocxHandler.formatQuestionNumber(input);
        console.log(JSON.stringify(output));
        """
        out = json.loads(self.run_node_code(code))
        self.assertEqual(out, '1. "Honesty is the best policy" - Explain in 5 sentences.')

    def test_vertical_single_option_per_line(self):
        """Vertical layout where each option is on its own line:
           (ক) ঢাকা -> \\tক. ঢাকা
           (খ) চট্টগ্রাম -> \\tখ. চট্টগ্রাম
           (গ) রাজশাহী -> \\tগ. রাজশাহী
           (ঘ) সিলেট -> \\tঘ. সিলেট"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const l1 = DocxHandler.formatQuestionPaperLine('(ক) ঢাকা');
        const l2 = DocxHandler.formatQuestionPaperLine('(খ) চট্টগ্রাম');
        const l3 = DocxHandler.formatQuestionPaperLine('(গ) রাজশাহী');
        const l4 = DocxHandler.formatQuestionPaperLine('(ঘ) সিলেট');
        console.log(JSON.stringify({{ l1, l2, l3, l4 }}));
        """
        out = json.loads(self.run_node_code(code))
        self.assertEqual(out['l1'], "\tক. ঢাকা")
        self.assertEqual(out['l2'], "\tখ. চট্টগ্রাম")
        self.assertEqual(out['l3'], "\tগ. রাজশাহী")
        self.assertEqual(out['l4'], "\tঘ. সিলেট")

    def test_format_question_paper_full_document(self):
        """Full question paper document formatting with English protection and Bengali formatting"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('./js/bangla-converter-engine.js', 'utf-8'));
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const doc = [
            '১. মানুষ উৎপাদনের হাতিয়ার হিসেবে কী ব্যবহার করেছে?',
            '(ক) তীর (খ) বল্লম (গ) পাথর (ঘ) লাঠি',
            '২. নিচের উদ্দীপকটি পড় এবং প্রশ্নের উত্তর দাও:',
            'ক) সমাজবিজ্ঞান কাকে বলে?',
            'খ) সংস্কৃতির উপাদান কয়টি ও কী কী?',
            '1. Write a paragraph on "A Winter Morning".',
            '(a) What is a winter morning?',
            '(b) How do people feel in the cold?'
        ].join('\\n');

        const formatted = DocxHandler.formatQuestionPaper(doc);
        console.log(JSON.stringify(formatted));
        """
        out = json.loads(self.run_node_code(code))
        lines = out.split('\n')
        # Line 0: Bengali Q1 serial must have Dari
        self.assertTrue(lines[0].startswith('১। '))
        # Line 1: MCQ options must have leading tab and dots
        self.assertEqual(lines[1], "\tক. তীর\tখ. বল্লম\tগ. পাথর\tঘ. লাঠি")
        # Line 2: Bengali Q2 serial must have Dari
        self.assertTrue(lines[2].startswith('২। '))
        # Line 3 & 4: CQ sub-questions must have dot without brackets
        self.assertTrue(lines[3].startswith('ক. '))
        self.assertTrue(lines[4].startswith('খ. '))
        # Line 5: English question 1 must remain standard untouched
        self.assertEqual(lines[5], '1. Write a paragraph on "A Winter Morning".')
        # Line 6 & 7: English sub-questions must remain standard untouched
        self.assertEqual(lines[6], '(a) What is a winter morning?')
        self.assertEqual(lines[7], '(b) How do people feel in the cold?')

    def test_doc_export_contains_formatted_tabs_and_serials(self):
        """DocxHandler.createDocFromText must produce mso-tab-count:1 and formatted serials"""
        code = f"""
        const fs = require('fs');
        eval(fs.readFileSync('./js/bangla-converter-engine.js', 'utf-8'));
        eval(fs.readFileSync('{self.web_docx_handler.replace('\\\\', '/')}', 'utf-8'));
        const input = '১. প্রশ্ন\\n(ক) ঢাকা (খ) রাজশাহী';
        const docBlob = DocxHandler.createDocFromText(input, 'SutonnyMJ', true);
        console.log(JSON.stringify({{ size: docBlob.size, hasTab: docBlob._content ? docBlob._content.includes('mso-tab-count:1') : true }}));
        """
        out = json.loads(self.run_node_code(code))
        self.assertTrue(out['size'] > 100)

    def test_clean_ocr_response_integration(self):
        handler_path = self.web_docx_handler.replace('\\', '/')
        ai_ocr_path = self.web_ai_ocr.replace('\\', '/')
        code = (
            "global.window = global;\n"
            "global.document = { readyState: 'complete', addEventListener: () => {}, getElementById: () => null };\n"
            "global.localStorage = { getItem: () => null, setItem: () => {} };\n"
            "const fs = require('fs');\n"
            "eval(fs.readFileSync('./js/bangla-converter-engine.js', 'utf-8'));\n"
            f"eval(fs.readFileSync('{handler_path}', 'utf-8'));\n"
            f"eval(fs.readFileSync('{ai_ocr_path}', 'utf-8'));\n"
            "const input = [\n"
            "    '১. মানুষ উৎপাদনের হাতিয়ার হিসেবে কী ব্যবহার করেছে?',\n"
            "    '(ক) তীর (খ) বল্লম (গ) পাথর (ঘ) লাঠি',\n"
            "    '1. What is the capital of Bangladesh?',\n"
            "    '(a) Dhaka (b) Chittagong'\n"
            "].join('\\n');\n"
            "const cleaned = global.FayzarAiOcrEngine.cleanOcrResponse(input);\n"
            "console.log(JSON.stringify(cleaned));\n"
        )
        
        out = json.loads(self.run_node_code(code))
        lines = out.split('\n')
        # Bengali Q1 must have Dari
        self.assertTrue(lines[0].startswith('১। '))
        # MCQ options must have leading tab and dots
        self.assertEqual(lines[1], "\tক. তীর\tখ. বল্লম\tগ. পাথর\tঘ. লাঠি")
        # English Q1 must remain standard
        self.assertEqual(lines[2], '1. What is the capital of Bangladesh?')
        # English options must remain standard untouched
        self.assertEqual(lines[3], '(a) Dhaka (b) Chittagong')

    def test_decimal_clause_numbering_not_converted_to_dari(self):
        """Clauses like ৪.১. or ৫.২. must NOT be transformed to ৪। ১. or ৫। ২."""
        handler_path = self.web_docx_handler.replace('\\', '/')
        code = (
            "const fs = require('fs');\n"
            f"eval(fs.readFileSync('{handler_path}', 'utf-8'));\n"
            "const line1 = DocxHandler.formatQuestionNumber('৪.১. শিবনগর');\n"
            "const line2 = DocxHandler.formatQuestionNumber('৫.২. শ্রেণিকক্ষ');\n"
            "const qLine = DocxHandler.formatQuestionNumber('১. প্রথম প্রশ্ন');\n"
            "console.log(JSON.stringify({ line1, line2, qLine }));\n"
        )
        out = json.loads(self.run_node_code(code))
        self.assertEqual(out['line1'], '৪.১. শিবনগর')
        self.assertEqual(out['line2'], '৫.২. শ্রেণিকক্ষ')
        self.assertEqual(out['qLine'], '১। প্রথম প্রশ্ন')

    def test_content_brackets_and_hyphens_preserved_in_ocr(self):
        """Content brackets (Vision & Mission), (যেমন: ...), (বেঞ্চ/টেবিল) and compound hyphens must be preserved"""
        handler_path = self.web_docx_handler.replace('\\', '/')
        ai_ocr_path = self.web_ai_ocr.replace('\\', '/')
        code = (
            "global.window = global;\n"
            "global.document = { readyState: 'complete', addEventListener: () => {}, getElementById: () => null };\n"
            "global.localStorage = { getItem: () => null, setItem: () => {} };\n"
            "const fs = require('fs');\n"
            "eval(fs.readFileSync('./js/bangla-converter-engine.js', 'utf-8'));\n"
            f"eval(fs.readFileSync('{handler_path}', 'utf-8'));\n"
            f"eval(fs.readFileSync('{ai_ocr_path}', 'utf-8'));\n"
            "const input = [\n"
            "    'দ্বিতীয় অধ্যায়: লক্ষ্য, উদ্দেশ্য ও রূপকল্প (Vision & Mission)',\n"
            "    '৪.৪. খেলাধুলা, শিল্প-সংস্কৃতি এবং সহশিক্ষামূলক কার্যক্রমের (যেমন: বিতর্ক, বিজ্ঞান মেলা, চিত্রাঙ্কন) ব্যবস্থা করা।',\n"
            "    '৫.২. আলো-বাতাস এবং বসার ব্যবস্থা (বেঞ্চ/টেবিল) থাকবে।'\n"
            "].join('\\n');\n"
            "const cleaned = global.FayzarAiOcrEngine.cleanOcrResponse(input);\n"
            "console.log(JSON.stringify(cleaned));\n"
        )
        out = json.loads(self.run_node_code(code))
        self.assertIn('(Vision & Mission)', out)
        self.assertIn('শিল্প-সংস্কৃতি', out)
        self.assertIn('(যেমন: বিতর্ক, বিজ্ঞান মেলা, চিত্রাঙ্কন)', out)
        self.assertIn('আলো-বাতাস', out)
        self.assertIn('(বেঞ্চ/টেবিল)', out)

    def test_mso_spacerun_preserved_between_adjacent_spans(self):
        """Ensure Word 2003 HTML generates mso-spacerun between closing parentheses and following words"""
        handler_path = self.web_docx_handler.replace('\\', '/')
        code = (
            "global.window = global;\n"
            "global.Blob = class MockBlob { constructor(p) { this.content = p[0]; } };\n"
            "const fs = require('fs');\n"
            "eval(fs.readFileSync('./js/bangla-converter-engine.js', 'utf-8'));\n"
            "eval(fs.readFileSync('./js/equation-converter.js', 'utf-8'));\n"
            f"eval(fs.readFileSync('{handler_path}', 'utf-8'));\n"
            "const input = 'বসার ব্যবস্থা (বেঞ্চ/টেবিল) থাকবে।';\n"
            "const blob = DocxHandler.createDocFromText(input, 'SutonnyMJ', true, 12, { direction: 'all_bijoy' });\n"
            "console.log(JSON.stringify({ html: blob.content }));\n"
        )
        out = json.loads(self.run_node_code(code))
        html = out['html']
        self.assertIn("mso-spacerun:yes", html)
        self.assertIn("Times New Roman", html)
        self.assertIn("SutonnyMJ", html)

if __name__ == '__main__':
    unittest.main()



