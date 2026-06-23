export type CreateCouponPayload = {
    eventId: string;
    code: string;
    discount: number;
    maxUses: number;
    expiresAt: string;
};
