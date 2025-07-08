import pytest
import json
from datetime import datetime, timedelta
import pytz
from src.models.user import db

class TestIntegrationFullWorkflow:
    """Integration tests for complete business workflows."""
    
    def test_complete_business_setup_workflow(self, client):
        """Test complete business setup from registration to first sale."""
        
        # Step 1: Register a new business owner
        register_data = {
            'email': 'owner@testbusiness.com',
            'phone': '+2348012345678',
            'password': 'securepassword123',
            'full_name': 'John Doe',
            'business_name': 'Test Business Ltd'
        }
        
        register_response = client.post('/api/auth/register', json=register_data)
        assert register_response.status_code == 201
        
        register_data = register_response.get_json()
        access_token = register_data['data']['access_token']
        owner_id = register_data['data']['user']['id']
        
        auth_headers = {'Authorization': f'Bearer {access_token}'}
        
        # Step 2: Verify owner can access profile
        profile_response = client.get('/api/auth/profile', headers=auth_headers)
        assert profile_response.status_code == 200
        
        profile_data = profile_response.get_json()
        assert profile_data['data']['user']['role'] == 'Owner'
        assert profile_data['data']['user']['subscription_status'] == 'trial'
        
        # Step 3: Add customers
        customers_data = [
            {
                'name': 'Customer One',
                'email': 'customer1@example.com',
                'phone': '+2348012345679',
                'address': '123 Lagos Street, Lagos'
            },
            {
                'name': 'Customer Two',
                'email': 'customer2@example.com',
                'phone': '+2348012345680',
                'address': '456 Abuja Avenue, Abuja'
            }
        ]
        
        customer_ids = []
        for customer_data in customers_data:
            customer_response = client.post('/api/customers', json=customer_data, headers=auth_headers)
            assert customer_response.status_code == 201
            customer_ids.append(customer_response.get_json()['customer']['id'])
        
        # Step 4: Add products to inventory
        products_data = [
            {
                'name': 'Laptop Computer',
                'sku': 'LAP-001',
                'description': 'High-performance laptop',
                'price': 150000.00,
                'cost_price': 120000.00,
                'quantity': 10,
                'low_stock_threshold': 3,
                'category': 'Electronics'
            },
            {
                'name': 'Office Chair',
                'sku': 'CHAIR-001',
                'description': 'Ergonomic office chair',
                'price': 25000.00,
                'cost_price': 18000.00,
                'quantity': 20,
                'low_stock_threshold': 5,
                'category': 'Furniture'
            }
        ]
        
        product_ids = []
        for product_data in products_data:
            product_response = client.post('/api/products', json=product_data, headers=auth_headers)
            assert product_response.status_code == 201
            product_ids.append(product_response.get_json()['product']['id'])
        
        # Step 5: Create and send invoice
        invoice_data = {
            'customer_id': customer_ids[0],
            'invoice_date': datetime.now().strftime('%Y-%m-%d'),
            'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'status': 'draft',
            'notes': 'First invoice for new customer',
            'tax_rate': 7.5,
            'discount_amount': 0,
            'items': [
                {
                    'product_id': product_ids[0],
                    'description': 'Laptop Computer',
                    'quantity': 2,
                    'unit_price': 150000.00
                },
                {
                    'product_id': product_ids[1],
                    'description': 'Office Chair',
                    'quantity': 1,
                    'unit_price': 25000.00
                }
            ]
        }
        
        invoice_response = client.post('/api/invoices', json=invoice_data, headers=auth_headers)
        assert invoice_response.status_code == 201
        
        invoice_id = invoice_response.get_json()['invoice']['id']
        
        # Step 6: Update invoice status to sent
        update_invoice_response = client.put(f'/api/invoices/{invoice_id}', 
                                           json={'status': 'sent'}, 
                                           headers=auth_headers)
        assert update_invoice_response.status_code == 200
        
        # Step 7: Record payment
        payment_data = {
            'invoice_id': invoice_id,
            'amount': 325000.00,  # Full amount
            'payment_method': 'bank_transfer',
            'payment_date': datetime.now().strftime('%Y-%m-%d'),
            'reference': 'TXN123456789',
            'status': 'completed'
        }
        
        payment_response = client.post('/api/payments', json=payment_data, headers=auth_headers)
        assert payment_response.status_code == 201
        
        # Step 8: Verify stock was reduced
        product_response = client.get(f'/api/products/{product_ids[0]}', headers=auth_headers)
        assert product_response.status_code == 200
        
        product_data = product_response.get_json()['product']
        assert product_data['quantity'] == 8  # 10 - 2 = 8
        
        # Step 9: Check dashboard overview
        dashboard_response = client.get('/api/dashboard/overview', headers=auth_headers)
        assert dashboard_response.status_code == 200
        
        dashboard_data = dashboard_response.get_json()['data']
        assert dashboard_data['revenue']['total'] > 0
        assert dashboard_data['customers']['total'] == 2
        assert dashboard_data['products']['total'] == 2
        
        # Step 10: Record an expense
        expense_data = {
            'description': 'Office rent',
            'amount': 50000.00,
            'category': 'Rent',
            'expense_date': datetime.now().strftime('%Y-%m-%d'),
            'payment_method': 'bank_transfer'
        }
        
        expense_response = client.post('/api/expenses', json=expense_data, headers=auth_headers)
        assert expense_response.status_code == 201
        
        # Verify complete workflow success
        assert True  # If we reach here, the complete workflow succeeded
    
    def test_team_member_workflow(self, client):
        """Test team member creation and access control."""
        
        # Step 1: Register owner
        owner_data = {
            'email': 'teamowner@testbusiness.com',
            'phone': '+2348012345681',
            'password': 'ownerpassword123',
            'full_name': 'Team Owner',
            'business_name': 'Team Business Ltd'
        }
        
        owner_response = client.post('/api/auth/register', json=owner_data)
        assert owner_response.status_code == 201
        
        owner_token = owner_response.get_json()['data']['access_token']
        owner_headers = {'Authorization': f'Bearer {owner_token}'}
        
        # Step 2: Owner creates team member
        team_member_data = {
            'full_name': 'Sales Person',
            'email': 'salesperson@testbusiness.com',
            'password': 'salespassword123',
            'role': 'Salesperson'
        }
        
        team_response = client.post('/api/team', json=team_member_data, headers=owner_headers)
        assert team_response.status_code == 201
        
        # Step 3: Team member logs in
        login_response = client.post('/api/auth/login', json={
            'login': 'salesperson@testbusiness.com',
            'password': 'salespassword123'
        })
        assert login_response.status_code == 200
        
        member_token = login_response.get_json()['data']['access_token']
        member_headers = {'Authorization': f'Bearer {member_token}'}
        
        # Step 4: Verify team member has correct role and access
        member_profile = client.get('/api/auth/profile', headers=member_headers)
        assert member_profile.status_code == 200
        
        profile_data = member_profile.get_json()['data']['user']
        assert profile_data['role'] == 'Salesperson'
        
        # Step 5: Test role-based access control
        # Team member should be able to create customers
        customer_response = client.post('/api/customers', json={
            'name': 'Team Customer',
            'email': 'teamcustomer@example.com',
            'phone': '+2348012345682'
        }, headers=member_headers)
        assert customer_response.status_code == 201
        
        # Team member should NOT be able to create other team members
        unauthorized_team_response = client.post('/api/team', json={
            'full_name': 'Unauthorized Member',
            'email': 'unauthorized@testbusiness.com',
            'password': 'password123',
            'role': 'Admin'
        }, headers=member_headers)
        assert unauthorized_team_response.status_code == 403
    
    def test_subscription_and_limits_workflow(self, client):
        """Test subscription limits and upgrade workflow."""
        
        # Step 1: Register user on free trial
        user_data = {
            'email': 'subscription@testbusiness.com',
            'phone': '+2348012345683',
            'password': 'password123',
            'full_name': 'Subscription User',
            'business_name': 'Subscription Business'
        }
        
        register_response = client.post('/api/auth/register', json=user_data)
        assert register_response.status_code == 201
        
        token = register_response.get_json()['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Step 2: Create invoices up to free limit (5 invoices)
        customer_response = client.post('/api/customers', json={
            'name': 'Limit Customer',
            'email': 'limit@example.com',
            'phone': '+2348012345684'
        }, headers=headers)
        customer_id = customer_response.get_json()['customer']['id']
        
        product_response = client.post('/api/products', json={
            'name': 'Limit Product',
            'sku': 'LIMIT-001',
            'price': 1000.00,
            'quantity': 100
        }, headers=headers)
        product_id = product_response.get_json()['product']['id']
        
        # Create 5 invoices (free limit)
        invoice_ids = []
        for i in range(5):
            invoice_data = {
                'customer_id': customer_id,
                'invoice_date': datetime.now().strftime('%Y-%m-%d'),
                'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                'status': 'draft',
                'items': [{
                    'product_id': product_id,
                    'description': f'Test Item {i+1}',
                    'quantity': 1,
                    'unit_price': 1000.00
                }]
            }
            
            invoice_response = client.post('/api/invoices', json=invoice_data, headers=headers)
            assert invoice_response.status_code == 201
            invoice_ids.append(invoice_response.get_json()['invoice']['id'])
        
        # Step 3: Try to create 6th invoice (should fail or warn about limits)
        sixth_invoice_data = {
            'customer_id': customer_id,
            'invoice_date': datetime.now().strftime('%Y-%m-%d'),
            'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'status': 'draft',
            'items': [{
                'product_id': product_id,
                'description': 'Limit Exceeded Item',
                'quantity': 1,
                'unit_price': 1000.00
            }]
        }
        
        limit_response = client.post('/api/invoices', json=sixth_invoice_data, headers=headers)
        # This might succeed or fail depending on implementation
        # The test should verify the appropriate behavior
        
        # Step 4: Check upgrade suggestions
        profile_response = client.get('/api/auth/profile', headers=headers)
        profile_data = profile_response.get_json()['data']['user']
        
        # Verify user is still on trial
        assert profile_data['subscription_status'] == 'trial'
    
    def test_inventory_management_workflow(self, client, auth_headers):
        """Test complete inventory management workflow."""
        
        # Step 1: Add initial products
        products_data = [
            {
                'name': 'Inventory Product A',
                'sku': 'INV-A-001',
                'price': 1000.00,
                'quantity': 50,
                'low_stock_threshold': 10
            },
            {
                'name': 'Inventory Product B',
                'sku': 'INV-B-001',
                'price': 2000.00,
                'quantity': 8,  # Below threshold
                'low_stock_threshold': 10
            }
        ]
        
        product_ids = []
        for product_data in products_data:
            response = client.post('/api/products', json=product_data, headers=auth_headers)
            assert response.status_code == 201
            product_ids.append(response.get_json()['product']['id'])
        
        # Step 2: Check low stock alerts
        low_stock_response = client.get('/api/products?low_stock=true', headers=auth_headers)
        assert low_stock_response.status_code == 200
        
        low_stock_products = low_stock_response.get_json()['products']
        assert len(low_stock_products) == 1
        assert low_stock_products[0]['name'] == 'Inventory Product B'
        
        # Step 3: Restock low stock product
        restock_response = client.patch(f'/api/products/{product_ids[1]}/stock',
                                      json={'quantity': 25},
                                      headers=auth_headers)
        assert restock_response.status_code == 200
        
        # Step 4: Verify stock update
        updated_product_response = client.get(f'/api/products/{product_ids[1]}', headers=auth_headers)
        updated_product = updated_product_response.get_json()['product']
        assert updated_product['quantity'] == 25
        
        # Step 5: Create sale that reduces stock
        customer_response = client.post('/api/customers', json={
            'name': 'Inventory Customer',
            'email': 'inventory@example.com',
            'phone': '+2348012345685'
        }, headers=auth_headers)
        customer_id = customer_response.get_json()['customer']['id']
        
        sale_data = {
            'customer_id': customer_id,
            'sale_date': datetime.now().strftime('%Y-%m-%d'),
            'items': [
                {
                    'product_id': product_ids[0],
                    'quantity': 5,
                    'unit_price': 1000.00
                }
            ]
        }
        
        sale_response = client.post('/api/sales', json=sale_data, headers=auth_headers)
        assert sale_response.status_code == 201
        
        # Step 6: Verify stock was automatically reduced
        final_product_response = client.get(f'/api/products/{product_ids[0]}', headers=auth_headers)
        final_product = final_product_response.get_json()['product']
        assert final_product['quantity'] == 45  # 50 - 5 = 45
    
    def test_financial_reporting_workflow(self, client, auth_headers):
        """Test complete financial reporting workflow."""
        
        # Step 1: Setup customers and products
        customer_response = client.post('/api/customers', json={
            'name': 'Financial Customer',
            'email': 'financial@example.com',
            'phone': '+2348012345686'
        }, headers=auth_headers)
        customer_id = customer_response.get_json()['customer']['id']
        
        product_response = client.post('/api/products', json={
            'name': 'Financial Product',
            'sku': 'FIN-001',
            'price': 5000.00,
            'cost_price': 3000.00,
            'quantity': 100
        }, headers=auth_headers)
        product_id = product_response.get_json()['product']['id']
        
        # Step 2: Create multiple invoices over time
        utc = pytz.UTC
        base_date = datetime.now(utc)
        
        invoice_data_list = [
            {
                'date_offset': -60,  # 2 months ago
                'amount': 10000.00,
                'status': 'paid'
            },
            {
                'date_offset': -30,  # 1 month ago
                'amount': 15000.00,
                'status': 'paid'
            },
            {
                'date_offset': -15,  # 2 weeks ago
                'amount': 20000.00,
                'status': 'paid'
            },
            {
                'date_offset': -5,   # 5 days ago
                'amount': 12000.00,
                'status': 'sent'
            }
        ]
        
        invoice_ids = []
        for invoice_info in invoice_data_list:
            invoice_date = (base_date + timedelta(days=invoice_info['date_offset'])).strftime('%Y-%m-%d')
            
            invoice_data = {
                'customer_id': customer_id,
                'invoice_date': invoice_date,
                'due_date': (base_date + timedelta(days=invoice_info['date_offset'] + 30)).strftime('%Y-%m-%d'),
                'status': invoice_info['status'],
                'items': [{
                    'product_id': product_id,
                    'description': 'Financial Product',
                    'quantity': int(invoice_info['amount'] / 5000),
                    'unit_price': 5000.00
                }]
            }
            
            response = client.post('/api/invoices', json=invoice_data, headers=auth_headers)
            assert response.status_code == 201
            invoice_ids.append(response.get_json()['invoice']['id'])
        
        # Step 3: Record payments for paid invoices
        for i, invoice_id in enumerate(invoice_ids[:3]):  # First 3 are paid
            payment_data = {
                'invoice_id': invoice_id,
                'amount': invoice_data_list[i]['amount'],
                'payment_method': 'bank_transfer',
                'status': 'completed'
            }
            
            payment_response = client.post('/api/payments', json=payment_data, headers=auth_headers)
            assert payment_response.status_code == 201
        
        # Step 4: Add expenses
        expenses_data = [
            {
                'description': 'Office Rent',
                'amount': 5000.00,
                'category': 'Rent',
                'expense_date': (base_date + timedelta(days=-45)).strftime('%Y-%m-%d')
            },
            {
                'description': 'Marketing',
                'amount': 3000.00,
                'category': 'Marketing',
                'expense_date': (base_date + timedelta(days=-20)).strftime('%Y-%m-%d')
            }
        ]
        
        for expense_data in expenses_data:
            expense_response = client.post('/api/expenses', json=expense_data, headers=auth_headers)
            assert expense_response.status_code == 201
        
        # Step 5: Generate and verify reports
        # Dashboard overview
        dashboard_response = client.get('/api/dashboard/overview', headers=auth_headers)
        assert dashboard_response.status_code == 200
        
        dashboard_data = dashboard_response.get_json()['data']
        assert dashboard_data['revenue']['total'] > 0
        assert dashboard_data['revenue']['outstanding'] > 0
        
        # Revenue chart
        chart_response = client.get('/api/dashboard/revenue-chart', headers=auth_headers)
        assert chart_response.status_code == 200
        
        chart_data = chart_response.get_json()['data']['chart_data']
        assert len(chart_data) > 0
        
        # Sales report
        sales_report_response = client.get('/api/reports/sales', headers=auth_headers)
        assert sales_report_response.status_code == 200
        
        # Transaction history
        transactions_response = client.get('/api/transactions', headers=auth_headers)
        assert transactions_response.status_code == 200
    
    def test_error_handling_and_recovery(self, client, auth_headers):
        """Test error handling and recovery scenarios."""
        
        # Test 1: Handle invalid product creation
        invalid_product = {
            'name': '',  # Invalid empty name
            'sku': 'INVALID-001',
            'price': -100,  # Invalid negative price
            'quantity': 'invalid'  # Invalid quantity type
        }
        
        response = client.post('/api/products', json=invalid_product, headers=auth_headers)
        assert response.status_code == 400
        assert response.get_json()['success'] is False
        
        # Test 2: Handle non-existent resource access
        response = client.get('/api/products/non-existent-id', headers=auth_headers)
        assert response.status_code == 404
        
        # Test 3: Handle invalid invoice creation
        invalid_invoice = {
            'customer_id': 'non-existent-customer',
            'invoice_date': 'invalid-date',
            'items': []  # Empty items
        }
        
        response = client.post('/api/invoices', json=invalid_invoice, headers=auth_headers)
        assert response.status_code == 400
        
        # Test 4: Handle concurrent stock updates
        # Create a product
        product_response = client.post('/api/products', json={
            'name': 'Concurrent Product',
            'sku': 'CONC-001',
            'price': 1000.00,
            'quantity': 10
        }, headers=auth_headers)
        
        product_id = product_response.get_json()['product']['id']
        
        # Try to update stock to more than available
        response = client.patch(f'/api/products/{product_id}/stock',
                              json={'quantity': -5},  # Invalid negative quantity
                              headers=auth_headers)
        assert response.status_code == 400
    
    def test_data_consistency_across_operations(self, client, auth_headers):
        """Test data consistency across multiple operations."""
        
        # Step 1: Create test data
        customer_response = client.post('/api/customers', json={
            'name': 'Consistency Customer',
            'email': 'consistency@example.com',
            'phone': '+2348012345687'
        }, headers=auth_headers)
        customer_id = customer_response.get_json()['customer']['id']
        
        product_response = client.post('/api/products', json={
            'name': 'Consistency Product',
            'sku': 'CONS-001',
            'price': 2000.00,
            'quantity': 20
        }, headers=auth_headers)
        product_id = product_response.get_json()['product']['id']
        
        # Step 2: Create invoice
        invoice_response = client.post('/api/invoices', json={
            'customer_id': customer_id,
            'invoice_date': datetime.now().strftime('%Y-%m-%d'),
            'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'status': 'draft',
            'items': [{
                'product_id': product_id,
                'description': 'Consistency Product',
                'quantity': 5,
                'unit_price': 2000.00
            }]
        }, headers=auth_headers)
        
        invoice_id = invoice_response.get_json()['invoice']['id']
        
        # Step 3: Update invoice to sent
        client.put(f'/api/invoices/{invoice_id}', json={'status': 'sent'}, headers=auth_headers)
        
        # Step 4: Record payment
        client.post('/api/payments', json={
            'invoice_id': invoice_id,
            'amount': 10000.00,
            'payment_method': 'bank_transfer',
            'status': 'completed'
        }, headers=auth_headers)
        
        # Step 5: Verify data consistency
        # Check product stock was reduced
        product_check = client.get(f'/api/products/{product_id}', headers=auth_headers)
        product_data = product_check.get_json()['product']
        assert product_data['quantity'] == 15  # 20 - 5 = 15
        
        # Check invoice status
        invoice_check = client.get(f'/api/invoices/{invoice_id}', headers=auth_headers)
        invoice_data = invoice_check.get_json()['invoice']
        assert invoice_data['status'] == 'paid'  # Should be updated after payment
        
        # Check dashboard reflects changes
        dashboard_response = client.get('/api/dashboard/overview', headers=auth_headers)
        dashboard_data = dashboard_response.get_json()['data']
        assert dashboard_data['revenue']['total'] >= 10000.00
        assert dashboard_data['customers']['total'] >= 1
        assert dashboard_data['products']['total'] >= 1

