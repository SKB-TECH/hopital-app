export type OperationKind =
  | "preview-invoice"
  | "generate-invoice"
  | "pay-invoice"
  | "validate-lab"
  | "discharge"
  | "stock-movement"
  | "complete-consultation"
  | "confirm-birth"
  | "change-status"
  | "print-invoice"
  | "patient-record";

export type OperationState = { kind: OperationKind; row?: any; endpoint?: string };

export type OperationAction = { kind: OperationKind; label: string; icon: any };
