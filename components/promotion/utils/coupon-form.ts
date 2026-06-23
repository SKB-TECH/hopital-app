export function parseDiscountValue(raw: string): number {
    const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
    const value = parseFloat(cleaned);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function parseMaxUses(raw: string): number {
    const trimmed = raw.trim().toLowerCase();
    if (
        !trimmed ||
        trimmed === "illimité" ||
        trimmed === "illimite" ||
        trimmed === "unlimited" ||
        trimmed === "∞"
    ) {
        return 0;
    }
    const value = parseInt(trimmed, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

export function toExpiresAtIso(dateValue: string): string {
    return new Date(`${dateValue}T23:59:59.999Z`).toISOString();
}
