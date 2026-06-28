[void][System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")
$bmp = New-Object System.Drawing.Bitmap("scratch/check_book.jpg")
Write-Host "Width:" $bmp.Width "Height:" $bmp.Height
Write-Host "Pixel 0,0:" $bmp.GetPixel(0, 0)
Write-Host "Pixel 10,10:" $bmp.GetPixel(10, 10)
Write-Host "Pixel 300,300:" $bmp.GetPixel(300, 300)
$bmp.Dispose()
