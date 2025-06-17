@echo off
echo ==================================
echo        CleanC 应用打包工具
echo ==================================
echo.
echo 正在准备打包CleanC应用程序...
echo.

rem 检查Node.js环境
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo [错误] 未找到Node.js，请确保已安装Node.js并添加到PATH中。
  goto end
)

echo [1/5] 清理旧的构建文件...
if exist "dist" (
  rmdir /s /q "dist"
)
mkdir dist

echo [2/5] 安装依赖...
call npm install
if %errorlevel% neq 0 (
  echo [错误] 安装依赖失败，请检查网络连接或package.json文件。
  goto end
)

echo [3/5] 开始打包应用...
echo 这可能需要几分钟时间，请耐心等待...
call npm run build:installer
if %errorlevel% neq 0 (
  echo [错误] 打包应用失败，请查看上方错误信息。
  goto end
)

echo [4/5] 检查打包结果...
if not exist "dist\CleanC-Setup-1.0.0.exe" (
  echo [警告] 未找到安装程序文件，打包可能未完成。
  goto end
)

echo [5/5] 打包完成！
echo.
echo ====================================
echo 安装程序已保存到dist目录下：
echo CleanC-Setup-1.0.0.exe
echo ====================================
echo.
echo 打包过程已完成，您的源代码已被保护。
echo 公众号和图标信息已包含在安装程序中。
echo.

:end
pause 