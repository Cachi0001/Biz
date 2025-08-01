/**
 * Push Notification Manager Component
 * Allows users to manage their push notification settings
 */

import React, { useState, useEffect } from 'react';
import PushNotificationService from '../services/PushNotificationService';

const PushNotificationManager = () => {
  const [tokens, setTokens] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadUserTokens();
    loadPreferences();
  }, []);

  const loadUserTokens = async () => {
    try {
      setLoading(true);
      const response = await PushNotificationService.getUserTokens();
      setTokens(response.data.tokens || []);
    } catch (err) {
      setError('Failed to load device tokens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await PushNotificationService.getNotificationPreferences();
      setPreferences(response.data.preferences || []);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if push notifications are supported
      if (!PushNotificationService.isSupported()) {
        setError('Push notifications are not supported in this browser');
        return;
      }

      // For demo purposes, we'll register a mock token
      // In a real implementation, you'd get the actual FCM token
      const mockToken = `web_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await PushNotificationService.registerDeviceToken(mockToken, 'web', {
        demo: true,
        registered_at: new Date().toISOString()
      });

      setSuccess('Push notifications enabled successfully!');
      loadUserTokens();

    } catch (err) {
      setError(err.message || 'Failed to enable push notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveToken = async (tokenId) => {
    try {
      setLoading(true);
      await PushNotificationService.removeDeviceToken(tokenId);
      setSuccess('Device token removed successfully');
      loadUserTokens();
    } catch (err) {
      setError('Failed to remove device token');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await PushNotificationService.sendTestNotification();
      
      if (response.data.sent) {
        setSuccess('Test notification sent successfully!');
      } else {
        setError('No active device tokens found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send test notification');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (index, enabled) => {
    const updatedPreferences = [...preferences];
    updatedPreferences[index].enabled = enabled;
    setPreferences(updatedPreferences);
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      await PushNotificationService.updateNotificationPreferences(preferences);
      setSuccess('Notification preferences updated successfully');
    } catch (err) {
      setError('Failed to update preferences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDeviceType = (deviceType) => {
    const types = {
      web: '🌐 Web Browser',
      android: '📱 Android',
      ios: '📱 iOS',
      desktop: '💻 Desktop'
    };
    return types[deviceType] || deviceType;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="push-notification-manager p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Push Notification Settings</h2>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Device Tokens Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Your Devices</h3>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleEnablePushNotifications}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Enable Push Notifications'}
          </button>
          
          <button
            onClick={handleSendTestNotification}
            disabled={loading || tokens.length === 0}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Send Test Notification
          </button>
        </div>

        {tokens.length === 0 ? (
          <p className="text-gray-500">No devices registered for push notifications</p>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{formatDeviceType(token.device_type)}</div>
                  <div className="text-sm text-gray-500">
                    Registered: {formatDate(token.created_at)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Token: {token.token.substring(0, 20)}...
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveToken(token.id)}
                  className="text-red-500 hover:text-red-700 px-3 py-1 border border-red-300 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Preferences Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        
        {preferences.length === 0 ? (
          <p className="text-gray-500">Loading preferences...</p>
        ) : (
          <div className="space-y-3">
            {preferences.map((pref, index) => (
              <div key={pref.notification_type || index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium capitalize">
                    {(pref.notification_type || 'Unknown').replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getPreferenceDescription(pref.notification_type)}
                  </div>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pref.enabled}
                    onChange={(e) => handlePreferenceChange(index, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>
            ))}
            
            <button
              onClick={handleSavePreferences}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 mt-4"
            >
              Save Preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const getPreferenceDescription = (type) => {
  const descriptions = {
    low_stock_alert: 'Get notified when product stock is running low',
    payment_success: 'Receive confirmations for successful payments',
    subscription_expiry: 'Reminders about subscription renewals',
    invoice_created: 'Notifications when new invoices are created',
    team_activity: 'Updates about team member activities',
    system_maintenance: 'Important system updates and maintenance notices'
  };
  return descriptions[type] || 'Notification preference';
};

export default PushNotificationManager;