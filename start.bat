@echo off
title CleanC - C盘清理工具

:: 切换到脚本所在目录
cd /d "%~dp0"

echo CleanC - C盘清理工具
echo ====================
echo.
echo 正在启动...
echo.

:: 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js未安装，请先安装Node.js
    echo 您可以从 https://nodejs.org 下载最新版本
    echo.
    pause
    exit /b 1
)

:: 检查npm是否安装
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo npm未安装，请先安装Node.js（包含npm）
    echo 您可以从 https://nodejs.org 下载最新版本
    echo.
    pause
    exit /b 1
)

:: 检查是否需要安装依赖
if not exist "node_modules" (
    echo 首次运行，正在安装必要的依赖...
    npm install
    if %errorlevel% neq 0 (
        echo 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
)

:: 检查electron是否安装
if not exist "node_modules\electron" (
    echo 安装Electron...
    npm install electron --save-dev
    if %errorlevel% neq 0 (
        echo Electron安装失败，请检查网络连接
        pause
        exit /b 1
    )
)

:: 启动应用
echo 正在启动CleanC...
npm start
if %errorlevel% neq 0 (
    echo 应用启动失败，请尝试重新安装
    pause
    exit /b 1
)

exit /b 0 