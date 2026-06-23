import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
    page: number;
    pages: number;
    onChange: (page: number) => void;
};

export default function DiscoverPagination({ page, pages, onChange }: Props) {
    if (pages <= 1) return null;

    return (
        <div className="mt-14 flex justify-center gap-3">
            <button
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border bg-white disabled:opacity-40"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>

            {Array.from({ length: pages }).map((_, index) => {
                const pageNumber = index + 1;

                return (
                    <button
                        key={pageNumber}
                        onClick={() => onChange(pageNumber)}
                        className={`h-11 w-11 rounded-lg border font-bold ${
                            page === pageNumber
                                ? "border-[#0067A8] bg-[#0067A8] text-white"
                                : "bg-white text-[#131827]"
                        }`}
                    >
                        {pageNumber}
                    </button>
                );
            })}

            <button
                disabled={page >= pages}
                onClick={() => onChange(page + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border bg-white disabled:opacity-40"
            >
                <ChevronRight className="h-5 w-5" />
            </button>
        </div>
    );
}
