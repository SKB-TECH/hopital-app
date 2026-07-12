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
    "confirm-birth": "Confirmer la naissance",
    "send-to-surgery": "Envoyer au bloc",
    "surgery-status": "Statut salle de bloc",
    "validate-material-count": "Valider le comptage",
    "validate-oms-step": "Valider checklist OMS",
    "change-status": "Changer le statut",
    "print-invoice": "Impression",
    "patient-record": "Dossier patient",
  } as Record<OperationKind, string>)[kind];
}
