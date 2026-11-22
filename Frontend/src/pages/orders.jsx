import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";

import { PageMessage } from "../components/PageMessage";
import { StatusBadge } from "../components/StatusBadge";
import { orderProducts, statuses } from "../utils/orders";

export function Orders() {
    
    const [orders, setOrders] = useState([]);
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        product: "",
        from: "",
        to: ""
    });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        async function loadOrders() {
            try {
                const response = await api.get("/api/production-orders");
                if (active) {
                    setOrders(response.data.orders);
                }
            } catch (err) {
                if (active) {
                    setError(errorMessage(err));
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }
        loadOrders();
        return () => {
            active = false;
        };
    }, []);

    function filter(field, value) {
        setFilters({ ...filters, [field]: value });
        setPage(1);
    }

    // Garder chaque produit une seule fois dans le filtre.
    const products = [];
    for (const order of orders) {
        for (const product of orderProducts(order)) {
            const exists = products.find(function (item) {
                return item.reference === product.productReference;
            });
            if (!exists) {
                products.push({ reference: product.productReference, name: product.productName });
            }
        }
    }

    const filtered = orders.filter(function (order) {
        const lines = orderProducts(order);
        let text = order._id;
        for (const product of lines) {
            text += " " + product.productReference + " " + product.productName;
        }
        if (!text.toLowerCase().includes(filters.search.trim().toLowerCase())) {
            return false;
        }
        if (filters.status && order.status !== filters.status) {
            return false;
        }
        if (filters.product) {
            const product = lines.find(function (line) {
                return line.productReference === filters.product;
            });
            if (!product) {
                return false;
            }
        }

        const date = new Date(order.createdAt);
        if (filters.from && date < new Date(filters.from + "T00:00:00")) {
            return false;
        }
        if (filters.to && date > new Date(filters.to + "T23:59:59.999")) {
            return false;
        }
        return true;
    });
    const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
    const visible = filtered.slice((page - 1) * 10, page * 10);

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>{"Ordres de fabrication"}</h1>
                    <p>
                        {"Planifiez et suivez la fabrication."}
                    </p>
                </div>
                {<Link className="btn" to="/orders/new">
                        Nouvel ordre
                    </Link>}
            </div>
            <PageMessage loading={loading} error={error} />
            <section
                aria-label="Filtres des ordres"
                className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
                <div>
                    <label className="label" htmlFor="order-search">
                        Recherche
                    </label>
                    <input
                        className="input"
                        id="order-search"
                        type="search"
                        placeholder="Produit ou identifiant"
                        value={filters.search}
                        onChange={(event) => filter("search", event.target.value)}
                    />
                </div>
                <div>
                    <label className="label" htmlFor="order-status">
                        Statut
                    </label>
                    <select
                        className="input"
                        id="order-status"
                        value={filters.status}
                        onChange={(event) => filter("status", event.target.value)}
                    >
                        <option value="">Tous les statuts</option>
                        {Object.keys(statuses).map((status) => (
                            <option key={status} value={status}>
                                {statuses[status]}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label" htmlFor="order-product">
                        Produit
                    </label>
                    <select
                        className="input"
                        id="order-product"
                        value={filters.product}
                        onChange={(event) => filter("product", event.target.value)}
                    >
                        <option value="">Tous les produits</option>
                        {products.map((product) => (
                            <option key={product.reference} value={product.reference}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label" htmlFor="order-from">
                        Cree a partir du
                    </label>
                    <input
                        className="input"
                        id="order-from"
                        type="date"
                        value={filters.from}
                        max={filters.to || undefined}
                        onChange={(event) => filter("from", event.target.value)}
                    />
                </div>
                <div>
                    <label className="label" htmlFor="order-to">
                        Jusqu'au
                    </label>
                    <input
                        className="input"
                        id="order-to"
                        type="date"
                        value={filters.to}
                        min={filters.from || undefined}
                        onChange={(event) => filter("to", event.target.value)}
                    />
                </div>
                <button
                    className="text-link text-left"
                    onClick={() => {
                        setFilters({ search: "", status: "", product: "", from: "", to: "" });
                        setPage(1);
                    }}
                >
                    Reinitialiser les filtres
                </button>
            </section>
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Ordre</th>
                            <th scope="col">Produits</th>
                            <th scope="col">Date</th>
                            <th scope="col">Statut</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((order) => (
                            <tr key={order._id}>
                                <th scope="row">{order._id.slice(-8)}</th>
                                <td>
                                    {orderProducts(order).map((product) => (
                                        <p key={product.productReference}>
                                            {product.productName} × {product.quantity}
                                        </p>
                                    ))}
                                </td>
                                <td>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</td>
                                <td>
                                    <StatusBadge status={order.status} />
                                </td>
                                <td>
                                    <Link className="text-link" to={`/orders/${order._id}`}>
                                        Voir les details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {!loading && !visible.length && (
                            <tr>
                                <td colSpan={5} className="empty">
                                    Aucun ordre trouve.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="muted" aria-live="polite">
                    {filtered.length} ordre(s) · Page {page} sur {pageCount}
                </p>
                <div className="flex gap-2">
                    <button
                        className="btn-secondary"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                    >
                        Precedent
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= pageCount}
                    >
                        Suivant
                    </button>
                </div>
            </div>
        </>
    );
}
