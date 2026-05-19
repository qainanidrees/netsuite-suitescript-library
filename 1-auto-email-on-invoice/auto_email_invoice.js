/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Script Name:  Auto Email Invoice on Approval
 * Description:  Automatically sends a PDF copy of an Invoice to the billing
 *               contact when the invoice status changes to "Approved for Posting"
 *               (or when it is first saved in an open/approved state).
 *
 * Trigger:      After Submit — Invoice record
 * Author:       NetSuite Certified Consultant
 * Version:      1.0
 */

define(['N/email', 'N/render', 'N/record', 'N/runtime', 'N/search'], (email, render, record, runtime, search) => {

    /**
     * afterSubmit — fires after the Invoice record is saved.
     */
    const afterSubmit = (context) => {

        // Only run on Create or Edit, and only when the record type is Invoice
        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) return;

        const newRecord = context.newRecord;
        const oldRecord = context.oldRecord;

        // Read the current and previous approval status
        const newStatus  = newRecord.getValue({ fieldId: 'approvalstatus' });
        const prevStatus = oldRecord ? oldRecord.getValue({ fieldId: 'approvalstatus' }) : null;

        // '2' = Approved in NetSuite's approvalstatus list
        const APPROVED = '2';

        // Only proceed if the status just changed TO Approved (avoid duplicate emails)
        if (newStatus !== APPROVED) return;
        if (prevStatus === APPROVED) return;

        // ── Get customer email ──────────────────────────────────────────────
        const customerId   = newRecord.getValue({ fieldId: 'entity' });
        const invoiceId    = newRecord.id;
        const invoiceNumber = newRecord.getValue({ fieldId: 'tranid' });
        const amountDue    = newRecord.getValue({ fieldId: 'amountremaining' });

        // Look up the customer's primary email
        const customerRecord = record.load({ type: record.Type.CUSTOMER, id: customerId });
        const toEmail        = customerRecord.getValue({ fieldId: 'email' });
        const customerName   = customerRecord.getValue({ fieldId: 'companyname' })
                            || customerRecord.getValue({ fieldId: 'altname' });

        if (!toEmail) {
            log.audit('AutoEmailInvoice', `Customer ${customerId} has no email — skipping.`);
            return;
        }

        // ── Render the Invoice as a PDF ────────────────────────────────────
        const pdfFile = render.transaction({
            entityId   : parseInt(invoiceId, 10),
            printMode  : render.PrintMode.PDF
        });

        // ── Build email body ───────────────────────────────────────────────
        const subject = `Invoice #${invoiceNumber} — Payment Due`;
        const body    = `
Dear ${customerName},

Please find attached Invoice #${invoiceNumber}.

Amount Due: $${parseFloat(amountDue).toFixed(2)}

If you have any questions regarding this invoice, please don't hesitate to contact us.

Thank you for your business.

Best regards,
Accounts Receivable Team
        `.trim();

        // ── Send the email ─────────────────────────────────────────────────
        email.send({
            author     : runtime.getCurrentUser().id,
            recipients : toEmail,
            subject    : subject,
            body       : body,
            attachments: [pdfFile],
            relatedRecords: {
                transactionId: parseInt(invoiceId, 10)
            }
        });

        log.audit('AutoEmailInvoice', `Invoice #${invoiceNumber} emailed to ${toEmail}`);
    };

    return { afterSubmit };
});
