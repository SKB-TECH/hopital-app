import type { OperationKind } from "./types";

export function operationTitle(kind: OperationKind) {
  return ({
    "preview-invoice": "Aperçu de facture",
    "generate-invoice": "Générer une facture",
    "pay-invoice": "Encaissement",
    "validate-lab": "Validation laboratoire",
    discharge: "Sortie hospitalisation",
    "stock-movement": "Mouvement de stock",
    "complete-consultation": "Terminer la consultation",
    "change-status": "Changer le statut",
    "print-invoice": "Impression",
    "patient-record": "Dossier patient",
  } as Record<OperationKind, string>)[kind];
}
