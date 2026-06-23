import { api } from "@/shared/lib/http/api";
import type { CreateCouponPayload } from "@/shared/types/coupon.types";

export const couponService = {
    async createCoupon(payload: CreateCouponPayload): Promise<unknown> {
        const res = await api.post("/coupons", payload);
        return res.data;
    },
};
