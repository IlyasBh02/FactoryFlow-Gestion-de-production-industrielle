import { Link } from "react-router-dom";
import { Factory, Boxes, Package, ClipboardList } from "lucide-react";

export function Welcome() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
            <div className="w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl sm:p-12">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Factory size={28} aria-hidden="true" />
                </div>

                <p className="mb-3 text-sm font-medium text-slate-400">Welcome to</p>
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    Factory<span className="text-indigo-500">Flow</span>
                </h1>
                <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
                    Keep your materials, products, and production orders organized in one place.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        to="/register"
                        className="rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400 active:scale-[0.98]"
                    >
                        Create an account
                    </Link>
                    <Link
                        to="/login"
                        className="rounded-lg border border-slate-700 bg-slate-800 px-8 py-3 text-sm font-semibold text-slate-300 transition hover:border-indigo-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400 active:scale-[0.98]"
                    >
                        Sign in
                    </Link>
                </div>

                <div className="mt-10 grid gap-6 border-t border-slate-800 pt-8 sm:grid-cols-3">
                    <div>
                        <Boxes
                            size={22}
                            className="mx-auto mb-3 text-indigo-400"
                            aria-hidden="true"
                        />
                        <h2 className="text-sm font-medium text-slate-300">Materials</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                            Keep track of your stock.
                        </p>
                    </div>
                    <div>
                        <Package
                            size={22}
                            className="mx-auto mb-3 text-indigo-400"
                            aria-hidden="true"
                        />
                        <h2 className="text-sm font-medium text-slate-300">Products</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                            Organize what you produce.
                        </p>
                    </div>
                    <div>
                        <ClipboardList
                            size={22}
                            className="mx-auto mb-3 text-indigo-400"
                            aria-hidden="true"
                        />
                        <h2 className="text-sm font-medium text-slate-300">Production</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                            Follow your production orders.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
