$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8788

while (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    $port++
}

Write-Host "AI 智能试衣项目已启动：http://127.0.0.1:$port/"
Write-Host "按 Ctrl+C 停止服务。"
Set-Location $project
python -m http.server $port --bind 127.0.0.1
