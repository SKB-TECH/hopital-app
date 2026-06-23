type LoaderProps = {
    label?: string;
    fullScreen?: boolean;
};

export function Loader({ label = "Chargement en cours...", fullScreen = false }: LoaderProps) {
    return (
        <div
            className={`flex items-center justify-center ${
                fullScreen ? "min-h-screen" : "py-6"
            }`}
        >
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded border-4 border-gray-200 border-t-emerald-500 animate-spin" />
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}
