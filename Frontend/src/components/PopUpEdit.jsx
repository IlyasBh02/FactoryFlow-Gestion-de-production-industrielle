import { useState } from "react";
import { Modal } from "./Modal";

export function PopUpEdit({ material, onClose, onSave, isSaving, error }) {
    const [name, setName] = useState(material.name);
    const [unit, setUnit] = useState(material.unit);

    async function submit(event) {
        event.preventDefault();
        if (isSaving) {
            return;
        }

        const changes = {
            name: name.trim(),
            unit: unit.trim()
        };
        const saved = await onSave(changes);
        if (saved) {
            onClose();
        }
    }

    return (
        <Modal title="Modifier la matiere" onClose={onClose} busy={isSaving}>
            <form onSubmit={submit} className="space-y-4" aria-busy={isSaving}>
                <fieldset disabled={isSaving} className="space-y-4">
                    <legend className="sr-only">Informations de la matiere</legend>
                    <div>
                        <label className="label" htmlFor="edit-reference">
                            Reference
                        </label>
                        <input
                            className="input"
                            id="edit-reference"
                            value={material.reference}
                            readOnly
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="edit-name">
                            Nom
                        </label>
                        <input
                            className="input"
                            id="edit-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="edit-unit">
                            Unite
                        </label>
                        <input
                            className="input"
                            id="edit-unit"
                            value={unit}
                            maxLength={3}
                            onChange={(event) => setUnit(event.target.value)}
                            required
                        />
                    </div>
                </fieldset>
                {error && (
                    <p role="alert" className="error">
                        {error}
                    </p>
                )}
                <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                    <button
                        type="button"
                        className="btn-secondary"
                        disabled={isSaving}
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                    <button className="btn" disabled={isSaving}>
                        {isSaving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
