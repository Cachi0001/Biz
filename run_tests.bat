@echo off
echo 🧪 SabiOps Comprehensive Testing Suite
echo =====================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.7+ first.
    pause
    exit /b 1
)

echo ✅ Python found
echo.

echo Installing required packages...
pip install requests >nul 2>&1

echo.
echo 🚀 Starting comprehensive tests...
echo.

cd /d "%~dp0"
python tests/run_all_tests.py

echo.
echo 📊 Test execution completed!
echo Check the tests/ directory for detailed reports.
echo.
pause