$source = 'C:\Users\lbs1\ChatGPT-Beast-Mode-Dev'
$dest = 'C:\Users\lbs1\ChatGPT-Beast-Mode-Dev\SafariPort\SummarizeSafariExtension\Resources'
$folders = @('popup', 'content-script', 'background', 'shared', '_locales')
foreach ($folder in $folders) {
    if (Test-Path "$source\$folder") {
        Copy-Item -Path "$source\$folder" -Destination $dest -Recurse -Force
        Write-Host "Copied $folder"
    }
}
$iconSource = 'C:\Users\lbs1\ChatGPT-Beast-Mode-Dev'
$iconDest = 'C:\Users\lbs1\ChatGPT-Beast-Mode-Dev\SafariPort\SummarizeSafariExtension\Resources\icons'
if (-not (Test-Path $iconDest)) { New-Item -ItemType Directory -Path $iconDest | Out-Null }
$icons = @('logo-16.png', 'logo-32.png', 'logo-48.png', 'logo-128.png', 'logo.svg')
foreach ($icon in $icons) {
    if (Test-Path "$iconSource\$icon") {
        Copy-Item -Path "$iconSource\$icon" -Destination $iconDest -Force
        Write-Host "Copied $icon"
    }
}
Write-Host 'Done!'