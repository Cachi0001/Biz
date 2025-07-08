"""Gunicorn configuration for production deployment."""

import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"

# Worker processes - simplified for stability
workers = 1
worker_class = "sync"

# Timeout
timeout = 120
keepalive = 2

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "sabiops-backend"

# Server mechanics
daemon = False
preload_app = False

