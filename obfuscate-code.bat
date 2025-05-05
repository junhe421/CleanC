@echo off
echo CleanC - 源代码保护工具
echo =======================
echo.

echo 此工具将会混淆JavaScript代码，使其难以被逆向工程。
echo 注意：混淆后的代码功能不变，但可读性会大大降低。
echo.

:: 检查是否安装了JavaScript混淆器
where javascript-obfuscator >nul 2>nul
if %errorlevel% neq 0 (
  echo 正在安装JavaScript混淆器...
  npm install -g javascript-obfuscator
  if %errorlevel% neq 0 (
    echo 安装失败，请手动安装
    echo 命令: npm install -g javascript-obfuscator
    pause
    exit /b 1
  )
)

:: 创建备份目录
set BACKUP_DIR=.\backup_%date:~0,4%%date:~5,2%%date:~8,2%
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

echo 正在备份原始源代码...
if exist .\src\js\renderer.js copy .\src\js\renderer.js %BACKUP_DIR%\renderer.js.bak
if exist .\main.js copy .\main.js %BACKUP_DIR%\main.js.bak

echo 正在混淆renderer.js (前端逻辑)...
if exist .\src\js\renderer.js (
  javascript-obfuscator .\src\js\renderer.js --output .\src\js\renderer.js --compact true --self-defending true --string-array true --string-array-encoding rc4 --disable-console-output true --control-flow-flattening true --identifier-names-generator hexadecimal --log false --rename-globals true
  echo 完成: renderer.js 已混淆
) else (
  echo 警告: 找不到 src\js\renderer.js 文件
)

echo 正在混淆main.js (主进程逻辑)...
if exist .\main.js (
  javascript-obfuscator .\main.js --output .\main.js --compact true --self-defending true --string-array true --string-array-encoding rc4 --disable-console-output true --control-flow-flattening true --identifier-names-generator hexadecimal --log false --rename-globals true
  echo 完成: main.js 已混淆
) else (
  echo 警告: 找不到 main.js 文件
)

echo.
echo 源代码混淆完成！
echo 原始文件已备份到: %BACKUP_DIR%
echo.
echo 现在您可以使用build-installer.bat创建受保护的安装程序。
echo.
pause 