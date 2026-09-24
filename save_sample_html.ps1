$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $p = "C:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-bangla-converter\SAMPLE QUESTION\Bangla 1st (C-8).doc"
    $doc = $word.Documents.Open($p)
    $outHtml = "C:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-bangla-converter\scratch\sample_word_full.htm"
    $doc.SaveAs([ref]$outHtml, [ref]8)
    $doc.Close([ref]$false)
    Write-Host "Saved Full HTML, size: $((Get-Item $outHtml).Length)"
} finally {
    $word.Quit()
}
