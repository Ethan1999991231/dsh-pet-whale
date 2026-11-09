# 把 pet-whale-app（EXE 版）的源码快照到仓库的 app/ 目录
$ErrorActionPreference = 'Continue'
$src = 'E:\Users\Administrator\Documents\deepseek-harness\default-workspace\pet-whale-app'
$dst = 'E:\Users\Administrator\Documents\deepseek-harness\default-workspace\pet-whale\app'

if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
New-Item -ItemType Directory -Path $dst -Force | Out-Null

foreach ($f in @('main.js', 'server.js', 'preload.js', 'package.json', 'README.md')) {
  Copy-Item (Join-Path $src $f) (Join-Path $dst $f) -Force
}
Copy-Item (Join-Path $src 'ui')    (Join-Path $dst 'ui')    -Recurse -Force
Copy-Item (Join-Path $src 'tools') (Join-Path $dst 'tools') -Recurse -Force
Copy-Item (Join-Path $src 'assets')(Join-Path $dst 'assets')-Recurse -Force
New-Item -ItemType Directory -Path (Join-Path $dst 'build') -Force | Out-Null
Copy-Item (Join-Path $src 'build\whale.ico') (Join-Path $dst 'build') -Force
Copy-Item (Join-Path $src 'build\icon.png')  (Join-Path $dst 'build') -Force
Copy-Item (Join-Path $src 'build\tray.png')  (Join-Path $dst 'build') -Force

$m = Get-ChildItem $dst -Recurse -File | Measure-Object -Property Length -Sum
'SNAP_FILES=' + $m.Count
'SNAP_BYTES=' + $m.Sum
Get-ChildItem $dst -Recurse -File | ForEach-Object { $_.FullName.Substring($dst.Length + 1) } | Sort-Object
