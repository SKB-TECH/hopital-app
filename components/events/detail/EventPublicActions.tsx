"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { portalService, type PortalEventReaction } from "@/shared/services/portal.service";
import { tokenStore } from "@/shared/lib/tokenStore";
import { useLocalizedPath } from "@/shared/hooks/useLocalizedPath";
import { useTranslations } from "next-intl";

export default function EventPublicActions({
    slug,
    initialLikeCount = 0,
    initialReviewCount = 0,
}: {
    slug: string;
    initialLikeCount?: number;
    initialReviewCount?: number;
}) {
    const router = useRouter();
    const t = useTranslations("eventDetail");
    const { getLocalizedHref } = useLocalizedPath();
    const [reaction, setReaction] = useState<PortalEventReaction>({
        eventId: "",
        liked: false,
        likeCount: initialLikeCount,
        reviewCount: initialReviewCount,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!tokenStore.get()) return;

        portalService
            .eventReaction(slug)
            .then(setReaction)
            .catch(() => undefined);
    }, [slug]);

    const requireLogin = () => {
        router.push(getLocalizedHref(`/auth?mode=login&next=/events/${slug}`));
    };

    const toggleLike = async () => {
        if (!tokenStore.get()) {
            requireLogin();
            return;
        }

        setLoading(true);
        try {
            const next = reaction.liked
                ? await portalService.unlikeEvent(slug)
                : await portalService.likeEvent(slug);
            setReaction(next);
            toast.success(next.liked ? t("likedAdded") : t("likedRemoved"));
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t("reactionError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
                type="button"
                onClick={toggleLike}
                disabled={loading}
                className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
                    reaction.liked
                        ? "border-[#0067A8] bg-[#E7F3FB] text-[#0067A8]"
                        : "border-slate-300 bg-white text-slate-700 hover:border-[#0067A8] hover:text-[#0067A8]"
                }`}
            >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Heart className={`size-4 ${reaction.liked ? "fill-[#0067A8]" : ""}`} />}
                {reaction.likeCount} {t("likes")}
            </button>

            <span className="text-sm font-semibold text-slate-500">
                {t("reviewsCount", { count: reaction.reviewCount })}
            </span>
        </div>
    );
}
