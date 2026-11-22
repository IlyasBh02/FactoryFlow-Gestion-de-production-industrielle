import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { PageMessage } from "../components/PageMessage";
import { calculateRequirements, orderProducts } from "../utils/orders";

export function OrderForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [operators, setOperators] = useState([]);
    const [original, setOriginal] = useState(null);
    const [lines, setLines] = useState([{ productReference: "", quantity: "1" }]);
    const [operator, setOperator] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        async function load() {
            setLoading(true);
            setError("");
            try {
                const catalog = await api.get("/api/product/all");
                const people = await api.get("/api/auth/operators");
                let detail = null;
                if (id) {
                    detail = await api.get(`/api/production-orders/${id}`);
                }
                if (!active) return;
                setProducts(catalog.data.allProduct);
                setOperators(people.data.operators);
                if (detail) {
                    const order = detail.data.order;
                    setOriginal(order);
                    setOperator(order.assignedOperator?._id || order.assignedOperator);
                    setLines(
                        orderProducts(order).map((product) => ({
                            productReference: product.productReference,
                            quantity: product.quantity
                        }))
                    );
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
    }, [id]);

    // Recalculer les besoins quand les produits ou leurs quantites changent.
    const requirements = useMemo(
        function () {
            const selectedProducts = [];

            for (const line of lines) {
                let product;

                // En modification, garder la composition copiee dans l'ordre.
                if (original) {
                    product = orderProducts(original).find(function (item) {
                        return item.productReference === line.productReference;
                    });
                }
                if (!product) {
                    product = products.find(function (item) {
                        return item.reference === line.productReference;
                    });
                }
                if (product) {
                    selectedProducts.push({ ...product, quantity: line.quantity });
                }
            }

            return calculateRequirements(selectedProducts);
        },
        [lines, products, original]
    );

    function changeLine(index, field, value) {
        const updatedLines = lines.map(function (line, lineIndex) {
            if (lineIndex === index) {
                return { ...line, [field]: value };
            }
            return line;
        });
        setLines(updatedLines);
    }

    function addProduct() {
        setLines([...lines, { productReference: "", quantity: "1" }]);
    }

    function removeProduct(index) {
        const remaining = lines.filter(function (line, lineIndex) {
            return lineIndex !== index;
        });
        setLines(remaining);
    }

    async function submit(event) {
        event.preventDefault();
        if (saving) {
            return;
        }
        setError("");

        if (!operator || lines.length === 0) {
            setError("Choisissez un operateur et ajoutez au moins un produit.");
            return;
        }

        const references = [];
        const orderLines = [];
        for (const line of lines) {
            const quantity = Number(line.quantity);
            if (!line.productReference || !Number.isFinite(quantity) || quantity <= 0) {
                setError("Chaque produit doit avoir une quantite strictement positive.");
                return;
            }
            if (references.includes(line.productReference)) {
                setError("Un produit ne peut figurer qu'une seule fois dans l'ordre.");
                return;
            }
            references.push(line.productReference);
            orderLines.push({ productReference: line.productReference, quantity: quantity });
        }

        for (const material of requirements) {
            if (!Number.isFinite(material.quantity) || material.quantity <= 0) {
                setError("Les besoins calcules doivent etre des nombres finis et positifs.");
                return;
            }
        }

        setSaving(true);
        try {
            const data = { products: orderLines, assignedOperator: operator };
            let response;
            if (id) {
                response = await api.put(`/api/production-orders/${id}`, data);
            } else {
                response = await api.post("/api/production-orders", data);
            }
            navigate(`/orders/${response.data.order._id}`, {
                state: { message: id ? "Ordre modifie." : "Ordre cree." }
            });
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    const unavailable =
        loading ||
        saving ||
        !products.length ||
        !operators.length ||
        (id && (!original || original.status !== "PLANNED"));

    return (
        <>
            <div className="page-heading">
                <h1>{id ? "Modifier l'ordre" : "Nouvel ordre"}</h1>
                <Link className="text-link" to={id ? `/orders/${id}` : "/orders"}>
                    Liste ou details des ordres
                </Link>
            </div>
            <PageMessage loading={loading} error={error} />
            {!loading && (!products.length || !operators.length) && (
                <p className="error">
                    Creez au moins un produit et un operateur avant de planifier un ordre.
                </p>
            )}
            {original && original.status !== "PLANNED" && (
                <p role="alert" className="error">
                    Seul un ordre planifie peut etre modifie.
                </p>
            )}
            <div className="grid items-start gap-6 lg:grid-cols-3">
                <form onSubmit={submit} className="card space-y-5 lg:col-span-2">
                    <fieldset disabled={unavailable} className="space-y-5">
                        <legend className="sr-only">Planification de fabrication</legend>
                        <div>
                            <label className="label" htmlFor="assigned-operator">
                                Operateur
                            </label>
                            <select
                                className="input"
                                id="assigned-operator"
                                value={operator}
                                onChange={(event) => setOperator(event.target.value)}
                                required
                            >
                                <option value="">Choisir un operateur</option>
                                {operators.map((person) => (
                                    <option key={person._id} value={person._id}>
                                        {person.name} — {person.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <h2>Produits a fabriquer</h2>
                        {lines.map((line, index) => (
                            <div
                                className="space-y-3 rounded-md border border-slate-700 p-4"
                                key={index}
                            >
                                <div>
                                    <label className="label" htmlFor={`order-line-${index}`}>
                                        Produit {index + 1}
                                    </label>
                                    <select
                                        className="input"
                                        id={`order-line-${index}`}
                                        value={line.productReference}
                                        onChange={(event) =>
                                            changeLine(
                                                index,
                                                "productReference",
                                                event.target.value
                                            )
                                        }
                                        required
                                    >
                                        <option value="">Choisir un produit</option>
                                        {products.map((product) => (
                                            <option
                                                key={product.reference}
                                                value={product.reference}
                                            >
                                                {product.name} ({product.reference})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label" htmlFor={`order-count-${index}`}>
                                        Quantite a fabriquer
                                    </label>
                                    <input
                                        className="input"
                                        id={`order-count-${index}`}
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={line.quantity}
                                        onChange={(event) =>
                                            changeLine(index, "quantity", event.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="text-link"
                                    disabled={lines.length === 1}
                                    onClick={() => removeProduct(index)}
                                >
                                    Retirer le produit {index + 1}
                                </button>
                            </div>
                        ))}
                        <button type="button" className="btn-secondary" onClick={addProduct}>
                            Ajouter un produit
                        </button>
                        <div className="border-t border-slate-800 pt-4">
                            <button className="btn">
                                {saving ? "Enregistrement..." : "Enregistrer l'ordre"}
                            </button>
                        </div>
                    </fieldset>
                </form>
                <section className="card space-y-4" aria-label="Besoins en matieres">
                    <h2>Besoins en matieres</h2>
                    <p className="muted">
                        Total pour tous les produits de cet ordre. Le stock sera consomme au
                        demarrage.
                    </p>
                    <ul className="space-y-3" aria-live="polite">
                        {requirements.map((line) => (
                            <li className="border-t border-slate-800 pt-3" key={line.id}>
                                <p className="text-sm">{line.name}</p>
                                <p className="mt-1 font-semibold text-indigo-300">
                                    {Number.isFinite(line.quantity)
                                        ? Number(line.quantity.toFixed(6))
                                        : "Quantite invalide"}{" "}
                                    {line.unit}
                                </p>
                            </li>
                        ))}
                    </ul>
                    {!requirements.length && (
                        <p className="muted">Selectionnez un produit pour afficher les besoins.</p>
                    )}
                </section>
            </div>
        </>
    );
}
