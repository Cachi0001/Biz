import os
import requests
import json
from typing import Dict, Any, Optional
from datetime import datetime

class PaystackService:
    """
    Comprehensive Paystack payment service for handling all payment operations
    """
    
    def __init__(self):
        self.secret_key = os.getenv('PAYSTACK_SECRET_KEY')
        self.public_key = os.getenv('PAYSTACK_PUBLIC_KEY')
        self.base_url = 'https://api.paystack.co'
        
        if not self.secret_key:
            raise ValueError("PAYSTACK_SECRET_KEY environment variable is required")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Paystack API requests"""
        return {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json',
        }
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to Paystack API"""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, params=data)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Paystack API request failed: {str(e)}")
    
    def initialize_transaction(self, email: str, amount: int, reference: str = None, 
                             callback_url: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """
        Initialize a payment transaction
        
        Args:
            email: Customer's email address
            amount: Amount in kobo (multiply naira by 100)
            reference: Unique transaction reference
            callback_url: URL to redirect after payment
            metadata: Additional transaction metadata
        
        Returns:
            Dict containing transaction details and authorization URL
        """
        data = {
            'email': email,
            'amount': amount,
        }
        
        if reference:
            data['reference'] = reference
        if callback_url:
            data['callback_url'] = callback_url
        if metadata:
            data['metadata'] = metadata
        
        response = self._make_request('POST', '/transaction/initialize', data)
        return response
    
    def verify_transaction(self, reference: str) -> Dict[str, Any]:
        """
        Verify a transaction using its reference
        
        Args:
            reference: Transaction reference to verify
        
        Returns:
            Dict containing transaction verification details
        """
        response = self._make_request('GET', f'/transaction/verify/{reference}')
        return response
    
    def list_transactions(self, per_page: int = 50, page: int = 1, 
                         customer: str = None, status: str = None,
                         from_date: str = None, to_date: str = None) -> Dict[str, Any]:
        """
        List transactions with optional filters
        
        Args:
            per_page: Number of transactions per page
            page: Page number
            customer: Customer ID to filter by
            status: Transaction status to filter by
            from_date: Start date (YYYY-MM-DD)
            to_date: End date (YYYY-MM-DD)
        
        Returns:
            Dict containing list of transactions
        """
        params = {
            'perPage': per_page,
            'page': page,
        }
        
        if customer:
            params['customer'] = customer
        if status:
            params['status'] = status
        if from_date:
            params['from'] = from_date
        if to_date:
            params['to'] = to_date
        
        response = self._make_request('GET', '/transaction', params)
        return response
    
    def get_transaction(self, transaction_id: str) -> Dict[str, Any]:
        """
        Get details of a specific transaction
        
        Args:
            transaction_id: ID of the transaction
        
        Returns:
            Dict containing transaction details
        """
        response = self._make_request('GET', f'/transaction/{transaction_id}')
        return response
    
    def create_customer(self, email: str, first_name: str = None, 
                       last_name: str = None, phone: str = None) -> Dict[str, Any]:
        """
        Create a customer on Paystack
        
        Args:
            email: Customer's email address
            first_name: Customer's first name
            last_name: Customer's last name
            phone: Customer's phone number
        
        Returns:
            Dict containing customer details
        """
        data = {'email': email}
        
        if first_name:
            data['first_name'] = first_name
        if last_name:
            data['last_name'] = last_name
        if phone:
            data['phone'] = phone
        
        response = self._make_request('POST', '/customer', data)
        return response
    
    def get_customer(self, email_or_code: str) -> Dict[str, Any]:
        """
        Get customer details by email or customer code
        
        Args:
            email_or_code: Customer email or customer code
        
        Returns:
            Dict containing customer details
        """
        response = self._make_request('GET', f'/customer/{email_or_code}')
        return response
    
    def list_customers(self, per_page: int = 50, page: int = 1) -> Dict[str, Any]:
        """
        List customers
        
        Args:
            per_page: Number of customers per page
            page: Page number
        
        Returns:
            Dict containing list of customers
        """
        params = {
            'perPage': per_page,
            'page': page,
        }
        
        response = self._make_request('GET', '/customer', params)
        return response
    
    def create_plan(self, name: str, amount: int, interval: str, 
                   description: str = None, currency: str = 'NGN') -> Dict[str, Any]:
        """
        Create a subscription plan
        
        Args:
            name: Plan name
            amount: Plan amount in kobo
            interval: Payment interval (daily, weekly, monthly, annually)
            description: Plan description
            currency: Currency code (default: NGN)
        
        Returns:
            Dict containing plan details
        """
        data = {
            'name': name,
            'amount': amount,
            'interval': interval,
            'currency': currency,
        }
        
        if description:
            data['description'] = description
        
        response = self._make_request('POST', '/plan', data)
        return response
    
    def create_subscription(self, customer: str, plan: str, 
                          authorization: str = None) -> Dict[str, Any]:
        """
        Create a subscription
        
        Args:
            customer: Customer code or email
            plan: Plan code
            authorization: Authorization code (if available)
        
        Returns:
            Dict containing subscription details
        """
        data = {
            'customer': customer,
            'plan': plan,
        }
        
        if authorization:
            data['authorization'] = authorization
        
        response = self._make_request('POST', '/subscription', data)
        return response
    
    def get_banks(self, country: str = 'nigeria') -> Dict[str, Any]:
        """
        Get list of supported banks
        
        Args:
            country: Country to get banks for
        
        Returns:
            Dict containing list of banks
        """
        params = {'country': country}
        response = self._make_request('GET', '/bank', params)
        return response
    
    def resolve_account_number(self, account_number: str, bank_code: str) -> Dict[str, Any]:
        """
        Resolve account number to get account details
        
        Args:
            account_number: Account number to resolve
            bank_code: Bank code
        
        Returns:
            Dict containing account details
        """
        params = {
            'account_number': account_number,
            'bank_code': bank_code,
        }
        
        response = self._make_request('GET', '/bank/resolve', params)
        return response
    
    def create_transfer_recipient(self, type: str, name: str, account_number: str, 
                                bank_code: str, currency: str = 'NGN') -> Dict[str, Any]:
        """
        Create a transfer recipient
        
        Args:
            type: Recipient type (nuban for Nigerian bank accounts)
            name: Recipient name
            account_number: Account number
            bank_code: Bank code
            currency: Currency code
        
        Returns:
            Dict containing recipient details
        """
        data = {
            'type': type,
            'name': name,
            'account_number': account_number,
            'bank_code': bank_code,
            'currency': currency,
        }
        
        response = self._make_request('POST', '/transferrecipient', data)
        return response
    
    def initiate_transfer(self, source: str, amount: int, recipient: str, 
                         reason: str = None, reference: str = None) -> Dict[str, Any]:
        """
        Initiate a transfer
        
        Args:
            source: Transfer source (balance)
            amount: Amount in kobo
            recipient: Recipient code
            reason: Transfer reason
            reference: Transfer reference
        
        Returns:
            Dict containing transfer details
        """
        data = {
            'source': source,
            'amount': amount,
            'recipient': recipient,
        }
        
        if reason:
            data['reason'] = reason
        if reference:
            data['reference'] = reference
        
        response = self._make_request('POST', '/transfer', data)
        return response
    
    def get_balance(self) -> Dict[str, Any]:
        """
        Get account balance
        
        Returns:
            Dict containing balance information
        """
        response = self._make_request('GET', '/balance')
        return response
    
    def webhook_signature_valid(self, payload: str, signature: str) -> bool:
        """
        Validate webhook signature
        
        Args:
            payload: Raw webhook payload
            signature: Webhook signature from headers
        
        Returns:
            Boolean indicating if signature is valid
        """
        import hmac
        import hashlib
        
        secret = self.secret_key.encode('utf-8')
        computed_signature = hmac.new(
            secret, 
            payload.encode('utf-8'), 
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature, signature)
    
    def format_amount_to_kobo(self, naira_amount: float) -> int:
        """
        Convert naira amount to kobo
        
        Args:
            naira_amount: Amount in naira
        
        Returns:
            Amount in kobo (integer)
        """
        return int(naira_amount * 100)
    
    def format_amount_to_naira(self, kobo_amount: int) -> float:
        """
        Convert kobo amount to naira
        
        Args:
            kobo_amount: Amount in kobo
        
        Returns:
            Amount in naira (float)
        """
        return kobo_amount / 100

# Create a singleton instance
paystack_service = PaystackService()

