"""
Subscription Service Implementation
Handles subscription management, pro-rata calculations, and plan enforcement
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from decimal import Decimal
import requests
import hashlib
import hmac
import json

from core.interfaces.services.subscription_service_interface import SubscriptionServiceInterface
from core.entities.subscription_entity import SubscriptionEntity, SubscriptionPlan, SubscriptionStatus, PaymentStatus
from core.interfaces.repositories.subscription_repository_interface import SubscriptionRepositoryInterface
from core.interfaces.services.paystack_service_interface import PaystackServiceInterface
from core.interfaces.services.email_service_interface import EmailServiceInterface
from shared.exceptions.business_exceptions import ValidationException, BusinessException

logger = logging.getLogger(__name__)

class SubscriptionService(SubscriptionServiceInterface):
    
    def __init__(self, 
                 subscription_repository: SubscriptionRepositoryInterface,
                 paystack_service: PaystackServiceInterface,
                 email_service: EmailServiceInterface):
        self.subscription_repository = subscription_repository
        self.paystack_service = paystack_service
        self.email_service = email_service
        
        # Plan pricing in kobo (multiply by 100 for Paystack)
        self.plan_prices = {
            SubscriptionPlan.WEEKLY: 140000,  # ₦1,400
            SubscriptionPlan.MONTHLY: 450000,  # ₦4,500
            SubscriptionPlan.YEARLY: 5000000   # ₦50,000
        }
        
        # Plan durations in days
        self.plan_durations = {
            SubscriptionPlan.WEEKLY: 7,
            SubscriptionPlan.MONTHLY: 30,
            SubscriptionPlan.YEARLY: 365
        }

    async def create_subscription(self, user_id: str, plan: str, payment_reference: str) -> SubscriptionEntity:
        """Create a new subscription for a user"""
        try:
            subscription_plan = SubscriptionPlan(plan)
            now = datetime.now()
            end_date = now + timedelta(days=self.plan_durations[subscription_plan])
            amount = Decimal(str(self.plan_prices[subscription_plan] / 100))  # Convert from kobo
            
            subscription_data = {
                'user_id': user_id,
                'plan': subscription_plan,
                'status': SubscriptionStatus.ACTIVE,
                'start_date': now,
                'end_date': end_date,
                'amount': amount,
                'payment_reference': payment_reference,
                'payment_status': PaymentStatus.COMPLETED,
                'created_at': now,
                'updated_at': now
            }
            
            subscription = SubscriptionEntity.from_dict(subscription_data)
            created_subscription = await self.subscription_repository.create_subscription(subscription)
            
            # Log subscription change for audit
            await self.log_subscription_change(
                user_id, 'created', None, plan, 'New subscription created'
            )
            
            # Send confirmation email
            await self._send_subscription_confirmation(user_id, plan)
            
            logger.info(f"Successfully created subscription for user {user_id} with plan {plan}")
            return created_subscription
            
        except Exception as e:
            logger.error(f"Failed to create subscription: {str(e)}")
            raise BusinessException(f"Failed to create subscription: {str(e)}")

    async def get_user_subscription(self, user_id: str) -> Optional[SubscriptionEntity]:
        """Get the current subscription for a user"""
        try:
            return await self.subscription_repository.find_active_subscription_by_user(user_id)
        except Exception as e:
            logger.error(f"Failed to get user subscription: {str(e)}")
            raise BusinessException(f"Failed to get user subscription: {str(e)}")

    async def update_subscription_status(self, subscription_id: str, status: str) -> SubscriptionEntity:
        """Update subscription status"""
        try:
            subscription_status = SubscriptionStatus(status)
            updates = {
                'status': subscription_status,
                'updated_at': datetime.now()
            }
            
            updated_subscription = await self.subscription_repository.update_subscription(
                subscription_id, updates
            )
            
            if not updated_subscription:
                raise BusinessException("Subscription not found")
            
            # Log status change
            await self.log_subscription_change(
                updated_subscription.user_id, 'status_updated', 
                None, None, f"Status updated to {status}"
            )
            
            return updated_subscription
            
        except Exception as e:
            logger.error(f"Failed to update subscription status: {str(e)}")
            raise BusinessException(f"Failed to update subscription status: {str(e)}")

    async def cancel_subscription(self, subscription_id: str, reason: str = None) -> SubscriptionEntity:
        """Cancel a subscription"""
        try:
            subscription = await self.subscription_repository.find_subscription_by_id(subscription_id)
            if not subscription:
                raise BusinessException("Subscription not found")
            
            subscription.cancel()
            updated_subscription = await self.subscription_repository.update_subscription(
                subscription_id, {
                    'status': subscription.status,
                    'cancelled_at': subscription.cancelled_at,
                    'auto_renew': subscription.auto_renew,
                    'updated_at': subscription.updated_at
                }
            )
            
            # Log cancellation
            await self.log_subscription_change(
                subscription.user_id, 'cancelled', 
                subscription.plan.value, None, reason or 'User requested cancellation'
            )
            
            # Send cancellation confirmation
            await self._send_cancellation_confirmation(subscription.user_id, subscription.plan.value)
            
            return updated_subscription
            
        except Exception as e:
            logger.error(f"Failed to cancel subscription: {str(e)}")
            raise BusinessException(f"Failed to cancel subscription: {str(e)}")

    async def renew_subscription(self, subscription_id: str, new_end_date: datetime) -> SubscriptionEntity:
        """Renew a subscription"""
        try:
            subscription = await self.subscription_repository.find_subscription_by_id(subscription_id)
            if not subscription:
                raise BusinessException("Subscription not found")
            
            if not subscription.can_renew():
                raise BusinessException("Subscription cannot be renewed")
            
            subscription.renew(new_end_date)
            updated_subscription = await self.subscription_repository.update_subscription(
                subscription_id, {
                    'status': subscription.status,
                    'end_date': subscription.end_date,
                    'updated_at': subscription.updated_at
                }
            )
            
            # Log renewal
            await self.log_subscription_change(
                subscription.user_id, 'renewed', 
                subscription.plan.value, subscription.plan.value, 'Subscription renewed'
            )
            
            return updated_subscription
            
        except Exception as e:
            logger.error(f"Failed to renew subscription: {str(e)}")
            raise BusinessException(f"Failed to renew subscription: {str(e)}")

    async def get_expiring_subscriptions(self, days_ahead: int = 7) -> List[SubscriptionEntity]:
        """Get subscriptions expiring within specified days"""
        try:
            expiry_date = datetime.now() + timedelta(days=days_ahead)
            return await self.subscription_repository.find_expiring_subscriptions(expiry_date)
        except Exception as e:
            logger.error(f"Failed to get expiring subscriptions: {str(e)}")
            raise BusinessException(f"Failed to get expiring subscriptions: {str(e)}")

    async def process_subscription_payment(self, subscription_id: str, payment_data: Dict) -> Dict:
        """Process payment for subscription"""
        try:
            subscription = await self.subscription_repository.find_subscription_by_id(subscription_id)
            if not subscription:
                raise BusinessException("Subscription not found")
            
            # Initialize payment with Paystack
            payment_result = await self.paystack_service.initialize_payment(
                email=payment_data['email'],
                amount=subscription.amount,
                reference=payment_data.get('reference'),
                callback_url=payment_data.get('callback_url'),
                metadata={
                    'subscription_id': subscription_id,
                    'user_id': subscription.user_id,
                    'plan': subscription.plan.value
                }
            )
            
            if payment_result.get('success'):
                # Update subscription payment reference
                await self.subscription_repository.update_subscription(
                    subscription_id, {
                        'payment_reference': payment_result['reference'],
                        'payment_status': PaymentStatus.PENDING,
                        'updated_at': datetime.now()
                    }
                )
            
            return payment_result
            
        except Exception as e:
            logger.error(f"Failed to process subscription payment: {str(e)}")
            raise BusinessException(f"Failed to process subscription payment: {str(e)}")

    async def get_subscription_analytics(self, start_date: datetime, end_date: datetime) -> Dict:
        """Get subscription analytics for date range"""
        try:
            return await self.subscription_repository.get_subscription_analytics(start_date, end_date)
        except Exception as e:
            logger.error(f"Failed to get subscription analytics: {str(e)}")
            raise BusinessException(f"Failed to get subscription analytics: {str(e)}")

    async def enforce_usage_limits(self, user_id: str, feature: str) -> Dict:
        """Check and enforce usage limits for a feature"""
        try:
            subscription = await self.get_user_subscription(user_id)
            if not subscription:
                # Free tier limits
                return await self._check_free_tier_limits(user_id, feature)
            
            if subscription.is_active():
                # Paid subscription - unlimited access
                return {
                    'allowed': True,
                    'plan': subscription.plan.value,
                    'unlimited': True
                }
            
            # Expired subscription - treat as free tier
            return await self._check_free_tier_limits(user_id, feature)
            
        except Exception as e:
            logger.error(f"Failed to enforce usage limits: {str(e)}")
            raise BusinessException(f"Failed to enforce usage limits: {str(e)}")

    async def log_subscription_change(self, user_id: str, action: str, old_plan: str = None, 
                                    new_plan: str = None, reason: str = None) -> str:
        """Log subscription changes for audit"""
        try:
            return await self.subscription_repository.log_subscription_change(
                user_id, action, old_plan, new_plan, reason
            )
        except Exception as e:
            logger.error(f"Failed to log subscription change: {str(e)}")
            raise BusinessException(f"Failed to log subscription change: {str(e)}")

    async def calculate_prorata_upgrade(self, user_id: str, new_plan: str) -> Dict:
        """Calculate pro-rata cost for plan upgrade"""
        try:
            current_subscription = await self.get_user_subscription(user_id)
            if not current_subscription:
                raise BusinessException("No active subscription found")
            
            new_subscription_plan = SubscriptionPlan(new_plan)
            current_plan = current_subscription.plan
            
            if current_plan == new_subscription_plan:
                raise ValidationException("Already on the selected plan")
            
            now = datetime.now()
            remaining_days = max(0, (current_subscription.end_date - now).days)
            total_days_current = self.plan_durations[current_plan]
            
            # Calculate costs
            current_plan_cost = Decimal(str(self.plan_prices[current_plan] / 100))
            new_plan_cost = Decimal(str(self.plan_prices[new_subscription_plan] / 100))
            
            # Calculate daily rates
            current_daily_rate = current_plan_cost / Decimal(str(total_days_current))
            new_daily_rate = new_plan_cost / Decimal(str(self.plan_durations[new_subscription_plan]))
            
            # Calculate unused amount from current plan
            unused_amount = current_daily_rate * Decimal(str(remaining_days))
            
            # Calculate pro-rata amount
            prorata_amount = max(new_plan_cost - unused_amount, Decimal('0'))
            
            return {
                'current_plan': current_plan.value,
                'new_plan': new_plan,
                'current_amount': float(current_plan_cost),
                'new_amount': float(new_plan_cost),
                'days_remaining': remaining_days,
                'unused_amount': float(unused_amount),
                'prorata_amount': float(prorata_amount),
                'amount_in_kobo': int(prorata_amount * 100)
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate pro-rata upgrade: {str(e)}")
            raise BusinessException(f"Failed to calculate pro-rata upgrade: {str(e)}")

    async def _check_free_tier_limits(self, user_id: str, feature: str) -> Dict:
        """Check free tier usage limits"""
        # This would integrate with usage tracking repository
        # For now, return basic free tier limits
        return {
            'allowed': True,  # Would check actual usage
            'plan': 'free',
            'limits': {
                'invoices': 5,
                'expenses': 5,
                'products': 10
            },
            'usage': {
                'invoices': 0,  # Would get from repository
                'expenses': 0,
                'products': 0
            }
        }

    async def _send_subscription_confirmation(self, user_id: str, plan: str):
        """Send subscription confirmation email"""
        try:
            # This would get user email from user repository
            # For now, just log the action
            logger.info(f"Sending subscription confirmation for user {user_id}, plan {plan}")
        except Exception as e:
            logger.error(f"Failed to send subscription confirmation: {str(e)}")

    async def _send_cancellation_confirmation(self, user_id: str, plan: str):
        """Send cancellation confirmation email"""
        try:
            # This would get user email from user repository
            # For now, just log the action
            logger.info(f"Sending cancellation confirmation for user {user_id}, plan {plan}")
        except Exception as e:
            logger.error(f"Failed to send cancellation confirmation: {str(e)}")