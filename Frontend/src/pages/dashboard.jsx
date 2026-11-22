import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/auth-context";
import { PageMessage } from "../components/PageMessage";
import { StatusBadge } from "../components/StatusBadge";
import { orderProducts, statuses } from "../utils/orders";

export function Dashboard() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [products, setProducts] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        async function load() {
            try {
                const orderResponse = await api.get("/api/production-orders");
                if (active) {
                    setOrders(orderResponse.data.orders);
                }

                if (user.role === "ADMIN") {
                    const materialResponse = await api.get("/api/material/all");
                    const productResponse = await api.get("/api/product/all");
                    const stockResponse = await api.get("/api/stock/all");
                    if (active) {
                        setMaterials(materialResponse.data.allMaterial);
                        setProducts(productResponse.data.allProduct);
                        setStocks(stockResponse.data.stocks);
                    }
                }
            } catch (err) {
                if (active) setError(errorMessage(err));
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => {
            active = false;
        };
    }, [user.role]);

    const alerts = stocks.filter((stock) => stock.quantityCurrent < (stock.alertThreshold || 0));
    const cards = [];
    if (user.role === "ADMIN") {
        cards.push({ label: "Matieres", count: materials.length, to: "/material" });
        cards.push({ label: "Produits", count: products.length, to: "/products" });
        cards.push({ label: "Ordres", count: orders.length, to: "/orders" });
    } else {
        cards.push({ label: "Mes ordres", count: orders.length, to: "/orders" });
    }

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Tableau de bord</h1>
                    <p>Bonjour {user.name}, voici le suivi de votre production.</p>
                </div>
            </div>
            <PageMessage loading={loading} error={error} />
            {!loading && !error && (
                <>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {cards.map((card) => (
                            <Link
                                to={card.to}
                                className="card hover:border-indigo-500/50"
                                key={card.label}
                            >
                                <p className="muted">{card.label}</p>
                                <p className="mt-3 text-3xl font-bold">{card.count}</p>
                            </Link>
                        ))}
                    </div>
                    <section className="card space-y-4">
                        <h2>Repartition des ordres</h2>
                        <div className="grid gap-4 sm:grid-cols-4">
                            {Object.keys(statuses).map((status) => (
                                <div key={status}>
                                    <StatusBadge status={status} />
                                    <p className="mt-3 text-2xl font-semibold">
                                        {orders.filter((order) => order.status === status).length}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                    {user.role === "ADMIN" && (
                        <section className="card space-y-4">
                            <div className="page-heading">
                                <h2>Alertes de stock</h2>
                                <Link className="text-link" to="/stock">
                                    Gerer les stocks
                                </Link>
                            </div>
                            {alerts.length ? (
                                <ul className="divide-y divide-slate-800">
                                    {alerts.map((stock) => (
                                        <li
                                            className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                                            key={stock._id}
                                        >
                                            <span>{stock.material?.name}</span>
                                            <span className="text-amber-300">
                                                {stock.quantityCurrent} {stock.material?.unit}{" "}
                                                disponibles · seuil {stock.alertThreshold}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="muted">Aucune matiere sous son seuil d'alerte.</p>
                            )}
                        </section>
                    )}
                    <section className="space-y-3">
                        <div className="page-heading">
                            <h2>Derniers ordres</h2>
                            <Link className="text-link" to="/orders">
                                Tous les ordres
                            </Link>
                        </div>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Ordre</th>
                                        <th scope="col">Produits</th>
                                        <th scope="col">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.slice(0, 5).map((order) => (
                                        <tr key={order._id}>
                                            <th scope="row">
                                                <Link
                                                    className="text-link"
                                                    to={`/orders/${order._id}`}
                                                >
                                                    {order._id.slice(-8)}
                                                </Link>
                                            </th>
                                            <td>
                                                {orderProducts(order)
                                                    .map((product) => product.productName)
                                                    .join(", ")}
                                            </td>
                                            <td>
                                                <StatusBadge status={order.status} />
                                            </td>
                                        </tr>
                                    ))}
                                    {!orders.length && (
                                        <tr>
                                            <td colSpan={3} className="empty">
                                                Aucun ordre pour le moment.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </>
    );
}
