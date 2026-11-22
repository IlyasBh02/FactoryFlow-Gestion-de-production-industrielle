import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { errorMessage } from "../services/api";

export function Login() {
    const { user, login, notice } = useAuth();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function submit(event) {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setError("");
        try {
            await login(email, password);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    if (user) return <Navigate to={location.state?.from || "/dashboard"} replace />;

    return (
        <main className="auth-page">
            <section className="auth-card">
                <p className="brand">
                    Factory<span>Flow</span>
                </p>
                <div>
                    <h1>Connexion</h1>
                    <p className="muted mt-2">Connectez-vous pour acceder a votre espace.</p>
                </div>
                {(notice || location.state?.message) && (
                    <p role="status" className="muted">
                        {notice || location.state.message}
                    </p>
                )}
                {error && (
                    <p role="alert" className="error">
                        {error}
                    </p>
                )}
                <form className="space-y-4" onSubmit={submit}>
                    <div>
                        <label className="label" htmlFor="login-email">
                            Email
                        </label>
                        <input
                            className="input"
                            id="login-email"
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="login-password">
                            Mot de passe
                        </label>
                        <input
                            className="input"
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>
                    <button className="btn w-full" disabled={saving}>
                        {saving ? "Connexion..." : "Se connecter"}
                    </button>
                </form>
                <p className="muted">Les comptes operateurs sont crees par l'administrateur.</p>
            </section>
        </main>
    );
}
