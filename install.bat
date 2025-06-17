@echo off
echo CleanC - C盘清理工具安装程序
echo ===============================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 请右键点击此文件，选择"以管理员身份运行"
    echo 安装需要管理员权限才能将文件复制到Program Files目录。
    pause
    exit
)

echo 正在安装CleanC - C盘清理工具...
echo.

:: 创建安装目录
set INSTALL_DIR=%ProgramFiles%\CleanC
echo 创建安装目录: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: 复制程序文件
echo 正在复制程序文件...
xcopy /E /I /Y ".\*" "%INSTALL_DIR%\"

:: 创建桌面快捷方式
echo 创建桌面快捷方式...
set SHORTCUT="%USERPROFILE%\Desktop\CleanC.lnk"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = %SHORTCUT% >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\start.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "简单易用的C盘清理工具" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.IconLocation = "%INSTALL_DIR%\assets\icon.ico" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript /nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

:: 创建启动脚本
echo @echo off > "%INSTALL_DIR%\start.bat"
echo cd /d "%%~dp0" >> "%INSTALL_DIR%\start.bat"
echo echo 正在启动CleanC - C盘清理工具... >> "%INSTALL_DIR%\start.bat"
echo echo 请稍候... >> "%INSTALL_DIR%\start.bat"
echo start /wait cmd /c "npm start" >> "%INSTALL_DIR%\start.bat"

echo.
echo 安装完成！
echo CleanC已成功安装到您的计算机。
echo 您可以通过桌面快捷方式"CleanC"启动程序。
echo.
pause 