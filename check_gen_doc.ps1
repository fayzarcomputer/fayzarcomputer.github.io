$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open('C:\Users\Admin\Desktop\Bangla_1st_Combined_Exam.doc')
    Write-Host ("Sections count: " + $doc.Sections.Count)
    for ($i = 1; $i -le $doc.Sections.Count; $i++) {
        $s = $doc.Sections.Item($i)
        Write-Host ("Sec " + $i + ": Cols=" + $s.PageSetup.TextColumns.Count + ", Orient=" + $s.PageSetup.Orientation + ", Start=" + $s.PageSetup.SectionStart)
    }
    $doc.Close([ref]$false)
} finally {
    $word.Quit()
}
