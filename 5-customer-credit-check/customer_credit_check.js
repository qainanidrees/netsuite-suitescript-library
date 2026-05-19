/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Script Name:  Customer Credit Limit Check on Sales Order
 * Description:  Before a Sales Order is saved, checks whether the customer's
 *               total outstanding balance (open invoices + this new order)
 *               would exceed their credit limit.
 *
 *               If the limit is exceeded:
 *               - Shows a clear error to the rep with the exact amounts
 *               - Prevents the order from saving
 *               - Logs the attempt for the Finance team to review
 *
 *               If the customer has no credit limit set, the order is allowed.
 *
 * Trigger:      Before Submit — Sales Order (Create & Edit)
 * Author:       NetSuite Certified Consultant
 * Version:      1.0
 */

define(['N/record', 'N/search', 'N/error'], (record, search, error) => {

    /**
     * beforeSubmit — validate credit limit before saving
     */
    const beforeSubmit = (context) => {

        // Only check on Create or Edit
        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) return;

        const soRecord   = context.newRecord;
        const customerId = soRecord.getValue({ fieldId: 'entity' });

        if (!customerId) return;

        // ── Load customer to get credit limit ────────────────────────────────
        const customerRecord  = record.load({ type: record.Type.CUSTOMER, id: customerId });
        const creditLimit     = parseFloat(customerRecord.getValue({ fieldId: 'creditlimit' }) || 0);
        const customerName    = customerRecord.getValue({ fieldId: 'companyname' })
                             || customerRecord.getValue({ fieldId: 'altname' });

        // If no credit limit is set (0), skip the check
        if (creditLimit <= 0) {
            log.audit('CreditCheck', `${customerName} — no credit limit set, skipping.`);
            return;
        }

        // ── Get current open balance for this customer ───────────────────────
        // Searches for open invoices to calculate outstanding balance
        const balanceSearch = search.create({
            type   : search.Type.INVOICE,
            filters: [
                ['entity',          'anyof', customerId],
                'AND',
                ['mainline',        'is',    'T'],
                'AND',
                ['status',          'anyof', 'CustInvc:A'],  // Open only
                'AND',
                ['amountremaining', 'greaterthan', 0]
            ],
            columns: [
                search.createColumn({ name: 'amountremaining' })
            ]
        });

        let openBalance = 0;
        balanceSearch.run().each((result) => {
            openBalance += parseFloat(result.getValue('amountremaining') || 0);
            return true;
        });

        // ── Get the total of the current Sales Order ─────────────────────────
        const soTotal = parseFloat(soRecord.getValue({ fieldId: 'total' }) || 0);

        // ── Calculate projected balance ──────────────────────────────────────
        const projectedBalance = openBalance + soTotal;
        const available        = creditLimit - openBalance;
        const overage          = projectedBalance - creditLimit;

        log.audit('CreditCheck', [
            `Customer: ${customerName}`,
            `Credit Limit: $${creditLimit.toFixed(2)}`,
            `Open Balance: $${openBalance.toFixed(2)}`,
            `This Order: $${soTotal.toFixed(2)}`,
            `Projected: $${projectedBalance.toFixed(2)}`
        ].join(' | '));

        // ── Block if over limit ───────────────────────────────────────────────
        if (projectedBalance > creditLimit) {
            throw error.create({
                name   : 'CREDIT_LIMIT_EXCEEDED',
                message: [
                    `⚠ Credit Limit Exceeded for ${customerName}.`,
                    `Credit Limit: $${creditLimit.toFixed(2)}`,
                    `Current Open Balance: $${openBalance.toFixed(2)}`,
                    `This Order Total: $${soTotal.toFixed(2)}`,
                    `Available Credit: $${available.toFixed(2)}`,
                    `Over Limit By: $${overage.toFixed(2)}`,
                    `Please contact the Finance team or reduce the order amount.`
                ].join('\n'),
                notifyOff: false
            });
        }

        log.audit('CreditCheck',
            `${customerName} — OK. Projected balance $${projectedBalance.toFixed(2)} within limit $${creditLimit.toFixed(2)}.`
        );
    };

    return { beforeSubmit };
});
