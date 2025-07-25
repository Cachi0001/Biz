"""
Enhanced Dashboard Routes with Role-Based Rendering
Provides role-specific dashboard data and subscription-aware metrics
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from ..services.subscription_service import subscription_service
from ..utils.role_decorators import role_required, get_user_role
from ..database import supabase

dashboard_bp = Blueprint('dashboard', __name__)
logger = logging.getLogger(__name__)

@dashboard_bp.route('/dashboard/role-data', methods=['GET'])
@jwt_required()
def get_role_based_dashboard_data():
    """Get dashboard data based on user role and subscription"""
    try:
        user_id = get_jwt_identity()
        
        # Get user details and role
        user_response = supabase.table('users').select(
            'id, role, subscription_plan, subscription_status, trial_ends_at, owner_id'
        ).eq('id', user_id).single().execute()
        
        if not user_response.data:
            return jsonify({'error': 'User not found'}), 404
        
        user = user_response.data
        role = user['role']
        
        # Get subscription details
        subscription = subscription_service.get_user_subscription(user_id)
        
        # Get role-specific data
        if role == 'Owner':
            data = get_owner_dashboard_data(user_id, subscription)
        elif role == 'Admin':
            data = get_admin_dashboard_data(user_id, subscription)
        elif role == 'Salesperson':
            data = get_salesperson_dashboard_data(user_id, subscription)
        else:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Add common data
        data.update({
            'user_role': role,
            'subscription': subscription,
            'usage_limits': subscription_service.check_usage_limits(user_id),
            'upgrade_suggestions': subscription_service.get_upgrade_suggestions(user_id)
        })
        
        return jsonify(data)
        
    except Exception as e:
        logger.error(f"Failed to get role-based dashboard data: {str(e)}")
        return jsonify({'error': 'Failed to load dashboard data'}), 500

def get_owner_dashboard_data(user_id: str, subscription: dict) -> dict:
    """Get comprehensive dashboard data for business owners"""
    try:
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Financial metrics
        revenue_data = get_revenue_metrics(user_id, start_of_month, start_of_year)
        expense_data = get_expense_metrics(user_id, start_of_month, start_of_year)
        profit_data = calculate_profit_metrics(revenue_data, expense_data)
        
        # Customer metrics
        customer_data = get_customer_metrics(user_id, start_of_month)
        
        # Product metrics
        product_data = get_product_metrics(user_id)
        
        # Team metrics
        team_data = get_team_metrics(user_id)
        
        # Referral earnings (owner only)
        referral_data = get_referral_metrics(user_id)
        
        # Recent activities
        activities = get_recent_activities(user_id, limit=10)
        
        # Subscription insights
        subscription_insights = get_subscription_insights(user_id, subscription)
        
        return {
            'revenue': revenue_data,
            'expenses': expense_data,
            'profit': profit_data,
            'customers': customer_data,
            'products': product_data,
            'team': team_data,
            'referrals': referral_data,
            'activities': activities,
            'subscription_insights': subscription_insights,
            'dashboard_type': 'owner'
        }
        
    except Exception as e:
        logger.error(f"Failed to get owner dashboard data: {str(e)}")
        raise

def get_admin_dashboard_data(user_id: str, subscription: dict) -> dict:
    """Get operational dashboard data for admins"""
    try:
        # Get owner ID for data access
        user_response = supabase.table('users').select('owner_id').eq('id', user_id).single().execute()
        owner_id = user_response.data['owner_id'] or user_id
        
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Operational metrics (no financial details)
        sales_data = get_sales_metrics(owner_id, start_of_month)
        customer_data = get_customer_metrics(owner_id, start_of_month)
        product_data = get_product_metrics(owner_id)
        inventory_data = get_inventory_metrics(owner_id)
        
        # Recent activities (operational only)
        activities = get_operational_activities(owner_id, limit=10)
        
        return {
            'sales': sales_data,
            'customers': customer_data,
            'products': product_data,
            'inventory': inventory_data,
            'activities': activities,
            'dashboard_type': 'admin'
        }
        
    except Exception as e:
        logger.error(f"Failed to get admin dashboard data: {str(e)}")
        raise

def get_salesperson_dashboard_data(user_id: str, subscription: dict) -> dict:
    """Get sales-focused dashboard data for salespersons"""
    try:
        # Get owner ID for data access
        user_response = supabase.table('users').select('owner_id').eq('id', user_id).single().execute()
        owner_id = user_response.data['owner_id'] or user_id
        
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Personal sales metrics
        personal_sales = get_personal_sales_metrics(user_id, start_of_month, start_of_day)
        
        # Customer data (limited)
        customer_data = get_customer_metrics(owner_id, start_of_month, salesperson_id=user_id)
        
        # Product data (for sales)
        product_data = get_sales_product_metrics(owner_id)
        
        # Recent sales activities
        activities = get_sales_activities(user_id, limit=10)
        
        return {
            'personal_sales': personal_sales,
            'customers': customer_data,
            'products': product_data,
            'activities': activities,
            'dashboard_type': 'salesperson'
        }
        
    except Exception as e:
        logger.error(f"Failed to get salesperson dashboard data: {str(e)}")
        raise

def get_revenue_metrics(user_id: str, start_of_month: datetime, start_of_year: datetime) -> dict:
    """Get comprehensive revenue metrics"""
    try:
        # Total revenue
        total_response = supabase.table('sales').select(
            'total_amount'
        ).eq('owner_id', user_id).execute()
        
        total_revenue = sum(Decimal(str(sale['total_amount'])) for sale in total_response.data)
        
        # This month revenue
        month_response = supabase.table('sales').select(
            'total_amount'
        ).eq('owner_id', user_id).gte('created_at', start_of_month.isoformat()).execute()
        
        month_revenue = sum(Decimal(str(sale['total_amount'])) for sale in month_response.data)
        
        # This year revenue
        year_response = supabase.table('sales').select(
            'total_amount'
        ).eq('owner_id', user_id).gte('created_at', start_of_year.isoformat()).execute()
        
        year_revenue = sum(Decimal(str(sale['total_amount'])) for sale in year_response.data)
        
        # Today's revenue
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_response = supabase.table('sales').select(
            'total_amount'
        ).eq('owner_id', user_id).gte('created_at', today.isoformat()).execute()
        
        today_revenue = sum(Decimal(str(sale['total_amount'])) for sale in today_response.data)
        
        return {
            'total': float(total_revenue),
            'this_month': float(month_revenue),
            'this_year': float(year_revenue),
            'today': float(today_revenue)
        }
        
    except Exception as e:
        logger.error(f"Failed to get revenue metrics: {str(e)}")
        return {'total': 0, 'this_month': 0, 'this_year': 0, 'today': 0}

def get_expense_metrics(user_id: str, start_of_month: datetime, start_of_year: datetime) -> dict:
    """Get comprehensive expense metrics"""
    try:
        # Total expenses
        total_response = supabase.table('expenses').select(
            'amount'
        ).eq('owner_id', user_id).execute()
        
        total_expenses = sum(Decimal(str(expense['amount'])) for expense in total_response.data)
        
        # This month expenses
        month_response = supabase.table('expenses').select(
            'amount'
        ).eq('owner_id', user_id).gte('created_at', start_of_month.isoformat()).execute()
        
        month_expenses = sum(Decimal(str(expense['amount'])) for expense in month_response.data)
        
        # This year expenses
        year_response = supabase.table('expenses').select(
            'amount'
        ).eq('owner_id', user_id).gte('created_at', start_of_year.isoformat()).execute()
        
        year_expenses = sum(Decimal(str(expense['amount'])) for expense in year_response.data)
        
        return {
            'total': float(total_expenses),
            'this_month': float(month_expenses),
            'this_year': float(year_expenses)
        }
        
    except Exception as e:
        logger.error(f"Failed to get expense metrics: {str(e)}")
        return {'total': 0, 'this_month': 0, 'this_year': 0}

def calculate_profit_metrics(revenue_data: dict, expense_data: dict) -> dict:
    """Calculate profit metrics from revenue and expense data"""
    return {
        'total': revenue_data['total'] - expense_data['total'],
        'this_month': revenue_data['this_month'] - expense_data['this_month'],
        'this_year': revenue_data['this_year'] - expense_data['this_year'],
        'margin_this_month': (
            (revenue_data['this_month'] - expense_data['this_month']) / revenue_data['this_month'] * 100
            if revenue_data['this_month'] > 0 else 0
        )
    }

def get_customer_metrics(user_id: str, start_of_month: datetime, salesperson_id: str = None) -> dict:
    """Get customer metrics"""
    try:
        query = supabase.table('customers').select('id, created_at, total_spent')
        
        if salesperson_id:
            # For salesperson, get customers they've served
            sales_response = supabase.table('sales').select(
                'customer_id'
            ).eq('salesperson_id', salesperson_id).execute()
            
            customer_ids = list(set(sale['customer_id'] for sale in sales_response.data if sale['customer_id']))
            if customer_ids:
                query = query.in_('id', customer_ids)
            else:
                return {'total': 0, 'new_this_month': 0, 'served': 0}
        else:
            query = query.eq('owner_id', user_id)
        
        customers_response = query.execute()
        customers = customers_response.data
        
        # New customers this month
        new_this_month = len([
            c for c in customers 
            if datetime.fromisoformat(c['created_at'].replace('Z', '+00:00')) >= start_of_month
        ])
        
        return {
            'total': len(customers),
            'new_this_month': new_this_month,
            'served': len(customers) if salesperson_id else len(customers)
        }
        
    except Exception as e:
        logger.error(f"Failed to get customer metrics: {str(e)}")
        return {'total': 0, 'new_this_month': 0, 'served': 0}

def get_product_metrics(user_id: str) -> dict:
    """Get product metrics"""
    try:
        products_response = supabase.table('products').select(
            'id, quantity, low_stock_threshold, active'
        ).eq('owner_id', user_id).eq('active', True).execute()
        
        products = products_response.data
        low_stock = [p for p in products if p['quantity'] <= p['low_stock_threshold']]
        out_of_stock = [p for p in products if p['quantity'] == 0]
        
        return {
            'total': len(products),
            'low_stock': len(low_stock),
            'out_of_stock': len(out_of_stock),
            'low_stock_items': low_stock[:5]  # First 5 for display
        }
        
    except Exception as e:
        logger.error(f"Failed to get product metrics: {str(e)}")
        return {'total': 0, 'low_stock': 0, 'out_of_stock': 0, 'low_stock_items': []}

def get_team_metrics(user_id: str) -> dict:
    """Get team metrics for owners"""
    try:
        team_response = supabase.table('team').select(
            'team_member_id, role, active'
        ).eq('owner_id', user_id).execute()
        
        team_members = team_response.data
        active_members = [m for m in team_members if m['active']]
        
        return {
            'total_members': len(team_members),
            'active_count': len(active_members),
            'roles': {
                'admin': len([m for m in active_members if m['role'] == 'Admin']),
                'salesperson': len([m for m in active_members if m['role'] == 'Salesperson'])
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get team metrics: {str(e)}")
        return {'total_members': 0, 'active_count': 0, 'roles': {'admin': 0, 'salesperson': 0}}

def get_referral_metrics(user_id: str) -> dict:
    """Get referral earnings for owners"""
    try:
        earnings_response = supabase.table('referral_earnings').select(
            'amount, status'
        ).eq('referrer_id', user_id).execute()
        
        earnings = earnings_response.data
        total_earnings = sum(Decimal(str(e['amount'])) for e in earnings)
        confirmed_earnings = sum(Decimal(str(e['amount'])) for e in earnings if e['status'] == 'confirmed')
        
        return {
            'total_earnings': float(total_earnings),
            'confirmed_earnings': float(confirmed_earnings),
            'available_for_withdrawal': float(confirmed_earnings)
        }
        
    except Exception as e:
        logger.error(f"Failed to get referral metrics: {str(e)}")
        return {'total_earnings': 0, 'confirmed_earnings': 0, 'available_for_withdrawal': 0}

def get_personal_sales_metrics(user_id: str, start_of_month: datetime, start_of_day: datetime) -> dict:
    """Get personal sales metrics for salesperson"""
    try:
        # Total personal sales
        total_response = supabase.table('sales').select(
            'total_amount'
        ).eq('salesperson_id', user_id).execute()
        
        total_sales = sum(Decimal(str(sale['total_amount'])) for sale in total_response.data)
        
        # This month sales
        month_response = supabase.table('sales').select(
            'total_amount'
        ).eq('salesperson_id', user_id).gte('created_at', start_of_month.isoformat()).execute()
        
        month_sales = sum(Decimal(str(sale['total_amount'])) for sale in month_response.data)
        
        # Today's sales
        today_response = supabase.table('sales').select(
            'total_amount'
        ).eq('salesperson_id', user_id).gte('created_at', start_of_day.isoformat()).execute()
        
        today_sales = sum(Decimal(str(sale['total_amount'])) for sale in today_response.data)
        
        return {
            'total': float(total_sales),
            'this_month': float(month_sales),
            'today': float(today_sales)
        }
        
    except Exception as e:
        logger.error(f"Failed to get personal sales metrics: {str(e)}")
        return {'total': 0, 'this_month': 0, 'today': 0}

def get_recent_activities(user_id: str, limit: int = 10) -> list:
    """Get recent business activities"""
    try:
        activities_response = supabase.table('activities').select(
            'id, activity_type, description, created_at'
        ).eq('owner_id', user_id).order('created_at', desc=True).limit(limit).execute()
        
        return activities_response.data
        
    except Exception as e:
        logger.error(f"Failed to get recent activities: {str(e)}")
        return []

def get_subscription_insights(user_id: str, subscription: dict) -> dict:
    """Get subscription-related insights"""
    try:
        insights = {
            'plan': subscription['plan'],
            'status': subscription['status'],
            'is_trial': subscription['is_trial'],
            'trial_days_left': subscription.get('trial_days_left', 0),
            'features_unlocked': get_plan_features(subscription['plan']),
            'next_billing_date': subscription.get('subscription_end'),
            'upgrade_available': subscription['plan'] != 'yearly'
        }
        
        # Add usage warnings if applicable
        usage_limits = subscription_service.check_usage_limits(user_id)
        if 'warnings' in usage_limits:
            insights['usage_warnings'] = [
                feature for feature, warning in usage_limits['warnings'].items() if warning
            ]
        
        return insights
        
    except Exception as e:
        logger.error(f"Failed to get subscription insights: {str(e)}")
        return {}

def get_plan_features(plan: str) -> list:
    """Get features available for a plan"""
    features = {
        'free': ['Basic invoicing', 'Customer management', 'Limited reports'],
        'weekly': ['Unlimited invoicing', 'Team management', 'Advanced reports', 'Priority support'],
        'monthly': ['All weekly features', 'Advanced analytics', 'API access', 'Custom branding'],
        'yearly': ['All monthly features', 'Priority support', 'Custom integrations', 'Dedicated account manager']
    }
    
    return features.get(plan, [])

# Additional utility endpoints

@dashboard_bp.route('/dashboard/metrics/summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    """Get quick dashboard summary for header/sidebar"""
    try:
        user_id = get_jwt_identity()
        
        # Get basic metrics
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Today's sales
        sales_response = supabase.table('sales').select(
            'total_amount'
        ).eq('owner_id', user_id).gte('created_at', today.isoformat()).execute()
        
        today_sales = sum(Decimal(str(sale['total_amount'])) for sale in sales_response.data)
        
        # Unread notifications
        notifications_response = supabase.table('notifications').select(
            'id', count='exact'
        ).eq('user_id', user_id).eq('read', False).execute()
        
        unread_notifications = notifications_response.count or 0
        
        # Low stock alerts
        products_response = supabase.table('products').select(
            'id, name, quantity, low_stock_threshold'
        ).eq('owner_id', user_id).execute()
        
        low_stock_count = len([
            p for p in products_response.data 
            if p['quantity'] <= p['low_stock_threshold']
        ])
        
        return jsonify({
            'today_sales': float(today_sales),
            'unread_notifications': unread_notifications,
            'low_stock_alerts': low_stock_count,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to get dashboard summary: {str(e)}")
        return jsonify({'error': 'Failed to load dashboard summary'}), 500

@dashboard_bp.route('/dashboard/quick-stats', methods=['GET'])
@jwt_required()
def get_quick_stats():
    """Get quick stats for dashboard cards"""
    try:
        user_id = get_jwt_identity()
        role = get_user_role(user_id)
        
        if role == 'Owner':
            stats = get_owner_quick_stats(user_id)
        elif role == 'Admin':
            stats = get_admin_quick_stats(user_id)
        elif role == 'Salesperson':
            stats = get_salesperson_quick_stats(user_id)
        else:
            return jsonify({'error': 'Invalid role'}), 400
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Failed to get quick stats: {str(e)}")
        return jsonify({'error': 'Failed to load quick stats'}), 500

def get_owner_quick_stats(user_id: str) -> dict:
    """Get quick stats for owner"""
    try:
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Revenue this month
        revenue_response = supabase.table('sales').select(
            'total_amount'
        ).eq('owner_id', user_id).gte('created_at', start_of_month.isoformat()).execute()
        
        month_revenue = sum(Decimal(str(sale['total_amount'])) for sale in revenue_response.data)
        
        # Customer count
        customers_response = supabase.table('customers').select(
            'id', count='exact'
        ).eq('owner_id', user_id).execute()
        
        customer_count = customers_response.count or 0
        
        # Product count
        products_response = supabase.table('products').select(
            'id', count='exact'
        ).eq('owner_id', user_id).eq('active', True).execute()
        
        product_count = products_response.count or 0
        
        # Pending invoices
        invoices_response = supabase.table('invoices').select(
            'id', count='exact'
        ).eq('owner_id', user_id).eq('status', 'sent').execute()
        
        pending_invoices = invoices_response.count or 0
        
        return {
            'month_revenue': float(month_revenue),
            'customer_count': customer_count,
            'product_count': product_count,
            'pending_invoices': pending_invoices
        }
        
    except Exception as e:
        logger.error(f"Failed to get owner quick stats: {str(e)}")
        return {}

def get_admin_quick_stats(user_id: str) -> dict:
    """Get quick stats for admin"""
    try:
        # Get owner ID
        user_response = supabase.table('users').select('owner_id').eq('id', user_id).single().execute()
        owner_id = user_response.data['owner_id'] or user_id
        
        return get_owner_quick_stats(owner_id)
        
    except Exception as e:
        logger.error(f"Failed to get admin quick stats: {str(e)}")
        return {}

def get_salesperson_quick_stats(user_id: str) -> dict:
    """Get quick stats for salesperson"""
    try:
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Personal sales today
        today_sales_response = supabase.table('sales').select(
            'total_amount'
        ).eq('salesperson_id', user_id).gte('created_at', start_of_day.isoformat()).execute()
        
        today_sales = sum(Decimal(str(sale['total_amount'])) for sale in today_sales_response.data)
        
        # Personal sales this month
        month_sales_response = supabase.table('sales').select(
            'total_amount'
        ).eq('salesperson_id', user_id).gte('created_at', start_of_month.isoformat()).execute()
        
        month_sales = sum(Decimal(str(sale['total_amount'])) for sale in month_sales_response.data)
        
        # Customers served this month
        customers_served_response = supabase.table('sales').select(
            'customer_id'
        ).eq('salesperson_id', user_id).gte('created_at', start_of_month.isoformat()).execute()
        
        unique_customers = len(set(sale['customer_id'] for sale in customers_served_response.data if sale['customer_id']))
        
        return {
            'today_sales': float(today_sales),
            'month_sales': float(month_sales),
            'customers_served': unique_customers
        }
        
    except Exception as e:
        logger.error(f"Failed to get salesperson quick stats: {str(e)}")
        return {}

