import unittest
import re

class TestNightModeContrast(unittest.TestCase):
    def setUp(self):
        with open('index.html', 'r', encoding='utf-8') as f:
            self.html = f.read()

    def test_no_low_contrast_card_backgrounds(self):
        """Cards should not use low-contrast dark hexes (#111a2e, #131f38) that blend into the canvas."""
        # Find all card definitions in index.html
        low_contrast_hexes = ['dark:bg-[#111a2e]', 'dark:bg-[#131f38]']
        for hex_val in low_contrast_hexes:
            self.assertNotIn(
                hex_val, 
                self.html, 
                f"Card background should use elevated high-contrast dark:bg-[#16243d], found obsolete {hex_val}"
            )

    def test_no_low_contrast_card_borders(self):
        """Cards should not use low-contrast dark borders (#1e2d4a, #283b63) that are invisible in night mode."""
        low_contrast_borders = ['dark:border-[#1e2d4a]', 'dark:border-[#283b63]']
        for border_val in low_contrast_borders:
            self.assertNotIn(
                border_val,
                self.html,
                f"Card borders should use visible luminous border (e.g. dark:border-slate-700/80), found obsolete {border_val}"
            )

    def test_elevated_contrast_card_present(self):
        """Index.html must have elevated high-contrast night mode cards."""
        self.assertIn('dark:bg-[#16243d]', self.html, "Elevated high-contrast card background must be used")
        self.assertTrue(
            'dark:border-slate-700' in self.html or 'dark:border-slate-600' in self.html,
            "Visible crisp card border must be used in dark mode"
        )

if __name__ == '__main__':
    unittest.main()
