# Requirements Document

## Introduction

This feature addresses the critical challenges Nigerian SMEs face in payment processing, POS integration, and credit sales management within the SabiOPS system. The solution provides accurate record-keeping, improved reconciliation capabilities, and enhanced flexibility for handling various payment scenarios including cash, POS transactions (card and transfer), bank transfers, and credit sales with partial payment support.

## Requirements

### Requirement 1

**User Story:** As a business owner, I want to accurately track all payment methods including POS transactions, so that I can have complete visibility into my daily cash flow and reconcile my accounts properly.

#### Acceptance Criteria

1. WHEN a user records a payment THEN the system SHALL allow selection from standardized payment methods including 'Cash', 'POS - Card', 'POS - Transfer', 'Bank Transfer', 'Credit', and 'Online Payment'
2. WHEN a user selects a POS payment method THEN the system SHALL capture POS account name, transaction type (Sale/Deposit/Withdrawal/Refund), and POS reference number
3. WHEN recording POS transactions THEN the system SHALL flag them as POS transactions for separate tracking and reporting
4. IF a payment is made via POS THEN the system SHALL categorize it correctly for daily summary calculations

### Requirement 2

**User Story:** As a business manager, I want to see daily financial summaries including cash at hand and POS totals, so that I can make informed decisions about my business operations.

#### Acceptance Criteria

1. WHEN requesting a daily summary THEN the system SHALL calculate total cash at hand by summing cash payments and subtracting cash expenses
2. WHEN generating daily reports THEN the system SHALL show total money deposited on POS and total money withdrawn from POS separately
3. WHEN viewing daily summaries THEN the system SHALL display sales totals by product category (e.g., drinks)
4. WHEN accessing daily summaries THEN the system SHALL provide an HTML download format option

### Requirement 3

**User Story:** As a sales person, I want to manage credit sales with partial payments, so that I can track customer debts and payment progress accurately.

#### Acceptance Criteria

1. WHEN creating a credit sale THEN the system SHALL initialize amount_paid to 0 and amount_due to total_amount
2. WHEN a partial payment is made on a credit sale THEN the system SHALL update amount_paid and reduce amount_due accordingly
3. WHEN amount_due reaches 0 THEN the system SHALL automatically change payment_status to 'Paid'
4. WHEN viewing credit sales THEN the system SHALL display outstanding balance and payment history

### Requirement 4

**User Story:** As an accountant, I want revenue and profit to be recognized only when payments are received, so that my financial reports reflect actual cash flow rather than potential income.

#### Acceptance Criteria

1. WHEN calculating total revenue THEN the system SHALL exclude sales with payment_status 'Credit' or 'Pending'
2. WHEN generating profit reports THEN the system SHALL only include sales with payment_status 'Paid'
3. WHEN viewing financial reports THEN the system SHALL show separate metrics for 'Outstanding Credit Sales' or 'Accounts Receivable'
4. IF a credit sale becomes paid THEN the system SHALL include it in revenue calculations

### Requirement 5

**User Story:** As a business owner, I want to update sale and invoice statuses from credit/pending to paid, so that I can reflect actual payment receipt and maintain accurate records.

#### Acceptance Criteria

1. WHEN updating a sale status from 'Credit' to 'Paid' THEN the system SHALL record the payment method used for settlement
2. WHEN changing payment status THEN the system SHALL update revenue and profit calculations accordingly
3. WHEN updating invoice status THEN the system SHALL prevent errors and maintain data consistency
4. IF an invoice is marked as paid THEN the system SHALL reflect this in all related financial reports

### Requirement 6

**User Story:** As a business manager, I want to track detailed payment information for reconciliation, so that I can match my system records with bank statements and POS reports.

#### Acceptance Criteria

1. WHEN recording any payment THEN the system SHALL store payment method, amount, date, and reference numbers
2. WHEN processing POS transactions THEN the system SHALL capture POS terminal reference numbers for reconciliation
3. WHEN viewing payment records THEN the system SHALL display all relevant details for audit purposes
4. WHEN generating reports THEN the system SHALL provide sufficient detail for external reconciliation processes