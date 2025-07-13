import firebase_admin
from firebase_admin import credentials, messaging
import os
import json
import logging

logger = logging.getLogger(__name__)

# Path to your service account JSON (or use environment variable)
FIREBASE_CRED_PATH = os.environ.get('FIREBASE_CRED_PATH', 'firebase-service-account.json')

firebase_initialized = False
try:
    firebase_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if firebase_json:
        cred = credentials.Certificate(json.loads(firebase_json))
    else:
        cred = credentials.Certificate(FIREBASE_CRED_PATH)

    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase initialized successfully")
except Exception as e:
    logger.warning(f"Firebase initialization failed: {e}. Push notifications will be disabled.")
    firebase_initialized = False

def send_push_notification(token, title, body, data=None):
    if not firebase_initialized:
        logger.warning("Firebase not initialized. Skipping push notification.")
        return None
    
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            token=token,
            data=data or {}
        )
        response = messaging.send(message)
        return response
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
        return None
