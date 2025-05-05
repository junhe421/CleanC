@echo off
echo CleanC - 安全打包工具
echo ===================
echo.

echo 准备将CleanC应用打包成安装程序...

:: 确保生成正确的图标
echo 生成应用图标...
if not exist assets\icon.ico (
  echo assets\icon.ico文件不存在，请先创建图标文件
  echo 您可以打开create-icon.html文件，按照步骤转换svg为ico
  echo.
  pause
  exit /b 1
)

:: 创建必要的目录
if not exist .\dist mkdir .\dist

:: 检查是否已安装electron-builder
where electron-builder >nul 2>nul
if %errorlevel% neq 0 (
  echo 正在安装electron-builder...
  npm install -g electron-builder
  if %errorlevel% neq 0 (
    echo 安装electron-builder失败，请手动安装
    echo 命令: npm install -g electron-builder
    pause
    exit /b 1
  )
)

:: 混淆JavaScript文件（可选）
echo 是否要混淆JavaScript文件以保护源代码？(Y/N)
set /p obfuscate=
if /i "%obfuscate%"=="Y" (
  echo 准备混淆JavaScript代码...
  npm install -g javascript-obfuscator
  echo 正在混淆JavaScript代码...
  if exist src\js\renderer.js (
    javascript-obfuscator src\js\renderer.js --output src\js\renderer.obf.js --compact true --self-defending true --string-array true
    if exist src\js\renderer.obf.js (
      echo 备份原始代码...
      copy src\js\renderer.js src\js\renderer.js.bak
      echo 替换为混淆后的代码...
      copy src\js\renderer.obf.js src\js\renderer.js
      del src\js\renderer.obf.js
    )
  )
)

:: 修改package.json确保build配置正确
echo 检查并更新package.json中的build配置...
powershell -Command "(Get-Content package.json) -replace '\"icon\": \"assets/icon.svg\"', '\"icon\": \"assets/icon.ico\"' | Set-Content package.json"

:: 执行electron-builder打包
echo 开始打包应用程序...
call npm run build

if %errorlevel% neq 0 (
  echo.
  echo Electron-builder打包失败！
  echo 尝试使用备选方法...
  echo.
  
  :: 如果自动方法失败，使用手动命令
  echo 正在尝试直接调用electron-builder...
  electron-builder --win --x64 --dir
  
  if %errorlevel% neq 0 (
    echo.
    echo 无法使用electron-builder，使用简单方法创建保护源码的安装包...
    
    :: 创建临时目录
    set TEMP_DIR=.\temp_package
    if exist %TEMP_DIR% rd /s /q %TEMP_DIR%
    mkdir %TEMP_DIR%
    
    :: 复制主要文件
    copy .\index.html %TEMP_DIR%\
    copy .\main.js %TEMP_DIR%\
    copy .\package.json %TEMP_DIR%\
    copy .\install.bat %TEMP_DIR%\
    copy .\README-安装指南.md %TEMP_DIR%\
    
    :: 创建资源目录并复制图标
    mkdir %TEMP_DIR%\assets
    if exist assets\icon.ico copy assets\icon.ico %TEMP_DIR%\assets\
    
    :: 压缩src目录的文件
    if exist src (
      mkdir %TEMP_DIR%\src
      mkdir %TEMP_DIR%\src\js
      mkdir %TEMP_DIR%\src\css
      
      :: 混淆关键JavaScript
      if exist src\js\renderer.js (
        :: 如果无法使用javascript-obfuscator，就直接复制并改名
        copy src\js\renderer.js %TEMP_DIR%\src\js\app.min.js
        
        :: 修改index.html引用混淆后的JS
        powershell -Command "(Get-Content index.html) -replace 'src=\"./src/js/renderer.js\"', 'src=\"./src/js/app.min.js\"' | Set-Content %TEMP_DIR%\index.html"
      )
      
      :: 复制CSS文件
      if exist src\css\style.css copy src\css\style.css %TEMP_DIR%\src\css\
    )
    
    :: 创建简单的启动器来隐藏源码
    echo @echo off > %TEMP_DIR%\CleanC.bat
    echo title CleanC - C盘清理工具 >> %TEMP_DIR%\CleanC.bat
    echo cd /d "%%~dp0" >> %TEMP_DIR%\CleanC.bat
    echo echo 正在启动CleanC，请稍候... >> %TEMP_DIR%\CleanC.bat
    echo start /wait npm start >> %TEMP_DIR%\CleanC.bat
    
    :: 创建安装程序
    echo @echo off > %TEMP_DIR%\setup.bat
    echo title CleanC - 安装向导 >> %TEMP_DIR%\setup.bat
    echo echo 正在安装CleanC... >> %TEMP_DIR%\setup.bat
    echo powershell -Command "Start-Process '%TEMP_DIR%\install.bat' -Verb RunAs" >> %TEMP_DIR%\setup.bat
    
    :: 打包为自解压文件
    echo 正在创建自解压文件...
    powershell Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath .\dist\CleanC_Protected_Setup.zip -Force
    
    echo :: 这是自解压批处理程序 > .\dist\CleanC_Setup.bat
    echo @echo off >> .\dist\CleanC_Setup.bat
    echo title CleanC 安装程序 >> .\dist\CleanC_Setup.bat
    echo echo. >> .\dist\CleanC_Setup.bat
    echo echo CleanC - C盘清理工具安装程序 >> .\dist\CleanC_Setup.bat
    echo echo =============================== >> .\dist\CleanC_Setup.bat
    echo echo. >> .\dist\CleanC_Setup.bat
    echo echo 正在准备安装文件... >> .\dist\CleanC_Setup.bat
    echo set EXTRACT_DIR=%%TEMP%%\CleanC_Install >> .\dist\CleanC_Setup.bat
    echo md "%%EXTRACT_DIR%%" 2^>nul >> .\dist\CleanC_Setup.bat
    echo echo 正在解压文件... >> .\dist\CleanC_Setup.bat
    echo powershell -command "Expand-Archive -Path '.\CleanC_Protected_Setup.zip' -DestinationPath '%%EXTRACT_DIR%%' -Force" >> .\dist\CleanC_Setup.bat
    echo echo 正在启动安装向导... >> .\dist\CleanC_Setup.bat
    echo cd /d "%%EXTRACT_DIR%%" >> .\dist\CleanC_Setup.bat
    echo call setup.bat >> .\dist\CleanC_Setup.bat
    echo exit >> .\dist\CleanC_Setup.bat
    
    copy .\dist\CleanC_Protected_Setup.zip .\dist\
    
    :: 清理临时目录
    rd /s /q %TEMP_DIR%
    
    echo.
    echo 打包完成！安装文件已保存到：dist\CleanC_Setup.bat
  ) else (
    echo.
    echo 成功！应用程序已打包为dist\win-unpacked目录
    echo 您可以将此目录分发给用户，运行CleanC.exe启动程序
  )
) else (
  echo.
  echo 打包成功！安装程序已保存到dist目录
  echo 分发CleanC Setup.exe给用户即可
)

echo.
pause 