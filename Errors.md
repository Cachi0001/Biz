{
    "error": "{'code': 'PGRST116', 'details': 'The result contains 0 rows', 'hint': None, 'message': 'JSON object requested, multiple (or no) rows returned'}",
    "message": "Failed to create invoice",
    "success": false,
    "toast": {
        "message": "Failed to create invoice",
        "timeout": 4000,
        "type": "error"
    }
}
{
    "error": "{'code': 'PGRST116', 'details': 'The result contains 0 rows', 'hint': None, 'message': 'JSON object requested, multiple (or no) rows returned'}",
    "message": "Failed to create invoice",
    "success": false,
    "toast": {
        "message": "Failed to create invoice",
        "timeout": 4000,
        "type": "error"
    }
}
CUrrently only owners can create invoice and when the invoice status is updated across all cards that uses invoice there is no consistency eg once an invoice status changes , in the transaction history it always return nan for the price or amount section or field and as for the dashboard the overdue card is meant to be returning invoices that are overdue but this is not working at least it doesn't work consistently.
And also there has been issues for other roles in recording sales as they get a random error message
{
    "message": "Transaction processing error: {'code': 'PGRST116', 'details': 'The result contains 0 rows', 'hint': None, 'message': 'JSON object requested, multiple (or no) rows returned'}",
    "success": false,
    "toast": {
        "message": "Transaction processing error: {'code': 'PGRST116', 'details': 'The result contains 0 rows', 'hint': None, 'message': 'JSON object requested, multiple (or no) rows returned'}",
        "timeout": 3000,
        "type": "error"
    }
}
The toast error message is not showing the correct error scenario or giving the correct error message example when the customer wasn't selected while the user (admin) tried to create invoice instead of getting customer required error message he got item 1 true

ALso when i try to input the quantity of a product on the sale card i noticed that while typing the toast notification for validating the quantity start popping up while still on the process of the typing this is wrong the validation should happen in a way that once the system sees that the stock quantity of a sale that is about to be recorded is should disable the button for recording sale and show the toast message and not while the user is still typing the quantity