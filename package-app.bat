@echo off
echo CleanC - 应用打包工具
echo ===================
echo.

echo 准备打包CleanC应用...

:: 创建临时目录
set TEMP_DIR=.\temp_package
if exist %TEMP_DIR% rd /s /q %TEMP_DIR%
mkdir %TEMP_DIR%

:: 复制必要文件
echo 复制必要文件...
xcopy .\index.html %TEMP_DIR%\ /Y
xcopy .\main.js %TEMP_DIR%\ /Y
xcopy .\package.json %TEMP_DIR%\ /Y
xcopy .\start.bat %TEMP_DIR%\ /Y
xcopy .\install.bat %TEMP_DIR%\ /Y
xcopy .\README-安装指南.md %TEMP_DIR%\ /Y
xcopy .\create-icon.html %TEMP_DIR%\ /Y
xcopy .\src\* %TEMP_DIR%\src\ /E /I /Y
xcopy .\assets\* %TEMP_DIR%\assets\ /E /I /Y

:: 创建node_modules临时目录，只复制必要的文件
mkdir %TEMP_DIR%\node_modules
mkdir %TEMP_DIR%\node_modules\@fortawesome
mkdir %TEMP_DIR%\node_modules\@fortawesome\fontawesome-free
mkdir %TEMP_DIR%\node_modules\@fortawesome\fontawesome-free\css
mkdir %TEMP_DIR%\node_modules\@fortawesome\fontawesome-free\webfonts
mkdir %TEMP_DIR%\node_modules\chart.js
mkdir %TEMP_DIR%\node_modules\chart.js\dist

:: 复制必要的node_modules文件
echo 复制必要的依赖文件...
xcopy .\node_modules\@fortawesome\fontawesome-free\css\all.min.css %TEMP_DIR%\node_modules\@fortawesome\fontawesome-free\css\ /Y
xcopy .\node_modules\@fortawesome\fontawesome-free\webfonts\* %TEMP_DIR%\node_modules\@fortawesome\fontawesome-free\webfonts\ /Y
xcopy .\node_modules\chart.js\dist\chart.umd.js %TEMP_DIR%\node_modules\chart.js\dist\ /Y
xcopy .\node_modules\node-disk-info\* %TEMP_DIR%\node_modules\node-disk-info\ /E /I /Y
xcopy .\node_modules\winreg\* %TEMP_DIR%\node_modules\winreg\ /E /I /Y

:: 创建dist目录
if not exist .\dist mkdir .\dist

:: 检查是否安装了7-Zip
where 7z >nul 2>nul
if %errorlevel% equ 0 (
    echo 使用7-Zip打包应用...
    7z a -tzip .\dist\CleanC_Setup.zip %TEMP_DIR%\*
) else (
    echo 未找到7-Zip，使用内置的zip命令...
    powershell Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath .\dist\CleanC_Setup.zip -Force
)

:: 清理临时文件
rd /s /q %TEMP_DIR%

echo.
echo 打包完成！安装文件已保存到：dist\CleanC_Setup.zip
echo.
pause 