import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/auth-context";
import { AccountForm } from "../components/AccountForm";

export function Installation() {
    const { setInstalled } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function install(data) {
        if (saving) return;
        setSaving(true);
        setError("");
        try {
            await api.post("/api/installation", data);
            setInstalled(true);
            navigate("/login", {
                replace: true,
                state: {
                    message:
                        "Installation terminee. Connectez-vous avec votre compte administrateur."
                }
            });
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <p className="brand">
                    Factory<span>Flow</span>
                </p>
                <div>
                    <h1>Premiere installation</h1>
                    <p className="muted mt-2">Creez le compte administrateur pour commencer.</p>
                </div>
                {error && (
                    <p role="alert" className="error">
                        {error}
                    </p>
                )}
                <AccountForm
                    onSubmit={install}
                    saving={saving}
                    buttonText="Installer FactoryFlow"
                />
            </section>
        </main>
    );
}
