import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { PageMessage } from "../components/PageMessage";

export function Products() {
    const [products, setProducts] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(false);
    const [data, setData] = useState({
        reference: "",
        name: "",
        composition: [{ material: "", quantityPerUnit: "" }]
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function load() {
        try {
            const catalog = await api.get("/api/product/all");
            const rawMaterials = await api.get("/api/material/all");
            setProducts(catalog.data.allProduct);
            setMaterials(rawMaterials.data.allMaterial);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        load();
    }, []);

    function reset() {
        setEditing(false);
        setData({ reference: "", name: "", composition: [{ material: "", quantityPerUnit: "" }] });
    }

    function edit(product) {
        setError("");
        setSuccess("");
        setEditing(true);
        setData({
            reference: product.reference,
            name: product.name,
            composition: product.composition.map((line) => ({
                material: line.material?._id || "",
                quantityPerUnit: line.quantityPerUnit
            }))
        });
    }

    function changeLine(index, field, value) {
        const composition = data.composition.map(function (line, lineIndex) {
            if (lineIndex === index) {
                return { ...line, [field]: value };
            }
            return line;
        });
        setData({ ...data, composition: composition });
    }

    function addMaterial() {
        const composition = [...data.composition, { material: "", quantityPerUnit: "" }];
        setData({ ...data, composition: composition });
    }

    function removeMaterial(index) {
        const composition = data.composition.filter(function (line, lineIndex) {
            return lineIndex !== index;
        });
        setData({ ...data, composition: composition });
    }

    async function submit(event) {
        event.preventDefault();
        if (saving) {
            return;
        }
        setError("");
        setSuccess("");
        if (!data.name.trim() || !data.reference.trim()) {
            setError("Nom et reference obligatoires.");
            return;
        }
        if (data.composition.length === 0) {
            setError("Ajoutez au moins une matiere.");
            return;
        }

        const composition = [];
        const materialIds = [];
        for (const line of data.composition) {
            const quantity = Number(line.quantityPerUnit);
            if (!line.material || !Number.isFinite(quantity) || quantity <= 0) {
                setError("Chaque matiere doit avoir une quantite strictement positive.");
                return;
            }
            if (materialIds.includes(line.material)) {
                setError("Une matiere ne peut figurer qu'une seule fois.");
                return;
            }
            materialIds.push(line.material);
            composition.push({ material: line.material, quantityPerUnit: quantity });
        }
        setSaving(true);
        try {
            const payload = {
                reference: data.reference.trim().toUpperCase(),
                name: data.name.trim(),
                composition
            };
            if (editing) {
                await api.put(`/api/product/update/${encodeURIComponent(data.reference)}`, payload);
            } else {
                await api.post("/api/product/newProduct", payload);
            }
            setSuccess(editing ? "Produit modifie." : "Produit ajoute.");
            reset();
            await load();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    const filtered = products.filter((product) =>
        `${product.reference} ${product.name}`.toLowerCase().includes(search.trim().toLowerCase())
    );

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Produits</h1>
                    <p>Le catalogue et la composition de vos produits.</p>
                </div>
            </div>
            <PageMessage loading={loading} error={error} success={success} />
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <section className="min-w-0 space-y-4" aria-label="Catalogue produits">
                    <div>
                        <label className="label" htmlFor="product-search">
                            Rechercher un produit
                        </label>
                        <input
                            className="input"
                            id="product-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Nom ou reference"
                        />
                    </div>
                    <div className="space-y-3">
                        {filtered.map((product) => (
                            <article className="card" key={product.reference}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2>{product.name}</h2>
                                        <p className="muted">{product.reference}</p>
                                    </div>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => edit(product)}
                                        disabled={saving}
                                        aria-label={`Modifier ${product.name}`}
                                    >
                                        Modifier
                                    </button>
                                </div>
                                <ul className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-sm text-slate-300">
                                    {product.composition.map((line) => (
                                        <li key={line._id || line.material?._id}>
                                            {line.material?.name || "Matiere indisponible"} :{" "}
                                            {line.quantityPerUnit} {line.material?.unit} par unite
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                    {!loading && !filtered.length && <p className="empty">Aucun produit trouve.</p>}
                </section>
                <section className="card space-y-4">
                    <h2>{editing ? "Modifier le produit" : "Ajouter un produit"}</h2>
                    {!materials.length && !loading && (
                        <p className="muted">Creez d'abord une matiere premiere.</p>
                    )}
                    <form onSubmit={submit} className="space-y-4">
                        <fieldset disabled={saving || !materials.length} className="space-y-4">
                            <legend className="sr-only">Informations du produit</legend>
                            <div>
                                <label className="label" htmlFor="product-reference">
                                    Reference
                                </label>
                                <input
                                    className="input"
                                    id="product-reference"
                                    value={data.reference}
                                    readOnly={editing}
                                    onChange={(event) =>
                                        setData({ ...data, reference: event.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="label" htmlFor="product-name">
                                    Nom du produit
                                </label>
                                <input
                                    className="input"
                                    id="product-name"
                                    value={data.name}
                                    onChange={(event) =>
                                        setData({ ...data, name: event.target.value })
                                    }
                                    required
                                />
                            </div>
                            <h3>Composition par unite</h3>
                            {data.composition.map((line, index) => (
                                <div
                                    className="space-y-3 rounded-md border border-slate-700 p-3"
                                    key={index}
                                >
                                    <div>
                                        <label className="label" htmlFor={`composition-${index}`}>
                                            Matiere {index + 1}
                                        </label>
                                        <select
                                            className="input"
                                            id={`composition-${index}`}
                                            value={line.material}
                                            onChange={(event) =>
                                                changeLine(index, "material", event.target.value)
                                            }
                                            required
                                        >
                                            <option value="">Choisir une matiere</option>
                                            {materials.map((material) => (
                                                <option key={material._id} value={material._id}>
                                                    {material.name} ({material.unit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label" htmlFor={`quantity-${index}`}>
                                            Quantite par unite
                                        </label>
                                        <input
                                            className="input"
                                            id={`quantity-${index}`}
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={line.quantityPerUnit}
                                            onChange={(event) =>
                                                changeLine(
                                                    index,
                                                    "quantityPerUnit",
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                    <button
                                        className="text-link"
                                        type="button"
                                        disabled={data.composition.length === 1}
                                        onClick={() => removeMaterial(index)}
                                    >
                                        Retirer la matiere {index + 1}
                                    </button>
                                </div>
                            ))}
                            <button className="btn-secondary" type="button" onClick={addMaterial}>
                                Ajouter une matiere
                            </button>
                        </fieldset>
                        <div className="flex flex-wrap gap-3">
                            <button className="btn" disabled={saving || !materials.length}>
                                {saving ? "Enregistrement..." : "Enregistrer le produit"}
                            </button>
                            {editing && (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={reset}
                                    disabled={saving}
                                >
                                    Annuler
                                </button>
                            )}
                        </div>
                    </form>
                </section>
            </div>
        </>
    );
}
