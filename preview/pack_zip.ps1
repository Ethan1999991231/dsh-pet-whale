# 把 pet-whale 打成可直接导入的 zip（内容在根目录，解压即插件目录）
$ErrorActionPreference = 'Stop'
$src = 'E:\Users\Administrator\Documents\deepseek-harness\default-workspace\pet-whale'
$out = 'E:\Users\Administrator\Documents\deepseek-harness\default-workspace\dsh-pet-whale-1.0.0.zip'
$tmp = Join-Path $env:TEMP ('dsh-pet-whale-pack-' + [guid]::NewGuid().ToString('N'))

New-Item -ItemType Directory -Path $tmp | Out-Null
$root = Join-Path $tmp 'dsh-pet-whale'
New-Item -ItemType Directory -Path $root | Out-Null

Copy-Item (Join-Path $src 'package.json')     $root
Copy-Item (Join-Path $src 'cordis.patch.yml') $root
Copy-Item (Join-Path $src 'README.md')        $root
Copy-Item (Join-Path $src 'lib')              $root -Recurse
Copy-Item (Join-Path $src 'assets')           $root -Recurse

if (Test-Path $out) { Remove-Item $out -Force }
Compress-Archive -Path (Join-Path $root '*') -DestinationPath $out -CompressionLevel Optimal -Force

Remove-Item $tmp -Recurse -Force
'OUT=' + $out
'SIZE=' + (Get-Item $out).Length

# 列出 zip 里实际有什么
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($out)
$zip.Entries | ForEach-Object { '  ' + $_.FullName + '  ' + $_.Length }
$zip.Dispose()
