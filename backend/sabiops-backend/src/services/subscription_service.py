"""
Subscription Management Service
Handles subscription upgrades, downgrades, status checks, and trial management
"""

import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple, Any
import logging
from flask import current_app

logger = logging.getLogger(__name__)

class SubscriptionService:
    """Service for managing user subscriptions and payments"""
    
    PAYSTACK_BASE_URL = "https://api.paystack.co"
    
    # Plan configurations matching frontend PaystackService
    PLAN_CONFIGS = {
        'free': {
            'id': 'free',
            'name': 'Free Plan',
            'price': 0,
            'period': 'forever',
            'duration_days': None,
            'trial_days': 0,
            'features': {
                'invoices': 5,
                'expenses': 20,
                'sales': 50,
                'products': 20
            }
        },
        'weekly': {
            'id': 'weekly',
            'name': 'Silver Weekly',
            'price': 140000,  # ₦1,400 in kobo
            'period': 'week',
            'duration_days': 7,
            'trial_days': 7,
            'features': {
                'invoices': 100,
                'expenses': 100,
                'sales': 250,
                'products': 100
            }
        },
        'monthly': {
            'id': 'monthly',
            'name': 'Silver Monthly',
            'price': 450000,  # ₦4,500 in kobo
            'period': 'month',
            'duration_days': 30,
            'trial_days': 0,
            'features': {
                'invoices': 450,
                'expenses': 500,
                'sales': 1500,
                'products': 500
            }
        },
        'yearly': {
            'id': 'yearly',
            'name': 'Silver Yearly',
            'price': 5000000,  # ₦50,000 in kobo
            'period': 'year',
            'duration_days': 365,
            'trial_days': 0,
            'features': {
                'invoices': 6000,
                'expenses': 2000,
                'sales': 18000,
                'products': 2000
            }
        }
    }
    
    def __init__(self):
        self.supabase = current_app.config.get('SUPABASE')
        self.paystack_secret = os.getenv('PAYSTACK_SECRET_KEY')
        
    def get_user_subscription_status(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive subscription status for a user"""
        try:
            # Get user data
            user_result = self.supabase.table('users').select('*').eq('id', user_id).single().execute()
            if not user_result.data:
                raise ValueError("User not found")
            
            user = user_result.data
            
            # Check if user is a team member (has owner_id)
            owner_id = user.get('owner_id')
            if owner_id:
                # Team member inherits subscription from owner
                logger.info(f"User {user_id} is team member, inheriting from owner {owner_id}")
                owner_result = self.supabase.table('users').select('*').eq('id', owner_id).single().execute()
                if owner_result.data:
                    # Use owner's subscription data
                    subscription_user = owner_result.data
                else:
                    # Fallback to user's own data if owner not found
                    subscription_user = user
            else:
                # User is owner or individual user
                subscription_user = user
            
            subscription_plan = subscription_user.get('subscription_plan', 'free')
            subscription_status = subscription_user.get('subscription_status', 'inactive')
            trial_days_left = subscription_user.get('trial_days_left', 0)
            subscription_end_date = subscription_user.get('subscription_end_date')
            
            # Calculate remaining days
            remaining_days = self._calculate_remaining_days(
                subscription_plan, 
                subscription_end_date, 
                trial_days_left
            )
            
            # Get plan configuration
            plan_config = self.PLAN_CONFIGS.get(subscription_plan, self.PLAN_CONFIGS['free'])
            
            return {
                'user_id': user_id,
                'subscription_plan': subscription_plan,
                'subscription_status': subscription_status,
                'remaining_days': remaining_days,
                'trial_days_left': trial_days_left,
                'plan_config': plan_config,
                'subscription_end_date': subscription_end_date,
                'is_trial': trial_days_left > 0 and subscription_plan == 'weekly',
                'is_active': subscription_status == 'active' or trial_days_left > 0,
                'is_team_member': bool(owner_id),
                'owner_id': owner_id
            }
            
        except Exception as e:
            logger.error(f"Error getting subscription status for user {user_id}: {str(e)}")
            raise
    
    def verify_paystack_payment(self, reference: str) -> Dict[str, Any]:
        """Verify payment with Paystack API"""
        try:
            headers = {
                'Authorization': f'Bearer {self.paystack_secret}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{self.PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"Paystack API error: {response.status_code}")
            
            paystack_data = response.json()
            
            if not paystack_data.get('status'):
                raise Exception("Paystack verification failed")
            
            transaction_data = paystack_data.get('data', {})
            
            if transaction_data.get('status') != 'success':
                raise Exception(f"Payment not successful: {transaction_data.get('status')}")
            
            return {
                'success': True,
                'reference': transaction_data.get('reference'),
                'amount': transaction_data.get('amount', 0) / 100,  # Convert from kobo
                'currency': transaction_data.get('currency'),
                'channel': transaction_data.get('channel'),
                'fees': transaction_data.get('fees', 0) / 100,
                'customer_email': transaction_data.get('customer', {}).get('email'),
                'paid_at': transaction_data.get('paid_at'),
                'metadata': transaction_data.get('metadata', {})
            }
            
        except Exception as e:
            logger.error(f"Paystack verification failed for reference {reference}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def upgrade_subscription(self, user_id: str, plan_id: str, payment_reference: str, 
                           paystack_data: Dict[str, Any]) -> Dict[str, Any]:
        """Upgrade user subscription after successful payment verification"""
        try:
            # Validate plan
            if plan_id not in self.PLAN_CONFIGS:
                raise ValueError(f"Invalid plan ID: {plan_id}")
            
            plan_config = self.PLAN_CONFIGS[plan_id]
            
            # Calculate subscription dates
            start_date = datetime.now()
            end_date = self._calculate_subscription_end_date(plan_id, start_date)
            
            # Update user subscription
            update_data = {
                'subscription_plan': plan_id,
                'subscription_status': 'active',
                'subscription_start_date': start_date.isoformat(),
                'subscription_end_date': end_date.isoformat() if end_date else None,
                'last_payment_date': start_date.isoformat(),
                'payment_reference': payment_reference,
                'trial_days_left': 0,  # Reset trial when upgrading
                'updated_at': datetime.now().isoformat()
            }
            
            # Update user record
            user_result = self.supabase.table('users').update(update_data).eq('id', user_id).execute()
            
            if not user_result.data:
                raise Exception("Failed to update user subscription")
            
            # Record subscription transaction
            transaction_data = {
                'user_id': user_id,
                'plan_id': plan_id,
                'amount': paystack_data.get('amount', 0),
                'payment_reference': payment_reference,
                'paystack_reference': paystack_data.get('reference'),
                'status': 'successful',
                'metadata': paystack_data,
                'created_at': datetime.now().isoformat()
            }
            
            self.supabase.table('subscription_transactions').insert(transaction_data).execute()
            
            # Reset usage counters for new plan
            self._reset_usage_counters(user_id, plan_id)
            
            logger.info(f"Successfully upgraded user {user_id} to {plan_id}")
            
            return {
                'success': True,
                'subscription': user_result.data[0],
                'plan_config': plan_config,
                'usage_reset': True,
                'message': f'Successfully upgraded to {plan_config["name"]}'
            }
            
        except Exception as e:
            logger.error(f"Subscription upgrade failed for user {user_id}: {str(e)}")
            raise
    
    def activate_trial(self, user_id: str) -> Dict[str, Any]:
        """Activate 7-day free trial for new users"""
        try:
            trial_end_date = datetime.now() + timedelta(days=7)
            
            update_data = {
                'subscription_plan': 'weekly',
                'subscription_status': 'trial',
                'trial_days_left': 7,
                'subscription_start_date': datetime.now().isoformat(),
                'subscription_end_date': trial_end_date.isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('users').update(update_data).eq('id', user_id).execute()
            
            if not result.data:
                raise Exception("Failed to activate trial")
            
            # Initialize usage counters for trial
            self._reset_usage_counters(user_id, 'weekly')
            
            logger.info(f"Activated 7-day trial for user {user_id}")
            
            return {
                'success': True,
                'message': '7-day free trial activated',
                'trial_end_date': trial_end_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Trial activation failed for user {user_id}: {str(e)}")
            raise
    
    def check_and_update_expired_subscriptions(self) -> int:
        """Check for expired subscriptions and downgrade to free plan"""
        try:
            current_time = datetime.now()
            
            # Find expired subscriptions
            expired_users = self.supabase.table('users').select('*').lt(
                'subscription_end_date', current_time.isoformat()
            ).neq('subscription_plan', 'free').execute()
            
            count = 0
            for user in expired_users.data:
                try:
                    # Downgrade to free plan
                    self.supabase.table('users').update({
                        'subscription_plan': 'free',
                        'subscription_status': 'inactive',
                        'trial_days_left': 0,
                        'updated_at': current_time.isoformat()
                    }).eq('id', user['id']).execute()
                    
                    # Reset usage counters to free plan limits
                    self._reset_usage_counters(user['id'], 'free')
                    
                    count += 1
                    logger.info(f"Downgraded expired subscription for user {user['id']}")
                    
                except Exception as e:
                    logger.error(f"Failed to downgrade user {user['id']}: {str(e)}")
            
            return count
            
        except Exception as e:
            logger.error(f"Error checking expired subscriptions: {str(e)}")
            return 0
    
    def get_team_owner_subscription(self, team_member_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription status of team owner for inheritance"""
        try:
            # Get team member's business owner using users table
            user_result = self.supabase.table('users').select('owner_id').eq(
                'id', team_member_id
            ).single().execute()
            
            if not user_result.data or not user_result.data.get('owner_id'):
                # User is not a team member or is the owner themselves
                return None
            
            owner_id = user_result.data['owner_id']
            return self.get_user_subscription_status(owner_id)
            
        except Exception as e:
            logger.error(f"Error getting team owner subscription for {team_member_id}: {str(e)}")
            return None
    
    def _calculate_remaining_days(self, plan: str, end_date_str: Optional[str], 
                                trial_days: int) -> int:
        """Calculate remaining subscription days"""
        try:
            if plan == 'free':
                return -1  # Unlimited for free plan
            
            if trial_days > 0:
                return trial_days
            
            if not end_date_str:
                return 0
            
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            remaining = (end_date - datetime.now()).days
            return max(0, remaining)
            
        except Exception as e:
            logger.error(f"Error calculating remaining days: {str(e)}")
            return 0
    
    def _calculate_subscription_end_date(self, plan_id: str, start_date: datetime) -> Optional[datetime]:
        """Calculate subscription end date based on plan"""
        plan_config = self.PLAN_CONFIGS.get(plan_id)
        if not plan_config or not plan_config.get('duration_days'):
            return None
        
        return start_date + timedelta(days=plan_config['duration_days'])
    
    def _reset_usage_counters(self, user_id: str, plan_id: str):
        """Reset usage counters for new plan limits"""
        try:
            plan_config = self.PLAN_CONFIGS.get(plan_id, self.PLAN_CONFIGS['free'])
            current_time = datetime.now()
            
            # Calculate period based on plan
            if plan_id == 'weekly':
                period_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
                period_end = period_start + timedelta(days=7)
            elif plan_id == 'yearly':
                period_start = current_time.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                period_end = period_start.replace(year=period_start.year + 1)
            else:  # monthly or free
                period_start = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if period_start.month == 12:
                    period_end = period_start.replace(year=period_start.year + 1, month=1)
                else:
                    period_end = period_start.replace(month=period_start.month + 1)
            
            # Delete existing usage records for this user
            self.supabase.table('feature_usage').delete().eq('user_id', user_id).execute()
            
            # Create new usage records with reset counters
            for feature_type, limit in plan_config['features'].items():
                usage_data = {
                    'user_id': user_id,
                    'feature_type': feature_type,
                    'current_count': 0,
                    'limit_count': limit,
                    'period_start': period_start.isoformat(),
                    'period_end': period_end.isoformat(),
                    'created_at': current_time.isoformat(),
                    'updated_at': current_time.isoformat()
                }
                
                self.supabase.table('feature_usage').insert(usage_data).execute()
            
            # Update user table counters for backward compatibility
            self.supabase.table('users').update({
                'current_month_invoices': 0,
                'current_month_expenses': 0,
                'usage_reset_date': current_time.date().isoformat(),
                'updated_at': current_time.isoformat()
            }).eq('id', user_id).execute()
            
            logger.info(f"Reset usage counters for user {user_id} with plan {plan_id}")
            
        except Exception as e:
            logger.error(f"Error resetting usage counters for user {user_id}: {str(e)}")
            raise