import unittest
import os
import re

class TestConverterFix(unittest.TestCase):
    def setUp(self):
        self.web_js = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\js\ai-ocr-engine.js'
        self.web_html = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\converter.html'

    def test_temperature_is_optimized(self):
        with open(self.web_js, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertNotIn('temperature: 0.05', content, f"temperature: 0.05 should not exist in {self.web_js}")
        self.assertIn('temperature: 0.2', content, f"temperature: 0.2 should be present in {self.web_js}")

    def test_model_priority_has_active_models_first(self):
        with open(self.web_js, 'r', encoding='utf-8') as f:
            content = f.read()
        match = re.search(r'const allActiveModels = \[(.*?)\];', content, re.DOTALL)
        self.assertTrue(match, "allActiveModels array must be defined")
        models_text = match.group(1)
        
        # Dead/unsupported models must NOT be in active models
        for weak_model in ["'gemini-3.5-flash-lite'", "'gemini-flash-lite-latest'", "'gemini-2.5-flash-lite'", "'gemini-2.5-pro'"]:
            self.assertNotIn(weak_model, models_text, f"{weak_model} must be purged from active models")
        
        # Powerful full models must be present in sequential order
        self.assertIn("'gemini-3.5-flash'", models_text)
        self.assertIn("'gemini-3.8-flash'", models_text)
        self.assertIn("'gemini-3.7-flash'", models_text)
        self.assertIn("'gemini-3.6-flash'", models_text)
        self.assertIn("'gemini-2.5-flash'", models_text)
        
        # Order: 3.5 -> 3.8 -> 3.7 -> 3.6 -> 2.5
        idx_35 = models_text.find("'gemini-3.5-flash'")
        idx_38 = models_text.find("'gemini-3.8-flash'")
        idx_37 = models_text.find("'gemini-3.7-flash'")
        idx_36 = models_text.find("'gemini-3.6-flash'")
        idx_25 = models_text.find("'gemini-2.5-flash'")
        
        self.assertLess(idx_35, idx_38, "gemini-3.5-flash must precede gemini-3.8-flash")
        self.assertLess(idx_38, idx_37, "gemini-3.8-flash must precede gemini-3.7-flash")
        self.assertLess(idx_37, idx_36, "gemini-3.7-flash must precede gemini-3.6-flash")
        self.assertLess(idx_36, idx_25, "gemini-3.6-flash must precede gemini-2.5-flash")

    def test_converter_html_has_purged_models(self):
        with open(self.web_html, 'r', encoding='utf-8') as f:
            content = f.read()
        # Select options must not include weak lite/dead models
        for weak_model in ['value="gemini-3.5-flash-lite"', 'value="gemini-flash-lite-latest"', 'value="gemini-2.5-flash-lite"', 'value="gemini-2.5-pro"']:
            self.assertNotIn(weak_model, content, f"{weak_model} must be removed from dropdown")
        # Select options must include powerful full models
        self.assertIn('value="gemini-3.5-flash"', content)
        self.assertIn('value="gemini-3.6-flash"', content)
        self.assertIn('value="gemini-3.8-flash"', content)
        self.assertIn('value="gemini-3.7-flash"', content)
        self.assertIn('value="gemini-2.5-flash"', content)

    def test_prompt_has_anti_dot_rule(self):
        with open(self.web_js, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertIn("DOTTED & BLANK LINES IN OFFICIAL LETTERS & FORMS", content)
        self.assertIn("Never generate long or infinite chains of dots", content)

    def test_zero_delay_quota_failover(self):
        with open(self.web_js, 'r', encoding='utf-8') as f:
            content = f.read()
        # Must detect 429 and RESOURCE_EXHAUSTED / quota and continue immediately
        self.assertIn("res.status === 429", content)
        self.assertIn("RESOURCE_EXHAUSTED", content)
        self.assertIn("পরবর্তী কি চেষ্টা হচ্ছে", content)

    def test_stream_and_response_dot_clamping(self):
        with open(self.web_js, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertIn(r"text.replace(/\.{8,}/g, '......')", content)
        self.assertIn(r"fullStreamedText.replace(/\.{8,}/g, '......')", content)

    def test_converter_html_scripts_clean_offline(self):
        with open(self.web_html, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertNotIn("js/ai-ocr-engine.js?v=", content)
        self.assertIn('<script src="js/ai-ocr-engine.js"></script>', content)

    def test_doc_binary_engine_included_and_rich_fidelity(self):
        web_doc_engine = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\js\doc-binary-engine.js'
        web_doc_conv = r'c:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-computer-web\doc-converter.html'

        for html_path in [self.web_html, web_doc_conv]:
            with open(html_path, 'r', encoding='utf-8') as f:
                content = f.read()
            self.assertIn('<script src="js/doc-binary-engine.js"></script>', content,
                          f"doc-binary-engine.js script tag must be included in {html_path}")

        self.assertTrue(os.path.exists(web_doc_engine), f"{web_doc_engine} must exist")
        with open(web_doc_engine, 'r', encoding='utf-8') as f:
            js_content = f.read()
        self.assertIn("class DocBinaryEngine", js_content)
        self.assertIn("_extractImageInfo", js_content)
        self.assertIn("_assignImageIds", js_content)
        self.assertIn("_generateRunOoxml", js_content)
        self.assertIn("_packDocxPackage", js_content)
        self.assertIn("word/media/", js_content)
        self.assertIn("convertedBlob", js_content)

if __name__ == '__main__':
    unittest.main()
