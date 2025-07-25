"""
Subscription Service
Handles subscription management, pro-rata calculations, and plan enforcement
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from decimal import Decimal, ROUND_HALF_UP
from supabase import create_client
import requests
import hashlib
import hmac

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

logger = logging.getLogger(__name__)

class SubscriptionService:
    def __init__(self):
        self.paystack_secret_key = os.getenv('PAYSTACK_SECRET_KEY')
        self.paystack_public_key = os.getenv('PAYSTACK_PUBLIC_KEY')
        self.paystack_base_url = 'https://api.paystack.co'
        
        # Plan pricing in kobo (multiply by 100 for Paystack)
        self.plan_prices = {
            'free': 0,
            'weekly': 140000,  # ₦1,400
            'monthly': 450000,  # ₦4,500
            'yearly': 5000000   # ₦50,000
        }
        
        # Plan durations in days
        self.plan_durations = {
            'weekly': 7,
            'monthly': 30,
            'yearly': 365
        }

    def get_user_subscription(self, user_id: str) -> Dict:
        """Get user's current subscription details"""
        try:
            response = supabase.table('users').select(
                'id, subscription_plan, subscription_status, trial_ends_at, '
                'subscription_start_date, subscription_end_date, owner_id'
            ).eq('id', user_id).single().execute()
            
            if not response.data:
                return {'error': 'User not found'}
            
            user = response.data
            
            # If user is a team member, get owner's subscription
            if user['owner_id']:
                owner_response = supabase.table('users').select(
                    'subscription_plan, subscription_status, trial_ends_at, '
                    'subscription_start_date, subscription_end_date'
                ).eq('id', user['owner_id']).single().execute()
                
                if owner_response.data:
                    # Team member inherits owner's subscription
                    user.update(owner_response.data)
            
            # Calculate trial days left
            trial_days_left = 0
            if user['trial_ends_at']:
                trial_end = datetime.fromisoformat(user['trial_ends_at'].replace('Z', '+00:00'))
                now = datetime.utcnow()
                if trial_end > now:
                    trial_days_left = (trial_end - now).days
            
            return {
                'plan': user['subscription_plan'],
                'status': user['subscription_status'],
                'trial_days_left': trial_days_left,
                'is_trial': user['subscription_status'] == 'trial',
                'subscription_start': user.get('subscription_start_date'),
                'subscription_end': user.get('subscription_end_date'),
                'is_owner': not user['owner_id']
            }
            
        except Exception as e:
            logger.error(f"Failed to get user subscription: {str(e)}")
            return {'error': 'Failed to get subscription details'}

    def calculate_prorata_upgrade(self, user_id: str, new_plan: str) -> Dict:
        """Calculate pro-rata cost for plan upgrade"""
        try:
            # Get current subscription
            current_sub = self.get_user_subscription(user_id)
            if 'error' in current_sub:
                return current_sub
            
            if not current_sub['is_owner']:
                return {'error': 'Only owners can upgrade subscriptions'}
            
            current_plan = current_sub['plan']
            
            if current_plan == new_plan:
                return {'error': 'Already on the selected plan'}
            
            # Get current plan details
            user_response = supabase.table('users').select(
                'subscription_start_date, subscription_end_date, subscription_plan'
            ).eq('id', user_id).single().execute()
            
            user_data = user_response.data
            current_start = datetime.fromisoformat(user_data['subscription_start_date']) if user_data.get('subscription_start_date') else datetime.utcnow()
            current_end = datetime.fromisoformat(user_data['subscription_end_date']) if user_data.get('subscription_end_date') else datetime.utcnow() + timedelta(days=self.plan_durations[current_plan])
            
            now = datetime.utcnow()
            
            # Calculate remaining days in current plan
            remaining_days = max(0, (current_end - now).days)
            total_days_current = self.plan_durations[current_plan]
            
            # Calculate costs
            current_plan_cost = Decimal(str(self.plan_prices[current_plan] / 100))  # Convert from kobo
            new_plan_cost = Decimal(str(self.plan_prices[new_plan] / 100))
            
            # Calculate daily rates
            current_daily_rate = current_plan_cost / Decimal(str(total_days_current))
            new_daily_rate = new_plan_cost / Decimal(str(self.plan_durations[new_plan]))
            
            # Calculate unused amount from current plan
            unused_amount = current_daily_rate * Decimal(str(remaining_days))
            
            # Calculate pro-rata amount
            if new_plan == 'yearly':
                # For yearly upgrade, charge full amount minus unused current plan amount
                prorata_amount = new_plan_cost - unused_amount
            else:
                # For other upgrades, calculate based on remaining period
                prorata_amount = new_plan_cost - unused_amount
            
            # Ensure minimum charge
            prorata_amount = max(prorata_amount, Decimal('0'))
            
            return {
                'current_plan': current_plan,
                'new_plan': new_plan,
                'current_amount': float(current_plan_cost),
                'new_amount': float(new_plan_cost),
                'days_remaining': remaining_days,
                'daily_rate_current': float(current_daily_rate),
                'daily_rate_new': float(new_daily_rate),
                'unused_amount': float(unused_amount),
                'prorata_amount': float(prorata_amount),
                'savings': float(unused_amount) if unused_amount > 0 else 0,
                'amount_in_kobo': int(prorata_amount * 100)  # For Paystack
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate pro-rata upgrade: {str(e)}")
            return {'error': 'Failed to calculate upgrade cost'}

    def initialize_payment(self, user_id: str, plan_details: Dict) -> Dict:
        """Initialize Paystack payment for subscription upgrade"""
        try:
            # Get user details
            user_response = supabase.table('users').select(
                'email, full_name'
            ).eq('id', user_id).single().execute()
            
            if not user_response.data:
                return {'error': 'User not found'}
            
            user = user_response.data
            
            # Prepare payment data
            payment_data = {
                'email': user['email'],
                'amount': plan_details['amount_in_kobo'],
                'currency': 'NGN',
                'reference': f\"SUB_{user_id}_{int(datetime.utcnow().timestamp())}\",
                'callback_url': f\"{os.getenv('FRONTEND_URL', 'https://sabiops.vercel.app')}/dashboard?payment=success\",
                'metadata': {
                    'user_id': user_id,
                    'plan_type': plan_details['new_plan'],
                    'upgrade_type': 'prorata',
                    'current_plan': plan_details['current_plan'],
                    'prorata_amount': plan_details['prorata_amount']
                }
            }
            
            # Initialize payment with Paystack
            headers = {
                'Authorization': f'Bearer {self.paystack_secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f'{self.paystack_base_url}/transaction/initialize',
                json=payment_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                if result['status']:
                    # Store payment reference
                    self.store_payment_reference(user_id, result['data']['reference'], plan_details)
                    
                    return {
                        'success': True,
                        'authorization_url': result['data']['authorization_url'],
                        'reference': result['data']['reference'],
                        'access_code': result['data']['access_code']
                    }
            
            return {'error': 'Failed to initialize payment'}
            
        except Exception as e:
            logger.error(f"Failed to initialize payment: {str(e)}")
            return {'error': 'Payment initialization failed'}

    def verify_payment(self, reference: str) -> Dict:
        """Verify payment with Paystack and update subscription"""
        try:
            headers = {
                'Authorization': f'Bearer {self.paystack_secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'{self.paystack_base_url}/transaction/verify/{reference}',
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                if result['status'] and result['data']['status'] == 'success':
                    # Update user subscription
                    metadata = result['data']['metadata']
                    user_id = metadata['user_id']
                    new_plan = metadata['plan_type']
                    
                    return self.activate_subscription(user_id, new_plan, reference)
            
            return {'error': 'Payment verification failed'}
            
        except Exception as e:
            logger.error(f"Failed to verify payment: {str(e)}")
            return {'error': 'Payment verification failed'}

    def activate_subscription(self, user_id: str, plan: str, reference: str) -> Dict:
        """Activate subscription after successful payment"""
        try:
            now = datetime.utcnow()
            plan_duration = self.plan_durations[plan]
            end_date = now + timedelta(days=plan_duration)
            
            # Update user subscription
            update_data = {
                'subscription_plan': plan,
                'subscription_status': 'active',
                'subscription_start_date': now.isoformat(),
                'subscription_end_date': end_date.isoformat(),
                'trial_ends_at': None,  # Clear trial
                'updated_at': now.isoformat()
            }
            
            supabase.table('users').update(update_data).eq('id', user_id).execute()
            
            # Update team members' access
            self.update_team_members_access(user_id, plan)
            
            # Log payment
            self.log_payment(user_id, plan, reference)
            
            # Send confirmation notification
            self.send_upgrade_notification(user_id, plan)
            
            return {
                'success': True,
                'message': f'Successfully upgraded to {plan} plan',
                'plan': plan,
                'end_date': end_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to activate subscription: {str(e)}")
            return {'error': 'Failed to activate subscription'}

    def update_team_members_access(self, owner_id: str, plan: str):
        """Update team members' access based on owner's plan"""
        try:
            # Get team members
            team_response = supabase.table('team').select(
                'team_member_id'
            ).eq('owner_id', owner_id).eq('active', True).execute()
            
            if team_response.data:
                team_member_ids = [member['team_member_id'] for member in team_response.data]
                
                # Update team members' subscription access
                now = datetime.utcnow()
                plan_duration = self.plan_durations[plan]
                end_date = now + timedelta(days=plan_duration)
                
                update_data = {
                    'subscription_plan': plan,
                    'subscription_status': 'active',
                    'subscription_start_date': now.isoformat(),
                    'subscription_end_date': end_date.isoformat(),
                    'trial_ends_at': None,
                    'updated_at': now.isoformat()
                }
                
                for member_id in team_member_ids:
                    supabase.table('users').update(update_data).eq('id', member_id).execute()
                
                logger.info(f\"Updated {len(team_member_ids)} team members' access for owner {owner_id}\")
                
        except Exception as e:
            logger.error(f\"Failed to update team members' access: {str(e)}\")

    def check_usage_limits(self, user_id: str) -> Dict:
        """Check user's current usage against plan limits"""
        try:
            # Get user subscription
            subscription = self.get_user_subscription(user_id)
            plan = subscription['plan']
            
            # Get current usage
            now = datetime.utcnow()
            
            # For free plan, check monthly limits
            if plan == 'free':
                start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                
                # Check invoices
                invoice_count = supabase.table('invoices').select('id', count='exact').eq(
                    'owner_id', user_id
                ).gte('created_at', start_of_month.isoformat()).execute().count or 0
                
                # Check expenses
                expense_count = supabase.table('expenses').select('id', count='exact').eq(
                    'owner_id', user_id
                ).gte('created_at', start_of_month.isoformat()).execute().count or 0
                
                return {
                    'plan': plan,
                    'limits': {
                        'invoices': 5,
                        'expenses': 5
                    },
                    'usage': {
                        'invoices': invoice_count,
                        'expenses': expense_count
                    },
                    'warnings': {
                        'invoices': invoice_count >= 4,  # Warn at 80%
                        'expenses': expense_count >= 4
                    },
                    'exceeded': {
                        'invoices': invoice_count >= 5,
                        'expenses': expense_count >= 5
                    }
                }
            
            # Paid plans have unlimited access
            return {
                'plan': plan,
                'limits': {'unlimited': True},
                'usage': {'unlimited': True},
                'warnings': {},
                'exceeded': {}
            }
            
        except Exception as e:
            logger.error(f\"Failed to check usage limits: {str(e)}\")
            return {'error': 'Failed to check usage limits'}

    def get_upgrade_suggestions(self, user_id: str) -> List[Dict]:
        """Get intelligent upgrade suggestions based on usage"""
        try:
            usage_data = self.check_usage_limits(user_id)
            
            if usage_data.get('plan') != 'free':
                return []
            
            suggestions = []
            
            # Check if nearing limits
            if usage_data['warnings']['invoices'] or usage_data['warnings']['expenses']:
                suggestions.append({
                    'type': 'limit_warning',
                    'title': 'Approaching Plan Limits',
                    'message': 'You are nearing your monthly limits. Upgrade for unlimited access.',
                    'suggested_plan': 'monthly',
                    'cta': 'Upgrade Now'
                })
            
            # Check if limits exceeded
            if usage_data['exceeded']['invoices'] or usage_data['exceeded']['expenses']:
                suggestions.append({
                    'type': 'limit_exceeded',
                    'title': 'Plan Limits Exceeded',
                    'message': 'You have reached your monthly limits. Upgrade to continue.',
                    'suggested_plan': 'monthly',
                    'cta': 'Upgrade Required',
                    'urgent': True
                })
            
            return suggestions
            
        except Exception as e:
            logger.error(f\"Failed to get upgrade suggestions: {str(e)}\")
            return []

    def store_payment_reference(self, user_id: str, reference: str, plan_details: Dict):
        """Store payment reference for tracking"""
        try:
            supabase.table('payment_references').insert({
                'user_id': user_id,
                'reference': reference,
                'plan_details': plan_details,
                'status': 'pending',
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f\"Failed to store payment reference: {str(e)}\")

    def log_payment(self, user_id: str, plan: str, reference: str):
        """Log successful payment"""
        try:
            supabase.table('subscription_payments').insert({
                'user_id': user_id,
                'plan': plan,
                'reference': reference,
                'amount': self.plan_prices[plan] / 100,  # Convert from kobo
                'status': 'completed',
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f\"Failed to log payment: {str(e)}\")

    def send_upgrade_notification(self, user_id: str, plan: str):
        """Send upgrade confirmation notification"""
        try:
            supabase.table('notifications').insert({
                'user_id': user_id,
                'title': 'Subscription Upgraded',
                'message': f'Your subscription has been upgraded to {plan} plan.',
                'type': 'success',
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f\"Failed to send upgrade notification: {str(e)}\")

    def handle_webhook(self, payload: Dict, signature: str) -> Dict:
        """Handle Paystack webhook"""
        try:
            # Verify webhook signature
            if not self.verify_webhook_signature(payload, signature):
                return {'error': 'Invalid signature'}
            
            event = payload.get('event')
            data = payload.get('data', {})
            
            if event == 'charge.success':
                reference = data.get('reference')
                if reference:
                    return self.verify_payment(reference)
            
            return {'message': 'Webhook processed'}
            
        except Exception as e:
            logger.error(f\"Failed to handle webhook: {str(e)}\")
            return {'error': 'Webhook processing failed'}

    def verify_webhook_signature(self, payload: Dict, signature: str) -> bool:
        """Verify Paystack webhook signature"""
        try:
            import json
            payload_str = json.dumps(payload, separators=(',', ':'))
            expected_signature = hmac.new(
                self.paystack_secret_key.encode('utf-8'),
                payload_str.encode('utf-8'),
                hashlib.sha512
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
            
        except Exception as e:
            logger.error(f\"Failed to verify webhook signature: {str(e)}\")
            return False

# Global instance
subscription_service = SubscriptionService()

