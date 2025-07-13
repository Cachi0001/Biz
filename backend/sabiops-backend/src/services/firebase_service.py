import os
import json

firebase_app = None
messaging = None

try:
    import firebase_admin
    from firebase_admin import credentials, messaging as firebase_messaging
    
    # Path to your service account JSON (or use environment variable)
    FIREBASE_CRED_PATH = os.environ.get('FIREBASE_CRED_PATH', 'firebase-service-account.json')
    
    firebase_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if firebase_json:
        cred = credentials.Certificate(json.loads(firebase_json))
        if not firebase_admin._apps:
            firebase_app = firebase_admin.initialize_app(cred)
        messaging = firebase_messaging
        print("[INFO] Firebase initialized successfully")
    elif os.path.exists(FIREBASE_CRED_PATH):
        cred = credentials.Certificate(FIREBASE_CRED_PATH)
        if not firebase_admin._apps:
            firebase_app = firebase_admin.initialize_app(cred)
        messaging = firebase_messaging
        print("[INFO] Firebase initialized successfully")
    else:
        print("[INFO] Firebase credentials not found, push notifications will be disabled")
except Exception as e:
    print(f"[INFO] Firebase not available: {e}. Push notifications will be disabled")

def send_push_notification(token, title, body, data=None):
    """Send push notification via Firebase. Returns None if Firebase is not available."""
    if not messaging:
        print("[WARNING] Firebase not initialized, cannot send push notification")
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
        print(f"[ERROR] Failed to send push notification: {e}")
        return None
