import logging
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from decimal import Decimal

from core.entities.subscription_entity import SubscriptionEntity, SubscriptionPlan, SubscriptionStatus, PaymentStatus
from core.interfaces.repositories.subscription_repository_interface import SubscriptionRepositoryInterface
from infrastructure.database.supabase_client import get_supabase_client
from shared.exceptions.business_exceptions import RepositoryException

logger = logging.getLogger(__name__)

class SupabaseSubscriptionRepository(SubscriptionRepositoryInterface):
    
    def __init__(self):
        self.client = get_supabase_client()
    
    async def create_subscription(self, subscription: SubscriptionEntity) -> SubscriptionEntity:
        try:
            subscription_data = {
                'id': subscription.id,
                'user_id': subscription.user_id,
                'plan': subscription.plan.value,
                'status': subscription.status.value,
                'start_date': subscription.start_date.isoformat(),
                'end_date': subscription.end_date.isoformat(),
                'created_at': subscription.created_at.isoformat(),
                'updated_at': subscription.updated_at.isoformat(),
                'amount': float(subscription.amount),
                'currency': subscription.currency,
                'payment_reference': subscription.payment_reference,
                'payment_status': subscription.payment_status.value,
                'auto_renew': subscription.auto_renew,
                'cancelled_at': subscription.cancelled_at.isoformat() if subscription.cancelled_at else None
            }
            
            result = self.client.table('subscriptions').insert(subscription_data).execute()
            
            if result.data:
                logger.info(f"Successfully created subscription: {subscription.id}")
                return self._map_to_entity(result.data[0])
            else:
                raise RepositoryException("Failed to create subscription")
                
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}")
            raise RepositoryException(f"Failed to create subscription: {str(e)}")
    
    async def find_subscription_by_id(self, subscription_id: str) -> Optional[SubscriptionEntity]:
        try:
            result = self.client.table('subscriptions').select('*').eq('id', subscription_id).execute()
            
            if result.data:
                return self._map_to_entity(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error finding subscription by ID: {str(e)}")
            raise RepositoryException(f"Failed to find subscription: {str(e)}")
    
    async def find_active_subscription_by_user(self, user_id: str) -> Optional[SubscriptionEntity]:
        try:
            current_time = datetime.now()
            
            result = self.client.table('subscriptions').select('*').eq('user_id', user_id).eq('status', SubscriptionStatus.ACTIVE.value).gte('end_date', current_time.isoformat()).order('created_at', desc=True).limit(1).execute()
            
            if result.data:
                return self._map_to_entity(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error finding active subscription for user {user_id}: {str(e)}")
            raise RepositoryException(f"Failed to find active subscription: {str(e)}")
    
    async def find_subscriptions_by_user(self, user_id: str) -> List[SubscriptionEntity]:
        try:
            result = self.client.table('subscriptions').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
            
            return [self._map_to_entity(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error finding subscriptions for user {user_id}: {str(e)}")
            raise RepositoryException(f"Failed to find subscriptions: {str(e)}")
    
    async def update_subscription(self, subscription_id: str, updates: dict) -> Optional[SubscriptionEntity]:
        try:
            # Convert Decimal values to float for JSON serialization
            processed_updates = {}
            for key, value in updates.items():
                if isinstance(value, Decimal):
                    processed_updates[key] = float(value)
                elif isinstance(value, datetime):
                    processed_updates[key] = value.isoformat()
                elif hasattr(value, 'value'):  # Enum
                    processed_updates[key] = value.value
                else:
                    processed_updates[key] = value
            
            processed_updates['updated_at'] = datetime.now().isoformat()
            
            result = self.client.table('subscriptions').update(processed_updates).eq('id', subscription_id).execute()
            
            if result.data:
                logger.info(f"Successfully updated subscription: {subscription_id}")
                return self._map_to_entity(result.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating subscription: {str(e)}")
            raise RepositoryException(f"Failed to update subscription: {str(e)}")
    
    async def cancel_subscription(self, subscription_id: str) -> bool:
        try:
            updates = {
                'status': SubscriptionStatus.CANCELLED.value,
                'cancelled_at': datetime.now().isoformat(),
                'auto_renew': False,
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.client.table('subscriptions').update(updates).eq('id', subscription_id).execute()
            
            success = len(result.data) > 0
            if success:
                logger.info(f"Successfully cancelled subscription: {subscription_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error cancelling subscription: {str(e)}")
            raise RepositoryException(f"Failed to cancel subscription: {str(e)}")
    
    async def get_expiring_subscriptions(self, days_ahead: int = 7) -> List[SubscriptionEntity]:
        try:
            current_time = datetime.now()
            expiry_threshold = current_time + timedelta(days=days_ahead)
            
            result = self.client.table('subscriptions').select('*').eq('status', SubscriptionStatus.ACTIVE.value).lte('end_date', expiry_threshold.isoformat()).gte('end_date', current_time.isoformat()).execute()
            
            return [self._map_to_entity(row) for row in result.data]
            
        except Exception as e:
            logger.error(f"Error getting expiring subscriptions: {str(e)}")
            raise RepositoryException(f"Failed to get expiring subscriptions: {str(e)}")
    
    async def get_subscription_statistics(self, start_date: datetime = None, end_date: datetime = None) -> Dict:
        try:
            query = self.client.table('subscriptions').select('*')
            
            if start_date:
                query = query.gte('created_at', start_date.isoformat())
            if end_date:
                query = query.lte('created_at', end_date.isoformat())
            
            result = query.execute()
            subscriptions_data = result.data
            
            # Calculate statistics
            total_subscriptions = len(subscriptions_data)
            active_subscriptions = [s for s in subscriptions_data if s.get('status') == SubscriptionStatus.ACTIVE.value]
            expired_subscriptions = [s for s in subscriptions_data if s.get('status') == SubscriptionStatus.EXPIRED.value]
            cancelled_subscriptions = [s for s in subscriptions_data if s.get('status') == SubscriptionStatus.CANCELLED.value]
            
            # Revenue calculations
            total_revenue = sum(float(s.get('amount', 0)) for s in subscriptions_data if s.get('payment_status') == PaymentStatus.COMPLETED.value)
            
            # Plan breakdown
            plan_breakdown = {}
            for subscription in subscriptions_data:
                plan = subscription.get('plan', 'unknown')
                if plan not in plan_breakdown:
                    plan_breakdown[plan] = {'count': 0, 'revenue': 0}
                plan_breakdown[plan]['count'] += 1
                if subscription.get('payment_status') == PaymentStatus.COMPLETED.value:
                    plan_breakdown[plan]['revenue'] += float(subscription.get('amount', 0))
            
            return {
                'total_subscriptions': total_subscriptions,
                'active_subscriptions': len(active_subscriptions),
                'expired_subscriptions': len(expired_subscriptions),
                'cancelled_subscriptions': len(cancelled_subscriptions),
                'total_revenue': total_revenue,
                'plan_breakdown': plan_breakdown,
                'conversion_rate': (len(active_subscriptions) / total_subscriptions * 100) if total_subscriptions > 0 else 0,
                'churn_rate': (len(cancelled_subscriptions) / total_subscriptions * 100) if total_subscriptions > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting subscription statistics: {str(e)}")
            raise RepositoryException(f"Failed to get subscription statistics: {str(e)}")
    
    def _map_to_entity(self, data: dict) -> SubscriptionEntity:
        return SubscriptionEntity(
            id=data['id'],
            user_id=data['user_id'],
            plan=SubscriptionPlan(data['plan']),
            status=SubscriptionStatus(data['status']),
            start_date=datetime.fromisoformat(data['start_date']),
            end_date=datetime.fromisoformat(data['end_date']),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            amount=Decimal(str(data['amount'])),
            currency=data.get('currency', 'NGN'),
            payment_reference=data.get('payment_reference'),
            payment_status=PaymentStatus(data.get('payment_status', PaymentStatus.PENDING.value)),
            auto_renew=data.get('auto_renew', True),
            cancelled_at=datetime.fromisoformat(data['cancelled_at']) if data.get('cancelled_at') else None
        )