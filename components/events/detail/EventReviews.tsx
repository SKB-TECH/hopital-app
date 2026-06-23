"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useGetPublicEventReviews } from "@/shared/hooks/public-event.hooks";
import { portalService } from "@/shared/services/portal.service";
import { tokenStore } from "@/shared/lib/tokenStore";
import { useLocalizedPath } from "@/shared/hooks/useLocalizedPath";
import { useTranslations } from "next-intl";

export default function EventReviews({ slug }: { slug: string }) {
    const router = useRouter();
    const t = useTranslations("eventDetail");
    const { getLocalizedHref } = useLocalizedPath();
    const { data, isLoading, refetch } = useGetPublicEventReviews(slug);
    const reviews = data?.data ?? [];
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);

    const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!tokenStore.get()) {
            router.push(getLocalizedHref(`/auth?mode=login&next=/events/${slug}`));
            return;
        }

        if (!comment.trim()) {
            toast.warning(t("reviewRequired"));
            return;
        }

        setSaving(true);
        try {
            await portalService.reviewEvent(slug, {
                rating,
                title: title.trim() || undefined,
                comment: comment.trim(),
            });
            setTitle("");
            setComment("");
            setRating(5);
            await refetch();
            toast.success(t("reviewPublished"));
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t("reviewError"));
        } finally {
            setSaving(false);
        }
    };

    const form = (
        <form onSubmit={submitReview} className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">{t("reviewFormTitle")}</h3>
            <div className="mt-4 flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setRating(index + 1)}
                        className="text-[#0067A8]"
                    >
                        <Star className={`size-5 ${index < rating ? "fill-[#0067A8]" : "fill-transparent"}`} />
                    </button>
                ))}
            </div>
            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("reviewTitlePlaceholder")}
                className="mt-4 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0067A8]"
            />
            <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t("reviewCommentPlaceholder")}
                rows={4}
                className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#0067A8]"
            />
            <button
                disabled={saving}
                className="mt-3 rounded-lg bg-[#0067A8] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
                {saving ? t("publishing") : t("publishReview")}
            </button>
        </form>
    );

    if (isLoading) {
        return (
            <section className="py-8">
                <h2 className="mb-4 font-bold text-[#131827]">{t("reviews")}</h2>
                {form}
                <p className="text-sm text-slate-500">{t("loadingReviews")}</p>
            </section>
        );
    }

    if (!reviews.length) {
        return (
            <section className="py-8">
                <h2 className="mb-4 font-bold text-[#131827]">{t("reviews")}</h2>
                {form}
                <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
                    {t("noReviews")}
                </div>
            </section>
        );
    }

    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    return (
        <section className="py-8">
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="font-bold text-[#131827]">{t("reviews")}</h2>
                <div className="flex items-center gap-2 text-sm font-bold text-[#0067A8]">
                    <Star className="size-4 fill-[#0067A8]" />
                    {average.toFixed(1)} / 5
                </div>
            </div>

            {form}

            <div className="space-y-4">
                {reviews.map((review) => (
                    <article key={review.id} className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-bold text-slate-900">{review.attendeeName}</p>
                                <p className="text-xs text-slate-500">
                                    {new Date(review.createdAt ?? review.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-[#0067A8]">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                        key={index}
                                        className={`size-4 ${index < review.rating ? "fill-[#0067A8]" : "fill-transparent"}`}
                                    />
                                ))}
                            </div>
                        </div>
                        {review.title ? <h3 className="mt-4 font-bold text-slate-900">{review.title}</h3> : null}
                        <p className="mt-2 text-sm leading-6 text-slate-600">{review.reviewText}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
