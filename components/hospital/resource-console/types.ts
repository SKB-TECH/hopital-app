export type OperationKind =
  | "preview-invoice"
  | "generate-invoice"
  | "pay-invoice"
  | "validate-lab"
  | "discharge"
  | "stock-movement"
  | "complete-consultation"
  | "confirm-birth"
  | "send-to-surgery"
  | "surgery-status"
  | "validate-material-count"
  | "validate-oms-step"
  | "change-status"
  | "close-queue"
  | "print-invoice"
  | "download-backup"
  | "patient-record";

export type OperationState = { kind: OperationKind; row?: any; endpoint?: string };

export type OperationAction = { kind: OperationKind; label: string; icon: any };
