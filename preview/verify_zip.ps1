# 验证 zip：解压 → 语法检查 → 打印包信息 → 清理
$ErrorActionPreference = 'Stop'
$z = 'E:\Users\Administrator\Documents\deepseek-harness\default-workspace\dsh-pet-whale-1.0.0.zip'
$d = Join-Path $env:TEMP ('pw-verify-' + [guid]::NewGuid().ToString('N'))
Expand-Archive -Path $z -DestinationPath $d
Push-Location $d
try {
  node --check lib\host.js
  if ($LASTEXITCODE -ne 0) { throw 'host.js 语法错误' }
  node --check lib\client.js
  if ($LASTEXITCODE -ne 0) { throw 'client.js 语法错误' }
  node -e "const p=require('./package.json');console.log('PKG name='+p.name+' ver='+p.version+' main='+p.main+' client='+((p.exports||{})['./client']))"
  'FILES_IN_ZIP:'
  Get-ChildItem -Recurse -File | ForEach-Object { '  ' + $_.FullName.Substring($d.Length + 1) }
} finally {
  Pop-Location
  Remove-Item $d -Recurse -Force
}
'VERIFY_OK'
