import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/auth-context";

export function NavBar() {
    const { user, logout } = useAuth();
    const [leaving, setLeaving] = useState(false);

    async function handleLogout() {
        setLeaving(true);
        await logout();
        setLeaving(false);
    }

    return (
        <header className="site-header">
            <div className="nav-top">
                <Link to="/dashboard" className="brand">
                    Factory<span>Flow</span>
                </Link>
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm text-slate-400">
                        {user.name} · {user.role === "ADMIN" ? "Admin" : "Operateur"}
                    </span>
                    <button className="btn-secondary" onClick={handleLogout} disabled={leaving}>
                        {leaving ? "Deconnexion..." : "Deconnexion"}
                    </button>
                </div>
            </div>
            <nav aria-label="Navigation principale" className="nav-links">
                <NavLink to="/dashboard">Tableau de bord</NavLink>
                {user.role === "ADMIN" && (
                    <>
                        <NavLink to="/material">Matieres</NavLink>
                        <NavLink to="/products">Produits</NavLink>
                        <NavLink to="/stock">Stocks</NavLink>
                        <NavLink to="/operators">Operateurs</NavLink>
                    </>
                )}
                <NavLink to="/orders">{user.role === "ADMIN" ? "Ordres" : "Mes ordres"}</NavLink>
            </nav>
        </header>
    );
}
