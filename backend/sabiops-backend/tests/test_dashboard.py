import pytest
import json
from datetime import datetime, timedelta
from src.models.customer import Customer
from src.models.product import Product
from src.models.invoice import Invoice, InvoiceItem
from src.models.payment import Payment
from src.models.user import db

class TestDashboardRoutes:
    """Test cases for dashboard and analytics routes."""
    
    def setup_comprehensive_test_data(self, client, auth_headers):
        """Setup comprehensive test data for analytics."""
        # Create customers
        customers_data = [
            {'name': 'Customer A', 'email': 'a@example.com', 'phone': '+2348012345678'},
            {'name': 'Customer B', 'email': 'b@example.com', 'phone': '+2348012345679'},
            {'name': 'Customer C', 'email': 'c@example.com', 'phone': '+2348012345680'}
        ]
        
        customer_ids = []
        for customer_data in customers_data:
            response = client.post('/api/customers', json=customer_data, headers=auth_headers)
            customer_ids.append(response.get_json()['customer']['id'])
        
        # Create products
        products_data = [
            {'name': 'Product 1', 'sku': 'PROD-001', 'price': 1000.00, 'quantity': 50},
            {'name': 'Product 2', 'sku': 'PROD-002', 'price': 2000.00, 'quantity': 30},
            {'name': 'Product 3', 'sku': 'PROD-003', 'price': 500.00, 'quantity': 5}  # Low stock
        ]
        
        product_ids = []
        for product_data in products_data:
            response = client.post('/api/products', json=product_data, headers=auth_headers)
            product_ids.append(response.get_json()['product']['id'])
        
        # Create invoices with different statuses and dates
        invoices_data = [
            {
                'customer_id': customer_ids[0],
                'invoice_date': (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                'due_date': (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'),
                'status': 'paid',
                'items': [{'product_id': product_ids[0], 'quantity': 2, 'unit_price': 1000.00}]
            },
            {
                'customer_id': customer_ids[1],
                'invoice_date': (datetime.now() - timedelta(days=15)).strftime('%Y-%m-%d'),
                'due_date': (datetime.now() + timedelta(days=15)).strftime('%Y-%m-%d'),
                'status': 'sent',
                'items': [{'product_id': product_ids[1], 'quantity': 1, 'unit_price': 2000.00}]
            },
            {
                'customer_id': customer_ids[2],
                'invoice_date': datetime.now().strftime('%Y-%m-%d'),
                'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                'status': 'draft',
                'items': [{'product_id': product_ids[2], 'quantity': 3, 'unit_price': 500.00}]
            }
        ]
        
        invoice_ids = []
        for invoice_data in invoices_data:
            response = client.post('/api/invoices', json=invoice_data, headers=auth_headers)
            invoice_ids.append(response.get_json()['invoice']['id'])
        
        # Create payments for paid invoices
        with client.application.app_context():
            payment = Payment(
                invoice_id=invoice_ids[0],
                amount=2000.00,
                payment_method='paystack',
                payment_reference='test_payment_ref',
                status='completed',
                payment_date=datetime.now() - timedelta(days=25)
            )
            db.session.add(payment)
            db.session.commit()
        
        return customer_ids, product_ids, invoice_ids
    
    def test_get_dashboard_overview_success(self, client, auth_headers):
        """Test successful retrieval of dashboard overview."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/overview', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        # Check that all required metrics are present
        assert 'total_revenue' in data
        assert 'revenue_this_month' in data
        assert 'total_customers' in data
        assert 'new_customers_this_month' in data
        assert 'total_products' in data
        assert 'low_stock_products' in data
        assert 'total_invoices' in data
        assert 'paid_invoices' in data
        assert 'pending_invoices' in data
        assert 'overdue_invoices' in data
        assert 'outstanding_amount' in data
        
        # Verify some expected values
        assert data['total_customers'] == 3
        assert data['total_products'] == 3
        assert data['low_stock_products'] == 1  # Product 3 has low stock
        assert data['total_invoices'] == 3
    
    def test_get_dashboard_overview_empty_data(self, client, auth_headers):
        """Test dashboard overview with no data."""
        response = client.get('/api/dashboard/overview', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        # All metrics should be zero or empty
        assert data['total_revenue'] == 0
        assert data['total_customers'] == 0
        assert data['total_products'] == 0
        assert data['total_invoices'] == 0
    
    def test_get_revenue_analytics_success(self, client, auth_headers):
        """Test successful retrieval of revenue analytics."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/revenue-analytics', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert 'monthly_revenue' in data
        assert 'revenue_by_customer' in data
        assert 'revenue_by_product' in data
        assert 'payment_methods' in data
        
        # Check that monthly revenue is a list
        assert isinstance(data['monthly_revenue'], list)
        
        # Check that revenue by customer contains data
        assert isinstance(data['revenue_by_customer'], list)
        
        # Check that revenue by product contains data
        assert isinstance(data['revenue_by_product'], list)
    
    def test_get_revenue_analytics_with_date_range(self, client, auth_headers):
        """Test revenue analytics with specific date range."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        start_date = (datetime.now() - timedelta(days=60)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')
        
        response = client.get(f'/api/dashboard/revenue-analytics?start_date={start_date}&end_date={end_date}', 
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert 'monthly_revenue' in data
        assert 'revenue_by_customer' in data
        assert 'revenue_by_product' in data
    
    def test_get_customer_analytics_success(self, client, auth_headers):
        """Test successful retrieval of customer analytics."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/customer-analytics', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert 'customer_growth' in data
        assert 'top_customers' in data
        assert 'customer_status_distribution' in data
        assert 'customer_acquisition_sources' in data
        
        # Check that customer growth is a list
        assert isinstance(data['customer_growth'], list)
        
        # Check that top customers is a list
        assert isinstance(data['top_customers'], list)
        
        # Check that status distribution contains expected keys
        assert isinstance(data['customer_status_distribution'], dict)
    
    def test_get_product_analytics_success(self, client, auth_headers):
        """Test successful retrieval of product analytics."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/product-analytics', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert 'top_selling_products' in data
        assert 'low_stock_products' in data
        assert 'product_categories' in data
        assert 'inventory_value' in data
        
        # Check that top selling products is a list
        assert isinstance(data['top_selling_products'], list)
        
        # Check that low stock products is a list
        assert isinstance(data['low_stock_products'], list)
        assert len(data['low_stock_products']) == 1  # We have one low stock product
        
        # Check that inventory value is a number
        assert isinstance(data['inventory_value'], (int, float))
        assert data['inventory_value'] > 0
    
    def test_get_invoice_analytics_success(self, client, auth_headers):
        """Test successful retrieval of invoice analytics."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/invoice-analytics', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert 'invoice_status_distribution' in data
        assert 'monthly_invoices' in data
        assert 'average_invoice_value' in data
        assert 'payment_timeline' in data
        
        # Check that status distribution contains expected statuses
        status_dist = data['invoice_status_distribution']
        assert isinstance(status_dist, dict)
        
        # Check that monthly invoices is a list
        assert isinstance(data['monthly_invoices'], list)
        
        # Check that average invoice value is a number
        assert isinstance(data['average_invoice_value'], (int, float))
    
    def test_get_recent_activities_success(self, client, auth_headers):
        """Test successful retrieval of recent activities."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/recent-activities', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert 'activities' in data
        assert isinstance(data['activities'], list)
        
        # Activities should be sorted by date (most recent first)
        if len(data['activities']) > 1:
            for i in range(len(data['activities']) - 1):
                current_date = datetime.fromisoformat(data['activities'][i]['date'].replace('Z', '+00:00'))
                next_date = datetime.fromisoformat(data['activities'][i + 1]['date'].replace('Z', '+00:00'))
                assert current_date >= next_date
    
    def test_get_recent_activities_with_limit(self, client, auth_headers):
        """Test recent activities with limit parameter."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/recent-activities?limit=2', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert 'activities' in data
        assert len(data['activities']) <= 2
    
    def test_export_dashboard_data_success(self, client, auth_headers):
        """Test successful export of dashboard data."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/export?format=json', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        # Check that all major sections are included
        assert 'overview' in data
        assert 'revenue_analytics' in data
        assert 'customer_analytics' in data
        assert 'product_analytics' in data
        assert 'invoice_analytics' in data
        assert 'export_timestamp' in data
    
    def test_export_dashboard_data_pdf(self, client, auth_headers):
        """Test export of dashboard data as PDF."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/export?format=pdf', headers=auth_headers)
        
        assert response.status_code == 200
        assert response.content_type == 'application/pdf'
    
    def test_export_dashboard_data_excel(self, client, auth_headers):
        """Test export of dashboard data as Excel."""
        self.setup_comprehensive_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/export?format=excel', headers=auth_headers)
        
        assert response.status_code == 200
        assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in response.content_type
    
    def test_dashboard_unauthorized_access(self, client):
        """Test accessing dashboard routes without authentication."""
        response = client.get('/api/dashboard/overview')
        assert response.status_code == 401
        
        response = client.get('/api/dashboard/revenue-analytics')
        assert response.status_code == 401
        
        response = client.get('/api/dashboard/customer-analytics')
        assert response.status_code == 401
        
        response = client.get('/api/dashboard/product-analytics')
        assert response.status_code == 401
        
        response = client.get('/api/dashboard/invoice-analytics')
        assert response.status_code == 401
        
        response = client.get('/api/dashboard/recent-activities')
        assert response.status_code == 401
        
        response = client.get('/api/dashboard/export')
        assert response.status_code == 401

