import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { NavBar } from "./NavBar";

export function PrivateRoute({ adminOnly = false }) {
    const { user } = useAuth();
    const location = useLocation();
    if (!user)
        return (
            <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
        );
    if (adminOnly && user.role !== "ADMIN") return <Navigate to="/forbidden" replace />;
    return <Outlet />;
}

export function Layout() {
    return (
        <>
            <a href="#content" className="skip-link">
                Aller au contenu
            </a>
            <NavBar />
            <main id="content" className="page">
                <Outlet />
            </main>
        </>
    );
}
