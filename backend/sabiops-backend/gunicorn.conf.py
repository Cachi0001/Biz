"""Gunicorn configuration for production deployment."""

import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# Timeout
timeout = 30
keepalive = 2

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "bizflow-sme-nigeria"

# Server mechanics
daemon = False
pidfile = "/tmp/gunicorn.pid"
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
keyfile = os.getenv('SSL_KEYFILE')
certfile = os.getenv('SSL_CERTFILE')

# Preload application
preload_app = True

# Worker lifecycle
def when_ready(server):
    """Called just after the server is started."""
    server.log.info("Bizflow SME Nigeria server is ready. Listening on: %s", server.address)

def worker_int(worker):
    """Called just after a worker exited on SIGINT or SIGQUIT."""
    worker.log.info("Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_worker_init(worker):
    """Called just after a worker has initialized the application."""
    worker.log.info("Worker initialized (pid: %s)", worker.pid)

def worker_abort(worker):
    """Called when a worker received the SIGABRT signal."""
    worker.log.info("Worker received SIGABRT signal")

# Environment variables
raw_env = [
    f"FLASK_ENV={os.getenv('FLASK_ENV', 'production')}",
    f"SECRET_KEY={os.getenv('SECRET_KEY', '')}",
    f"JWT_SECRET_KEY={os.getenv('JWT_SECRET_KEY', '')}",
    f"DATABASE_URL={os.getenv('DATABASE_URL', '')}",
    f"REDIS_URL={os.getenv('REDIS_URL', '')}",
    f"PAYSTACK_SECRET_KEY={os.getenv('PAYSTACK_SECRET_KEY', '')}",
    f"PAYSTACK_PUBLIC_KEY={os.getenv('PAYSTACK_PUBLIC_KEY', '')}",
    f"CLOUDINARY_CLOUD_NAME={os.getenv('CLOUDINARY_CLOUD_NAME', '')}",
    f"CLOUDINARY_API_KEY={os.getenv('CLOUDINARY_API_KEY', '')}",
    f"CLOUDINARY_API_SECRET={os.getenv('CLOUDINARY_API_SECRET', '')}",
    f"SMTP_SERVER={os.getenv('SMTP_SERVER', '')}",
    f"SMTP_PORT={os.getenv('SMTP_PORT', '587')}",
    f"SMTP_USERNAME={os.getenv('SMTP_USERNAME', '')}",
    f"SMTP_PASSWORD={os.getenv('SMTP_PASSWORD', '')}",
    f"FROM_EMAIL={os.getenv('FROM_EMAIL', '')}",
    f"SENTRY_DSN={os.getenv('SENTRY_DSN', '')}",
]