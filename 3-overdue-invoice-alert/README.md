# Script 3 — Overdue Invoice Daily Alert

## What It Does

A **Scheduled Script** that runs automatically every morning and emails your AR team a formatted HTML summary of all open invoices that are past their due date — including customer name, invoice number, due date, and amount outstanding.

**Business problem solved:** AR teams were manually pulling aging reports each morning. This automates that entirely and puts the data in their inbox before the workday starts.

---

## Sample Email Output

> **⚠ Overdue Invoice Summary — 06/15/2025**
>
> 12 invoice(s) are past due. Total outstanding: **$48,320.00**
>
> | Invoice # | Customer | Due Date | Amount Due |
> |-----------|----------|----------|------------|
> | INV-1042 | ABC Corp | 05/30/2025 | $12,500.00 |
> | INV-1031 | XYZ Ltd | 05/15/2025 | $8,200.00 |

---

## Deployment Steps

1. Go to **Customization → Scripting → Scripts → New**
2. Upload `overdue_invoice_alert.js`
3. Set Script Type: **Scheduled Script**
4. Set **Execute** function to: `execute`
5. In the Deployment, set the **Schedule** to daily at your preferred time (e.g. 7:00 AM)
6. Update `AR_TEAM_EMAIL` in the script to your team's email address

---

## Customization Notes

| Item | How to Change |
|------|--------------|
| Recipient email | Update `AR_TEAM_EMAIL` constant |
| CC additional recipients | Add `cc: ['manager@company.com']` to `email.send` |
| Days overdue threshold | Add a `daysoverdue` filter to the search |
| Filter by subsidiary | Add a `subsidiary` filter |

---

## Permissions Required

- View Transactions / Invoices
- Send Email
- Scheduled Script execution rights
