# 停掉旧的预览服务器，再起一个新的（改过 server.mjs 必须走这里，否则拿的是旧代码）
$root = Split-Path -Parent $PSScriptRoot

$procs = Get-CimInstance Win32_Process -Filter "name='node.exe'" |
  Where-Object { $_.CommandLine -like '*server.mjs*' }
foreach ($p in $procs) {
  Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
  "killed $($p.ProcessId)"
}
Start-Sleep -Milliseconds 400

Push-Location $root
try {
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c start "" /min node preview\server.mjs' -WindowStyle Hidden
} catch {
  "START_ERR: $($_.Exception.Message)"
}
Pop-Location

Start-Sleep -Seconds 2
try {
  $r = Invoke-WebRequest -Uri 'http://127.0.0.1:7788/' -UseBasicParsing -TimeoutSec 3
  "PREVIEW_OK $($r.StatusCode)"
} catch {
  "PREVIEW_FAIL $($_.Exception.Message)"
}
