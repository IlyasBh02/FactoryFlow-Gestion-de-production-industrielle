import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { PageMessage } from "../components/PageMessage";

const movementLabels = {
    INITIAL: "Stock initial",
    ENTRY: "Entree",
    EXIT: "Sortie",
    ADJUSTMENT: "Correction"
};

export function Stock() {
    const [stocks, setStocks] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [search, setSearch] = useState("");
    const [data, setData] = useState({ material: "", quantityInitial: "0", alertThreshold: "0" });
    const [selectedId, setSelectedId] = useState("");
    const [entry, setEntry] = useState("");
    const [threshold, setThreshold] = useState("0");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function load() {
        try {
            const stockResponse = await api.get("/api/stock/all");
            const materialResponse = await api.get("/api/material/all");
            setStocks(stockResponse.data.stocks);
            setMaterials(materialResponse.data.allMaterial);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        load();
    }, []);

    async function create(event) {
        event.preventDefault();
        if (saving) return;
        setError("");
        setSuccess("");
        const initialQuantity = Number(data.quantityInitial);
        const alertThreshold = Number(data.alertThreshold);
        if (!data.material) {
            setError("Choisissez une matiere.");
            return;
        }
        if (!Number.isFinite(initialQuantity) || initialQuantity < 0) {
            setError("La quantite initiale doit etre positive ou nulle.");
            return;
        }
        if (!Number.isFinite(alertThreshold) || alertThreshold < 0) {
            setError("Le seuil doit etre positif ou nul.");
            return;
        }
        setSaving(true);
        try {
            await api.post("/api/stock/newStock", {
                material: data.material,
                quantityInitial: initialQuantity,
                alertThreshold: alertThreshold
            });
            setData({ material: "", quantityInitial: "0", alertThreshold: "0" });
            setSuccess("Stock initialise.");
            await load();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function addEntry(event) {
        event.preventDefault();
        if (saving) return;
        setError("");
        setSuccess("");
        const quantity = Number(entry);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            setError("La quantite d'entree doit etre strictement positive.");
            return;
        }
        setSaving(true);
        try {
            await api.post(`/api/stock/entry/${selectedId}`, { quantity: quantity });
            setEntry("");
            setSuccess("Entree de stock enregistree.");
            await load();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function updateThreshold(event) {
        event.preventDefault();
        if (saving) {
            return;
        }
        setError("");
        setSuccess("");

        const alertThreshold = Number(threshold);
        if (!Number.isFinite(alertThreshold) || alertThreshold < 0) {
            setError("Le seuil doit etre positif ou nul.");
            return;
        }

        setSaving(true);
        try {
            await api.put(`/api/stock/update/${selectedId}`, { alertThreshold: alertThreshold });
            setSuccess("Seuil modifie.");
            await load();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    function selectStock(stock) {
        setSelectedId(stock._id);
        setThreshold(String(stock.alertThreshold ?? 0));
        setEntry("");
    }

    const availableMaterials = materials.filter(
        (material) => !stocks.some((stock) => stock.material?._id === material._id)
    );
    const filtered = stocks.filter((stock) =>
        `${stock.material?.name} ${stock.material?.reference}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
    );
    const selected = stocks.find((stock) => stock._id === selectedId);
    let movements = [];
    if (selected && selected.movements) {
        movements = [...selected.movements];
        movements.reverse();
    }

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Stocks</h1>
                    <p>Quantites disponibles, entrees et historique des mouvements.</p>
                </div>
            </div>
            <PageMessage loading={loading} error={error} success={success} />
            <div className="grid items-start gap-6 lg:grid-cols-3">
                <section className="min-w-0 space-y-4 lg:col-span-2" aria-label="Liste des stocks">
                    <div>
                        <label className="label" htmlFor="stock-search">
                            Rechercher une matiere
                        </label>
                        <input
                            className="input"
                            id="stock-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Matiere</th>
                                    <th scope="col">Disponible</th>
                                    <th scope="col">Seuil</th>
                                    <th scope="col">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((stock) => (
                                    <tr key={stock._id}>
                                        <th scope="row">
                                            {stock.material?.name || "Matiere indisponible"}
                                            <span className="mt-1 block text-xs text-slate-400">
                                                {stock.material?.reference}
                                            </span>
                                        </th>
                                        <td
                                            className={
                                                stock.quantityCurrent < stock.alertThreshold
                                                    ? "text-amber-300"
                                                    : ""
                                            }
                                        >
                                            {stock.quantityCurrent} {stock.material?.unit}
                                            {stock.quantityCurrent < stock.alertThreshold && (
                                                <span className="mt-1 block text-xs">
                                                    Sous le seuil
                                                </span>
                                            )}
                                        </td>
                                        <td>{stock.alertThreshold ?? 0}</td>
                                        <td>
                                            <button
                                                className="btn-secondary"
                                                disabled={saving}
                                                onClick={() => selectStock(stock)}
                                            >
                                                Gerer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && !filtered.length && (
                                    <tr>
                                        <td colSpan={4} className="empty">
                                            Aucun stock trouve.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                <section className="card space-y-4">
                    <h2>Initialiser un stock</h2>
                    {!loading && !availableMaterials.length && (
                        <p className="muted">
                            Toutes les matieres existantes ont deja un stock, ou aucune matiere n'a
                            encore ete creee.
                        </p>
                    )}
                    <form onSubmit={create} className="space-y-4">
                        <fieldset
                            className="space-y-4"
                            disabled={saving || !availableMaterials.length}
                        >
                            <legend className="sr-only">Nouveau stock</legend>
                            <div>
                                <label className="label" htmlFor="stock-material">
                                    Matiere
                                </label>
                                <select
                                    className="input"
                                    id="stock-material"
                                    value={data.material}
                                    onChange={(event) =>
                                        setData({ ...data, material: event.target.value })
                                    }
                                    required
                                >
                                    <option value="">Choisir une matiere</option>
                                    {availableMaterials.map((material) => (
                                        <option key={material._id} value={material._id}>
                                            {material.name} ({material.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label" htmlFor="initial-quantity">
                                    Quantite initiale
                                </label>
                                <input
                                    className="input"
                                    id="initial-quantity"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={data.quantityInitial}
                                    onChange={(event) =>
                                        setData({ ...data, quantityInitial: event.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="label" htmlFor="initial-threshold">
                                    Seuil d'alerte
                                </label>
                                <input
                                    className="input"
                                    id="initial-threshold"
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={data.alertThreshold}
                                    onChange={(event) =>
                                        setData({ ...data, alertThreshold: event.target.value })
                                    }
                                    required
                                />
                            </div>
                            <button className="btn w-full">
                                {saving ? "Enregistrement..." : "Initialiser"}
                            </button>
                        </fieldset>
                    </form>
                </section>
            </div>
            {selected && (
                <section className="card space-y-5">
                    <div className="page-heading">
                        <h2>
                            {selected.material?.name} — {selected.quantityCurrent}{" "}
                            {selected.material?.unit}
                        </h2>
                        <button
                            className="btn-secondary"
                            disabled={saving}
                            onClick={() => setSelectedId("")}
                        >
                            Fermer
                        </button>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <form onSubmit={addEntry} className="space-y-3">
                            <label className="label" htmlFor="entry-quantity">
                                Quantite a ajouter ({selected.material?.unit})
                            </label>
                            <input
                                className="input"
                                id="entry-quantity"
                                type="number"
                                min="0"
                                step="any"
                                value={entry}
                                onChange={(event) => setEntry(event.target.value)}
                                required
                            />
                            <button className="btn" disabled={saving}>
                                Enregistrer l'entree
                            </button>
                        </form>
                        <form onSubmit={updateThreshold} className="space-y-3">
                            <label className="label" htmlFor="alert-threshold">
                                Seuil d'alerte
                            </label>
                            <input
                                className="input"
                                id="alert-threshold"
                                type="number"
                                min="0"
                                step="any"
                                value={threshold}
                                onChange={(event) => setThreshold(event.target.value)}
                                required
                            />
                            <button className="btn-secondary" disabled={saving}>
                                Modifier le seuil
                            </button>
                        </form>
                    </div>
                    <h3>Historique des mouvements</h3>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Date</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">Quantite</th>
                                    <th scope="col">Ordre</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map((movement) => (
                                    <tr key={movement._id}>
                                        <td>
                                            {new Date(movement.createdAt).toLocaleString("fr-FR")}
                                        </td>
                                        <td>{movementLabels[movement.type]}</td>
                                        <td>
                                            {movement.type === "EXIT" ? "−" : "+"}
                                            {movement.quantity} {selected.material?.unit}
                                        </td>
                                        <td>{movement.order ? movement.order.slice(-8) : "—"}</td>
                                    </tr>
                                ))}
                                {movements.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="empty">
                                            Aucun mouvement enregistre.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </>
    );
}
