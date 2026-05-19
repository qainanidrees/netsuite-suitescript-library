# Script 5 — Customer Credit Limit Check on Sales Order

## What It Does

Prevents a **Sales Order from being saved** if the customer's projected balance (open invoices + this order) would exceed their credit limit. Shows a clear, detailed error message to the sales rep with exact amounts.

**Business problem solved:** Sales reps were creating orders for customers who were already over their credit limit, creating collection problems and bad debt exposure for the Finance team.

---

## Error Message Shown to Rep

```
⚠ Credit Limit Exceeded for ABC Corp.
Credit Limit:         $50,000.00
Current Open Balance: $47,500.00
This Order Total:     $8,200.00
Available Credit:     $2,500.00
Over Limit By:        $5,700.00

Please contact the Finance team or reduce the order amount.
```

---

## How It Works

1. Sales rep saves a Sales Order
2. Script loads the customer's Credit Limit field
3. Searches all open invoices to calculate the current outstanding balance
4. Adds the current order total to the open balance
5. If the projected total exceeds the credit limit → **blocks save** with a detailed error
6. If within limit → allows save, logs a clean audit entry
7. If no credit limit is set on the customer → skips the check entirely

---

## Deployment Steps

1. Go to **Customization → Scripting → Scripts → New**
2. Upload `customer_credit_check.js`
3. Set Script Type: **User Event Script**
4. Set Record Type: **Sales Order**
5. Set **Before Submit** function to: `beforeSubmit`

---

## Customization Notes

| Item | How to Change |
|------|--------------|
| Warn instead of block | Replace `throw error.create` with a `log.audit` and dialog warning |
| Allow Finance to override | Add a role check before the throw — skip for Finance Manager role |
| Include open Sales Orders | Add an SO search alongside the Invoice search |
| Email Finance on block | Add `N/email` and send a notification when a block occurs |

---

## Permissions Required

- View Sales Orders
- View Invoices / Transactions
- View Customers
