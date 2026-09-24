$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open('C:\Users\Admin\Desktop\Bangla_1st_Combined_Exam.doc')
    Write-Host "=== VERIFYING FINAL DESKTOP DOC ==="
    Write-Host "Sections count: $($doc.Sections.Count)"
    for ($i = 1; $i -le $doc.Sections.Count; $i++) {
        $s = $doc.Sections.Item($i)
        $pg = $s.PageSetup
        Write-Host "--- Section $i ---"
        Write-Host "Orientation: $($pg.Orientation) (1=Landscape, 0=Portrait)"
        Write-Host "Columns: $($pg.TextColumns.Count), Spacing: $([math]::Round($pg.TextColumns.Spacing/72,2))in, LineBetween: $($pg.TextColumns.LineBetween)"
        Write-Host "Start: $($pg.SectionStart) (0=Continuous, 2=NewPage)"
        Write-Host "Paragraph count: $($s.Range.Paragraphs.Count)"
    }
    
    Write-Host "`n--- Sample Paragraphs ---"
    # Stem P10
    $p10 = $doc.Paragraphs.Item(10)
    Write-Host "P10 (Stem) Left=$($p10.LeftIndent), First=$($p10.FirstLineIndent): $($p10.Range.Text.Substring(0, [math]::Min(40, $p10.Range.Text.Length)).Trim())"
    
    # Sub Q11
    $p11 = $doc.Paragraphs.Item(11)
    Write-Host "P11 (Sub-Q 'ক') Left=$($p11.LeftIndent), First=$($p11.FirstLineIndent): $($p11.Range.Text.Substring(0, [math]::Min(40, $p11.Range.Text.Length)).Trim())"
    
    $doc.Close([ref]$false)
} finally {
    $word.Quit()
}
