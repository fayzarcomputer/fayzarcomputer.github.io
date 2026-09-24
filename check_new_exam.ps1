$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open('C:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-bangla-converter\scratch\output_exam\Bangla_1st_Combined_Exam.doc')
    Write-Host ("Sections count: " + $doc.Sections.Count)
    for ($i = 1; $i -le $doc.Sections.Count; $i++) {
        $s = $doc.Sections.Item($i)
        Write-Host ("Sec " + $i + ": Cols=" + $s.PageSetup.TextColumns.Count + ", Orient=" + $s.PageSetup.Orientation + ", Start=" + $s.PageSetup.SectionStart + ", Paras=" + $s.Range.Paragraphs.Count)
        Write-Host ("   First line: " + $s.Range.Paragraphs.Item(1).Range.Text.Trim().Substring(0, [math]::Min(40, $s.Range.Paragraphs.Item(1).Range.Text.Trim().Length)))
    }
    
    # Check CQ Paragraphs
    Write-Host "`n--- CQ Sample Paras ---"
    for ($j = 5; $j -le 10; $j++) {
        $p = $doc.Paragraphs.Item($j)
        Write-Host ("P" + $j + " [Left=" + $p.LeftIndent + ", First=" + $p.FirstLineIndent + "]: " + $p.Range.Text.Trim().Substring(0, [math]::Min(50, $p.Range.Text.Trim().Length)))
    }

    # Check MCQ Question 2 (Roman numerals)
    Write-Host "`n--- MCQ Roman Numerals ---"
    for ($k = 1; $k -le $doc.Paragraphs.Count; $k++) {
        $p = $doc.Paragraphs.Item($k)
        $t = $p.Range.Text
        if ($t -match 'i\.' -or $t -match 'ii\.' -or $t -match 'gv‡K fq') {
            Write-Host ("P" + $k + ": " + $t.Trim())
            for ($c = 1; $c -le [math]::Min(10, $p.Range.Characters.Count); $c++) {
                $ch = $p.Range.Characters.Item($c)
                Write-Host ("   Char " + $c + ": '" + $ch.Text + "' Font: " + $ch.Font.Name)
            }
        }
    }
    
    $doc.Close([ref]$false)
} finally {
    $word.Quit()
}
