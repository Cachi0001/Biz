import React, { createContext, useContext, useEffect, useState } from 'react';
import { messaging, getToken, onMessage, VAPID_KEY } from '../firebase';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { saveDeviceToken } from '../services/api';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const authContext = useAuth();
  const user = authContext?.user;
  const [permission, setPermission] = useState(Notification.permission);
  const [deviceToken, setDeviceToken] = useState(null);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Request notification permission and get device token
  useEffect(() => {
    if (!user) return;
    
    const initializeNotifications = async () => {
      try {
        // Check if messaging is supported
        if (!messaging) {
          console.warn('NotificationContext: Firebase messaging not supported in this browser');
          setUsingFallback(true);
          return;
        }
        
        if (permission === 'granted' && !deviceToken) {
          try {
            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (currentToken) {
              setDeviceToken(currentToken);
              // Save device token to backend for this user
              try {
                await saveDeviceToken(currentToken);
              } catch (saveError) {
                console.error('Failed to save device token:', saveError);
              }
            }
          } catch (tokenError) {
            console.error('Failed to get device token:', tokenError);
            setError('Failed to get device token');
            setUsingFallback(true);
          }
        }
      } catch (error) {
        console.error('NotificationContext: Initialization error:', error);
        setUsingFallback(true);
      }
    };
    
    initializeNotifications();
  }, [user, permission, deviceToken]);

  // Listen for foreground messages
  useEffect(() => {
    let unsubscribe = () => {};
    
    if (messaging) {
      try {
        unsubscribe = onMessage(messaging, (payload) => {
          toast(payload.notification?.body || 'New notification', {
            icon: '🔔',
            duration: 5000,
          });
        });
      } catch (error) {
        console.error('NotificationContext: Failed to set up message listener:', error);
        setUsingFallback(true);
      }
    } else {
      setUsingFallback(true);
    }
    
    return unsubscribe;
  }, []);

  // Helper to request permission
  const requestPermission = async () => {
    try {
      if (!('Notification' in window)) {
        setError('This browser does not support notifications');
        return;
      }
      
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications enabled!');
        
        // If we're using Firebase messaging, try to get a token
        if (messaging && !usingFallback) {
          try {
            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (currentToken) {
              setDeviceToken(currentToken);
              // Save device token to backend for this user
              try {
                await saveDeviceToken(currentToken);
              } catch (saveError) {
                console.error('Failed to save device token:', saveError);
              }
            }
          } catch (tokenError) {
            console.error('Failed to get device token after permission granted:', tokenError);
            setError('Failed to get device token');
            setUsingFallback(true);
          }
        }
      } else {
        toast.error('Notifications denied.');
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      setError('Failed to request notification permission');
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      permission, 
      deviceToken, 
      requestPermission, 
      error,
      usingFallback
    }}>
      {children}
    </NotificationContext.Provider>
  );
}; 