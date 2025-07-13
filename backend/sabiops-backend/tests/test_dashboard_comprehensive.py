import pytest
import json
from datetime import datetime, timedelta
import pytz
import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

class TestDashboardComprehensive:
    """Comprehensive test cases for dashboard functionality."""
    
    def setup_test_data(self, client, auth_headers):
        """Setup comprehensive test data for dashboard tests."""
        # Create customers
        customers_data = [
            {'name': 'Customer A', 'email': 'a@example.com', 'phone': '+2348012345678', 'address': '123 Lagos St'},
            {'name': 'Customer B', 'email': 'b@example.com', 'phone': '+2348012345679', 'address': '456 Abuja St'},
            {'name': 'Customer C', 'email': 'c@example.com', 'phone': '+2348012345680', 'address': '789 Kano St'}
        ]
        
        customer_ids = []
        for customer_data in customers_data:
            response = client.post('/api/customers', json=customer_data, headers=auth_headers)
            if response.status_code == 201:
                customer_ids.append(response.get_json()['customer']['id'])
        
        # Create products
        products_data = [
            {'name': 'Product 1', 'sku': 'PROD-001', 'price': 1000.00, 'quantity': 50, 'low_stock_threshold': 10},
            {'name': 'Product 2', 'sku': 'PROD-002', 'price': 2000.00, 'quantity': 30, 'low_stock_threshold': 15},
            {'name': 'Product 3', 'sku': 'PROD-003', 'price': 500.00, 'quantity': 5, 'low_stock_threshold': 10}  # Low stock
        ]
        
        product_ids = []
        for product_data in products_data:
            response = client.post('/api/products', json=product_data, headers=auth_headers)
            if response.status_code == 201:
                product_ids.append(response.get_json()['product']['id'])
        
        # Create invoices with different statuses and dates
        utc = pytz.UTC
        current_date = datetime.now(utc)
        
        invoices_data = [
            {
                'customer_id': customer_ids[0] if customer_ids else 1,
                'invoice_date': (current_date - timedelta(days=30)).strftime('%Y-%m-%d'),
                'due_date': (current_date - timedelta(days=1)).strftime('%Y-%m-%d'),
                'status': 'paid',
                'items': [{'product_id': product_ids[0] if product_ids else 1, 'quantity': 2, 'unit_price': 1000.00}]
            },
            {
                'customer_id': customer_ids[1] if customer_ids else 2,
                'invoice_date': (current_date - timedelta(days=15)).strftime('%Y-%m-%d'),
                'due_date': (current_date + timedelta(days=15)).strftime('%Y-%m-%d'),
                'status': 'sent',
                'items': [{'product_id': product_ids[1] if product_ids else 2, 'quantity': 1, 'unit_price': 2000.00}]
            },
            {
                'customer_id': customer_ids[2] if customer_ids else 3,
                'invoice_date': current_date.strftime('%Y-%m-%d'),
                'due_date': (current_date + timedelta(days=30)).strftime('%Y-%m-%d'),
                'status': 'draft',
                'items': [{'product_id': product_ids[2] if product_ids else 3, 'quantity': 4, 'unit_price': 500.00}]
            }
        ]
        
        invoice_ids = []
        for invoice_data in invoices_data:
            response = client.post('/api/invoices', json=invoice_data, headers=auth_headers)
            if response.status_code == 201:
                invoice_ids.append(response.get_json()['invoice']['id'])
        
        # Create payments
        payments_data = [
            {
                'invoice_id': invoice_ids[0] if invoice_ids else 1,
                'amount': 2000.00,
                'payment_method': 'bank_transfer',
                'status': 'completed'
            }
        ]
        
        for payment_data in payments_data:
            client.post('/api/payments', json=payment_data, headers=auth_headers)
        
        return {
            'customer_ids': customer_ids,
            'product_ids': product_ids,
            'invoice_ids': invoice_ids
        }
    
    def test_dashboard_overview_success(self, client, auth_headers):
        """Test successful dashboard overview retrieval."""
        # Setup test data
        self.setup_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/overview', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        
        overview_data = data['data']
        
        # Check revenue section
        assert 'revenue' in overview_data
        assert 'total' in overview_data['revenue']
        assert 'this_month' in overview_data['revenue']
        assert 'outstanding' in overview_data['revenue']
        
        # Check customers section
        assert 'customers' in overview_data
        assert 'total' in overview_data['customers']
        assert 'new_this_month' in overview_data['customers']
        
        # Check products section
        assert 'products' in overview_data
        assert 'total' in overview_data['products']
        assert 'low_stock' in overview_data['products']
        
        # Check invoices section
        assert 'invoices' in overview_data
        assert 'overdue' in overview_data['invoices']
    
    def test_dashboard_overview_empty_data(self, client, auth_headers):
        """Test dashboard overview with no data."""
        response = client.get('/api/dashboard/overview', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        
        overview_data = data['data']
        
        # All counts should be 0 for new user
        assert overview_data['revenue']['total'] == 0
        assert overview_data['revenue']['this_month'] == 0
        assert overview_data['revenue']['outstanding'] == 0
        assert overview_data['customers']['total'] == 0
        assert overview_data['customers']['new_this_month'] == 0
        assert overview_data['products']['total'] == 0
        assert overview_data['products']['low_stock'] == 0
        assert overview_data['invoices']['overdue'] == 0
    
    def test_dashboard_overview_unauthorized(self, client):
        """Test dashboard overview without authentication."""
        response = client.get('/api/dashboard/overview')
        
        assert response.status_code == 401
    
    def test_revenue_chart_success(self, client, auth_headers):
        """Test successful revenue chart data retrieval."""
        # Setup test data
        self.setup_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/revenue-chart', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        assert 'chart_data' in data['data']
        
        chart_data = data['data']['chart_data']
        assert isinstance(chart_data, list)
        
        # Should have data for 12 months
        assert len(chart_data) <= 12
        
        # Each data point should have period and revenue
        for point in chart_data:
            assert 'period' in point
            assert 'revenue' in point
            assert isinstance(point['revenue'], (int, float))
    
    def test_revenue_chart_with_period_parameter(self, client, auth_headers):
        """Test revenue chart with different period parameters."""
        periods = ['12months', '6months', '3months']
        
        for period in periods:
            response = client.get(f'/api/dashboard/revenue-chart?period={period}', headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['success'] is True
            assert 'chart_data' in data['data']
    
    def test_revenue_chart_unauthorized(self, client):
        """Test revenue chart without authentication."""
        response = client.get('/api/dashboard/revenue-chart')
        
        assert response.status_code == 401
    
    def test_top_customers_success(self, client, auth_headers):
        """Test successful top customers retrieval."""
        # Setup test data
        self.setup_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/top-customers', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        assert 'top_customers' in data['data']
        
        top_customers = data['data']['top_customers']
        assert isinstance(top_customers, list)
        
        # Each customer should have required fields
        for customer in top_customers:
            assert 'name' in customer
            assert 'total_revenue' in customer
            assert 'invoice_count' in customer
            assert isinstance(customer['total_revenue'], (int, float))
            assert isinstance(customer['invoice_count'], int)
    
    def test_top_customers_with_limit(self, client, auth_headers):
        """Test top customers with limit parameter."""
        # Setup test data
        self.setup_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/top-customers?limit=2', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        
        top_customers = data['data']['top_customers']
        assert len(top_customers) <= 2
    
    def test_top_customers_empty_data(self, client, auth_headers):
        """Test top customers with no data."""
        response = client.get('/api/dashboard/top-customers', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['data']['top_customers'] == []
    
    def test_top_customers_unauthorized(self, client):
        """Test top customers without authentication."""
        response = client.get('/api/dashboard/top-customers')
        
        assert response.status_code == 401
    
    def test_top_products_success(self, client, auth_headers):
        """Test successful top products retrieval."""
        # Setup test data
        self.setup_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/top-products', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        assert 'top_products' in data['data']
        
        top_products = data['data']['top_products']
        assert isinstance(top_products, list)
        
        # Each product should have required fields
        for product in top_products:
            assert 'id' in product
            assert 'name' in product
            assert 'total_revenue' in product
            assert 'total_quantity' in product
            assert isinstance(product['total_revenue'], (int, float))
            assert isinstance(product['total_quantity'], int)
    
    def test_top_products_with_limit(self, client, auth_headers):
        """Test top products with limit parameter."""
        # Setup test data
        self.setup_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/top-products?limit=3', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        
        top_products = data['data']['top_products']
        assert len(top_products) <= 3
    
    def test_top_products_unauthorized(self, client):
        """Test top products without authentication."""
        response = client.get('/api/dashboard/top-products')
        
        assert response.status_code == 401
    
    def test_recent_activities_success(self, client, auth_headers):
        """Test successful recent activities retrieval."""
        # Setup test data
        self.setup_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/recent-activities', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        assert 'activities' in data['data']
        
        activities = data['data']['activities']
        assert isinstance(activities, list)
        
        # Each activity should have required fields
        for activity in activities:
            assert 'type' in activity
            assert 'description' in activity
            assert 'date' in activity
            assert 'amount' in activity
            assert 'status' in activity
            assert activity['type'] in ['invoice', 'payment', 'customer']
    
    def test_recent_activities_with_limit(self, client, auth_headers):
        """Test recent activities with limit parameter."""
        # Setup test data
        self.setup_test_data(client, auth_headers)
        
        response = client.get('/api/dashboard/recent-activities?limit=5', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        
        activities = data['data']['activities']
        assert len(activities) <= 5
    
    def test_recent_activities_unauthorized(self, client):
        """Test recent activities without authentication."""
        response = client.get('/api/dashboard/recent-activities')
        
        assert response.status_code == 401
    
    def test_dashboard_data_consistency(self, client, auth_headers):
        """Test that dashboard data is consistent across endpoints."""
        # Setup test data
        test_data = self.setup_test_data(client, auth_headers)
        
        # Get overview data
        overview_response = client.get('/api/dashboard/overview', headers=auth_headers)
        overview_data = overview_response.get_json()['data']
        
        # Get top customers
        customers_response = client.get('/api/dashboard/top-customers', headers=auth_headers)
        customers_data = customers_response.get_json()['data']
        
        # Get top products
        products_response = client.get('/api/dashboard/top-products', headers=auth_headers)
        products_data = products_response.get_json()['data']
        
        # Verify consistency
        # Total customers should match between overview and customers list
        if customers_data['top_customers']:
            assert overview_data['customers']['total'] >= len(customers_data['top_customers'])
        
        # Total products should match between overview and products list
        if products_data['top_products']:
            assert overview_data['products']['total'] >= len(products_data['top_products'])
    
    def test_dashboard_timezone_handling(self, client, auth_headers):
        """Test that dashboard handles timezones correctly."""
        # Create data with specific dates
        utc = pytz.UTC
        current_date = datetime.now(utc)
        
        # Create customer this month
        customer_response = client.post('/api/customers', json={
            'name': 'Timezone Customer',
            'email': 'timezone@example.com',
            'phone': '+2348012345699'
        }, headers=auth_headers)
        
        # Get overview
        response = client.get('/api/dashboard/overview', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        # Should count the customer created this month
        assert data['data']['customers']['new_this_month'] >= 1
    
    def test_dashboard_performance(self, client, auth_headers):
        """Test dashboard performance with multiple requests."""
        import time
        
        # Make multiple concurrent requests to test performance
        start_time = time.time()
        
        responses = []
        for _ in range(5):
            response = client.get('/api/dashboard/overview', headers=auth_headers)
            responses.append(response)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
        
        # Should complete within reasonable time (5 seconds for 5 requests)
        assert total_time < 5.0, f"Dashboard requests took too long: {total_time} seconds"
    
    def test_dashboard_error_handling(self, client, auth_headers):
        """Test dashboard error handling."""
        # Test with invalid parameters
        response = client.get('/api/dashboard/revenue-chart?period=invalid', headers=auth_headers)
        assert response.status_code == 200  # Should handle gracefully
        
        response = client.get('/api/dashboard/top-customers?limit=-1', headers=auth_headers)
        assert response.status_code == 200  # Should handle gracefully
        
        response = client.get('/api/dashboard/top-products?limit=abc', headers=auth_headers)
        assert response.status_code == 200  # Should handle gracefully

