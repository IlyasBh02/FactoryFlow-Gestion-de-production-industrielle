import { Link } from "react-router-dom";

export function Forbidden() {
    return (
        <section className="card space-y-4">
            <h1>Acces refuse</h1>
            <p className="muted">Votre compte ne permet pas d'acceder a cette page.</p>
            <Link className="btn-secondary" to="/dashboard">
                Tableau de bord
            </Link>
        </section>
    );
}

export function NotFound() {
    return (
        <main className="page">
            <section className="card space-y-4">
                <h1>Page introuvable</h1>
                <p className="muted">Cette adresse ne correspond a aucune page.</p>
                <Link className="btn" to="/">
                    Accueil
                </Link>
            </section>
        </main>
    );
}
