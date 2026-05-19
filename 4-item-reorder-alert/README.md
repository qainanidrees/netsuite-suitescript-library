# Script 4 — Inventory Reorder Point Alert

## What It Does

A **Scheduled Script** that checks all inventory items daily and emails the purchasing team a list of items that have dropped to or below their defined reorder point — including preferred vendor, vendor part number, quantity on hand, and suggested reorder quantity.

**Business problem solved:** Purchasing teams were missing reorder points because they weren't checking inventory reports daily. This script eliminates stockouts by proactively alerting the team.

---

## Sample Email Output

> **📦 Inventory Reorder Alert — 06/15/2025**
>
> 5 item(s) are at or below their reorder point and require a Purchase Order.
>
> | Item | Preferred Vendor | Vendor Part # | Qty On Hand | Reorder Point | Reorder Qty |
> |------|-----------------|--------------|-------------|---------------|-------------|
> | WIDGET-100 | ABC Supplies | SUP-4421 | **3** | 10 | **25** |

---

## Deployment Steps

1. Go to **Customization → Scripting → Scripts → New**
2. Upload `item_reorder_alert.js`
3. Set Script Type: **Scheduled Script**
4. Set **Execute** function to: `execute`
5. Update `PURCHASING_EMAIL` to your purchasing team's email
6. Set the Schedule to daily (recommend after warehouse closes or early morning)

---

## Customization Notes

| Item | How to Change |
|------|--------------|
| Filter by location | Set `LOCATION_ID` to a NetSuite Location internal ID |
| Filter by item class | Add a `class` or `custitem_...` filter |
| Auto-create POs | Extend to call `record.create` for a Purchase Order |
| Multiple recipients | Add `cc: [...]` to the email.send call |

---

## Permissions Required

- View Items / Inventory
- Send Email
- Scheduled Script execution rights
