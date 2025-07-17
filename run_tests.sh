#!/bin/bash

echo "🧪 SabiOps Comprehensive Testing Suite"
echo "====================================="
echo

# Check Python installation
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python not found. Please install Python 3.7+ first."
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

echo "✅ Python found: $($PYTHON_CMD --version)"
echo

# Install required packages
echo "Installing required packages..."
$PYTHON_CMD -m pip install requests > /dev/null 2>&1

echo
echo "🚀 Starting comprehensive tests..."
echo

# Change to script directory
cd "$(dirname "$0")"

# Run the master test runner
$PYTHON_CMD tests/run_all_tests.py

echo
echo "📊 Test execution completed!"
echo "Check the tests/ directory for detailed reports."
echo