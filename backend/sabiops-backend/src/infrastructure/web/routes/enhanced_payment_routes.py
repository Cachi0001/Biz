from flask import Blueprint
from infrastructure.config.dependency_injection import get_container
from infrastructure.web.controllers.enhanced_payment_controller import EnhancedPaymentController
from core.use_cases.payment.record_enhanced_payment_use_case import RecordEnhancedPaymentUseCase
from core.use_cases.analytics.get_enhanced_daily_summary_use_case import GetEnhancedDailySummaryUseCase
from core.use_cases.sales.process_partial_payment_use_case import ProcessPartialPaymentUseCase

def create_enhanced_payment_routes():
    """Create and configure enhanced payment routes"""
    container = get_container()
    
    # Get use cases from container
    record_payment_use_case = container.get(RecordEnhancedPaymentUseCase)
    daily_summary_use_case = container.get(GetEnhancedDailySummaryUseCase)
    
    # Create partial payment use case (not in container yet)
    from core.interfaces.repositories.sale_payment_repository_interface import SalePaymentRepositoryInterface
    from infrastructure.database.repositories.supabase_sale_payment_repository import SupabaseSalePaymentRepository
    
    # For now, create directly - should be added to container
    sale_payment_repo = SupabaseSalePaymentRepository(container.get('supabase_client'))
    partial_payment_use_case = ProcessPartialPaymentUseCase(
        container.get('SalesRepositoryInterface'),
        sale_payment_repo,
        container.get('PaymentMethodRepositoryInterface')
    )
    
    # Create controller
    controller = EnhancedPaymentController(
        record_payment_use_case,
        daily_summary_use_case,
        partial_payment_use_case
    )
    
    return controller.blueprint

enhanced_payment_bp = create_enhanced_payment_routes()