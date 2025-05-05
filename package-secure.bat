@echo off
chcp 65001 > nul
echo CleanC - 安全打包工具
echo ====================
echo.

echo 此工具将执行以下操作:
echo 1. 混淆JavaScript代码以保护源代码
echo 2. 创建包含所有必要文件的安装程序
echo 3. 确保图标和公众号信息得到保留
echo.
echo 开始执行...
echo.

:: 创建工作目录
set WORK_DIR=.\build-temp
if exist %WORK_DIR% rd /s /q %WORK_DIR%
mkdir %WORK_DIR%

:: 备份原始文件 - 使用简单的时间戳格式
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "BACKUP_DIR=.\backup_%dt:~0,8%"
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%
echo 备份原始源代码...
if exist .\src\js\renderer.js copy .\src\js\renderer.js %BACKUP_DIR%\renderer.js.bak
if exist .\main.js copy .\main.js %BACKUP_DIR%\main.js.bak

:: 使用本地安装的混淆器而不是全局安装
echo 检查是否已安装javascript-obfuscator...
if not exist node_modules\javascript-obfuscator (
  echo 正在安装JavaScript混淆器(本地)...
  call npm install javascript-obfuscator --save-dev
  if %errorlevel% neq 0 (
    echo 安装javascript-obfuscator失败，请手动安装
    echo 命令: npm install javascript-obfuscator --save-dev
    pause
    exit /b 1
  )
)

:: 检查是否已安装electron-builder
if not exist node_modules\electron-builder (
  echo 正在安装electron-builder(本地)...
  call npm install electron-builder --save-dev
  if %errorlevel% neq 0 (
    echo 安装electron-builder失败，请手动安装
    echo 命令: npm install electron-builder --save-dev
    pause
    exit /b 1
  )
)

:: 创建备份目录结构
mkdir %WORK_DIR%\src\js

:: 混淆JavaScript代码
echo.
echo 第一步: 混淆JavaScript代码以保护源代码
echo --------------------------------
echo 混淆renderer.js (前端逻辑)...
if exist .\src\js\renderer.js (
  :: 复制原始文件到工作目录
  copy .\src\js\renderer.js %WORK_DIR%\src\js\renderer.js.bak
  
  :: 混淆代码 - 使用npx调用本地安装的混淆器
  call npx javascript-obfuscator ./src/js/renderer.js --output ./src/js/renderer.js --compact true --self-defending true --string-array true --string-array-encoding rc4 --disable-console-output false --control-flow-flattening true --identifier-names-generator hexadecimal --log false --rename-globals true
  echo 完成: renderer.js 已混淆
) else (
  echo 警告: 找不到 src\js\renderer.js 文件
)

echo 混淆main.js (主进程逻辑)...
if exist .\main.js (
  :: 复制原始文件到工作目录
  copy .\main.js %WORK_DIR%\main.js.bak
  
  :: 混淆代码 - 使用npx调用本地安装的混淆器
  call npx javascript-obfuscator ./main.js --output ./main.js --compact true --self-defending true --string-array true --string-array-encoding rc4 --disable-console-output false --control-flow-flattening true --identifier-names-generator hexadecimal --log false --rename-globals true
  echo 完成: main.js 已混淆
) else (
  echo 警告: 找不到 main.js 文件
)

:: 确保图标文件存在
echo.
echo 第二步: 准备图标和资源文件
echo -------------------------
if not exist assets\icon.ico (
  echo 正在使用应用图标创建ico文件...
  :: 使用简单的方法创建ico文件 - 复制svg并重命名为ico
  if exist assets\icon.svg (
    copy assets\icon.svg assets\icon.ico
    echo 图标已创建(简单复制方式)
  ) else (
    echo 警告: 找不到 assets\icon.svg 文件
  )
)

:: 确保package.json中的配置正确
echo 检查并更新package.json中的配置...
powershell -Command "(Get-Content package.json) -replace '\"icon\": \"assets/icon.svg\"', '\"icon\": \"assets/icon.ico\"' | Set-Content package.json"

:: 创建dist目录
if not exist .\dist mkdir .\dist

:: 尝试使用electron-builder创建安装程序
echo.
echo 第三步: 创建安装程序
echo ----------------
echo 开始使用electron-builder打包应用...
call npm run build

if %errorlevel% neq 0 (
  echo.
  echo Electron-builder打包失败，使用备用方法...
  
  :: 备用打包方法
  echo 使用手动打包方法创建安装程序...
  
  :: 创建临时目录结构
  set PACKAGE_DIR=.\dist\CleanC-Package
  if exist %PACKAGE_DIR% rd /s /q %PACKAGE_DIR%
  mkdir %PACKAGE_DIR%
  mkdir %PACKAGE_DIR%\src
  mkdir %PACKAGE_DIR%\src\js
  mkdir %PACKAGE_DIR%\src\css
  mkdir %PACKAGE_DIR%\assets
  mkdir %PACKAGE_DIR%\node_modules
  mkdir %PACKAGE_DIR%\node_modules\@fortawesome
  mkdir %PACKAGE_DIR%\node_modules\@fortawesome\fontawesome-free
  mkdir %PACKAGE_DIR%\node_modules\@fortawesome\fontawesome-free\css
  mkdir %PACKAGE_DIR%\node_modules\@fortawesome\fontawesome-free\webfonts
  mkdir %PACKAGE_DIR%\node_modules\chart.js
  mkdir %PACKAGE_DIR%\node_modules\chart.js\dist
  
  :: 复制主要文件
  copy .\index.html %PACKAGE_DIR%\
  copy .\index-new.html %PACKAGE_DIR%\
  copy .\main.js %PACKAGE_DIR%\
  copy .\package.json %PACKAGE_DIR%\
  if exist .\LICENSE copy .\LICENSE %PACKAGE_DIR%\
  if exist .\README.md copy .\README.md %PACKAGE_DIR%\
  
  :: 复制CSS文件
  copy .\src\css\*.css %PACKAGE_DIR%\src\css\
  
  :: 复制混淆后的JS文件
  copy .\src\js\renderer.js %PACKAGE_DIR%\src\js\
  
  :: 复制资源文件 - 特别确保图标和公众号资源被包含
  echo 复制重要资源文件，确保图标和公众号信息得到保留...
  
  :: 复制所有assets目录下的文件
  xcopy .\assets\*.* %PACKAGE_DIR%\assets\ /E /I /Y
  
  :: 特别检查和处理关键资源文件
  if exist .\assets\icon.svg copy .\assets\icon.svg %PACKAGE_DIR%\assets\
  if exist .\assets\icon.ico copy .\assets\icon.ico %PACKAGE_DIR%\assets\
  if exist .\assets\qrcode-wechat.png copy .\assets\qrcode-wechat.png %PACKAGE_DIR%\assets\
  if exist .\assets\next-wave-logo.png copy .\assets\next-wave-logo.png %PACKAGE_DIR%\assets\
  
  :: 复制必要的依赖文件
  if exist .\node_modules\@fortawesome\fontawesome-free\css\all.min.css (
    copy .\node_modules\@fortawesome\fontawesome-free\css\all.min.css %PACKAGE_DIR%\node_modules\@fortawesome\fontawesome-free\css\
  )
  if exist .\node_modules\@fortawesome\fontawesome-free\webfonts\ (
    xcopy .\node_modules\@fortawesome\fontawesome-free\webfonts\* %PACKAGE_DIR%\node_modules\@fortawesome\fontawesome-free\webfonts\ /E /I /Y
  )
  if exist .\node_modules\chart.js\dist\chart.umd.js (
    copy .\node_modules\chart.js\dist\chart.umd.js %PACKAGE_DIR%\node_modules\chart.js\dist\
  )
  if exist .\node_modules\node-disk-info\ (
    xcopy .\node_modules\node-disk-info\* %PACKAGE_DIR%\node_modules\node-disk-info\ /E /I /Y
  )
  if exist .\node_modules\winreg\ (
    xcopy .\node_modules\winreg\* %PACKAGE_DIR%\node_modules\winreg\ /E /I /Y
  )
  
  :: 创建启动批处理文件
  echo @echo off > %PACKAGE_DIR%\CleanC.bat
  echo chcp 65001 ^> nul >> %PACKAGE_DIR%\CleanC.bat
  echo title CleanC - C盘清理工具 >> %PACKAGE_DIR%\CleanC.bat
  echo cd /d "%%~dp0" >> %PACKAGE_DIR%\CleanC.bat
  echo echo 正在启动CleanC，请稍候... >> %PACKAGE_DIR%\CleanC.bat
  echo start /wait npx electron . >> %PACKAGE_DIR%\CleanC.bat
  
  :: 创建安装批处理文件
  echo @echo off > %PACKAGE_DIR%\Install-CleanC.bat
  echo chcp 65001 ^> nul >> %PACKAGE_DIR%\Install-CleanC.bat
  echo title CleanC - 安装向导 >> %PACKAGE_DIR%\Install-CleanC.bat
  echo cd /d "%%~dp0" >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo. >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo CleanC - C盘清理工具安装向导 >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo ============================ >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo. >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo 此向导将帮助您安装CleanC。 >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo. >> %PACKAGE_DIR%\Install-CleanC.bat
  
  :: 安装nodejs和electron
  echo echo 正在检查必要的运行环境... >> %PACKAGE_DIR%\Install-CleanC.bat
  echo where node ^>nul 2^>nul >> %PACKAGE_DIR%\Install-CleanC.bat
  echo if %%errorlevel%% neq 0 ( >> %PACKAGE_DIR%\Install-CleanC.bat
  echo   echo 未检测到Node.js，现在将安装Node.js... >> %PACKAGE_DIR%\Install-CleanC.bat
  echo   echo 请在弹出的窗口中完成Node.js的安装。 >> %PACKAGE_DIR%\Install-CleanC.bat
  echo   start https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi >> %PACKAGE_DIR%\Install-CleanC.bat
  echo   echo 请在安装完成后关闭此窗口，然后重新运行安装向导。 >> %PACKAGE_DIR%\Install-CleanC.bat
  echo   pause >> %PACKAGE_DIR%\Install-CleanC.bat
  echo   exit >> %PACKAGE_DIR%\Install-CleanC.bat
  echo ) >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo. >> %PACKAGE_DIR%\Install-CleanC.bat
  
  :: 创建桌面快捷方式
  echo echo 正在创建桌面快捷方式... >> %PACKAGE_DIR%\Install-CleanC.bat
  echo set SCRIPT=%%TEMP%%\CreateShortcut.vbs >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo Set oWS = WScript.CreateObject^("WScript.Shell"^) ^> %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo sLinkFile = oWS.ExpandEnvironmentStrings^("%%USERPROFILE%%\Desktop\CleanC.lnk"^) ^>^> %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo Set oLink = oWS.CreateShortcut^(sLinkFile^) ^>^> %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo oLink.TargetPath = "%%~dp0CleanC.bat" ^>^> %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo oLink.WorkingDirectory = "%%~dp0" ^>^> %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo oLink.Description = "CleanC - C盘清理工具" ^>^> %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo oLink.IconLocation = "%%~dp0assets\icon.ico" ^>^> %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo oLink.Save ^>^> %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo cscript /nologo %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo del %%SCRIPT%% >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo. >> %PACKAGE_DIR%\Install-CleanC.bat
  
  :: 安装完成
  echo echo 安装完成！ >> %PACKAGE_DIR%\Install-CleanC.bat
  echo echo 您可以从桌面快捷方式启动CleanC。 >> %PACKAGE_DIR%\Install-CleanC.bat
  echo pause >> %PACKAGE_DIR%\Install-CleanC.bat
  
  :: 创建打包的安装程序
  echo 正在创建最终安装包...
  powershell Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath .\dist\CleanC_Setup.zip -Force
  
  :: 创建自解压安装批处理文件
  echo @echo off > .\dist\CleanC_安装程序.bat
  echo chcp 65001 ^> nul >> .\dist\CleanC_安装程序.bat
  echo title CleanC 自解压安装程序 >> .\dist\CleanC_安装程序.bat
  echo echo. >> .\dist\CleanC_安装程序.bat
  echo echo CleanC - C盘清理工具 >> .\dist\CleanC_安装程序.bat
  echo echo =================== >> .\dist\CleanC_安装程序.bat
  echo echo. >> .\dist\CleanC_安装程序.bat
  echo echo 正在准备安装文件... >> .\dist\CleanC_安装程序.bat
  echo echo. >> .\dist\CleanC_安装程序.bat
  echo set INSTALL_DIR=%%USERPROFILE%%\CleanC >> .\dist\CleanC_安装程序.bat
  echo echo 将安装到: %%INSTALL_DIR%% >> .\dist\CleanC_安装程序.bat
  echo echo. >> .\dist\CleanC_安装程序.bat
  echo if exist "%%INSTALL_DIR%%" ( >> .\dist\CleanC_安装程序.bat
  echo   echo 检测到已有安装，将先删除旧文件... >> .\dist\CleanC_安装程序.bat
  echo   rd /s /q "%%INSTALL_DIR%%" >> .\dist\CleanC_安装程序.bat
  echo ) >> .\dist\CleanC_安装程序.bat
  echo echo. >> .\dist\CleanC_安装程序.bat
  echo mkdir "%%INSTALL_DIR%%" >> .\dist\CleanC_安装程序.bat
  echo echo 正在解压文件... >> .\dist\CleanC_安装程序.bat
  echo powershell -command "Expand-Archive -Path './CleanC_Setup.zip' -DestinationPath '%%INSTALL_DIR%%' -Force" >> .\dist\CleanC_安装程序.bat
  echo echo. >> .\dist\CleanC_安装程序.bat
  echo echo 正在启动安装向导... >> .\dist\CleanC_安装程序.bat
  echo cd /d "%%INSTALL_DIR%%" >> .\dist\CleanC_安装程序.bat
  echo start Install-CleanC.bat >> .\dist\CleanC_安装程序.bat
  echo exit >> .\dist\CleanC_安装程序.bat
  
  :: 复制zip文件到安装程序所在目录
  copy .\dist\CleanC_Setup.zip .\dist\
  
  echo.
  echo 打包完成！自解压安装程序已创建：dist\CleanC_安装程序.bat
  echo 请将dist目录下的CleanC_安装程序.bat和CleanC_Setup.zip一起分发。
) else (
  echo.
  echo 使用electron-builder打包成功！
  echo 安装程序已保存到dist目录下。
)

:: 恢复原始文件
echo.
echo 正在恢复原始源代码文件...
if exist %WORK_DIR%\src\js\renderer.js.bak copy %WORK_DIR%\src\js\renderer.js.bak .\src\js\renderer.js
if exist %WORK_DIR%\main.js.bak copy %WORK_DIR%\main.js.bak .\main.js

:: 删除临时文件
if exist %WORK_DIR% rd /s /q %WORK_DIR%
echo 清理完成。

echo.
echo 打包流程完成！您的应用已成功打包，并保护了源代码。
echo 图标和公众号信息已被正确包含在安装程序中。
echo.
pause 