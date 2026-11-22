import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/auth-context";
import { PageMessage } from "../components/PageMessage";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { calculateRequirements, orderProducts } from "../utils/orders";

export function OrderDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(location.state?.message || "");

    useEffect(() => {
        let active = true;
        setLoading(true);
        setOrder(null);
        setError("");
        async function loadOrder() {
            try {
                const response = await api.get(`/api/production-orders/${id}`);
                if (active) {
                    setOrder(response.data.order);
                }
            } catch (err) {
                if (!active) {
                    return;
                }
                if (err.response && err.response.status === 403) {
                    navigate("/forbidden", { replace: true });
                } else {
                    setError(errorMessage(err));
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }
        loadOrder();
        return () => {
            active = false;
        };
    }, [id, navigate]);

    let requirements = [];
    if (order) {
        requirements = calculateRequirements(orderProducts(order));
    }

    async function transition(action) {
        if (saving) {
            return false;
        }
        setError("");
        setSuccess("");
        setSaving(true);
        try {
            const response = await api.patch(`/api/production-orders/${id}/${action}`);
            setOrder(response.data.order);
            if (action === "start") {
                setSuccess("Ordre demarre. Les stocks ont ete mis a jour.");
            } else if (action === "complete") {
                setSuccess("Ordre termine.");
            } else {
                setSuccess("Ordre annule.");
            }
            return true;
        } catch (err) {
            setError(errorMessage(err));
            return false;
        } finally {
            setSaving(false);
        }
    }

    async function confirm() {
        const saved = await transition(confirmation);
        if (saved) {
            setConfirmation("");
        }
    }

    return (
        <>
            <div className="page-heading">
                <h1>Details de l'ordre</h1>
                <Link className="text-link" to="/orders">
                    Liste des ordres
                </Link>
            </div>
            <PageMessage loading={loading} error={confirmation ? "" : error} success={success} />
            {order && (
                <>
                    <section className="card space-y-4">
                        <div className="page-heading">
                            <h2>Ordre {order._id.slice(-8)}</h2>
                            <StatusBadge status={order.status} />
                        </div>
                        <div className="grid gap-4 text-sm sm:grid-cols-2">
                            <p className="muted">
                                Cree le {new Date(order.createdAt).toLocaleString("fr-FR")}
                            </p>
                            <p className="muted">
                                Operateur :{" "}
                                {order.assignedOperator?.name ||
                                    (user.role === "OPERATOR" ? user.name : order.assignedOperator)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {order.status === "PLANNED" && (
                                <button
                                    className="btn"
                                    disabled={saving}
                                    onClick={() => {
                                        setError("");
                                        setConfirmation("start");
                                    }}
                                >
                                    Demarrer l'ordre
                                </button>
                            )}
                            {order.status === "IN_PROGRESS" && (
                                <button
                                    className="btn"
                                    disabled={saving}
                                    onClick={() => transition("complete")}
                                >
                                    {saving ? "Enregistrement..." : "Terminer l'ordre"}
                                </button>
                            )}
                            {user.role === "ADMIN" && order.status === "PLANNED" && (
                                <>
                                    <Link className="btn-secondary" to={`/orders/${id}/edit`}>
                                        Modifier
                                    </Link>
                                    <button
                                        className="btn-danger"
                                        disabled={saving}
                                        onClick={() => {
                                            setError("");
                                            setConfirmation("cancel");
                                        }}
                                    >
                                        Annuler l'ordre
                                    </button>
                                </>
                            )}
                        </div>
                        {order.startedAt && (
                            <p className="muted">
                                Demarre le {new Date(order.startedAt).toLocaleString("fr-FR")}
                            </p>
                        )}
                        {order.completedAt && (
                            <p className="muted">
                                Termine le {new Date(order.completedAt).toLocaleString("fr-FR")}
                            </p>
                        )}
                        {order.cancelledAt && (
                            <p className="muted">
                                Annule le {new Date(order.cancelledAt).toLocaleString("fr-FR")}
                            </p>
                        )}
                    </section>
                    <section className="space-y-3">
                        <h2>Produits a fabriquer</h2>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Reference</th>
                                        <th scope="col">Produit</th>
                                        <th scope="col">Quantite</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderProducts(order).map((product) => (
                                        <tr key={product.productReference}>
                                            <td>{product.productReference}</td>
                                            <th scope="row">{product.productName}</th>
                                            <td>{product.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <section className="space-y-3">
                        <h2>Besoins en matieres</h2>
                        <p className="muted">
                            Calcul effectue a partir des compositions enregistrees dans cet ordre.
                        </p>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Matiere</th>
                                        <th scope="col">Reference</th>
                                        <th scope="col">Quantite totale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requirements.map((line) => (
                                        <tr key={line.id}>
                                            <th scope="row">{line.name}</th>
                                            <td>{line.reference}</td>
                                            <td>
                                                {Number(line.quantity.toFixed(6))} {line.unit}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
            {confirmation && (
                <Modal
                    title={
                        confirmation === "start"
                            ? "Demarrer la fabrication ?"
                            : "Annuler cet ordre ?"
                    }
                    onClose={() => setConfirmation("")}
                    busy={saving}
                >
                    <p className="muted mb-4">
                        {confirmation === "start"
                            ? "Les matieres necessaires seront deduites du stock. Si une matiere manque, aucune quantite ne sera consommee."
                            : "Cet ordre ne pourra plus etre demarre."}
                    </p>
                    {error && (
                        <p role="alert" className="error mb-4">
                            {error}
                        </p>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            className="btn-secondary"
                            disabled={saving}
                            onClick={() => setConfirmation("")}
                        >
                            Retour
                        </button>
                        <button
                            className={confirmation === "start" ? "btn" : "btn-danger"}
                            disabled={saving}
                            onClick={confirm}
                        >
                            {saving ? "Enregistrement..." : "Confirmer"}
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}
