$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $file = 'C:\Users\HP\Desktop\Rapport_de_Stage_IML_INPTIC_COMPLET.docx'
  $pdfFile = 'C:\Users\HP\Desktop\Rapport_de_Stage_IML_INPTIC_COMPLET.pdf'
  $doc = $word.Documents.Open($file)
  # 17 corresponds to wdExportFormatPDF
  $doc.ExportAsFixedFormat($pdfFile, 17)
  Write-Host "PDF généré avec succès sur le Bureau : $pdfFile"
  $doc.Close()
} catch {
  Write-Host "ERREUR_PDF: $($_.Exception.Message)"
} finally {
  $word.Quit()
}
