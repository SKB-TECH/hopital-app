export type PromotionType = "percentage" | "fixed";
export type PromotionStatus = "active" | "expired";

export type Promotion = {
    id: string;
    code: string;
    discount: string;
    type: PromotionType;
    usageLimit: string;
    used: number;
    expiryDate: string;
    status: PromotionStatus;
    createdAt: string;
};

export type PromotionsMetrics = {
    discountCodesActive: number;
    referralLinksCreated: number;
    salesFromPromotions: number;
};

export type PromotionsStatusCounts = {
    active: number;
    expired: number;
};
