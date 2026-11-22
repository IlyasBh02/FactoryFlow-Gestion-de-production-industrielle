import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { PageMessage } from "../components/PageMessage";

export function Operators() {
    const location = useLocation();
    const [operators, setOperators] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(location.state?.message || "");

    async function load() {
        try {
            setOperators((await api.get("/api/auth/operators")).data.operators);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        load();
    }, []);

    async function save(event) {
        event.preventDefault();
        if (saving) return;
        setError("");
        setSuccess("");
        if (!selected.name.trim()) {
            setError("Le nom est obligatoire.");
            return;
        }
        setSaving(true);
        try {
            await api.put(`/api/auth/operators/${selected._id}`, {
                name: selected.name.trim(),
                email: selected.email.trim().toLowerCase()
            });
            await load();
            setSelected(null);
            setSuccess("Operateur modifie.");
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Operateurs</h1>
                    <p>Les personnes qui executent les ordres de fabrication.</p>
                </div>
                <Link className="btn" to="/register">
                    Nouvel operateur
                </Link>
            </div>
            <PageMessage loading={loading} error={error} success={success} />
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Nom</th>
                            <th scope="col">Email</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operators.map((operator) => (
                            <tr key={operator._id}>
                                <th scope="row">{operator.name}</th>
                                <td>{operator.email}</td>
                                <td>
                                    <button
                                        className="btn-secondary"
                                        disabled={saving}
                                        onClick={() => setSelected({ ...operator })}
                                    >
                                        Modifier
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && !operators.length && (
                            <tr>
                                <td className="empty" colSpan={3}>
                                    Aucun operateur. Creez un compte pour affecter vos ordres.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {selected && (
                <section className="card max-w-lg space-y-4">
                    <h2>Modifier l'operateur</h2>
                    <form onSubmit={save} className="space-y-4">
                        <div>
                            <label className="label" htmlFor="operator-name">
                                Nom
                            </label>
                            <input
                                className="input"
                                id="operator-name"
                                value={selected.name}
                                onChange={(event) =>
                                    setSelected({ ...selected, name: event.target.value })
                                }
                                required
                            />
                        </div>
                        <div>
                            <label className="label" htmlFor="operator-email">
                                Email
                            </label>
                            <input
                                className="input"
                                id="operator-email"
                                type="email"
                                value={selected.email}
                                onChange={(event) =>
                                    setSelected({ ...selected, email: event.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button className="btn" disabled={saving}>
                                {saving ? "Enregistrement..." : "Enregistrer"}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                disabled={saving}
                                onClick={() => setSelected(null)}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </>
    );
}
