import firebase_admin
from firebase_admin import credentials, messaging
import os
import json

# Path to your service account JSON (or use environment variable)
FIREBASE_CRED_PATH = os.environ.get('FIREBASE_CRED_PATH', 'firebase-service-account.json')

firebase_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
if firebase_json:
    cred = credentials.Certificate(json.loads(firebase_json))
else:
    cred = credentials.Certificate(FIREBASE_CRED_PATH)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

def send_push_notification(token, title, body, data=None):
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