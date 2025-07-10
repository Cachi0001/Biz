import React, { createContext, useContext, useEffect, useState } from 'react';
import { messaging, getToken, onMessage, VAPID_KEY } from '../firebase';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { saveDeviceToken } from '../services/api';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth() || {}; // Fix: fallback to empty object if useAuth() is null
  const [permission, setPermission] = useState(Notification.permission);
  const [deviceToken, setDeviceToken] = useState(null);
  const [error, setError] = useState(null);

  // Request notification permission and get device token
  useEffect(() => {
    if (!user) return;
    if (permission === 'granted' && !deviceToken) {
      getToken(messaging, { vapidKey: VAPID_KEY })
        .then((currentToken) => {
          if (currentToken) {
            setDeviceToken(currentToken);
            // Save device token to backend for this user
            saveDeviceToken(currentToken)
              .catch(() => {});
          }
        })
        .catch((err) => {
          setError('Failed to get device token');
        });
    }
  }, [user, permission, deviceToken]);

  // Listen for foreground messages
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      toast(payload.notification?.body || 'New notification', {
        icon: '🔔',
        duration: 5000,
      });
    });
    return unsubscribe;
  }, []);

  // Helper to request permission
  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Notifications enabled!');
      } else {
        toast.error('Notifications denied.');
      }
    } catch (err) {
      setError('Failed to request notification permission');
    }
  };

  return (
    <NotificationContext.Provider value={{ permission, deviceToken, requestPermission, error }}>
      {children}
    </NotificationContext.Provider>
  );
}; 