def create_sale_from_invoice(invoice):
    """
    DEPRECATED: This function is no longer used.
    Revenue recording is now handled by InvoiceInventoryManager.process_invoice_status_update()
    Product quantity reduction happens during invoice creation, not when marked as paid.
    """
    try:
        print(f"[INFO] create_sale_from_invoice called for invoice {invoice.get('id', 'unknown')} - using new InvoiceInventoryManager instead")
        pass
    except Exception as e:
        print(f"Error in deprecated create_sale_from_invoice: {e}")
