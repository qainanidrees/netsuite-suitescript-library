# Script 2 — Purchase Order Approval Routing

## What It Does

Automatically assigns the correct **approver to a Purchase Order** based on the PO total amount before the record is saved. Eliminates manual routing and ensures compliance with your approval policy.

**Business problem solved:** Finance teams were manually reviewing POs and forwarding to the right approver — causing delays, missed approvals, and audit issues.

---

## Approval Tiers (Configurable)

| PO Amount | Approver |
|-----------|----------|
| Under $5,000 | Department Manager |
| $5,000 – $25,000 | Finance Director |
| Over $25,000 | CFO / VP Finance |

Tiers are defined in the `APPROVAL_TIERS` array at the top of the script — easy to update without touching the logic.

---

## Deployment Steps

1. Go to **Customization → Scripting → Scripts → New**
2. Upload `po_approval_routing.js`
3. Set Script Type: **User Event Script**
4. Set Record Type: **Purchase Order**
5. Set **Before Submit** function to: `beforeSubmit`
6. Replace `DEPT_MGR_EMPLOYEE_ID`, `FIN_DIR_EMPLOYEE_ID`, `CFO_EMPLOYEE_ID` with real Employee internal IDs

---

## Customization Notes

| Item | How to Change |
|------|--------------|
| Approval tiers | Edit the `APPROVAL_TIERS` array |
| Amount thresholds | Change `maxAmount` values |
| Approver field | Change `APPROVER_FIELD` if using a custom field |
| Add more tiers | Add another object to the array — no logic changes needed |

---

## Permissions Required

- Edit Purchase Orders
- View Employees
