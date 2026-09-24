$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $src = 'C:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-bangla-converter\scratch\output_exam\Bangla_1st_Combined_Exam.doc'
    $doc = $word.Documents.Open($src)
    $dst = 'C:\Users\Admin\Desktop\Bangla_1st_Combined_Exam.doc'
    # Save as native Word 97-2003 binary .doc (Format 0)
    $doc.SaveAs([ref]$dst, [ref]0)
    $doc.Close([ref]$false)
    Write-Host "Successfully saved native binary .doc to Desktop! Size: $((Get-Item $dst).Length)"
} catch {
    Write-Host "Error saving binary doc: $_"
} finally {
    $word.Quit()
}
