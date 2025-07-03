"""
Referral Service for Bizflow SME Nigeria
Handles referral earnings based on subscription plans
"""
from src.models.user import User, db
from src.models.referral import ReferralEarning
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ReferralService:
    
    # Referral earning rates (only for Monthly and Yearly plans)
    REFERRAL_RATES = {
        'monthly': 500.0,   # ₦500 per monthly subscription referral
        'yearly': 5000.0,   # ₦5,000 per yearly subscription referral
        'weekly': 0.0,      # No earnings for weekly (trial period)
        'free': 0.0         # No earnings for free plan
    }
    
    @staticmethod
    def calculate_referral_earning(subscription_plan, subscription_status='active'):
        """
        Calculate referral earning based on subscription plan
        Only Monthly and Yearly plans generate referral earnings
        """
        # No earnings for trial users or weekly plans
        if subscription_status == 'trial' or subscription_plan == 'weekly':
            return 0.0
        
        return ReferralService.REFERRAL_RATES.get(subscription_plan, 0.0)
    
    @staticmethod
    def process_referral_earning(referred_user_id, subscription_plan, subscription_status='active'):
        """
        Process referral earning when a user upgrades to a paid plan
        """
        try:
            # Get the referred user
            referred_user = User.query.get(referred_user_id)
            if not referred_user or not referred_user.referred_by:
                return False
            
            # Get the referrer
            referrer = User.query.get(referred_user.referred_by)
            if not referrer:
                return False
            
            # Calculate earning amount
            earning_amount = ReferralService.calculate_referral_earning(subscription_plan, subscription_status)
            
            # Only process if there's an earning amount
            if earning_amount <= 0:
                logger.info(f"No referral earning for {subscription_plan} plan")
                return False
            
            # Check if earning already exists for this referral
            existing_earning = ReferralEarning.query.filter_by(
                referrer_id=referrer.id,
                referred_user_id=referred_user.id,
                source_type='subscription',
                earning_type=subscription_plan
            ).first()
            
            if existing_earning:
                logger.info(f"Referral earning already exists for user {referred_user_id}")
                return False
            
            # Create referral earning record
            earning = ReferralEarning(
                referrer_id=referrer.id,
                referred_user_id=referred_user.id,
                earning_type=subscription_plan,
                amount=earning_amount,
                commission_rate=10.0,  # 10% commission rate
                source_id=referred_user.id,
                source_type='subscription',
                status='confirmed',
                earned_at=datetime.utcnow(),
                confirmed_at=datetime.utcnow()
            )
            
            # Add earning to referrer's balance
            referrer.referral_earnings += earning_amount
            referrer.total_referrals += 1
            
            # Save to database
            db.session.add(earning)
            db.session.commit()
            
            logger.info(f"Referral earning of ₦{earning_amount} processed for referrer {referrer.id}")
            
            # Send notification to referrer
            try:
                from flask import current_app
                if hasattr(current_app, 'supabase_service') and current_app.supabase_service.is_enabled():
                    current_app.supabase_service.send_notification(
                        str(referrer.id),
                        "Referral Earning!",
                        f"You earned ₦{earning_amount:,.0f} from referring {referred_user.first_name} {referred_user.last_name} to the {subscription_plan} plan!",
                        "success"
                    )
            except Exception as e:
                logger.error(f"Failed to send referral notification: {e}")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing referral earning: {e}")
            return False
    
    @staticmethod
    def get_referral_summary(user_id):
        """
        Get referral summary for a user
        """
        try:
            user = User.query.get(user_id)
            if not user:
                return None
            
            # Get all earnings
            earnings = ReferralEarning.query.filter_by(referrer_id=user_id).all()
            
            # Calculate totals by plan type
            monthly_earnings = sum(e.amount for e in earnings if e.earning_type == 'monthly')
            yearly_earnings = sum(e.amount for e in earnings if e.earning_type == 'yearly')
            total_earned = monthly_earnings + yearly_earnings
            
            # Count referrals by type
            monthly_referrals = len([e for e in earnings if e.earning_type == 'monthly'])
            yearly_referrals = len([e for e in earnings if e.earning_type == 'yearly'])
            
            return {
                'total_earned': total_earned,
                'available_balance': user.referral_earnings,
                'total_withdrawn': user.total_withdrawn,
                'total_referrals': user.total_referrals,
                'breakdown': {
                    'monthly': {
                        'count': monthly_referrals,
                        'earnings': monthly_earnings,
                        'rate': ReferralService.REFERRAL_RATES['monthly']
                    },
                    'yearly': {
                        'count': yearly_referrals,
                        'earnings': yearly_earnings,
                        'rate': ReferralService.REFERRAL_RATES['yearly']
                    }
                },
                'referral_code': user.referral_code,
                'can_withdraw': user.referral_earnings >= 3000
            }
            
        except Exception as e:
            logger.error(f"Error getting referral summary: {e}")
            return None
    
    @staticmethod
    def validate_referral_code(referral_code):
        """
        Validate a referral code
        """
        try:
            referrer = User.query.filter_by(referral_code=referral_code).first()
            if not referrer or not referrer.is_active:
                return None
            
            return {
                'valid': True,
                'referrer_id': referrer.id,
                'referrer_name': f"{referrer.first_name} {referrer.last_name}",
                'business_name': referrer.business_name
            }
            
        except Exception as e:
            logger.error(f"Error validating referral code: {e}")
            return None