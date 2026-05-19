/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 *
 * Script Name:  Inventory Reorder Point Alert
 * Description:  Runs on a schedule (daily or twice daily) and finds all
 *               inventory items where the current quantity on hand has
 *               dropped to or below the defined reorder point.
 *               Emails the purchasing team a list of items that need
 *               to be restocked, including preferred vendor and reorder qty.
 *
 * Schedule:     Daily at 6:30 AM (or after warehouse closes)
 * Author:       NetSuite Certified Consultant
 * Version:      1.0
 */

define(['N/search', 'N/email', 'N/runtime'], (search, email, runtime) => {

    // ── Configuration ────────────────────────────────────────────────────────
    const PURCHASING_EMAIL = 'purchasing@yourcompany.com'; // Change to your team email
    const LOCATION_ID      = null; // Set to a Location internal ID to filter by site, or null for all

    /**
     * execute — main entry point
     */
    const execute = (context) => {

        log.audit('ReorderAlert', 'Starting inventory reorder check...');

        // ── Search: items at or below reorder point ───────────────────────────
        const filters = [
            ['quantityreorderunit', 'greaterthan', 0],  // Only items that have a reorder point set
            'AND',
            ['isinactive', 'is', 'F'],
            'AND',
            // quantityonhand <= reorderpoint
            // NetSuite doesn't support field-to-field comparisons in saved search,
            // so we use a formula to calculate the gap
            ['formulanumeric: {quantityonhand} - {reorderpoint}', 'lessthanorequalto', 0]
        ];

        if (LOCATION_ID) {
            filters.push('AND', ['inventorylocation', 'anyof', LOCATION_ID]);
        }

        const itemSearch = search.create({
            type   : search.Type.ITEM,
            filters: filters,
            columns: [
                search.createColumn({ name: 'itemid',              label: 'Item Name'         }),
                search.createColumn({ name: 'displayname',         label: 'Display Name'      }),
                search.createColumn({ name: 'quantityonhand',      label: 'Qty On Hand'       }),
                search.createColumn({ name: 'reorderpoint',        label: 'Reorder Point'     }),
                search.createColumn({ name: 'quantityreorderunit', label: 'Reorder Qty'       }),
                search.createColumn({ name: 'preferredvendor',     label: 'Preferred Vendor'  }),
                search.createColumn({ name: 'vendorcode',          label: 'Vendor Part #'     })
            ]
        });

        // ── Collect results ──────────────────────────────────────────────────
        const reorderItems = [];
        itemSearch.run().each((result) => {
            reorderItems.push({
                itemName      : result.getValue('itemid'),
                displayName   : result.getValue('displayname') || result.getValue('itemid'),
                qtyOnHand     : parseFloat(result.getValue('quantityonhand') || 0),
                reorderPoint  : parseFloat(result.getValue('reorderpoint')    || 0),
                reorderQty    : parseFloat(result.getValue('quantityreorderunit') || 0),
                vendor        : result.getText('preferredvendor') || 'N/A',
                vendorPartNum : result.getValue('vendorcode') || 'N/A'
            });
            return true;
        });

        if (reorderItems.length === 0) {
            log.audit('ReorderAlert', 'No items below reorder point — no email sent.');
            return;
        }

        // ── Build email table ────────────────────────────────────────────────
        const tableRows = reorderItems.map(item => `
            <tr>
                <td style="padding:6px 12px;border-bottom:1px solid #eee">${item.itemName}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #eee">${item.vendor}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #eee">${item.vendorPartNum}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;color:#c0392b">
                    <strong>${item.qtyOnHand}</strong>
                </td>
                <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">
                    ${item.reorderPoint}
                </td>
                <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;color:#27ae60">
                    <strong>${item.reorderQty}</strong>
                </td>
            </tr>
        `).join('');

        const today    = new Date().toLocaleDateString('en-US');
        const emailBody = `
        <html><body style="font-family:Arial,sans-serif;font-size:14px;color:#333">
            <h2 style="color:#e67e22">📦 Inventory Reorder Alert — ${today}</h2>
            <p><strong>${reorderItems.length} item(s)</strong> are at or below their reorder point and require a Purchase Order.</p>
            <table style="border-collapse:collapse;width:100%;max-width:800px">
                <thead>
                    <tr style="background:#f4f4f4">
                        <th style="padding:8px 12px;text-align:left">Item</th>
                        <th style="padding:8px 12px;text-align:left">Preferred Vendor</th>
                        <th style="padding:8px 12px;text-align:left">Vendor Part #</th>
                        <th style="padding:8px 12px;text-align:center">Qty On Hand</th>
                        <th style="padding:8px 12px;text-align:center">Reorder Point</th>
                        <th style="padding:8px 12px;text-align:center">Reorder Qty</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
            <p style="margin-top:20px;font-size:12px;color:#999">
                Automated report from NetSuite Inventory Management.
            </p>
        </body></html>
        `;

        email.send({
            author     : runtime.getCurrentUser().id,
            recipients : PURCHASING_EMAIL,
            subject    : `[NetSuite] ${reorderItems.length} Item(s) Need Restocking — ${today}`,
            body       : emailBody
        });

        log.audit('ReorderAlert', `Email sent — ${reorderItems.length} items flagged for reorder.`);
    };

    return { execute };
});
