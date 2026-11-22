export function CardDashboard({ totalMachine, title = "Total Material" }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">{title}</p>
                <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400"></div>
            </div>
            <p className="mt-3 text-3xl font-bold">{totalMachine}</p>
        </div>
    );
}
