import { useMutation, useQueryClient } from "@tanstack/react-query";
import { couponService } from "@/shared/services/coupon.service";
import type { CreateCouponPayload } from "@/shared/types/coupon.types";

export function useCreateCoupon() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCouponPayload) => couponService.createCoupon(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dashboard", "promotions"] });
        },
    });
}
