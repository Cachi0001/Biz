"""
Unit tests for Subscription Decorators
Tests the subscription-based access control functionality
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the src directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from utils.subscription_decorators import (
    subscription_required, 
    analytics_access_required, 
    premium_analytics_required,
    check_analytics_access,
    get_subscription_upgrade_info
)

class TestSubscriptionDecorators(unittest.TestCase):
    """Test cases for subscription decorators"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.sample_user_id = "test-user-123"
        
        # Sample subscription status data
        self.free_user_status = {
            'subscription_plan': 'free',
            'subscription_status': 'inactive',
            'is_trial': False,
            'is_active': False,
            'trial_days_left': 0
        }
        
        self.trial_user_status = {
            'subscription_plan': 'weekly',
            'subscription_status': 'trial',
            'is_trial': True,
            'is_active': True,
            'trial_days_left': 5
        }
        
        self.paid_user_status = {
            'subscription_plan': 'monthly',
            'subscription_status': 'active',
            'is_trial': False,
            'is_active': True,
            'trial_days_left': 0
        }
        
        self.expired_user_status = {
            'subscription_plan': 'monthly',
            'subscription_status': 'expired',
            'is_trial': False,
            'is_active': False,
            'trial_days_left': 0
        }

    @patch('utils.subscription_decorators.get_jwt_identity')
    @patch('utils.subscription_decorators.SubscriptionService')
    def test_subscription_required_free_user_denied(self, mock_subscription_service, mock_get_jwt_identity):
        """Test that free users are denied access"""
        # Mock JWT identity
        mock_get_jwt_identity.return_value = self.sample_user_id
        
        # Mock subscription service
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.return_value = self.free_user_status
        mock_subscription_service.return_value = mock_service_instance
        
        # Create a test function with the decorator
        @subscription_required(['weekly', 'monthly', 'yearly'])
        def test_function():
            return "success"
        
        # Mock Flask's jsonify
        with patch('utils.subscription_decorators.jsonify') as mock_jsonify:
            mock_jsonify.return_value = ("mocked_response", 403)
            
            result = test_function()
            
            # Should return 403 error
            self.assertEqual(result[1], 403)
            mock_jsonify.assert_called_once()
            
            # Check that the error response contains expected fields
            call_args = mock_jsonify.call_args[0][0]
            self.assertFalse(call_args['success'])
            self.assertEqual(call_args['error'], 'Subscription required')
            self.assertTrue(call_args['upgrade_required'])

    @patch('utils.subscription_decorators.get_jwt_identity')
    @patch('utils.subscription_decorators.SubscriptionService')
    def test_subscription_required_trial_user_allowed(self, mock_subscription_service, mock_get_jwt_identity):
        """Test that trial users are allowed access"""
        # Mock JWT identity
        mock_get_jwt_identity.return_value = self.sample_user_id
        
        # Mock subscription service
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.return_value = self.trial_user_status
        mock_subscription_service.return_value = mock_service_instance
        
        # Create a test function with the decorator
        @subscription_required(['weekly', 'monthly', 'yearly'], allow_trial=True)
        def test_function():
            return "success"
        
        result = test_function()
        
        # Should return success
        self.assertEqual(result, "success")

    @patch('utils.subscription_decorators.get_jwt_identity')
    @patch('utils.subscription_decorators.SubscriptionService')
    def test_subscription_required_paid_user_allowed(self, mock_subscription_service, mock_get_jwt_identity):
        """Test that paid users are allowed access"""
        # Mock JWT identity
        mock_get_jwt_identity.return_value = self.sample_user_id
        
        # Mock subscription service
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.return_value = self.paid_user_status
        mock_subscription_service.return_value = mock_service_instance
        
        # Create a test function with the decorator
        @subscription_required(['weekly', 'monthly', 'yearly'])
        def test_function():
            return "success"
        
        result = test_function()
        
        # Should return success
        self.assertEqual(result, "success")

    @patch('utils.subscription_decorators.get_jwt_identity')
    @patch('utils.subscription_decorators.SubscriptionService')
    def test_subscription_required_expired_user_denied(self, mock_subscription_service, mock_get_jwt_identity):
        """Test that expired users are denied access"""
        # Mock JWT identity
        mock_get_jwt_identity.return_value = self.sample_user_id
        
        # Mock subscription service
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.return_value = self.expired_user_status
        mock_subscription_service.return_value = mock_service_instance
        
        # Create a test function with the decorator
        @subscription_required(['weekly', 'monthly', 'yearly'])
        def test_function():
            return "success"
        
        # Mock Flask's jsonify
        with patch('utils.subscription_decorators.jsonify') as mock_jsonify:
            mock_jsonify.return_value = ("mocked_response", 403)
            
            result = test_function()
            
            # Should return 403 error
            self.assertEqual(result[1], 403)
            mock_jsonify.assert_called_once()
            
            # Check that the error response indicates expiration
            call_args = mock_jsonify.call_args[0][0]
            self.assertFalse(call_args['success'])
            self.assertEqual(call_args['error'], 'Subscription expired')

    @patch('utils.subscription_decorators.get_jwt_identity')
    def test_subscription_required_no_user_denied(self, mock_get_jwt_identity):
        """Test that requests without user identity are denied"""
        # Mock no JWT identity
        mock_get_jwt_identity.return_value = None
        
        # Create a test function with the decorator
        @subscription_required(['weekly', 'monthly', 'yearly'])
        def test_function():
            return "success"
        
        # Mock Flask's jsonify
        with patch('utils.subscription_decorators.jsonify') as mock_jsonify:
            mock_jsonify.return_value = ("mocked_response", 401)
            
            result = test_function()
            
            # Should return 401 error
            self.assertEqual(result[1], 401)
            mock_jsonify.assert_called_once()
            
            # Check that the error response indicates authentication required
            call_args = mock_jsonify.call_args[0][0]
            self.assertFalse(call_args['success'])
            self.assertEqual(call_args['error'], 'Authentication required')

    def test_analytics_access_required_decorator(self):
        """Test the analytics_access_required decorator"""
        # This should be equivalent to subscription_required with specific parameters
        @analytics_access_required
        def test_function():
            return "success"
        
        # The decorator should be applied
        self.assertTrue(hasattr(test_function, '__wrapped__'))

    def test_premium_analytics_required_decorator(self):
        """Test the premium_analytics_required decorator"""
        # This should be equivalent to subscription_required with no trial allowed
        @premium_analytics_required
        def test_function():
            return "success"
        
        # The decorator should be applied
        self.assertTrue(hasattr(test_function, '__wrapped__'))

    @patch('utils.subscription_decorators.SubscriptionService')
    def test_check_analytics_access_free_user(self, mock_subscription_service):
        """Test analytics access check for free user"""
        # Mock subscription service
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.return_value = self.free_user_status
        mock_subscription_service.return_value = mock_service_instance
        
        result = check_analytics_access(self.sample_user_id)
        
        # Should deny access
        self.assertFalse(result['has_access'])
        self.assertEqual(result['reason'], 'Free plan does not include analytics')
        self.assertTrue(result['upgrade_required'])
        self.assertTrue(result['trial_available'])

    @patch('utils.subscription_decorators.SubscriptionService')
    def test_check_analytics_access_trial_user(self, mock_subscription_service):
        """Test analytics access check for trial user"""
        # Mock subscription service
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.return_value = self.trial_user_status
        mock_subscription_service.return_value = mock_service_instance
        
        result = check_analytics_access(self.sample_user_id)
        
        # Should allow access
        self.assertTrue(result['has_access'])
        self.assertEqual(result['reason'], 'Trial access granted')
        self.assertTrue(result['is_trial'])
        self.assertEqual(result['trial_days_left'], 5)

    @patch('utils.subscription_decorators.SubscriptionService')
    def test_check_analytics_access_paid_user(self, mock_subscription_service):
        """Test analytics access check for paid user"""
        # Mock subscription service
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.return_value = self.paid_user_status
        mock_subscription_service.return_value = mock_service_instance
        
        result = check_analytics_access(self.sample_user_id)
        
        # Should allow access
        self.assertTrue(result['has_access'])
        self.assertEqual(result['reason'], 'Paid subscription active')
        self.assertFalse(result['is_trial'])

    @patch('utils.subscription_decorators.SubscriptionService')
    def test_check_analytics_access_expired_user(self, mock_subscription_service):
        """Test analytics access check for expired user"""
        # Mock subscription service
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.return_value = self.expired_user_status
        mock_subscription_service.return_value = mock_service_instance
        
        result = check_analytics_access(self.sample_user_id)
        
        # Should deny access
        self.assertFalse(result['has_access'])
        self.assertEqual(result['reason'], 'Subscription expired')
        self.assertTrue(result['upgrade_required'])
        self.assertTrue(result['is_expired'])

    @patch('utils.subscription_decorators.SubscriptionService')
    def test_check_analytics_access_service_error(self, mock_subscription_service):
        """Test analytics access check when service throws error"""
        # Mock subscription service to raise exception
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.side_effect = Exception("Service error")
        mock_subscription_service.return_value = mock_service_instance
        
        result = check_analytics_access(self.sample_user_id)
        
        # Should deny access and include error
        self.assertFalse(result['has_access'])
        self.assertEqual(result['reason'], 'Error verifying subscription')
        self.assertIn('error', result)
        self.assertTrue(result['upgrade_required'])

    @patch('utils.subscription_decorators.SubscriptionService')
    def test_get_subscription_upgrade_info_free_user(self, mock_subscription_service):
        """Test getting upgrade info for free user"""
        # Mock subscription service
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.return_value = self.free_user_status
        mock_subscription_service.return_value = mock_service_instance
        
        result = get_subscription_upgrade_info(self.sample_user_id)
        
        # Should return upgrade options
        self.assertEqual(result['current_plan'], 'free')
        self.assertTrue(result['trial_available'])
        self.assertIn('upgrade_options', result)
        self.assertGreater(len(result['upgrade_options']), 0)
        
        # Check that upgrade options have required fields
        for option in result['upgrade_options']:
            self.assertIn('plan', option)
            self.assertIn('name', option)
            self.assertIn('price', option)
            self.assertIn('features', option)

    @patch('utils.subscription_decorators.SubscriptionService')
    def test_get_subscription_upgrade_info_service_error(self, mock_subscription_service):
        """Test getting upgrade info when service throws error"""
        # Mock subscription service to raise exception
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.side_effect = Exception("Service error")
        mock_subscription_service.return_value = mock_service_instance
        
        result = get_subscription_upgrade_info(self.sample_user_id)
        
        # Should return error info
        self.assertEqual(result['current_plan'], 'unknown')
        self.assertEqual(len(result['upgrade_options']), 0)
        self.assertIn('error', result)

    @patch('utils.subscription_decorators.get_jwt_identity')
    @patch('utils.subscription_decorators.SubscriptionService')
    def test_decorator_exception_handling(self, mock_subscription_service, mock_get_jwt_identity):
        """Test that decorator handles exceptions gracefully"""
        # Mock JWT identity
        mock_get_jwt_identity.return_value = self.sample_user_id
        
        # Mock subscription service to raise exception
        mock_service_instance = Mock()
        mock_service_instance.get_unified_subscription_status.side_effect = Exception("Service error")
        mock_subscription_service.return_value = mock_service_instance
        
        # Create a test function with the decorator
        @subscription_required(['weekly', 'monthly', 'yearly'])
        def test_function():
            return "success"
        
        # Mock Flask's jsonify
        with patch('utils.subscription_decorators.jsonify') as mock_jsonify:
            mock_jsonify.return_value = ("mocked_response", 500)
            
            result = test_function()
            
            # Should return 500 error
            self.assertEqual(result[1], 500)
            mock_jsonify.assert_called_once()
            
            # Check that the error response indicates service failure
            call_args = mock_jsonify.call_args[0][0]
            self.assertFalse(call_args['success'])
            self.assertEqual(call_args['error'], 'Subscription verification failed')

if __name__ == '__main__':
    unittest.main()