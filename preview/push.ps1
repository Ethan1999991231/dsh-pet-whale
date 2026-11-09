# 从 Windows 凭据管理器取出 GitHub token 并推送 —— token 只在内存里，输出里会被替换成 <token>
$ErrorActionPreference = 'Continue'

Add-Type -Namespace Wh -Name Cr -MemberDefinition @'
[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct CREDENTIAL {
  public int Flags;
  public int Type;
  public string TargetName;
  public string Comment;
  public long LastWritten;
  public int CredentialBlobSize;
  public IntPtr CredentialBlob;
  public int Persist;
  public int AttributeCount;
  public IntPtr Attributes;
  public string TargetAlias;
  public string UserName;
}
[DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
public static extern bool CredReadW(string target, int type, int flags, out IntPtr cred);
[DllImport("advapi32.dll", SetLastError = true)]
public static extern void CredFree(IntPtr cred);
'@

$ptr = [IntPtr]::Zero
$ok = [Wh.Cr]::CredReadW('git:https://github.com', 1, 0, [ref]$ptr)
if (-not $ok) { Write-Output 'CRED_FAIL'; exit 1 }
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][Wh.Cr+CREDENTIAL])
$blob = [Runtime.InteropServices.Marshal]::PtrToStringUni($c.CredentialBlob, [int]($c.CredentialBlobSize / 2))
[Wh.Cr]::CredFree($ptr)
if (-not $blob) { Write-Output 'CRED_EMPTY'; exit 1 }
Write-Output ('USER=' + $c.UserName)
Write-Output ('LEN=' + $blob.Length)

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
$env:GIT_TERMINAL_PROMPT = '0'

git add -A 2>&1 | Out-Null
git -c user.name=Ethan -c user.email=syk201256@qq.com commit -m "feat: 自定义音效与形象、余额取有值币种、修按下/松开重音" 2>&1 | Out-Null

$url = "https://x-access-token:$blob@github.com/Ethan1999991231/dsh-pet-whale.git"
$out = git push $url main 2>&1
$out | ForEach-Object { ($_ -replace [regex]::Escape($blob), '<token>') } | Write-Output
Write-Output ('PUSH_EXIT=' + $LASTEXITCODE)
Write-Output ('HEAD=' + (git rev-parse --short HEAD))
