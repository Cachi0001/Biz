"""
Subscription Management Service
Handles subscription upgrades, downgrades, status checks, and trial management
"""

import os
import requests
from datetime import datetime, timedelta, timezone
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
        
    def get_unified_subscription_status(self, user_id: str) -> Dict[str, Any]:
        """Get single source of truth for subscription status - resolves conflicts"""
        try:
            # First resolve any subscription conflicts
            self.resolve_subscription_conflicts(user_id)
            
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
            
            # Determine unified status priority: expired > trial > active > inactive
            unified_status = self._determine_unified_status(
                subscription_status, trial_days_left, remaining_days, subscription_plan
            )
            
            # Get plan configuration
            plan_config = self.PLAN_CONFIGS.get(subscription_plan, self.PLAN_CONFIGS['free'])
            
            return {
                'user_id': user_id,
                'subscription_plan': subscription_plan,
                'subscription_status': subscription_status,
                'unified_status': unified_status,  # Single source of truth
                'remaining_days': remaining_days,
                'trial_days_left': trial_days_left,
                'plan_config': plan_config,
                'subscription_end_date': subscription_end_date,
                'is_trial': unified_status == 'trial',
                'is_active': unified_status in ['active', 'trial'],
                'is_expired': unified_status == 'expired',
                'is_team_member': bool(owner_id),
                'owner_id': owner_id,
                'display_message': self._get_status_display_message(unified_status, remaining_days, subscription_plan)
            }
            
        except Exception as e:
            logger.error(f"Error getting unified subscription status for user {user_id}: {str(e)}")
            raise

    def get_user_subscription_status(self, user_id: str) -> Dict[str, Any]:
        """Legacy method - redirects to unified status for backward compatibility"""
        return self.get_unified_subscription_status(user_id)

    def resolve_subscription_conflicts(self, user_id: str) -> Dict[str, Any]:
        """Resolve conflicting subscription states using most recent database record"""
        try:
            # Get all subscription-related records for this user
            user_result = self.supabase.table('users').select('*').eq('id', user_id).single().execute()
            if not user_result.data:
                return {'conflicts_found': False, 'message': 'User not found'}
            
            user = user_result.data
            current_time = datetime.now()
            
            # Check for expired subscriptions that are still marked as active
            subscription_end_date = user.get('subscription_end_date')
            subscription_status = user.get('subscription_status', 'inactive')
            trial_days_left = user.get('trial_days_left', 0)
            
            if subscription_end_date and subscription_status == 'active':
                end_date = datetime.fromisoformat(subscription_end_date.replace('Z', '+00:00'))
                if end_date < current_time and trial_days_left <= 0:
                    # Subscription has expired but still marked as active
                    self.supabase.table('users').update({
                        'subscription_status': 'expired',
                        'subscription_plan': 'free',
                        'trial_days_left': 0,
                        'updated_at': current_time.isoformat()
                    }).eq('id', user_id).execute()
                    
                    logger.info(f"Resolved expired subscription conflict for user {user_id}")
            
            # Check for trial conflicts
            if trial_days_left > 0 and subscription_status not in ['trial', 'active']:
                # Has trial days but wrong status
                self.supabase.table('users').update({
                    'subscription_status': 'trial',
                    'updated_at': current_time.isoformat()
                }).eq('id', user_id).execute()
                
                logger.info(f"Resolved trial status conflict for user {user_id}")
            
            # Check for multiple active subscriptions (shouldn't happen but just in case)
            # This would require checking subscription_transactions table for duplicates
            
            return {
                'conflicts_found': True,
                'message': "Resolved subscription conflicts"
            }
            
        except Exception as e:
            logger.error(f"Error resolving subscription conflicts for user {user_id}: {str(e)}")
            return {'conflicts_found': False, 'error': str(e)}

    def _determine_unified_status(self, subscription_status: str, trial_days_left: int, 
                                remaining_days: int, subscription_plan: str) -> str:
        """Determine single unified status based on all factors"""
        # Priority order: expired > trial > active > inactive
        
        if subscription_plan == 'free':
            return 'free'
        
        if remaining_days <= 0 and trial_days_left <= 0:
            return 'expired'
        
        if trial_days_left > 0:
            return 'trial'
        
        if subscription_status == 'active' and remaining_days > 0:
            return 'active'
        
        return 'inactive'

    def _get_status_display_message(self, unified_status: str, remaining_days: int, 
                                  subscription_plan: str) -> str:
        """Get appropriate display message for dashboard"""
        if unified_status == 'expired':
            return "Your subscription has expired. Reactivate to continue using premium features."
        elif unified_status == 'trial':
            return f"You're on a 7-day free trial. {remaining_days} days remaining."
        elif unified_status == 'active':
            plan_name = self.PLAN_CONFIGS.get(subscription_plan, {}).get('name', subscription_plan)
            return f"You're on {plan_name}. {remaining_days} days remaining."
        elif unified_status == 'free':
            return "You're on the free plan. Upgrade to unlock more features."
        else:
            return "Your subscription is inactive. Please upgrade to access premium features."
    
    def verify_paystack_payment(self, reference: str) -> Dict[str, Any]:
        try:
            if not self.paystack_secret:
                logger.error("Paystack secret key not configured")
                return {
                    'success': False,
                    'error': 'Payment processing not configured',
                    'reference': reference
                }
            
            # Call Paystack API to verify payment
            headers = {
                'Authorization': f'Bearer {self.paystack_secret}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'{self.PAYSTACK_BASE_URL}/transaction/verify/{reference}',
                headers=headers
            )
            
            response.raise_for_status()
            response_data = response.json()
            
            if not response_data.get('status'):
                logger.error(f"Paystack verification failed: {response_data.get('message')}")
                return {
                    'success': False,
                    'error': response_data.get('message', 'Payment verification failed'),
                    'reference': reference
                }
            
            data = response_data.get('data', {})
            
            # Check if payment was successful
            if data.get('status') != 'success':
                return {
                    'success': False,
                    'error': f"Payment not successful: {data.get('gateway_response')}",
                    'reference': reference,
                    'status': data.get('status')
                }
            
            return {
                'success': True,
                'reference': data.get('reference'),
                'amount': int(data.get('amount', 0)) / 100,  
                'currency': data.get('currency'),
                'channel': data.get('channel'),
                'paid_at': data.get('paid_at'),
                'customer_email': data.get('customer', {}).get('email'),
                'metadata': data.get('metadata', {})
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack API request failed: {str(e)}")
            return {
                'success': False,
                'error': 'Failed to connect to payment processor',
                'reference': reference
            }
        except Exception as e:
            logger.error(f"Error verifying payment: {str(e)}")
            return {
                'success': False,
                'error': 'An error occurred while verifying payment',
                'reference': reference
            }

    def upgrade_subscription(self, user_id: str, plan_id: str, payment_reference: str, 
                           paystack_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            from flask_jwt_extended import create_access_token
            
            user_result = self.supabase.table('users').select('*').eq('id', user_id).single().execute()
            if not user_result.data:
                raise ValueError("User not found")
            
            user = user_result.data
            now = datetime.now(timezone.utc)
            
            plan_config = self.PLAN_CONFIGS.get(plan_id)
            if not plan_config:
                raise ValueError("Invalid subscription plan")
            
            current_plan = user.get('subscription_plan', 'free')
            
            # Check if this is the same plan and already active
            if current_plan == plan_id and user.get('subscription_status') == 'active':
                logger.info(f"User {user_id} is already on the {plan_id} plan")
                return {
                    'success': True,
                    'message': f'You are already on the {plan_config["name"]} plan',
                    'subscription': {
                        'plan': plan_id,
                        'status': 'active',
                        'end_date': user.get('subscription_end_date')
                    },
                    'plan_config': plan_config,
                    'usage_reset': False
                }
            
            # Handle trial logic
            is_trial = False
            bonus_days = int(user.get('trial_bonus_days', 0))
            
            # Check if eligible for trial (only for weekly plan)
            if plan_id == 'weekly' and (user.get('trial_days_left', 0) > 0 or 
                                      (user.get('trial_ends_at') and 
                                       datetime.fromisoformat(user['trial_ends_at']) > now)):
                is_trial = True
                trial_days = 7  # Default 7-day trial
                
                # If trial already started, use existing end date
                if user.get('trial_ends_at'):
                    end_date = datetime.fromisoformat(user['trial_ends_at'])
                    if bonus_days > 0:
                        end_date += timedelta(days=bonus_days)
                else:
                    # New trial
                    end_date = now + timedelta(days=trial_days + bonus_days)
                
                subscription_status = 'trial'
                message = f'Trial activated for {plan_config["name"]} plan! You have {trial_days + bonus_days} days to try it out.'
            else:
                # For paid plans, add plan duration to current date
                end_date = now + timedelta(days=plan_config['duration_days'])
                subscription_status = 'active'
                message = f'Successfully upgraded to {plan_config["name"]} plan!'
            
            # Prepare transaction data with all required fields
            transaction_data = {
                'user_id': user_id,
                'plan_id': plan_id,
                'reference': payment_reference,
                'amount': paystack_data.get('amount', 0) if not is_trial else 0,
                'status': 'completed',
                'payment_method': paystack_data.get('channel', 'trial'),
                'payment_date': paystack_data.get('paid_at', now.isoformat()),
                'is_trial': is_trial,
                'trial_bonus_applied': bool(bonus_days > 0 and is_trial),
                'bonus_days_used': bonus_days if is_trial else 0,
                'proration_applied': False,  # Will be set by proration logic if applicable
                'proration_details': {},
                'metadata': {
                    'is_trial': is_trial,
                    'previous_plan': current_plan,
                    'bonus_days_used': bonus_days if is_trial else 0,
                    'payment_data': {
                        k: v for k, v in paystack_data.items() 
                        if k not in ['authorization', 'customer']
                    }
                },
                'created_at': now.isoformat(),
                'updated_at': now.isoformat()
            }
            
            # Prepare user update data
            update_data = {
                'subscription_plan': plan_id,
                'subscription_status': subscription_status,
                'subscription_end_date': end_date.isoformat(),
                'trial_ends_at': end_date.isoformat() if is_trial else None,
                'trial_days_left': 0,  # Reset trial days
                'trial_bonus_days': 0 if is_trial and bonus_days > 0 else user.get('trial_bonus_days', 0),
                'updated_at': now.isoformat()
            }
            
            # Execute database operations in a transaction
            try:
                # Update user subscription
                self.supabase.table('users').update(update_data).eq('id', user_id).execute()
                
                # Record transaction
                self.supabase.table('subscription_transactions').insert(transaction_data).execute()
                
                # Reset usage limits if this is a paid upgrade
                if not is_trial:
                    self._reset_usage_limits(user_id, plan_id)
                
                logger.info(f"Successfully upgraded user {user_id} to {plan_id} plan")
                
                # Generate new JWT token with updated subscription info
                from flask import current_app
                from flask_jwt_extended import create_access_token
                
                # Create a new token with updated subscription info
                identity = {
                    'id': user_id,
                    'subscription_plan': plan_id,
                    'subscription_status': subscription_status,
                    'subscription_end_date': end_date.isoformat(),
                    'is_trial': is_trial,
                    'trial_days_left': 0
                }
                
                access_token = create_access_token(identity=identity)
                
                return {
                    'success': True,
                    'message': message,
                    'subscription': {
                        'plan': plan_id,
                        'status': subscription_status,
                        'end_date': end_date.isoformat(),
                        'is_trial': is_trial,
                        'bonus_days_used': bonus_days if is_trial else 0
                    },
                    'plan_config': plan_config,
                    'usage_reset': not is_trial,
                    'access_token': access_token  # Include new token in response
                }
                
            except Exception as e:
                logger.error(f"Database error during subscription upgrade: {str(e)}")
                return {
                    'success': False,
                    'error': 'Database operation failed',
                    'message': 'Could not complete subscription upgrade. Please contact support.'
                }
            
        except Exception as e:
            logger.error(f"Error in upgrade_subscription: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'message': 'An unexpected error occurred during subscription upgrade'
            }

    def downgrade_subscription(self, user_id: str, new_plan_id: str) -> Dict[str, Any]:
        """Handle subscription downgrade with limit enforcement"""
        try:
            if new_plan_id not in self.PLAN_CONFIGS:
                raise ValueError(f"Invalid plan ID: {new_plan_id}")
            
            # Get current status
            current_status = self.get_unified_subscription_status(user_id)
            current_plan = current_status['subscription_plan']
            
            if current_plan == new_plan_id:
                return {
                    'success': False,
                    'message': 'User is already on the requested plan'
                }
            
            # Apply downgrade limit enforcement
            enforcement_result = self.downgrade_limit_enforcement(user_id, new_plan_id)
            
            # Update subscription
            plan_config = self.PLAN_CONFIGS[new_plan_id]
            current_time = datetime.now()
            
            # Calculate new end date (immediate for downgrades)
            end_date = None
            if new_plan_id != 'free':
                end_date = current_time + timedelta(days=plan_config.get('duration_days', 0))
            
            update_data = {
                'subscription_plan': new_plan_id,
                'subscription_status': 'active' if new_plan_id != 'free' else 'inactive',
                'subscription_end_date': end_date.isoformat() if end_date else None,
                'updated_at': current_time.isoformat()
            }
            
            user_result = self.supabase.table('users').update(update_data).eq('id', user_id).execute()
            
            if not user_result.data:
                raise Exception("Failed to update user subscription")
            
            logger.info(f"Successfully downgraded user {user_id} to {new_plan_id}")
            
            return {
                'success': True,
                'subscription': user_result.data[0],
                'plan_config': plan_config,
                'enforcement_result': enforcement_result,
                'message': f'Successfully downgraded to {plan_config["name"]}'
            }
            
        except Exception as e:
            logger.error(f"Subscription downgrade failed for user {user_id}: {str(e)}")
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
            
            if trial_days and trial_days > 0:
                return trial_days
            
            if not end_date_str:
                return 0
            
            from datetime import timezone, datetime
            
            # Parse the end date and ensure it's timezone-aware
            if isinstance(end_date_str, str):
                if end_date_str.endswith('Z'):
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                else:
                    end_date = datetime.fromisoformat(end_date_str)
                    if end_date.tzinfo is None:
                        end_date = end_date.replace(tzinfo=timezone.utc)
            elif hasattr(end_date_str, 'isoformat'):  # Already a datetime object
                end_date = end_date_str
                if end_date.tzinfo is None:
                    end_date = end_date.replace(tzinfo=timezone.utc)
            else:
                return 0
            
            # Get current time in UTC
            now = datetime.now(timezone.utc)
            
            # Calculate remaining days
            remaining = (end_date - now).days
            return max(0, remaining)
            
        except Exception as e:
            logger.error(f"Error calculating remaining days: {str(e)}", exc_info=True)
            return 0
    
    def _calculate_subscription_end_date(self, plan_id: str, start_date: datetime) -> Optional[datetime]:
        """Calculate subscription end date based on plan"""
        plan_config = self.PLAN_CONFIGS.get(plan_id)
        if not plan_config or not plan_config.get('duration_days'):
            return None
        
        return start_date + timedelta(days=plan_config['duration_days'])
    
    def get_accurate_usage_counts(self, user_id: str) -> Dict[str, Any]:
        """Get accurate usage counts directly from database tables"""
        try:
            # Get the business owner ID (if user is team member, get their owner's ID)
            business_owner_id = self._get_business_owner_id(user_id)
            
            # Get actual counts from database tables
            actual_counts = self._get_actual_database_counts(business_owner_id)
            
            # Get current tracked counts from feature_usage table
            usage_result = self.supabase.table('feature_usage').select('*').eq('user_id', business_owner_id).execute()
            
            usage_counts = {}
            discrepancies = []
            
            for feature_type, actual_count in actual_counts.items():
                # Find tracked count for this feature
                tracked_record = next((u for u in usage_result.data if u['feature_type'] == feature_type), None)
                
                if tracked_record:
                    tracked_count = tracked_record['current_count']
                    limit_count = tracked_record['limit_count']
                else:
                    # No tracking record exists, create one
                    subscription_status = self.get_unified_subscription_status(business_owner_id)
                    plan_config = subscription_status['plan_config']
                    limit_count = plan_config['features'].get(feature_type, 0)
                    tracked_count = 0
                    
                    # Create new usage record
                    current_time = datetime.now()
                    new_usage = {
                        'user_id': business_owner_id,
                        'feature_type': feature_type,
                        'current_count': actual_count,
                        'limit_count': limit_count,
                        'period_start': current_time.isoformat(),
                        'period_end': (current_time + timedelta(days=30)).isoformat(),
                        'created_at': current_time.isoformat(),
                        'updated_at': current_time.isoformat()
                    }
                    self.supabase.table('feature_usage').insert(new_usage).execute()
                    tracked_count = actual_count
                
                usage_counts[feature_type] = {
                    'current_count': actual_count,  # Use actual count from database
                    'limit_count': limit_count,
                    'remaining': max(0, limit_count - actual_count),
                    'percentage_used': (actual_count / limit_count * 100) if limit_count > 0 else 0
                }
                
                # Check for discrepancies
                if tracked_count != actual_count:
                    discrepancies.append({
                        'feature_type': feature_type,
                        'tracked_count': tracked_count,
                        'actual_count': actual_count,
                        'difference': actual_count - tracked_count
                    })
            
            return {
                'user_id': user_id,
                'business_owner_id': business_owner_id,
                'usage_counts': usage_counts,
                'actual_counts': actual_counts,
                'discrepancies': discrepancies,
                'has_discrepancies': len(discrepancies) > 0,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting accurate usage counts for user {user_id}: {str(e)}")
            raise

    def _get_actual_database_counts(self, user_id: str) -> Dict[str, int]:
        """Get actual counts from database tables for business owner (includes all team member activities)"""
        try:
            # Get the business owner ID (if user is team member, get their owner's ID)
            business_owner_id = self._get_business_owner_id(user_id)
            
            counts = {}
            
            # Count invoices for the entire business (owner + team members)
            invoice_result = self.supabase.table('invoices').select('id', count='exact').eq('owner_id', business_owner_id).execute()
            counts['invoices'] = invoice_result.count or 0
            
            # Count expenses for the entire business
            expense_result = self.supabase.table('expenses').select('id', count='exact').eq('owner_id', business_owner_id).execute()
            counts['expenses'] = expense_result.count or 0
            
            # Count sales for the entire business
            sales_result = self.supabase.table('sales').select('id', count='exact').eq('owner_id', business_owner_id).execute()
            counts['sales'] = sales_result.count or 0
            
            # Count products for the entire business
            products_result = self.supabase.table('products').select('id', count='exact').eq('owner_id', business_owner_id).execute()
            counts['products'] = products_result.count or 0
            
            return counts
            
        except Exception as e:
            logger.error(f"Error getting actual database counts for user {user_id}: {str(e)}")
            return {}

    def _get_business_owner_id(self, user_id: str) -> str:
        """Get the business owner ID for a user (returns user_id if they are the owner)"""
        try:
            user_result = self.supabase.table('users').select('owner_id, role').eq('id', user_id).single().execute()
            
            if not user_result.data:
                return user_id
            
            # If user has owner_id, they are a team member - return the owner's ID
            if user_result.data.get('owner_id'):
                return user_result.data['owner_id']
            
            # If user has no owner_id, they are the owner themselves
            return user_id
            
        except Exception as e:
            logger.error(f"Error getting business owner ID for user {user_id}: {str(e)}")
            return user_id

    def usage_abuse_detection(self, user_id: str) -> Dict[str, Any]:
        """Simple abuse detection - always allow for now"""
        try:
            # For now, always allow payments
            # In the future, this could check for:
            # - Multiple rapid payment attempts
            # - Suspicious usage patterns
            # - Blacklisted users
            return {
                'requires_manual_review': False,
                'risk_score': 0,
                'message': 'Payment approved'
            }
        except Exception as e:
            logger.error(f"Error in abuse detection for user {user_id}: {str(e)}")
            return {
                'requires_manual_review': False,
                'risk_score': 0,
                'message': 'Abuse detection failed, allowing payment'
            }

    def _reset_usage_limits(self, user_id: str, plan_id: str):
        """Reset usage limits for new plan"""
        try:
            plan_config = self.PLAN_CONFIGS.get(plan_id, self.PLAN_CONFIGS['free'])
            current_time = datetime.now()
            
            # Reset feature usage counters
            for feature_type, limit in plan_config['features'].items():
                try:
                    # Update or insert feature usage record
                    self.supabase.table('feature_usage').upsert({
                        'user_id': user_id,
                        'feature_type': feature_type,
                        'current_count': 0,
                        'limit_count': limit,
                        'period_start': current_time.isoformat(),
                        'period_end': (current_time + timedelta(days=plan_config.get('duration_days', 30))).isoformat(),
                        'updated_at': current_time.isoformat()
                    }).execute()
                except Exception as e:
                    logger.error(f"Failed to reset {feature_type} usage for user {user_id}: {str(e)}")
            
            logger.info(f"Reset usage limits for user {user_id} on plan {plan_id}")
            
        except Exception as e:
            logger.error(f"Error resetting usage limits for user {user_id}: {str(e)}")

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

    # Usage Tracking Service Methods
    def get_accurate_usage_counts(self, user_id: str) -> Dict[str, Any]:
        """Query database directly for accurate usage counts (business-wide for all roles)"""
        try:
            # Get the business owner ID to ensure we track usage business-wide
            business_owner_id = self._get_business_owner_id(user_id)
            
            # Get current usage from feature_usage table (always use business owner's records)
            usage_result = self.supabase.table('feature_usage').select('*').eq('user_id', business_owner_id).execute()
            
            usage_counts = {}
            for usage_record in usage_result.data:
                feature_type = usage_record['feature_type']
                usage_counts[feature_type] = {
                    'current_count': usage_record['current_count'],
                    'limit_count': usage_record['limit_count'],
                    'remaining': max(0, usage_record['limit_count'] - usage_record['current_count']),
                    'percentage_used': (usage_record['current_count'] / usage_record['limit_count'] * 100) if usage_record['limit_count'] > 0 else 0
                }
            
            # Get actual counts from database tables for verification (business-wide)
            actual_counts = self._get_actual_database_counts(user_id)
            
            # Compare and flag discrepancies
            discrepancies = {}
            for feature_type, actual_count in actual_counts.items():
                if feature_type in usage_counts:
                    tracked_count = usage_counts[feature_type]['current_count']
                    if tracked_count != actual_count:
                        discrepancies[feature_type] = {
                            'tracked': tracked_count,
                            'actual': actual_count,
                            'difference': actual_count - tracked_count
                        }
            
            return {
                'user_id': user_id,
                'business_owner_id': business_owner_id,
                'usage_counts': usage_counts,
                'actual_counts': actual_counts,
                'discrepancies': discrepancies,
                'has_discrepancies': len(discrepancies) > 0,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting accurate usage counts for user {user_id}: {str(e)}")
            raise

    def increment_usage_atomic(self, user_id: str, feature_type: str, amount: int = 1) -> Dict[str, Any]:
        """Atomically increment usage with database transaction and retry logic (business-wide tracking)"""
        max_retries = 3
        retry_count = 0
        
        # Always use business owner ID for usage tracking
        business_owner_id = self._get_business_owner_id(user_id)
        
        while retry_count < max_retries:
            try:
                # Start transaction-like operation
                current_time = datetime.now()
                
                # Get current usage record (always for business owner)
                usage_result = self.supabase.table('feature_usage').select('*').eq(
                    'user_id', business_owner_id
                ).eq('feature_type', feature_type).single().execute()
                
                if not usage_result.data:
                    # Create new usage record if doesn't exist
                    user_subscription = self.get_unified_subscription_status(business_owner_id)
                    plan_config = user_subscription['plan_config']
                    limit_count = plan_config['features'].get(feature_type, 0)
                    
                    new_usage = {
                        'user_id': business_owner_id,
                        'feature_type': feature_type,
                        'current_count': amount,
                        'limit_count': limit_count,
                        'period_start': current_time.isoformat(),
                        'period_end': (current_time + timedelta(days=30)).isoformat(),
                        'created_at': current_time.isoformat(),
                        'updated_at': current_time.isoformat(),
                        'sync_status': 'synced',
                        'last_synced_at': current_time.isoformat()
                    }
                    
                    result = self.supabase.table('feature_usage').insert(new_usage).execute()
                    
                    return {
                        'success': True,
                        'new_count': amount,
                        'limit': limit_count,
                        'remaining': max(0, limit_count - amount),
                        'created_new_record': True,
                        'business_owner_id': business_owner_id
                    }
                
                # Update existing record
                current_count = usage_result.data['current_count']
                new_count = current_count + amount
                
                update_result = self.supabase.table('feature_usage').update({
                    'current_count': new_count,
                    'updated_at': current_time.isoformat(),
                    'last_synced_at': current_time.isoformat(),
                    'sync_status': 'synced'
                }).eq('user_id', business_owner_id).eq('feature_type', feature_type).execute()
                
                if update_result.data:
                    limit_count = usage_result.data['limit_count']
                    return {
                        'success': True,
                        'new_count': new_count,
                        'limit': limit_count,
                        'remaining': max(0, limit_count - new_count),
                        'incremented_by': amount,
                        'business_owner_id': business_owner_id
                    }
                else:
                    raise Exception("Failed to update usage count")
                
            except Exception as e:
                retry_count += 1
                logger.warning(f"Usage increment attempt {retry_count} failed for user {user_id} (business owner: {business_owner_id}), feature {feature_type}: {str(e)}")
                
                if retry_count >= max_retries:
                    logger.error(f"Usage increment failed after {max_retries} attempts for user {user_id}, feature {feature_type}")
                    # Mark as out of sync
                    try:
                        self.supabase.table('feature_usage').update({
                            'sync_status': 'out_of_sync',
                            'discrepancy_count': self.supabase.table('feature_usage').select('discrepancy_count').eq('user_id', business_owner_id).eq('feature_type', feature_type).single().execute().data.get('discrepancy_count', 0) + 1
                        }).eq('user_id', business_owner_id).eq('feature_type', feature_type).execute()
                    except:
                        pass
                    
                    raise Exception(f"Failed to increment usage after {max_retries} attempts: {str(e)}")
                
                # Wait before retry
                import time
                time.sleep(0.1 * retry_count)

    def sync_usage_counts(self, user_id: str) -> Dict[str, Any]:
        """Sync cached counts with database reality"""
        try:
            # Get actual counts from database
            actual_counts = self._get_actual_database_counts(user_id)
            
            # Get current tracked counts
            usage_result = self.supabase.table('feature_usage').select('*').eq('user_id', user_id).execute()
            
            synced_features = []
            current_time = datetime.now()
            
            for usage_record in usage_result.data:
                feature_type = usage_record['feature_type']
                tracked_count = usage_record['current_count']
                actual_count = actual_counts.get(feature_type, 0)
                
                if tracked_count != actual_count:
                    # Sync the count
                    self.supabase.table('feature_usage').update({
                        'current_count': actual_count,
                        'updated_at': current_time.isoformat(),
                        'last_synced_at': current_time.isoformat(),
                        'sync_status': 'synced',
                        'discrepancy_count': 0
                    }).eq('user_id', user_id).eq('feature_type', feature_type).execute()
                    
                    synced_features.append({
                        'feature_type': feature_type,
                        'old_count': tracked_count,
                        'new_count': actual_count,
                        'difference': actual_count - tracked_count
                    })
            
            return {
                'success': True,
                'synced_features': synced_features,
                'total_synced': len(synced_features),
                'message': f"Synced {len(synced_features)} features" if synced_features else "All counts were already accurate"
            }
            
        except Exception as e:
            logger.error(f"Error syncing usage counts for user {user_id}: {str(e)}")
            raise

    def validate_usage_consistency(self, user_id: str) -> Dict[str, Any]:
        """Check for and report usage count discrepancies"""
        try:
            # Get tracked counts
            usage_result = self.supabase.table('feature_usage').select('*').eq('user_id', user_id).execute()
            
            # Get actual counts
            actual_counts = self._get_actual_database_counts(user_id)
            
            discrepancies = []
            consistent_features = []
            
            for usage_record in usage_result.data:
                feature_type = usage_record['feature_type']
                tracked_count = usage_record['current_count']
                actual_count = actual_counts.get(feature_type, 0)
                
                if tracked_count != actual_count:
                    discrepancies.append({
                        'feature_type': feature_type,
                        'tracked_count': tracked_count,
                        'actual_count': actual_count,
                        'difference': actual_count - tracked_count,
                        'percentage_error': ((abs(actual_count - tracked_count) / max(actual_count, 1)) * 100),
                        'last_synced': usage_record.get('last_synced_at'),
                        'sync_status': usage_record.get('sync_status', 'unknown')
                    })
                else:
                    consistent_features.append(feature_type)
            
            return {
                'user_id': user_id,
                'is_consistent': len(discrepancies) == 0,
                'discrepancies': discrepancies,
                'consistent_features': consistent_features,
                'total_discrepancies': len(discrepancies),
                'validation_timestamp': datetime.now().isoformat(),
                'recommendation': 'Run sync_usage_counts() to fix discrepancies' if discrepancies else 'Usage counts are accurate'
            }
            
        except Exception as e:
            logger.error(f"Error validating usage consistency for user {user_id}: {str(e)}")
            raise

    def _get_actual_database_counts(self, user_id: str) -> Dict[str, int]:
        """Get actual counts from database tables for business owner (includes all team member activities)"""
        try:
            # Get the business owner ID (if user is team member, get their owner's ID)
            business_owner_id = self._get_business_owner_id(user_id)
            
            counts = {}
            
            # Count invoices for the entire business (owner + team members)
            invoice_result = self.supabase.table('invoices').select('id', count='exact').eq('owner_id', business_owner_id).execute()
            counts['invoices'] = invoice_result.count or 0
            
            # Count expenses for the entire business
            expense_result = self.supabase.table('expenses').select('id', count='exact').eq('owner_id', business_owner_id).execute()
            counts['expenses'] = expense_result.count or 0
            
            # Count sales for the entire business
            sales_result = self.supabase.table('sales').select('id', count='exact').eq('owner_id', business_owner_id).execute()
            counts['sales'] = sales_result.count or 0
            
            # Count products for the entire business
            products_result = self.supabase.table('products').select('id', count='exact').eq('owner_id', business_owner_id).execute()
            counts['products'] = products_result.count or 0
            
            return counts
            
        except Exception as e:
            logger.error(f"Error getting actual database counts for user {user_id}: {str(e)}")
            return {}

    def _get_business_owner_id(self, user_id: str) -> str:
        """Get the business owner ID for a user (returns user_id if they are the owner)"""
        try:
            user_result = self.supabase.table('users').select('owner_id, role').eq('id', user_id).single().execute()
            
            if not user_result.data:
                return user_id
            
            # If user has owner_id, they are a team member - return the owner's ID
            if user_result.data.get('owner_id'):
                return user_result.data['owner_id']
            
            # If user has no owner_id, they are the owner themselves
            return user_id
            
        except Exception as e:
            logger.error(f"Error getting business owner ID for user {user_id}: {str(e)}")
            return user_id

    # Pro-ration Calculation System
    def calculate_proration(self, user_id: str, current_plan: str, new_plan: str, 
                          days_remaining: int) -> Dict[str, Any]:
        """Calculate pro-rated upgrade with time extension"""
        try:
            if current_plan not in self.PLAN_CONFIGS or new_plan not in self.PLAN_CONFIGS:
                raise ValueError("Invalid plan configuration")
            
            current_config = self.PLAN_CONFIGS[current_plan]
            new_config = self.PLAN_CONFIGS[new_plan]
            
            # Daily rates (prices in kobo, converted to naira)
            daily_rates = {
                'weekly': 1400 / 7,    # ₦200 per day
                'monthly': 4500 / 30,  # ₦150 per day  
                'yearly': 50000 / 365  # ₦137 per day
            }
            
            # Calculate remaining value from current plan
            current_daily_rate = daily_rates.get(current_plan, 0)
            remaining_value = current_daily_rate * days_remaining
            
            # Calculate how many extra days this value provides in new plan
            new_daily_rate = daily_rates.get(new_plan, 0)
            extra_days = int(remaining_value / new_daily_rate) if new_daily_rate > 0 else 0
            
            # Calculate total duration for new plan
            base_duration = new_config.get('duration_days', 0)
            total_duration = base_duration + extra_days
            
            # Calculate new end date
            start_date = datetime.now()
            new_end_date = start_date + timedelta(days=total_duration)
            
            proration_details = {
                'current_plan': current_plan,
                'new_plan': new_plan,
                'days_remaining': days_remaining,
                'remaining_value': round(remaining_value, 2),
                'current_daily_rate': round(current_daily_rate, 2),
                'new_daily_rate': round(new_daily_rate, 2),
                'extra_days_granted': extra_days,
                'base_duration': base_duration,
                'total_duration': total_duration,
                'new_end_date': new_end_date.isoformat(),
                'calculation_timestamp': datetime.now().isoformat()
            }
            
            return {
                'success': True,
                'proration_details': proration_details,
                'extended_duration_days': extra_days,
                'total_duration_days': total_duration,
                'new_end_date': new_end_date.isoformat(),
                'value_preserved': remaining_value > 0
            }
            
        except Exception as e:
            logger.error(f"Error calculating proration for user {user_id}: {str(e)}")
            raise

    def calculate_extended_duration(self, current_plan: str, new_plan: str, 
                                  remaining_time: int) -> Dict[str, Any]:
        """Calculate new plan duration with time extension"""
        try:
            if current_plan == 'free' or new_plan == 'free':
                # No proration for free plans
                new_config = self.PLAN_CONFIGS[new_plan]
                return {
                    'base_duration': new_config.get('duration_days', 0),
                    'extended_duration': 0,
                    'total_duration': new_config.get('duration_days', 0),
                    'proration_applied': False
                }
            
            # Use proration calculation
            proration_result = self.calculate_proration('temp', current_plan, new_plan, remaining_time)
            
            return {
                'base_duration': proration_result['proration_details']['base_duration'],
                'extended_duration': proration_result['extended_duration_days'],
                'total_duration': proration_result['total_duration_days'],
                'proration_applied': True,
                'proration_details': proration_result['proration_details']
            }
            
        except Exception as e:
            logger.error(f"Error calculating extended duration: {str(e)}")
            raise

    def apply_proration_to_upgrade(self, user_id: str, new_plan_id: str, 
                                 payment_reference: str, paystack_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply pro-ration calculation to subscription upgrade"""
        try:
            # Get current subscription status
            current_status = self.get_unified_subscription_status(user_id)
            current_plan = current_status['subscription_plan']
            remaining_days = current_status['remaining_days']
            
            # Calculate proration if upgrading from paid plan
            proration_result = None
            total_duration = self.PLAN_CONFIGS[new_plan_id].get('duration_days', 0)
            
            if current_plan != 'free' and remaining_days > 0:
                proration_result = self.calculate_proration(
                    user_id, current_plan, new_plan_id, remaining_days
                )
                total_duration = proration_result['total_duration_days']
            
            # Calculate subscription dates
            start_date = datetime.now()
            end_date = start_date + timedelta(days=total_duration)
            
            # Update user subscription with proration details
            update_data = {
                'subscription_plan': new_plan_id,
                'subscription_status': 'active',
                'subscription_start_date': start_date.isoformat(),
                'subscription_end_date': end_date.isoformat(),
                'last_payment_date': start_date.isoformat(),
                'payment_reference': payment_reference,
                'trial_days_left': 0,  # Reset trial when upgrading
                'updated_at': datetime.now().isoformat()
            }
            
            # Add proration details if calculated
            if proration_result:
                update_data['proration_details'] = proration_result['proration_details']
                update_data['extended_duration_days'] = proration_result['extended_duration_days']
            
            # Update user record
            user_result = self.supabase.table('users').update(update_data).eq('id', user_id).execute()
            
            if not user_result.data:
                raise Exception("Failed to update user subscription")
            
            # Record subscription transaction with proration details
            transaction_data = {
                'user_id': user_id,
                'plan_id': new_plan_id,
                'amount': paystack_data.get('amount', 0),
                'payment_reference': payment_reference,
                'paystack_reference': paystack_data.get('reference'),
                'status': 'successful',
                'proration_applied': proration_result is not None,
                'proration_details': proration_result['proration_details'] if proration_result else None,
                'metadata': paystack_data,
                'created_at': datetime.now().isoformat()
            }
            
            self.supabase.table('subscription_transactions').insert(transaction_data).execute()
            
            # Reset usage counters for new plan (fair usage policy)
            self._reset_usage_counters(user_id, new_plan_id)
            
            logger.info(f"Successfully upgraded user {user_id} to {new_plan_id} with proration")
            
            return {
                'success': True,
                'subscription': user_result.data[0],
                'plan_config': self.PLAN_CONFIGS[new_plan_id],
                'proration_applied': proration_result is not None,
                'proration_details': proration_result['proration_details'] if proration_result else None,
                'total_duration_days': total_duration,
                'usage_reset': True,
                'message': f'Successfully upgraded with {proration_result["extended_duration_days"] if proration_result else 0} bonus days'
            }
            
        except Exception as e:
            logger.error(f"Proration upgrade failed for user {user_id}: {str(e)}")
            raise

    # Fair Usage Limit Management System
    def reset_usage_on_upgrade(self, user_id: str, new_plan_id: str) -> Dict[str, Any]:
        """Reset usage counts when upgrading (protects business from abuse)"""
        try:
            current_time = datetime.now()
            plan_config = self.PLAN_CONFIGS.get(new_plan_id, self.PLAN_CONFIGS['free'])
            
            # Log the reset action for audit
            reset_log = {
                'user_id': user_id,
                'action': 'usage_reset_on_upgrade',
                'new_plan': new_plan_id,
                'timestamp': current_time.isoformat(),
                'reason': 'Fair usage policy - preventing limit exploitation'
            }
            
            # Get current usage before reset for logging
            current_usage = self.get_accurate_usage_counts(user_id)
            reset_log['usage_before_reset'] = current_usage.get('usage_counts', {})
            
            # Reset all usage counters to 0
            self._reset_usage_counters(user_id, new_plan_id)
            
            # Log the reset in upgrade_history
            try:
                user_result = self.supabase.table('users').select('upgrade_history').eq('id', user_id).single().execute()
                upgrade_history = user_result.data.get('upgrade_history', []) if user_result.data else []
                upgrade_history.append(reset_log)
                
                self.supabase.table('users').update({
                    'upgrade_history': upgrade_history
                }).eq('id', user_id).execute()
            except Exception as log_error:
                logger.warning(f"Failed to log usage reset: {str(log_error)}")
            
            return {
                'success': True,
                'reset_applied': True,
                'new_limits': plan_config['features'],
                'message': 'Usage limits reset to prevent abuse - you now have full access to new plan limits'
            }
            
        except Exception as e:
            logger.error(f"Error resetting usage on upgrade for user {user_id}: {str(e)}")
            raise

    def apply_plan_limits(self, user_id: str, plan_id: str) -> Dict[str, Any]:
        """Apply new plan limits immediately"""
        try:
            plan_config = self.PLAN_CONFIGS.get(plan_id, self.PLAN_CONFIGS['free'])
            current_time = datetime.now()
            
            # Update all feature usage records with new limits
            for feature_type, new_limit in plan_config['features'].items():
                # Check if usage record exists
                usage_result = self.supabase.table('feature_usage').select('*').eq(
                    'user_id', user_id
                ).eq('feature_type', feature_type).execute()
                
                if usage_result.data:
                    # Update existing record
                    self.supabase.table('feature_usage').update({
                        'limit_count': new_limit,
                        'updated_at': current_time.isoformat()
                    }).eq('user_id', user_id).eq('feature_type', feature_type).execute()
                else:
                    # Create new record
                    new_usage = {
                        'user_id': user_id,
                        'feature_type': feature_type,
                        'current_count': 0,
                        'limit_count': new_limit,
                        'period_start': current_time.isoformat(),
                        'period_end': (current_time + timedelta(days=30)).isoformat(),
                        'created_at': current_time.isoformat(),
                        'updated_at': current_time.isoformat()
                    }
                    self.supabase.table('feature_usage').insert(new_usage).execute()
            
            return {
                'success': True,
                'new_limits': plan_config['features'],
                'plan_name': plan_config['name']
            }
            
        except Exception as e:
            logger.error(f"Error applying plan limits for user {user_id}: {str(e)}")
            raise

    def downgrade_limit_enforcement(self, user_id: str, new_plan_id: str) -> Dict[str, Any]:
        """Handle downgrade by capping limits but preserving current usage"""
        try:
            new_plan_config = self.PLAN_CONFIGS.get(new_plan_id, self.PLAN_CONFIGS['free'])
            current_usage = self.get_accurate_usage_counts(user_id)
            
            enforcement_actions = []
            warnings = []
            
            for feature_type, new_limit in new_plan_config['features'].items():
                if feature_type in current_usage['usage_counts']:
                    current_count = current_usage['usage_counts'][feature_type]['current_count']
                    
                    if current_count > new_limit:
                        # Current usage exceeds new limit
                        warnings.append({
                            'feature_type': feature_type,
                            'current_usage': current_count,
                            'new_limit': new_limit,
                            'excess': current_count - new_limit,
                            'message': f'You have {current_count} {feature_type} but new plan allows only {new_limit}. You can view existing items but cannot create new ones until next billing cycle.'
                        })
                    
                    # Update limit but keep current count
                    self.supabase.table('feature_usage').update({
                        'limit_count': new_limit,
                        'updated_at': datetime.now().isoformat()
                    }).eq('user_id', user_id).eq('feature_type', feature_type).execute()
                    
                    enforcement_actions.append({
                        'feature_type': feature_type,
                        'old_limit': current_usage['usage_counts'][feature_type]['limit_count'],
                        'new_limit': new_limit,
                        'current_usage': current_count,
                        'can_create_new': current_count < new_limit
                    })
            
            return {
                'success': True,
                'enforcement_actions': enforcement_actions,
                'warnings': warnings,
                'has_usage_conflicts': len(warnings) > 0,
                'message': f'Downgraded to {new_plan_config["name"]}. Some features may be restricted due to current usage.'
            }
            
        except Exception as e:
            logger.error(f"Error enforcing downgrade limits for user {user_id}: {str(e)}")
            raise

    def usage_abuse_detection(self, user_id: str) -> Dict[str, Any]:
        """Simplified abuse detection - always allows upgrades for better user experience"""
        try:
            # Always allow upgrades for better user experience
            return {
                'abuse_detected': False,
                'can_upgrade': True,
                'message': 'No usage abuse detected'
            }
        except Exception as e:
            logger.error(f"Error in usage abuse detection for user {user_id}: {str(e)}")
            return {
                'abuse_detected': False,
                'can_upgrade': True,
                'error': str(e)
            }
    
    def can_create_invoice(self, user_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can create invoices based on subscription limits"""
        try:
            subscription_status = self.get_unified_subscription_status(user_id)
            if not subscription_status:
                return False, {
                    'message': 'Unable to verify subscription status',
                    'upgrade_required': True
                }
            
            current_plan = subscription_status.get('subscription_plan', 'free')
            plan_config = self.PLAN_CONFIGS.get(current_plan, self.PLAN_CONFIGS['free'])
            
            # Get current usage
            usage_data = self.get_accurate_usage_counts(user_id)
            usage_counts = usage_data.get('usage_counts', {})
            current_invoices = usage_counts.get('invoices', {}).get('current_count', 0)
            invoice_limit = plan_config['features']['invoices']
            
            if current_invoices >= invoice_limit:
                return False, {
                    'message': f'Invoice limit reached ({current_invoices}/{invoice_limit})',
                    'current_usage': current_invoices,
                    'limit': invoice_limit,
                    'upgrade_required': True,
                    'current_plan': current_plan
                }
            
            return True, {
                'message': 'Invoice creation allowed',
                'current_usage': current_invoices,
                'limit': invoice_limit,
                'remaining': invoice_limit - current_invoices
            }
            
        except Exception as e:
            logger.error(f"Error checking invoice creation permission for user {user_id}: {str(e)}")
            return False, {
                'message': 'Error checking invoice creation permission',
                'error': str(e),
                'upgrade_required': True
            }
    
    def get_usage_limits(self, user_id: str) -> Dict[str, Any]:
        """Get current usage limits for user's subscription plan"""
        try:
            subscription_status = self.get_unified_subscription_status(user_id)
            if not subscription_status:
                return {
                    'error': 'Unable to verify subscription status'
                }
            
            current_plan = subscription_status.get('subscription_plan', 'free')
            plan_config = self.PLAN_CONFIGS.get(current_plan, self.PLAN_CONFIGS['free'])
            
            # Get current usage
            usage_counts = self.get_accurate_usage_counts(user_id)
            
            limits = {}
            for feature, limit in plan_config['features'].items():
                current_usage = usage_counts.get(feature, 0)
                limits[feature] = {
                    'limit': limit,
                    'current': current_usage,
                    'remaining': max(0, limit - current_usage),
                    'percentage_used': (current_usage / limit * 100) if limit > 0 else 0
                }
            
            return {
                'plan': current_plan,
                'limits': limits,
                'is_trial': subscription_status.get('is_trial', False),
                'trial_days_left': subscription_status.get('trial_days_left', 0)
            }
            
        except Exception as e:
            logger.error(f"Error getting usage limits for user {user_id}: {str(e)}")
            return {
                'error': str(e),
                'plan': 'unknown',
                'limits': {}
            }
    
    def can_create_product(self, user_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can create products based on subscription limits"""
        try:
            subscription_status = self.get_unified_subscription_status(user_id)
            if not subscription_status:
                return False, {
                    'message': 'Unable to verify subscription status',
                    'upgrade_required': True
                }
            
            current_plan = subscription_status.get('subscription_plan', 'free')
            plan_config = self.PLAN_CONFIGS.get(current_plan, self.PLAN_CONFIGS['free'])
            
            # Get current usage
            usage_counts = self.get_accurate_usage_counts(user_id)
            current_products = usage_counts.get('products', 0)
            product_limit = plan_config['features']['products']
            
            if current_products >= product_limit:
                return False, {
                    'message': f'Product limit reached ({current_products}/{product_limit})',
                    'current_usage': current_products,
                    'limit': product_limit,
                    'upgrade_required': True,
                    'current_plan': current_plan
                }
            
            return True, {
                'message': 'Product creation allowed',
                'current_usage': current_products,
                'limit': product_limit,
                'remaining': product_limit - current_products
            }
            
        except Exception as e:
            logger.error(f"Error checking product creation permission for user {user_id}: {str(e)}")
            return False, {
                'message': 'Error checking product creation permission',
                'error': str(e),
                'upgrade_required': True
            }
    
    def can_create_sale(self, user_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can create sales based on subscription limits"""
        try:
            subscription_status = self.get_unified_subscription_status(user_id)
            if not subscription_status:
                return False, {
                    'message': 'Unable to verify subscription status',
                    'upgrade_required': True
                }
            
            current_plan = subscription_status.get('subscription_plan', 'free')
            plan_config = self.PLAN_CONFIGS.get(current_plan, self.PLAN_CONFIGS['free'])
            
            # Get current usage
            usage_data = self.get_accurate_usage_counts(user_id)
            usage_counts = usage_data.get('usage_counts', {})
            current_sales = usage_counts.get('sales', {}).get('current_count', 0)
            sales_limit = plan_config['features']['sales']
            
            if current_sales >= sales_limit:
                return False, {
                    'message': f'Sales limit reached ({current_sales}/{sales_limit})',
                    'current_usage': current_sales,
                    'limit': sales_limit,
                    'upgrade_required': True,
                    'current_plan': current_plan
                }
            
            return True, {
                'message': 'Sales creation allowed',
                'current_usage': current_sales,
                'limit': sales_limit,
                'remaining': sales_limit - current_sales
            }
            
        except Exception as e:
            logger.error(f"Error checking sales creation permission for user {user_id}: {str(e)}")
            return False, {
                'message': 'Error checking sales creation permission',
                'error': str(e),
                'upgrade_required': True
            }
    
    def can_create_expense(self, user_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can create expenses based on subscription limits"""
        try:
            subscription_status = self.get_unified_subscription_status(user_id)
            if not subscription_status:
                return False, {
                    'message': 'Unable to verify subscription status',
                    'upgrade_required': True
                }
            
            current_plan = subscription_status.get('subscription_plan', 'free')
            plan_config = self.PLAN_CONFIGS.get(current_plan, self.PLAN_CONFIGS['free'])
            
            # Get current usage
            usage_counts = self.get_accurate_usage_counts(user_id)
            current_expenses = usage_counts.get('expenses', 0)
            expense_limit = plan_config['features']['expenses']
            
            if current_expenses >= expense_limit:
                return False, {
                    'message': f'Expense limit reached ({current_expenses}/{expense_limit})',
                    'current_usage': current_expenses,
                    'limit': expense_limit,
                    'upgrade_required': True,
                    'current_plan': current_plan
                }
            
            return True, {
                'message': 'Expense creation allowed',
                'current_usage': current_expenses,
                'limit': expense_limit,
                'remaining': expense_limit - current_expenses
            }
            
        except Exception as e:
            logger.error(f"Error checking expense creation permission for user {user_id}: {str(e)}")
            return False, {
                'message': 'Error checking expense creation permission',
                'error': str(e),
                'upgrade_required': True
            }
            # Simplified approach - always allow upgrades to prevent payment failures
            return {
                'user_id': user_id,
                'risk_level': 'low',
                'suspicious_patterns': [],
                'recent_upgrades_count': 0,
                'requires_manual_review': False,
                'recommendation': 'Normal upgrade pattern',
                'message': 'Simplified abuse detection - allowing upgrade'
            }
            
        except Exception as e:
            logger.error(f"Error in simplified abuse detection for user {user_id}: {str(e)}")
            return {
                'user_id': user_id,
                'risk_level': 'low',
                'suspicious_patterns': [],
                'recent_upgrades_count': 0,
                'requires_manual_review': False,
                'recommendation': 'Normal upgrade pattern',
                'error': str(e)
            } 
   
    def can_create_invoice(self, user_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can create invoices based on subscription limits"""
        try:
            subscription_status = self.get_unified_subscription_status(user_id)
            if not subscription_status:
                return False, {
                    'message': 'Unable to verify subscription status',
                    'upgrade_required': True
                }
            
            current_plan = subscription_status.get('subscription_plan', 'free')
            plan_config = self.PLAN_CONFIGS.get(current_plan, self.PLAN_CONFIGS['free'])
            
            # Get current usage
            usage_data = self.get_accurate_usage_counts(user_id)
            usage_counts = usage_data.get('usage_counts', {})
            current_invoices = usage_counts.get('invoices', {}).get('current_count', 0)
            invoice_limit = plan_config['features']['invoices']
            
            if current_invoices >= invoice_limit:
                return False, {
                    'message': f'Invoice limit reached ({current_invoices}/{invoice_limit})',
                    'current_usage': current_invoices,
                    'limit': invoice_limit,
                    'upgrade_required': True,
                    'current_plan': current_plan
                }
            
            return True, {
                'message': 'Invoice creation allowed',
                'current_usage': current_invoices,
                'limit': invoice_limit,
                'remaining': invoice_limit - current_invoices
            }
            
        except Exception as e:
            logger.error(f"Error checking invoice creation permission for user {user_id}: {str(e)}")
            return False, {
                'message': 'Error checking invoice creation permission',
                'error': str(e),
                'upgrade_required': True
            }
    
    def can_create_product(self, user_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can create products based on subscription limits"""
        try:
            subscription_status = self.get_unified_subscription_status(user_id)
            if not subscription_status:
                return False, {
                    'message': 'Unable to verify subscription status',
                    'upgrade_required': True
                }
            
            current_plan = subscription_status.get('subscription_plan', 'free')
            plan_config = self.PLAN_CONFIGS.get(current_plan, self.PLAN_CONFIGS['free'])
            
            # Get current usage
            usage_data = self.get_accurate_usage_counts(user_id)
            usage_counts = usage_data.get('usage_counts', {})
            current_products = usage_counts.get('products', {}).get('current_count', 0)
            product_limit = plan_config['features']['products']
            
            if current_products >= product_limit:
                return False, {
                    'message': f'Product limit reached ({current_products}/{product_limit})',
                    'current_usage': current_products,
                    'limit': product_limit,
                    'upgrade_required': True,
                    'current_plan': current_plan
                }
            
            return True, {
                'message': 'Product creation allowed',
                'current_usage': current_products,
                'limit': product_limit,
                'remaining': product_limit - current_products
            }
            
        except Exception as e:
            logger.error(f"Error checking product creation permission for user {user_id}: {str(e)}")
            return False, {
                'message': 'Error checking product creation permission',
                'error': str(e),
                'upgrade_required': True
            }
    
    def can_create_sale(self, user_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can create sales based on subscription limits"""
        try:
            subscription_status = self.get_unified_subscription_status(user_id)
            if not subscription_status:
                return False, {
                    'message': 'Unable to verify subscription status',
                    'upgrade_required': True
                }
            
            current_plan = subscription_status.get('subscription_plan', 'free')
            plan_config = self.PLAN_CONFIGS.get(current_plan, self.PLAN_CONFIGS['free'])
            
            # Get current usage
            usage_data = self.get_accurate_usage_counts(user_id)
            usage_counts = usage_data.get('usage_counts', {})
            current_sales = usage_counts.get('sales', {}).get('current_count', 0)
            sales_limit = plan_config['features']['sales']
            
            if current_sales >= sales_limit:
                return False, {
                    'message': f'Sales limit reached ({current_sales}/{sales_limit})',
                    'current_usage': current_sales,
                    'limit': sales_limit,
                    'upgrade_required': True,
                    'current_plan': current_plan
                }
            
            return True, {
                'message': 'Sales creation allowed',
                'current_usage': current_sales,
                'limit': sales_limit,
                'remaining': sales_limit - current_sales
            }
            
        except Exception as e:
            logger.error(f"Error checking sales creation permission for user {user_id}: {str(e)}")
            return False, {
                'message': 'Error checking sales creation permission',
                'error': str(e),
                'upgrade_required': True
            }
    
    def can_create_expense(self, user_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if user can create expenses based on subscription limits"""
        try:
            subscription_status = self.get_unified_subscription_status(user_id)
            if not subscription_status:
                return False, {
                    'message': 'Unable to verify subscription status',
                    'upgrade_required': True
                }
            
            current_plan = subscription_status.get('subscription_plan', 'free')
            plan_config = self.PLAN_CONFIGS.get(current_plan, self.PLAN_CONFIGS['free'])
            
            # Get current usage
            usage_data = self.get_accurate_usage_counts(user_id)
            usage_counts = usage_data.get('usage_counts', {})
            current_expenses = usage_counts.get('expenses', {}).get('current_count', 0)
            expense_limit = plan_config['features']['expenses']
            
            if current_expenses >= expense_limit:
                return False, {
                    'message': f'Expense limit reached ({current_expenses}/{expense_limit})',
                    'current_usage': current_expenses,
                    'limit': expense_limit,
                    'upgrade_required': True,
                    'current_plan': current_plan
                }
            
            return True, {
                'message': 'Expense creation allowed',
                'current_usage': current_expenses,
                'limit': expense_limit,
                'remaining': expense_limit - current_expenses
            }
            
        except Exception as e:
            logger.error(f"Error checking expense creation permission for user {user_id}: {str(e)}")
            return False, {
                'message': 'Error checking expense creation permission',
                'error': str(e),
                'upgrade_required': True
            }

    def _reset_usage_counters(self, user_id: str, plan_id: str) -> None:
        """Reset usage counters for a user to new plan limits"""
        try:
            plan_config = self.PLAN_CONFIGS.get(plan_id, self.PLAN_CONFIGS['free'])
            current_time = datetime.now()
            
            # Get business owner ID for team usage tracking
            business_owner_id = self._get_business_owner_id(user_id)
            
            # Reset all feature usage records
            for feature_type, limit in plan_config['features'].items():
                # Check if usage record exists
                usage_result = self.supabase.table('feature_usage').select('*').eq(
                    'user_id', business_owner_id
                ).eq('feature_type', feature_type).execute()
                
                if usage_result.data:
                    # Update existing record
                    self.supabase.table('feature_usage').update({
                        'current_count': 0,
                        'limit_count': limit,
                        'period_start': current_time.isoformat(),
                        'period_end': (current_time + timedelta(days=30)).isoformat(),
                        'updated_at': current_time.isoformat()
                    }).eq('user_id', business_owner_id).eq('feature_type', feature_type).execute()
                else:
                    # Create new record
                    new_usage = {
                        'user_id': business_owner_id,
                        'feature_type': feature_type,
                        'current_count': 0,
                        'limit_count': limit,
                        'period_start': current_time.isoformat(),
                        'period_end': (current_time + timedelta(days=30)).isoformat(),
                        'created_at': current_time.isoformat(),
                        'updated_at': current_time.isoformat()
                    }
                    self.supabase.table('feature_usage').insert(new_usage).execute()
            
            logger.info(f"Reset usage counters for user {user_id} (business owner: {business_owner_id}) to {plan_id} plan limits")
            
        except Exception as e:
            logger.error(f"Error resetting usage counters for user {user_id}: {str(e)}")
            raise