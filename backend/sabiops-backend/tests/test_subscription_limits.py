"""
Test subscription limit enforcement
"""
import pytest
import json
from unittest.mock import Mock, patch
from src.services.subscription_service import SubscriptionService
from src.utils.subscription_decorators import protected_expense_creation, protected_sales_creation

class TestSubscriptionLimits:
    """Test subscription limit enforcement functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.subscription_service = SubscriptionService()
        
        # Mock supabase client
        self.mock_supabase = Mock()
        self.subscription_service.supabase = self.mock_supabase
        
    def test_can_create_expense_within_limit(self):
        """Test that expense creation is allowed when within limits"""
        # Mock user subscription status
        mock_subscription = {
            'subscription_plan': 'monthly',
            'plan_config': {
                'features': {'expenses': 500}
            }
        }
        
        # Mock usage data showing user is within limits
        mock_usage_data = {
            'usage_counts': {
                'expenses': {
                    'current_count': 100,  # Well within 500 limit
                    'limit_count': 500
                }
            }
        }
        
        with patch.object(self.subscription_service, 'get_unified_subscription_status', return_value=mock_subscription), \
             patch.object(self.subscription_service, 'get_accurate_usage_counts', return_value=mock_usage_data):
            
            can_create, limit_info = self.subscription_service.can_create_expense('test_user_id')
            
            assert can_create is True
            assert limit_info['message'] == 'Expense creation allowed'
            assert limit_info['current_usage'] == 100
            assert limit_info['limit'] == 500
            assert limit_info['remaining'] == 400
    
    def test_can_create_expense_at_limit(self):
        """Test that expense creation is blocked when at limit"""
        # Mock user subscription status
        mock_subscription = {
            'subscription_plan': 'monthly',
            'plan_config': {
                'features': {'expenses': 500}
            }
        }
        
        # Mock usage data showing user is at limit
        mock_usage_data = {
            'usage_counts': {
                'expenses': {
                    'current_count': 500,  # At limit
                    'limit_count': 500
                }
            }
        }
        
        with patch.object(self.subscription_service, 'get_unified_subscription_status', return_value=mock_subscription), \
             patch.object(self.subscription_service, 'get_accurate_usage_counts', return_value=mock_usage_data):
            
            can_create, limit_info = self.subscription_service.can_create_expense('test_user_id')
            
            assert can_create is False
            assert 'Expense limit reached (500/500)' in limit_info['message']
            assert limit_info['current_usage'] == 500
            assert limit_info['limit'] == 500
            assert limit_info['upgrade_required'] is True
    
    def test_can_create_sales_within_limit(self):
        """Test that sales creation is allowed when within limits"""
        # Mock user subscription status
        mock_subscription = {
            'subscription_plan': 'weekly',
            'plan_config': {
                'features': {'sales': 250}
            }
        }
        
        # Mock usage data showing user is within limits
        mock_usage_data = {
            'usage_counts': {
                'sales': {
                    'current_count': 50,  # Well within 250 limit
                    'limit_count': 250
                }
            }
        }
        
        with patch.object(self.subscription_service, 'get_unified_subscription_status', return_value=mock_subscription), \
             patch.object(self.subscription_service, 'get_accurate_usage_counts', return_value=mock_usage_data):
            
            can_create, limit_info = self.subscription_service.can_create_sale('test_user_id')
            
            assert can_create is True
            assert limit_info['message'] == 'Sales creation allowed'
            assert limit_info['current_usage'] == 50
            assert limit_info['limit'] == 250
            assert limit_info['remaining'] == 200
    
    def test_get_accurate_usage_counts(self):
        """Test that accurate usage counts are retrieved from database"""
        # Mock database counts
        mock_actual_counts = {
            'expenses': 100,
            'sales': 50,
            'invoices': 25,
            'products': 30
        }
        
        # Mock subscription status
        mock_subscription = {
            'plan_config': {
                'features': {
                    'expenses': 500,
                    'sales': 250,
                    'invoices': 450,
                    'products': 500
                }
            }
        }
        
        # Mock feature usage table (empty to test creation)
        self.mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        with patch.object(self.subscription_service, '_get_actual_database_counts', return_value=mock_actual_counts), \
             patch.object(self.subscription_service, 'get_unified_subscription_status', return_value=mock_subscription), \
             patch.object(self.subscription_service, '_get_business_owner_id', return_value='test_user_id'):
            
            usage_data = self.subscription_service.get_accurate_usage_counts('test_user_id')
            
            assert usage_data['user_id'] == 'test_user_id'
            assert usage_data['business_owner_id'] == 'test_user_id'
            assert usage_data['usage_counts']['expenses']['current_count'] == 100
            assert usage_data['usage_counts']['expenses']['limit_count'] == 500
            assert usage_data['usage_counts']['sales']['current_count'] == 50
            assert usage_data['usage_counts']['sales']['limit_count'] == 250
    
    def test_business_owner_id_resolution(self):
        """Test that business owner ID is correctly resolved for team members"""
        # Mock team member user data
        mock_user_data = {
            'owner_id': 'business_owner_123',
            'role': 'Employee'
        }
        
        self.mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_user_data
        
        business_owner_id = self.subscription_service._get_business_owner_id('team_member_456')
        
        assert business_owner_id == 'business_owner_123'
    
    def test_business_owner_id_for_owner(self):
        """Test that business owner ID returns user ID for business owners"""
        # Mock business owner user data (no owner_id)
        mock_user_data = {
            'owner_id': None,
            'role': 'Owner'
        }
        
        self.mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_user_data
        
        business_owner_id = self.subscription_service._get_business_owner_id('business_owner_123')
        
        assert business_owner_id == 'business_owner_123'

if __name__ == '__main__':
    pytest.main([__file__])