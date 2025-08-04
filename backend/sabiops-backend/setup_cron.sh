#!/bin/bash
# Setup cron job for daily subscription expiration checks
# Run this script to install the cron job

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="$PROJECT_DIR/src/scripts/daily_expiration_check.py"
LOG_PATH="$PROJECT_DIR/logs/daily_expiration_check.log"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Create the cron job entry
CRON_JOB="0 0 * * * cd $PROJECT_DIR && /usr/bin/python3 $SCRIPT_PATH >> $LOG_PATH 2>&1"

echo "Setting up daily subscription expiration check cron job..."
echo "Project directory: $PROJECT_DIR"
echo "Script path: $SCRIPT_PATH"
echo "Log path: $LOG_PATH"
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if the script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: Script not found at $SCRIPT_PATH"
    exit 1
fi

# Make the script executable
chmod +x "$SCRIPT_PATH"

# Add the cron job
echo "Adding cron job..."
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Cron job added successfully!"
    echo ""
    echo "The daily expiration check will run every day at 00:00 UTC"
    echo "Logs will be written to: $LOG_PATH"
    echo ""
    echo "To view current cron jobs: crontab -l"
    echo "To remove this cron job: crontab -e (then delete the line)"
    echo ""
    echo "You can test the script manually by running:"
    echo "cd $PROJECT_DIR && python3 $SCRIPT_PATH"
else
    echo "❌ Failed to add cron job"
    exit 1
fi