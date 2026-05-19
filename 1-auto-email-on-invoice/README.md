# Script 1 — Auto Email Invoice on Approval

## What It Does

Automatically sends a **PDF copy of an Invoice** to the customer's billing email the moment the invoice is approved in NetSuite. No manual step required from your AR team.

**Business problem solved:** AR staff were manually downloading and emailing invoices — slow, inconsistent, and easy to forget.

---

## How It Works

1. Customer saves or approves an Invoice
2. Script checks if the approval status just changed to **Approved**
3. Renders the invoice as a PDF using the standard NetSuite template
4. Sends it to the customer's primary email with a clean message body
5. Logs the action in the Script Execution Log

---

## Deployment Steps

1. Go to **Customization → Scripting → Scripts → New**
2. Upload `auto_email_invoice.js`
3. Set Script Type: **User Event Script**
4. Set Record Type: **Invoice**
5. Set **After Submit** function to: `afterSubmit`
6. Deploy with Status: **Testing** first, then **Released**

---

## Customization Notes

| Item | How to Change |
|------|--------------|
| Email body text | Edit the `body` template string in the script |
| PDF template | Change the `render.transaction` call to reference a custom template ID |
| Send to CC | Add `cc: ['manager@company.com']` to the `email.send` call |
| Trigger condition | Modify the `APPROVED` status check to match your workflow |

---

## Permissions Required

- Send Email
- View Transactions
- View Customers
