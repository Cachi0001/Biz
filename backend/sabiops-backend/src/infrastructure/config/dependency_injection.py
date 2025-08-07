import os
import logging
import asyncio
from typing import Dict, Any, TypeVar, Type, Callable, List
from supabase import create_client, Client

from core.interfaces.repositories.user_repository_interface import UserRepositoryInterface
from core.interfaces.repositories.invoice_repository_interface import InvoiceRepositoryInterface
from core.interfaces.repositories.product_repository_interface import ProductRepositoryInterface
from core.interfaces.repositories.sales_repository_interface import SalesRepositoryInterface
from core.interfaces.repositories.payment_repository_interface import PaymentRepositoryInterface
from core.interfaces.repositories.expense_repository_interface import ExpenseRepositoryInterface
from core.interfaces.repositories.subscription_repository_interface import SubscriptionRepositoryInterface
from core.interfaces.services.encryption_service_interface import EncryptionServiceInterface
from core.interfaces.services.payment_service_interface import PaymentServiceInterface
from core.interfaces.services.base_service_interface import (
    BaseServiceInterface, CacheableServiceInterface, AuditableServiceInterface,
    NotificationServiceInterface, PaymentServiceInterface, AnalyticsServiceInterface
)

from shared.exceptions.service_exceptions import ServiceInitializationException, ServiceUnavailableException

logger = logging.getLogger(__name__)

from infrastructure.database.repositories.supabase_user_repository import SupabaseUserRepository
from infrastructure.database.repositories.supabase_invoice_repository import SupabaseInvoiceRepository
from infrastructure.database.repositories.supabase_product_repository import SupabaseProductRepository
from infrastructure.database.repositories.supabase_sales_repository import SupabaseSalesRepository
from infrastructure.database.repositories.supabase_payment_repository import SupabasePaymentRepository
from infrastructure.database.repositories.supabase_expense_repository import SupabaseExpenseRepository
from infrastructure.database.repositories.supabase_subscription_repository import SupabaseSubscriptionRepository
from infrastructure.services.encryption_service import EncryptionService
from infrastructure.services.paystack_payment_service import PaystackPaymentService

from core.use_cases.user.authenticate_user_use_case import AuthenticateUserUseCase
from core.use_cases.user.register_user_use_case import RegisterUserUseCase
from core.use_cases.invoice.create_invoice_use_case import CreateInvoiceUseCase
from core.use_cases.invoice.update_invoice_use_case import UpdateInvoiceUseCase
from core.use_cases.invoice.calculate_invoice_totals_use_case import CalculateInvoiceTotalsUseCase
from core.use_cases.product.create_product_use_case import CreateProductUseCase
from core.use_cases.product.get_products_use_case import GetProductsUseCase
from core.use_cases.sales.create_sale_use_case import CreateSaleUseCase
from core.use_cases.sales.update_sale_payment_status_use_case import UpdateSalePaymentStatusUseCase
from core.use_cases.expense.create_expense_use_case import CreateExpenseUseCase
from core.use_cases.analytics.get_daily_summary_use_case import GetDailySummaryUseCase

from core.interfaces.repositories.payment_method_repository_interface import PaymentMethodRepositoryInterface
from infrastructure.database.repositories.supabase_payment_method_repository import SupabasePaymentMethodRepository
from core.use_cases.payment.get_payment_methods_use_case import GetPaymentMethodsUseCase

# Enhanced payment system imports
from core.interfaces.repositories.enhanced_payment_repository_interface import EnhancedPaymentRepositoryInterface
from core.interfaces.repositories.sale_payment_repository_interface import SalePaymentRepositoryInterface
from core.interfaces.repositories.product_category_repository_interface import ProductCategoryRepositoryInterface
from infrastructure.database.repositories.supabase_enhanced_payment_repository import SupabaseEnhancedPaymentRepository
from infrastructure.database.repositories.supabase_sale_payment_repository import SupabaseSalePaymentRepository
from infrastructure.database.repositories.supabase_product_category_repository import SupabaseProductCategoryRepository
from core.use_cases.payment.record_enhanced_payment_use_case import RecordEnhancedPaymentUseCase
from core.use_cases.analytics.get_enhanced_daily_summary_use_case import GetEnhancedDailySummaryUseCase
from core.use_cases.sales.process_partial_payment_use_case import ProcessPartialPaymentUseCase

T = TypeVar('T')

class DependencyContainer:    
    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._singletons: Dict[str, Any] = {}
        self._setup_dependencies()
    
    def _setup_dependencies(self):
        self.register_singleton('supabase_client', self._create_supabase_client)
        
        self.register_singleton(EncryptionServiceInterface, lambda: EncryptionService())
        
        self.register_singleton(
            UserRepositoryInterface, 
            lambda: SupabaseUserRepository(self.get('supabase_client'))
        )
        
        self.register_singleton(
            InvoiceRepositoryInterface,
            lambda: SupabaseInvoiceRepository(self.get('supabase_client'))
        )
        
        self.register_singleton(
            ProductRepositoryInterface,
            lambda: SupabaseProductRepository(self.get('supabase_client'))
        )
        
        self.register_singleton(
            PaymentMethodRepositoryInterface,
            lambda: SupabasePaymentMethodRepository()
        )
        
        self.register_singleton(
            EnhancedPaymentRepositoryInterface,
            lambda: SupabaseEnhancedPaymentRepository()
        )
        
        self.register_singleton(
            SalePaymentRepositoryInterface,
            lambda: SupabaseSalePaymentRepository()
        )
        
        self.register_singleton(
            ProductCategoryRepositoryInterface,
            lambda: SupabaseProductCategoryRepository()
        )
        
        self.register_singleton(
            SalesRepositoryInterface,
            lambda: SupabaseSalesRepository()
        )
        
        self.register_singleton(
            PaymentRepositoryInterface,
            lambda: SupabasePaymentRepository()
        )
        
        self.register_singleton(
            ExpenseRepositoryInterface,
            lambda: SupabaseExpenseRepository()
        )
        
        self.register_singleton(
            SubscriptionRepositoryInterface,
            lambda: SupabaseSubscriptionRepository()
        )
        
        self.register_singleton(
            PaymentServiceInterface,
            lambda: PaystackPaymentService()
        )
        
        self.register_transient(
            AuthenticateUserUseCase,
            lambda: AuthenticateUserUseCase(
                self.get(UserRepositoryInterface),
                self.get(EncryptionServiceInterface)
            )
        )
        
        self.register_transient(
            RegisterUserUseCase,
            lambda: RegisterUserUseCase(
                self.get(UserRepositoryInterface),
                self.get(EncryptionServiceInterface)
            )
        )
        
        self.register_transient(
            CreateInvoiceUseCase,
            lambda: CreateInvoiceUseCase(self.get(InvoiceRepositoryInterface))
        )
        
        self.register_transient(
            UpdateInvoiceUseCase,
            lambda: UpdateInvoiceUseCase(self.get(InvoiceRepositoryInterface))
        )
        
        self.register_transient(
            CalculateInvoiceTotalsUseCase,
            lambda: CalculateInvoiceTotalsUseCase()
        )
        
        self.register_transient(
            CreateProductUseCase,
            lambda: CreateProductUseCase(self.get(ProductRepositoryInterface))
        )
        
        self.register_transient(
            GetProductsUseCase,
            lambda: GetProductsUseCase(self.get(ProductRepositoryInterface))
        )
        
        self.register_transient(
            GetPaymentMethodsUseCase,
            lambda: GetPaymentMethodsUseCase(self.get(PaymentMethodRepositoryInterface))
        )
        
        self.register_transient(
            CreateSaleUseCase,
            lambda: CreateSaleUseCase(self.get(SalesRepositoryInterface))
        )
        
        self.register_transient(
            UpdateSalePaymentStatusUseCase,
            lambda: UpdateSalePaymentStatusUseCase(self.get(SalesRepositoryInterface))
        )
        
        self.register_transient(
            CreateExpenseUseCase,
            lambda: CreateExpenseUseCase(self.get(ExpenseRepositoryInterface))
        )
        
        self.register_transient(
            GetDailySummaryUseCase,
            lambda: GetDailySummaryUseCase(
                self.get(SalesRepositoryInterface),
                self.get(ExpenseRepositoryInterface)
            )
        )
        
        # Enhanced payment system use cases
        self.register_transient(
            RecordEnhancedPaymentUseCase,
            lambda: RecordEnhancedPaymentUseCase(
                self.get(EnhancedPaymentRepositoryInterface),
                self.get(PaymentMethodRepositoryInterface)
            )
        )
        
        self.register_transient(
            GetEnhancedDailySummaryUseCase,
            lambda: GetEnhancedDailySummaryUseCase(
                self.get(EnhancedPaymentRepositoryInterface),
                self.get(SalesRepositoryInterface),
                self.get(ProductCategoryRepositoryInterface)
            )
        )
        
        self.register_transient(
            ProcessPartialPaymentUseCase,
            lambda: ProcessPartialPaymentUseCase(
                self.get(SalesRepositoryInterface),
                self.get(SalePaymentRepositoryInterface),
                self.get(PaymentMethodRepositoryInterface)
            )
        )
    
    def register_singleton(self, service_type: Type[T], factory_func) -> None:
        if isinstance(service_type, str):
            key = service_type
        else:
            key = service_type.__name__
        
        self._services[key] = {
            'factory': factory_func,
            'lifetime': 'singleton'
        }
    
    def register_transient(self, service_type: Type[T], factory_func) -> None:
        if isinstance(service_type, str):
            key = service_type
        else:
            key = service_type.__name__
        
        self._services[key] = {
            'factory': factory_func,
            'lifetime': 'transient'
        }
    
    def get(self, service_type: Type[T]) -> T:
        if isinstance(service_type, str):
            key = service_type
        else:
            key = service_type.__name__
        
        if key not in self._services:
            raise ValueError(f"Service {key} is not registered")
        
        service_config = self._services[key]
        
        if service_config['lifetime'] == 'singleton':
            if key not in self._singletons:
                self._singletons[key] = service_config['factory']()
            return self._singletons[key]
        else:
            return service_config['factory']()
    
    def _create_supabase_client(self) -> Client:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
        
        return create_client(supabase_url, supabase_key)

container = DependencyContainer()

def get_container() -> DependencyContainer:
    return container