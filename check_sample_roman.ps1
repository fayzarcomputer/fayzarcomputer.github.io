$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open('C:\Users\Admin\.gemini\antigravity-ide\scratch\fayzar-bangla-converter\SAMPLE QUESTION\Bangla 1st (C-8).doc')
    for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
        $p = $doc.Paragraphs.Item($i)
        $t = $p.Range.Text
        if ($t -match 'i\.' -or $t -match 'ii\.' -or $t -match 'wb‡Pi') {
            Write-Host ("P$i Font: " + $p.Range.Font.Name + " Text: " + $t.Substring(0, [math]::Min(50, $t.Length)).Trim())
            for ($k = 1; $k -le [math]::Min(15, $p.Range.Characters.Count); $k++) {
                $c = $p.Range.Characters.Item($k)
                Write-Host ("  Char " + $k + ": '" + $c.Text + "' Font: " + $c.Font.Name + " ASCII: " + [int][char]$c.Text[0])
            }
        }
    }
    $doc.Close([ref]$false)
} finally {
    $word.Quit()
}
