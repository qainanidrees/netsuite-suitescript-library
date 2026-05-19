/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Script Name:  Purchase Order Approval Routing
 * Description:  Routes a Purchase Order to the correct approver based on
 *               the PO total amount. Uses a threshold table so approval
 *               tiers can be updated without changing code.
 *
 *               Tier 1 : PO < $5,000      → Department Manager
 *               Tier 2 : PO $5k – $25k    → Finance Director
 *               Tier 3 : PO > $25,000     → CFO / VP Finance
 *
 * Trigger:      Before Submit — Purchase Order (on Create & Edit)
 * Author:       NetSuite Certified Consultant
 * Version:      1.0
 */

define(['N/record', 'N/search', 'N/runtime', 'N/log'], (record, search, runtime, log) => {

    // ── Approval Tier Configuration ──────────────────────────────────────────
    // Update employee IDs to match your NetSuite environment.
    // Employee IDs can be found under Lists → Employees.
    const APPROVAL_TIERS = [
        { maxAmount: 5000,    approverEmployeeId: 'DEPT_MGR_EMPLOYEE_ID',   label: 'Department Manager' },
        { maxAmount: 25000,   approverEmployeeId: 'FIN_DIR_EMPLOYEE_ID',    label: 'Finance Director'   },
        { maxAmount: Infinity, approverEmployeeId: 'CFO_EMPLOYEE_ID',       label: 'CFO / VP Finance'   }
    ];

    // Internal ID of the custom field that stores the assigned approver
    // Default NetSuite field for PO approval is 'approver'
    const APPROVER_FIELD = 'approver';

    /**
     * beforeSubmit — set the approver before the record is saved
     */
    const beforeSubmit = (context) => {

        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) return;

        const poRecord = context.newRecord;

        // Don't reassign if PO is already approved or in-process
        const status = poRecord.getValue({ fieldId: 'approvalstatus' });
        if (status === '2') return; // '2' = Approved — leave it alone

        const poTotal = parseFloat(poRecord.getValue({ fieldId: 'total' })) || 0;

        // Find the correct tier
        const tier = APPROVAL_TIERS.find(t => poTotal <= t.maxAmount);

        if (!tier) {
            log.error('POApprovalRouting', `No matching tier found for PO total: ${poTotal}`);
            return;
        }

        // Assign the approver
        poRecord.setValue({
            fieldId : APPROVER_FIELD,
            value   : tier.approverEmployeeId
        });

        log.audit('POApprovalRouting',
            `PO total $${poTotal.toFixed(2)} → routed to ${tier.label} (ID: ${tier.approverEmployeeId})`
        );
    };

    return { beforeSubmit };
});
