$files = @('manifest.json', 'popup/index.html', 'popup/index.css', 'popup/index.js', 'popup/header.js', 'popup/batch-results.js', 'popup/batch-results.css', 'background/index.js', 'content-script/index.js')
foreach ($file in $files) {
    $src = "C:\Users\lbs1\ChatGPT-Beast-Mode-Dev\$file"
    $dst = "C:\Users\lbs1\ChatGPT-Beast-Mode-Firefox\$file"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Force
        Write-Host "Copied $file"
    } else {
        Write-Host "MISSING: $file"
    }
}
Copy-Item -Path 'C:\Users\lbs1\ChatGPT-Beast-Mode-Dev\_locales' -Destination 'C:\Users\lbs1\ChatGPT-Beast-Mode-Firefox\_locales' -Recurse -Force
Write-Host 'Done copying to Firefox port!'