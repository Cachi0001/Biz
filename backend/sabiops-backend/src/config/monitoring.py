"""Monitoring and logging configuration for Bizflow SME Nigeria."""

import os
import logging
import structlog
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from flask import Flask, request, g
import time
from datetime import datetime


def configure_monitoring(app: Flask):
    """Configure monitoring, logging, and error tracking."""
    
    # Sentry Configuration for Error Tracking
    if app.config.get('SENTRY_DSN'):
        sentry_sdk.init(
            dsn=app.config['SENTRY_DSN'],
            integrations=[
                FlaskIntegration(transaction_style='endpoint'),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=0.1,  # 10% of transactions
            profiles_sample_rate=0.1,
            environment=app.config.get('ENV', 'development'),
            release=app.config.get('VERSION', '1.0.0')
        )
    
    # Structured Logging Configuration
    configure_structured_logging(app)
    
    # Performance Monitoring
    configure_performance_monitoring(app)
    
    # Business Metrics Tracking
    configure_business_metrics(app)
    
    # Health Check Endpoints
    configure_health_checks(app)


def configure_structured_logging(app: Flask):
    """Configure structured logging with structlog."""
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure Flask logging
    if not app.debug:
        # File handler for production
        file_handler = logging.FileHandler('logs/bizflow.log')
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Bizflow SME Nigeria startup')


def configure_performance_monitoring(app: Flask):
    """Configure performance monitoring."""
    
    @app.before_request
    def start_timer():
        g.start_time = time.time()
        g.request_id = request.headers.get('X-Request-ID', 'unknown')
    
    @app.after_request
    def log_request(response):
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            
            # Log request details
            logger = structlog.get_logger()
            logger.info(
                "request_completed",
                method=request.method,
                path=request.path,
                status_code=response.status_code,
                duration=duration,
                request_id=getattr(g, 'request_id', 'unknown'),
                user_agent=request.headers.get('User-Agent', ''),
                ip_address=request.remote_addr
            )
            
            # Track slow requests
            if duration > 2.0:  # Requests taking more than 2 seconds
                logger.warning(
                    "slow_request",
                    method=request.method,
                    path=request.path,
                    duration=duration,
                    request_id=getattr(g, 'request_id', 'unknown')
                )
        
        return response


def configure_business_metrics(app: Flask):
    """Configure business metrics tracking."""
    
    class BusinessMetrics:
        """Track business-specific metrics."""
        
        @staticmethod
        def track_user_registration(user_id: int, subscription_plan: str):
            """Track user registration events."""
            logger = structlog.get_logger()
            logger.info(
                "user_registered",
                user_id=user_id,
                subscription_plan=subscription_plan,
                timestamp=datetime.utcnow().isoformat()
            )
        
        @staticmethod
        def track_subscription_upgrade(user_id: int, from_plan: str, to_plan: str):
            """Track subscription upgrades."""
            logger = structlog.get_logger()
            logger.info(
                "subscription_upgraded",
                user_id=user_id,
                from_plan=from_plan,
                to_plan=to_plan,
                timestamp=datetime.utcnow().isoformat()
            )
        
        @staticmethod
        def track_payment_processed(user_id: int, amount: float, currency: str, status: str):
            """Track payment processing."""
            logger = structlog.get_logger()
            logger.info(
                "payment_processed",
                user_id=user_id,
                amount=amount,
                currency=currency,
                status=status,
                timestamp=datetime.utcnow().isoformat()
            )
        
        @staticmethod
        def track_invoice_created(user_id: int, invoice_id: int, amount: float):
            """Track invoice creation."""
            logger = structlog.get_logger()
            logger.info(
                "invoice_created",
                user_id=user_id,
                invoice_id=invoice_id,
                amount=amount,
                timestamp=datetime.utcnow().isoformat()
            )
        
        @staticmethod
        def track_trial_conversion(user_id: int, converted: bool):
            """Track trial to paid conversion."""
            logger = structlog.get_logger()
            logger.info(
                "trial_conversion",
                user_id=user_id,
                converted=converted,
                timestamp=datetime.utcnow().isoformat()
            )
    
    # Make metrics available to the app
    app.business_metrics = BusinessMetrics()


def configure_health_checks(app: Flask):
    """Configure health check endpoints."""
    
    @app.route('/api/health')
    def health_check():
        """Basic health check endpoint."""
        return {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': app.config.get('VERSION', '1.0.0'),
            'environment': app.config.get('ENV', 'development')
        }
    
    @app.route('/api/health/detailed')
    def detailed_health_check():
        """Detailed health check with dependencies."""
        from src.models import db
        
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': app.config.get('VERSION', '1.0.0'),
            'environment': app.config.get('ENV', 'development'),
            'checks': {}
        }
        
        # Database check
        try:
            db.session.execute('SELECT 1')
            health_status['checks']['database'] = 'healthy'
        except Exception as e:
            health_status['checks']['database'] = f'unhealthy: {str(e)}'
            health_status['status'] = 'unhealthy'
        
        # Redis check (if configured)
        if app.config.get('REDIS_URL'):
            try:
                from flask import current_app
                cache = current_app.extensions.get('cache')
                if cache:
                    cache.set('health_check', 'ok', timeout=10)
                    health_status['checks']['redis'] = 'healthy'
                else:
                    health_status['checks']['redis'] = 'not_configured'
            except Exception as e:
                health_status['checks']['redis'] = f'unhealthy: {str(e)}'
                health_status['status'] = 'unhealthy'
        
        # Paystack API check
        try:
            import requests
            response = requests.get('https://api.paystack.co', timeout=5)
            if response.status_code == 200:
                health_status['checks']['paystack'] = 'healthy'
            else:
                health_status['checks']['paystack'] = f'unhealthy: status {response.status_code}'
        except Exception as e:
            health_status['checks']['paystack'] = f'unhealthy: {str(e)}'
        
        # Cloudinary check
        try:
            import cloudinary
            # Simple ping to cloudinary
            health_status['checks']['cloudinary'] = 'healthy'
        except Exception as e:
            health_status['checks']['cloudinary'] = f'unhealthy: {str(e)}'
        
        return health_status, 200 if health_status['status'] == 'healthy' else 503


class MetricsCollector:
    """Collect and export metrics for monitoring."""
    
    def __init__(self):
        self.metrics = {
            'requests_total': 0,
            'requests_by_status': {},
            'response_times': [],
            'active_users': 0,
            'database_connections': 0
        }
    
    def increment_request_count(self, status_code: int):
        """Increment request counters."""
        self.metrics['requests_total'] += 1
        
        if status_code not in self.metrics['requests_by_status']:
            self.metrics['requests_by_status'][status_code] = 0
        self.metrics['requests_by_status'][status_code] += 1
    
    def record_response_time(self, duration: float):
        """Record response time."""
        self.metrics['response_times'].append(duration)
        
        # Keep only last 1000 response times
        if len(self.metrics['response_times']) > 1000:
            self.metrics['response_times'] = self.metrics['response_times'][-1000:]
    
    def get_metrics(self):
        """Get current metrics."""
        avg_response_time = (
            sum(self.metrics['response_times']) / len(self.metrics['response_times'])
            if self.metrics['response_times'] else 0
        )
        
        return {
            **self.metrics,
            'avg_response_time': avg_response_time,
            'timestamp': datetime.utcnow().isoformat()
        }