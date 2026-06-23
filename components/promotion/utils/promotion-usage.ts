export function getUsagePercentage(used: number, limit: string): number {
    if (limit === "Unlimited") return 0;
    const limitNum = parseInt(limit, 10);
    if (!limitNum || Number.isNaN(limitNum)) return 0;
    return (used / limitNum) * 100;
}
