import os
import requests
import json
import logging
import hmac
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime

from core.interfaces.services.payment_service_interface import PaymentServiceInterface
from shared.exceptions.business_exceptions import PaymentException

logger = logging.getLogger(__name__)

class PaystackPaymentService(PaymentServiceInterface):
    """
    Paystack payment service implementation following clean architecture
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
            result = response.json()
            
            if not result.get('status'):
                raise PaymentException(f"Paystack API error: {result.get('message', 'Unknown error')}")
            
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack API request failed: {str(e)}")
            raise PaymentException(f"Payment service unavailable: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in Paystack request: {str(e)}")
            raise PaymentException(f"Payment processing error: {str(e)}")
    
    async def initialize_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initialize a payment transaction
        
        Args:
            payment_data: Dict containing payment details
                - email: Customer's email address
                - amount: Amount in naira (will be converted to kobo)
                - reference: Unique transaction reference
                - callback_url: URL to redirect after payment
                - metadata: Additional transaction metadata
        
        Returns:
            Dict containing transaction details and authorization URL
        """
        try:
            # Convert amount to kobo
            amount_kobo = self.format_amount_to_kobo(payment_data['amount'])
            
            data = {
                'email': payment_data['email'],
                'amount': amount_kobo,
            }
            
            if payment_data.get('reference'):
                data['reference'] = payment_data['reference']
            if payment_data.get('callback_url'):
                data['callback_url'] = payment_data['callback_url']
            if payment_data.get('metadata'):
                data['metadata'] = payment_data['metadata']
            
            response = self._make_request('POST', '/transaction/initialize', data)
            
            logger.info(f"Payment initialized successfully: {payment_data.get('reference')}")
            
            return {
                'success': True,
                'reference': response['data']['reference'],
                'authorization_url': response['data']['authorization_url'],
                'access_code': response['data']['access_code'],
                'amount': payment_data['amount'],
                'currency': 'NGN'
            }
            
        except Exception as e:
            logger.error(f"Failed to initialize payment: {str(e)}")
            raise PaymentException(f"Failed to initialize payment: {str(e)}")
    
    async def verify_payment(self, reference: str) -> Dict[str, Any]:
        """
        Verify a payment transaction using its reference
        
        Args:
            reference: Transaction reference to verify
        
        Returns:
            Dict containing transaction verification details
        """
        try:
            response = self._make_request('GET', f'/transaction/verify/{reference}')
            transaction_data = response['data']
            
            # Map Paystack response to our standard format
            result = {
                'success': True,
                'reference': transaction_data['reference'],
                'status': transaction_data['status'],
                'amount': self.format_amount_to_naira(transaction_data['amount']),
                'currency': transaction_data['currency'],
                'customer_email': transaction_data['customer']['email'],
                'customer_name': f"{transaction_data['customer'].get('first_name', '')} {transaction_data['customer'].get('last_name', '')}".strip(),
                'paid_at': transaction_data.get('paid_at'),
                'channel': transaction_data.get('channel'),
                'gateway_response': transaction_data.get('gateway_response'),
                'metadata': transaction_data.get('metadata', {}),
                'is_successful': transaction_data['status'] == 'success'
            }
            
            logger.info(f"Payment verification completed: {reference} - {result['status']}")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to verify payment {reference}: {str(e)}")
            raise PaymentException(f"Failed to verify payment: {str(e)}")
    
    async def process_refund(self, transaction_reference: str, amount: float = None, reason: str = None) -> Dict[str, Any]:
        """
        Process a refund for a transaction
        
        Args:
            transaction_reference: Reference of the transaction to refund
            amount: Amount to refund (if partial refund)
            reason: Reason for the refund
        
        Returns:
            Dict containing refund details
        """
        try:
            # First get the transaction details
            transaction_response = self._make_request('GET', f'/transaction/verify/{transaction_reference}')
            transaction_data = transaction_response['data']
            
            if transaction_data['status'] != 'success':
                raise PaymentException("Cannot refund unsuccessful transaction")
            
            # Prepare refund data
            refund_data = {
                'transaction': transaction_reference,
            }
            
            if amount:
                refund_data['amount'] = self.format_amount_to_kobo(amount)
            if reason:
                refund_data['merchant_note'] = reason
            
            response = self._make_request('POST', '/refund', refund_data)
            refund_data_response = response['data']
            
            logger.info(f"Refund processed successfully: {transaction_reference}")
            
            return {
                'success': True,
                'refund_reference': refund_data_response.get('id'),
                'transaction_reference': transaction_reference,
                'amount_refunded': self.format_amount_to_naira(refund_data_response.get('amount', 0)),
                'status': refund_data_response.get('status'),
                'created_at': refund_data_response.get('createdAt')
            }
            
        except Exception as e:
            logger.error(f"Failed to process refund for {transaction_reference}: {str(e)}")
            raise PaymentException(f"Failed to process refund: {str(e)}")
    
    async def get_payment_status(self, reference: str) -> str:
        """
        Get the current status of a payment
        
        Args:
            reference: Payment reference
        
        Returns:
            Payment status string
        """
        try:
            verification_result = await self.verify_payment(reference)
            return verification_result['status']
            
        except Exception as e:
            logger.error(f"Failed to get payment status for {reference}: {str(e)}")
            return 'unknown'
    
    async def validate_webhook(self, payload: str, signature: str) -> bool:
        """
        Validate webhook signature from Paystack
        
        Args:
            payload: Raw webhook payload
            signature: Webhook signature from headers
        
        Returns:
            Boolean indicating if signature is valid
        """
        try:
            secret = self.secret_key.encode('utf-8')
            computed_signature = hmac.new(
                secret, 
                payload.encode('utf-8'), 
                hashlib.sha512
            ).hexdigest()
            
            is_valid = hmac.compare_digest(computed_signature, signature)
            
            if is_valid:
                logger.info("Webhook signature validation successful")
            else:
                logger.warning("Webhook signature validation failed")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Error validating webhook signature: {str(e)}")
            return False
    
    async def get_supported_banks(self, country: str = 'nigeria') -> Dict[str, Any]:
        """
        Get list of supported banks for transfers
        
        Args:
            country: Country to get banks for
        
        Returns:
            Dict containing list of banks
        """
        try:
            params = {'country': country}
            response = self._make_request('GET', '/bank', params)
            
            banks = []
            for bank in response['data']:
                banks.append({
                    'name': bank['name'],
                    'code': bank['code'],
                    'slug': bank['slug'],
                    'currency': bank.get('currency', 'NGN')
                })
            
            return {
                'success': True,
                'banks': banks,
                'count': len(banks)
            }
            
        except Exception as e:
            logger.error(f"Failed to get supported banks: {str(e)}")
            raise PaymentException(f"Failed to get supported banks: {str(e)}")
    
    async def resolve_account_number(self, account_number: str, bank_code: str) -> Dict[str, Any]:
        """
        Resolve account number to get account details
        
        Args:
            account_number: Account number to resolve
            bank_code: Bank code
        
        Returns:
            Dict containing account details
        """
        try:
            params = {
                'account_number': account_number,
                'bank_code': bank_code,
            }
            
            response = self._make_request('GET', '/bank/resolve', params)
            account_data = response['data']
            
            return {
                'success': True,
                'account_number': account_data['account_number'],
                'account_name': account_data['account_name'],
                'bank_id': account_data.get('bank_id')
            }
            
        except Exception as e:
            logger.error(f"Failed to resolve account number {account_number}: {str(e)}")
            raise PaymentException(f"Failed to resolve account number: {str(e)}")
    
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
    
    async def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a customer on Paystack
        
        Args:
            customer_data: Dict containing customer details
                - email: Customer's email address
                - first_name: Customer's first name
                - last_name: Customer's last name
                - phone: Customer's phone number
        
        Returns:
            Dict containing customer details
        """
        try:
            data = {'email': customer_data['email']}
            
            if customer_data.get('first_name'):
                data['first_name'] = customer_data['first_name']
            if customer_data.get('last_name'):
                data['last_name'] = customer_data['last_name']
            if customer_data.get('phone'):
                data['phone'] = customer_data['phone']
            
            response = self._make_request('POST', '/customer', data)
            customer_response = response['data']
            
            logger.info(f"Customer created successfully: {customer_data['email']}")
            
            return {
                'success': True,
                'customer_code': customer_response['customer_code'],
                'email': customer_response['email'],
                'first_name': customer_response.get('first_name'),
                'last_name': customer_response.get('last_name'),
                'phone': customer_response.get('phone'),
                'created_at': customer_response.get('createdAt')
            }
            
        except Exception as e:
            logger.error(f"Failed to create customer: {str(e)}")
            raise PaymentException(f"Failed to create customer: {str(e)}")