import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { AccountForm } from "../components/AccountForm";

export function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function register(data) {
        if (saving) return;
        setSaving(true);
        setError("");
        try {
            await api.post("/api/auth/register", data);
            navigate("/operators", { state: { message: "Operateur cree." } });
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="page-heading">
                <h1>Nouvel operateur</h1>
                <Link to="/operators" className="text-link">
                    Liste des operateurs
                </Link>
            </div>
            <section className="card max-w-lg space-y-4">
                <p className="muted">Le compte aura le role operateur.</p>
                {error && (
                    <p role="alert" className="error">
                        {error}
                    </p>
                )}
                <AccountForm onSubmit={register} saving={saving} buttonText="Creer le compte" />
            </section>
        </>
    );
}
