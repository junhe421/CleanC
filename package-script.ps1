# CleanC - 安全打包脚本 (PowerShell版)
Write-Host "CleanC - 安全打包工具" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "此工具将执行以下操作:" -ForegroundColor Yellow
Write-Host "1. 创建备份" -ForegroundColor Yellow
Write-Host "2. 创建打包目录" -ForegroundColor Yellow
Write-Host "3. 复制所有必要文件" -ForegroundColor Yellow
Write-Host "4. 创建安装程序" -ForegroundColor Yellow
Write-Host ""
Write-Host "开始执行..." -ForegroundColor Green
Write-Host ""

# 创建时间戳
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$BACKUP_DIR = ".\backup_$timestamp"
$WORK_DIR = ".\build-temp"
$PACKAGE_DIR = ".\dist\CleanC-Package"

# 创建备份目录
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -Path $BACKUP_DIR -ItemType Directory | Out-Null
    Write-Host "创建备份目录: $BACKUP_DIR" -ForegroundColor Green
}

# 备份原始文件
Write-Host "备份原始源代码..." -ForegroundColor Green
if (Test-Path ".\src\js\renderer.js") {
    Copy-Item -Path ".\src\js\renderer.js" -Destination "$BACKUP_DIR\renderer.js.bak"
}
if (Test-Path ".\main.js") {
    Copy-Item -Path ".\main.js" -Destination "$BACKUP_DIR\main.js.bak"
}

# 创建工作目录
if (Test-Path $WORK_DIR) {
    Remove-Item -Path $WORK_DIR -Recurse -Force
}
New-Item -Path $WORK_DIR -ItemType Directory | Out-Null
Write-Host "创建工作目录: $WORK_DIR" -ForegroundColor Green

# 创建dist目录
if (-not (Test-Path ".\dist")) {
    New-Item -Path ".\dist" -ItemType Directory | Out-Null
    Write-Host "创建dist目录" -ForegroundColor Green
}

# 创建临时打包目录
if (Test-Path $PACKAGE_DIR) {
    Remove-Item -Path $PACKAGE_DIR -Recurse -Force
}
New-Item -Path $PACKAGE_DIR -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\src" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\src\js" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\src\css" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\assets" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\node_modules" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\node_modules\@fortawesome" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\node_modules\@fortawesome\fontawesome-free" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\node_modules\@fortawesome\fontawesome-free\css" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\node_modules\@fortawesome\fontawesome-free\webfonts" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\node_modules\chart.js" -ItemType Directory | Out-Null
New-Item -Path "$PACKAGE_DIR\node_modules\chart.js\dist" -ItemType Directory | Out-Null

Write-Host "创建包结构完成" -ForegroundColor Green

# 复制主要文件
Write-Host "正在复制主要文件..." -ForegroundColor Green
Copy-Item -Path ".\index.html" -Destination $PACKAGE_DIR
Copy-Item -Path ".\index-new.html" -Destination $PACKAGE_DIR -ErrorAction SilentlyContinue
Copy-Item -Path ".\main.js" -Destination $PACKAGE_DIR
Copy-Item -Path ".\package.json" -Destination $PACKAGE_DIR
Copy-Item -Path ".\LICENSE" -Destination $PACKAGE_DIR -ErrorAction SilentlyContinue
Copy-Item -Path ".\README.md" -Destination $PACKAGE_DIR -ErrorAction SilentlyContinue

# 复制CSS文件
Write-Host "复制CSS文件..." -ForegroundColor Green
Copy-Item -Path ".\src\css\*.css" -Destination "$PACKAGE_DIR\src\css\" -ErrorAction SilentlyContinue

# 复制JS文件
Write-Host "复制JS文件..." -ForegroundColor Green
Copy-Item -Path ".\src\js\renderer.js" -Destination "$PACKAGE_DIR\src\js\" -ErrorAction SilentlyContinue

# 复制资源文件
Write-Host "复制资源文件..." -ForegroundColor Green
Copy-Item -Path ".\assets\*" -Destination "$PACKAGE_DIR\assets\" -Recurse -ErrorAction SilentlyContinue

# 特殊处理关键资源文件
Write-Host "确保关键资源文件存在..." -ForegroundColor Green
if (Test-Path "$PACKAGE_DIR\assets\icon.svg") {
    Write-Host "- 图标文件已复制" -ForegroundColor Green
}
if (Test-Path "$PACKAGE_DIR\assets\qrcode-wechat.png") {
    Write-Host "- 微信公众号二维码已复制" -ForegroundColor Green
}
if (Test-Path "$PACKAGE_DIR\assets\next-wave-logo.png") {
    Write-Host "- LOGO已复制" -ForegroundColor Green
}

# 复制必要的依赖文件
Write-Host "复制依赖文件..." -ForegroundColor Green
if (Test-Path ".\node_modules\@fortawesome\fontawesome-free\css\all.min.css") {
    Copy-Item -Path ".\node_modules\@fortawesome\fontawesome-free\css\all.min.css" -Destination "$PACKAGE_DIR\node_modules\@fortawesome\fontawesome-free\css\"
}
if (Test-Path ".\node_modules\@fortawesome\fontawesome-free\webfonts") {
    Copy-Item -Path ".\node_modules\@fortawesome\fontawesome-free\webfonts\*" -Destination "$PACKAGE_DIR\node_modules\@fortawesome\fontawesome-free\webfonts\" -Recurse
}
if (Test-Path ".\node_modules\chart.js\dist\chart.umd.js") {
    Copy-Item -Path ".\node_modules\chart.js\dist\chart.umd.js" -Destination "$PACKAGE_DIR\node_modules\chart.js\dist\"
}
if (Test-Path ".\node_modules\node-disk-info") {
    Copy-Item -Path ".\node_modules\node-disk-info\*" -Destination "$PACKAGE_DIR\node_modules\node-disk-info\" -Recurse -ErrorAction SilentlyContinue
}
if (Test-Path ".\node_modules\winreg") {
    Copy-Item -Path ".\node_modules\winreg\*" -Destination "$PACKAGE_DIR\node_modules\winreg\" -Recurse -ErrorAction SilentlyContinue
}

# 创建启动批处理文件
$startContent = '@echo off
chcp 65001 > nul
title CleanC - C盘清理工具
cd /d "%~dp0"
echo 正在启动CleanC，请稍候...
start /wait npx electron .'

Set-Content -Path "$PACKAGE_DIR\CleanC.bat" -Value $startContent -Encoding UTF8

# 创建安装批处理文件
$installContent = '@echo off
chcp 65001 > nul
title CleanC - 安装向导
cd /d "%~dp0"
echo.
echo CleanC - C盘清理工具安装向导
echo ============================
echo.
echo 此向导将帮助您安装CleanC。
echo.
echo 正在检查必要的运行环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo 未检测到Node.js，现在将安装Node.js...
  echo 请在弹出的窗口中完成Node.js的安装。
  start https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi
  echo 请在安装完成后关闭此窗口，然后重新运行安装向导。
  pause
  exit
)
echo.
echo 正在创建桌面快捷方式...
set SCRIPT=%TEMP%\CreateShortcut.vbs
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.ExpandEnvironmentStrings("%USERPROFILE%\Desktop\CleanC.lnk") >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0CleanC.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "CleanC - C盘清理工具" >> %SCRIPT%
echo oLink.IconLocation = "%~dp0assets\icon.ico" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%
echo.
echo 安装完成！
echo 您可以从桌面快捷方式启动CleanC。
pause'

Set-Content -Path "$PACKAGE_DIR\Install-CleanC.bat" -Value $installContent -Encoding UTF8

Write-Host "创建批处理文件完成" -ForegroundColor Green

# 创建打包的安装程序
Write-Host "正在创建最终安装包..." -ForegroundColor Green
Compress-Archive -Path "$PACKAGE_DIR\*" -DestinationPath ".\dist\CleanC_Setup.zip" -Force

# 创建自解压安装批处理文件
$extractorContent = '@echo off
chcp 65001 > nul
title CleanC 自解压安装程序
echo.
echo CleanC - C盘清理工具
echo ===================
echo.
echo 正在准备安装文件...
echo.
set INSTALL_DIR=%USERPROFILE%\CleanC
echo 将安装到: %INSTALL_DIR%
echo.
if exist "%INSTALL_DIR%" (
  echo 检测到已有安装，将先删除旧文件...
  rd /s /q "%INSTALL_DIR%"
)
echo.
mkdir "%INSTALL_DIR%"
echo 正在解压文件...
powershell -command "Expand-Archive -Path ''./CleanC_Setup.zip'' -DestinationPath ''%INSTALL_DIR%'' -Force"
echo.
echo 正在启动安装向导...
cd /d "%INSTALL_DIR%"
start Install-CleanC.bat
exit'

Set-Content -Path ".\dist\CleanC_安装程序.bat" -Value $extractorContent -Encoding UTF8

# 复制zip文件到安装程序所在目录
Copy-Item -Path ".\dist\CleanC_Setup.zip" -Destination ".\dist\"

Write-Host ""
Write-Host "打包完成！" -ForegroundColor Green
Write-Host "自解压安装程序已创建：dist\CleanC_安装程序.bat" -ForegroundColor Green
Write-Host "请将dist目录下的CleanC_安装程序.bat和CleanC_Setup.zip一起分发。" -ForegroundColor Yellow
Write-Host "" 