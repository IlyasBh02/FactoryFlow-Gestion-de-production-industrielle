import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import api, { errorMessage } from "../services/api";
import { PageMessage } from "../components/PageMessage";
import { PopUpEdit } from "../components/PopUpEdit";

const emptyMaterial = { reference: "", name: "", unit: "" };

export function Material() {
    const [materials, setMaterials] = useState([]);
    const [data, setData] = useState(emptyMaterial);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selected, setSelected] = useState(null);
    const [editError, setEditError] = useState("");

    async function load() {
        setLoading(true);
        try {
            const response = await api.get("/api/material/all");
            setMaterials(response.data.allMaterial);
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
        if (saving) {
            return;
        }
        setError("");
        setSuccess("");
        const material = {
            reference: data.reference.trim().toUpperCase(),
            name: data.name.trim(),
            unit: data.unit.trim()
        };
        if (!material.reference || !material.name || !material.unit) {
            setError("Remplissez tous les champs.");
            return;
        }
        setSaving(true);
        try {
            await api.post("/api/material/newMaterial", material);
            setData(emptyMaterial);
            setSuccess("Matiere ajoutee.");
            await load();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function save(changes) {
        if (saving) {
            return false;
        }
        setEditError("");
        if (!changes.name || !changes.unit || changes.unit.length > 3) {
            setEditError("Le nom et une unite de 3 caracteres maximum sont obligatoires.");
            return false;
        }
        setSaving(true);
        try {
            const response = await api.post(
                `/api/material/update/${encodeURIComponent(selected.reference)}`,
                changes
            );
            const updatedMaterials = materials.map(function (material) {
                if (material.reference === selected.reference) {
                    return { ...material, ...response.data.info_Materiel };
                }
                return material;
            });
            setMaterials(updatedMaterials);
            setSuccess("Matiere modifiee.");
            return true;
        } catch (err) {
            setEditError(errorMessage(err));
            return false;
        } finally {
            setSaving(false);
        }
    }

    const filtered = materials.filter(function (material) {
        const text = material.name + " " + material.reference;
        return text.toLowerCase().includes(search.trim().toLowerCase());
    });

    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>Matieres premieres</h1>
                    <p>{materials.length} matiere(s) dans le catalogue.</p>
                </div>
            </div>
            <PageMessage loading={loading} error={error} success={success} />
            <div className="grid items-start gap-6 lg:grid-cols-3">
                <section
                    className="min-w-0 space-y-4 lg:col-span-2"
                    aria-label="Catalogue des matieres"
                >
                    <div>
                        <label className="label" htmlFor="search-material">
                            Rechercher une matiere
                        </label>
                        <input
                            id="search-material"
                            className="input"
                            type="search"
                            placeholder="Nom ou reference"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Nom</th>
                                    <th scope="col">Reference</th>
                                    <th scope="col">Unite</th>
                                    <th scope="col">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((material) => (
                                    <tr key={material.reference}>
                                        <th scope="row">{material.name}</th>
                                        <td className="text-slate-400">{material.reference}</td>
                                        <td>{material.unit}</td>
                                        <td>
                                            <button
                                                className="btn-secondary"
                                                aria-label={`Modifier ${material.name}`}
                                                onClick={() => {
                                                    setSelected(material);
                                                    setEditError("");
                                                    setSuccess("");
                                                }}
                                            >
                                                <Pencil size={15} aria-hidden="true" />
                                                Modifier
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="empty">
                                            Aucune matiere trouvee.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                <section className="card space-y-4">
                    <h2>Ajouter une matiere</h2>
                    <form onSubmit={create} className="space-y-4">
                        <div>
                            <label className="label" htmlFor="material-reference">
                                Reference
                            </label>
                            <input
                                className="input"
                                id="material-reference"
                                value={data.reference}
                                onChange={(event) =>
                                    setData({ ...data, reference: event.target.value })
                                }
                                placeholder="MAT-001"
                                required
                            />
                        </div>
                        <div>
                            <label className="label" htmlFor="material-name">
                                Nom
                            </label>
                            <input
                                className="input"
                                id="material-name"
                                value={data.name}
                                onChange={(event) => setData({ ...data, name: event.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="label" htmlFor="material-unit">
                                Unite
                            </label>
                            <input
                                className="input"
                                id="material-unit"
                                value={data.unit}
                                onChange={(event) => setData({ ...data, unit: event.target.value })}
                                placeholder="kg, L, pcs"
                                maxLength={3}
                                required
                            />
                        </div>
                        <button className="btn w-full" disabled={saving}>
                            {saving ? "Enregistrement..." : "Ajouter"}
                        </button>
                    </form>
                </section>
            </div>
            {selected && (
                <PopUpEdit
                    key={selected.reference}
                    material={selected}
                    onClose={() => setSelected(null)}
                    onSave={save}
                    isSaving={saving}
                    error={editError}
                />
            )}
        </>
    );
}
