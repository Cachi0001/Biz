def create_sale_from_invoice(invoice):
    try:
        supabase = get_supabase()
        for item in invoice.get("items", []):
            product_id = item.get("product_id")
            quantity = int(item.get("quantity", 0))
            if product_id and quantity > 0:
                # Create a sale record
                sale_data = {
                    "owner_id": invoice["owner_id"],
                    "customer_id": invoice["customer_id"],
                    "product_id": product_id,
                    "quantity": quantity,
                    "unit_price": item.get("unit_price", 0),
                    "total_amount": item.get("total", 0),
                    "payment_method": "invoice",
                    "payment_status": "completed",
                    "date": datetime.now().isoformat(),
                }
                supabase.table("sales").insert(sale_data).execute()

                # Update product quantity
                product_result = supabase.table("products").select("quantity").eq("id", product_id).single().execute()
                if product_result.data:
                    current_quantity = product_result.data["quantity"]
                    new_quantity = max(0, current_quantity - quantity)
                    supabase.table("products").update({"quantity": new_quantity}).eq("id", product_id).execute()
    except Exception as e:
        print(f"Error creating sale from invoice: {e}")
