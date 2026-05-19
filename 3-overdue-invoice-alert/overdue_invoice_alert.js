/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 *
 * Script Name:  Overdue Invoice Daily Alert
 * Description:  Runs once per day (via a scheduled deployment) and emails
 *               the AR team a summary of all open invoices that are past
 *               their due date. Groups results by customer and sorts by
 *               oldest due date first.
 *
 * Schedule:     Daily at 7:00 AM (set in deployment)
 * Author:       NetSuite Certified Consultant
 * Version:      1.0
 */

define(['N/search', 'N/email', 'N/runtime', 'N/format'], (search, email, runtime, format) => {

    // ── Configuration ────────────────────────────────────────────────────────
    const AR_TEAM_EMAIL  = 'ar-team@yourcompany.com';   // Change to your AR email
    const SENDER_ID      = runtime.getCurrentUser().id; // Sends as the script's executing user

    /**
     * execute — main entry point for Scheduled Script
     */
    const execute = (context) => {

        const today     = new Date();
        const todayStr  = format.format({ value: today, type: format.Type.DATE });

        log.audit('OverdueInvoiceAlert', `Running overdue check for ${todayStr}`);

        // ── Search: open invoices with a due date before today ───────────────
        const invoiceSearch = search.create({
            type   : search.Type.INVOICE,
            filters: [
                ['mainline',      'is',      'T'],
                'AND',
                ['status',        'anyof',   'CustInvc:A'],   // Open invoices
                'AND',
                ['duedate',       'before',  'today'],
                'AND',
                ['amountremaining', 'greaterthan', 0]
            ],
            columns: [
                search.createColumn({ name: 'tranid',          label: 'Invoice #'      }),
                search.createColumn({ name: 'entity',          label: 'Customer'       }),
                search.createColumn({ name: 'duedate',         label: 'Due Date',  sort: search.Sort.ASC }),
                search.createColumn({ name: 'amountremaining', label: 'Amount Due'     }),
                search.createColumn({ name: 'memo',            label: 'Memo'           })
            ]
        });

        // ── Collect results ──────────────────────────────────────────────────
        const overdueList = [];
        invoiceSearch.run().each((result) => {
            overdueList.push({
                invoiceNum : result.getValue('tranid'),
                customer   : result.getText('entity'),
                dueDate    : result.getValue('duedate'),
                amountDue  : parseFloat(result.getValue('amountremaining')),
                memo       : result.getValue('memo') || ''
            });
            return true; // continue iteration
        });

        if (overdueList.length === 0) {
            log.audit('OverdueInvoiceAlert', 'No overdue invoices found — no email sent.');
            return;
        }

        // ── Build HTML email table ────────────────────────────────────────────
        const totalOverdue = overdueList.reduce((sum, inv) => sum + inv.amountDue, 0);

        let tableRows = overdueList.map(inv => `
            <tr>
                <td style="padding:6px 12px;border-bottom:1px solid #eee">${inv.invoiceNum}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #eee">${inv.customer}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #eee;color:#c0392b">${inv.dueDate}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">
                    $${inv.amountDue.toFixed(2)}
                </td>
            </tr>
        `).join('');

        const emailBody = `
        <html><body style="font-family:Arial,sans-serif;font-size:14px;color:#333">
            <h2 style="color:#c0392b">⚠ Overdue Invoice Summary — ${todayStr}</h2>
            <p><strong>${overdueList.length} invoice(s)</strong> are past due.
               Total outstanding: <strong>$${totalOverdue.toFixed(2)}</strong></p>
            <table style="border-collapse:collapse;width:100%;max-width:700px">
                <thead>
                    <tr style="background:#f4f4f4">
                        <th style="padding:8px 12px;text-align:left">Invoice #</th>
                        <th style="padding:8px 12px;text-align:left">Customer</th>
                        <th style="padding:8px 12px;text-align:left">Due Date</th>
                        <th style="padding:8px 12px;text-align:right">Amount Due</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
            <p style="margin-top:20px;font-size:12px;color:#999">
                This is an automated daily report from NetSuite.
            </p>
        </body></html>
        `;

        // ── Send email ────────────────────────────────────────────────────────
        email.send({
            author     : SENDER_ID,
            recipients : AR_TEAM_EMAIL,
            subject    : `[NetSuite] ${overdueList.length} Overdue Invoice(s) — $${totalOverdue.toFixed(2)} Outstanding`,
            body       : emailBody
        });

        log.audit('OverdueInvoiceAlert',
            `Email sent to ${AR_TEAM_EMAIL} — ${overdueList.length} invoices, $${totalOverdue.toFixed(2)} total`
        );
    };

    return { execute };
});
