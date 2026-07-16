import { useAuth, PERMISSION_KEYS } from "../contexts/Authcontext";

export function usePermissions() {
  const { currentUser, hasPermission } = useAuth();

  const enhancedHasPermission = (permissionKey) => {
    const approveToDeleteReject = {
      [PERMISSION_KEYS.APPROVE_INDENT_ITEMS]: [PERMISSION_KEYS.DELETE_ITEM, PERMISSION_KEYS.REJECT_INDENT_ITEMS],
      [PERMISSION_KEYS.APPROVE_PO_ITEMS]: [PERMISSION_KEYS.DELETE_ITEM, PERMISSION_KEYS.REJECT_PO_ITEMS],
      [PERMISSION_KEYS.APPROVE_GRN_ITEMS]: [PERMISSION_KEYS.DELETE_ITEM, PERMISSION_KEYS.REJECT_GRN_ITEMS],
      [PERMISSION_KEYS.APPROVE_STOCK_ISSUE]: [PERMISSION_KEYS.DELETE_ITEM, PERMISSION_KEYS.REJECT_STOCK_ISSUE],
      [PERMISSION_KEYS.APPROVE_TRANSFER]: [PERMISSION_KEYS.DELETE_ITEM, PERMISSION_KEYS.REJECT_TRANSFER],
    };

    for (const [approveKey, extraKeys] of Object.entries(approveToDeleteReject)) {
      if (extraKeys.includes(permissionKey) && hasPermission(approveKey)) {
        return true;
      }
    }

    if (permissionKey === PERMISSION_KEYS.MARK_GRN_DISCREPANCY && hasPermission(PERMISSION_KEYS.CREATE_GRN)) {
      return true;
    }

    return hasPermission(permissionKey);
  };

  return {
    can: {
      addItem:                enhancedHasPermission(PERMISSION_KEYS.ADD_ITEM),
      editItem:               enhancedHasPermission(PERMISSION_KEYS.EDIT_ITEM),
      deleteItem:             enhancedHasPermission(PERMISSION_KEYS.DELETE_ITEM),
      createIndent:           enhancedHasPermission(PERMISSION_KEYS.CREATE_INDENT),
      approveIndentItems:     enhancedHasPermission(PERMISSION_KEYS.APPROVE_INDENT_ITEMS),
      rejectIndentItems:      enhancedHasPermission(PERMISSION_KEYS.REJECT_INDENT_ITEMS),
      createPO:               enhancedHasPermission(PERMISSION_KEYS.CREATE_PO),
      approvePOItems:         enhancedHasPermission(PERMISSION_KEYS.APPROVE_PO_ITEMS),
      rejectPOItems:          enhancedHasPermission(PERMISSION_KEYS.REJECT_PO_ITEMS),
      createGRN:              enhancedHasPermission(PERMISSION_KEYS.CREATE_GRN),
      approveGRNItems:        enhancedHasPermission(PERMISSION_KEYS.APPROVE_GRN_ITEMS),
      rejectGRNItems:         enhancedHasPermission(PERMISSION_KEYS.REJECT_GRN_ITEMS),
      shortDeliveryApprove:   enhancedHasPermission(PERMISSION_KEYS.SHORT_DELIVERY_APPROVE),
      markGRNDiscrepancy:     enhancedHasPermission(PERMISSION_KEYS.MARK_GRN_DISCREPANCY),
      stockIssueRequest:      enhancedHasPermission(PERMISSION_KEYS.STOCK_ISSUE_REQUEST),
      approveStockIssue:      enhancedHasPermission(PERMISSION_KEYS.APPROVE_STOCK_ISSUE),
      rejectStockIssue:       enhancedHasPermission(PERMISSION_KEYS.REJECT_STOCK_ISSUE),
      issueStock:             enhancedHasPermission(PERMISSION_KEYS.ISSUE_STOCK),
      createTransfer:         enhancedHasPermission(PERMISSION_KEYS.CREATE_TRANSFER),
      approveTransfer:        enhancedHasPermission(PERMISSION_KEYS.APPROVE_TRANSFER),
      rejectTransfer:         enhancedHasPermission(PERMISSION_KEYS.REJECT_TRANSFER),
      dispatchTransfer:       enhancedHasPermission(PERMISSION_KEYS.DISPATCH_TRANSFER),
      acknowledgementReceipt: enhancedHasPermission(PERMISSION_KEYS.ACKNOWLEDGEMENT_RECEIPT),
      transferRequest:        enhancedHasPermission(PERMISSION_KEYS.TRANSFER_REQUEST),
      transferItemsApprove:   enhancedHasPermission(PERMISSION_KEYS.TRANSFER_ITEMS_APPROVE),
      dispatch:               enhancedHasPermission(PERMISSION_KEYS.DISPATCH),
      disposeItems:           enhancedHasPermission(PERMISSION_KEYS.DISPOSE_ITEMS),
      replacementItems:       enhancedHasPermission(PERMISSION_KEYS.REPLACEMENT_ITEMS),
      consumptionDamagedItems:enhancedHasPermission(PERMISSION_KEYS.CONSUMPTION_DAMAGED_ITEMS),
    },
    hasPermission: enhancedHasPermission,
    permissions: currentUser?.permissions || [], // ← only change: {} → []
    role: currentUser?.role || null,
  };
}