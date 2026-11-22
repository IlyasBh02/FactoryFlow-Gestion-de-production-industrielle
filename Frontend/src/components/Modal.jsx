import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ title, onClose, busy = false, children }) {
    const dialogRef = useRef(null);
    const previousElement = useRef(null);

    useEffect(function () {
        if (!previousElement.current) {
            previousElement.current = document.activeElement;
        }
        if (!dialogRef.current.open) {
            dialogRef.current.showModal();
        }
        return function () {
            // Remettre le focus sur le bouton qui a ouvert la popup.
            if (previousElement.current) {
                previousElement.current.focus();
            }
        };
    }, []);

    function closeModal() {
        dialogRef.current.close();
    }

    function handleEscape(event) {
        if (busy) {
            event.preventDefault();
        }
    }

    return (
        <dialog
            className="modal"
            ref={dialogRef}
            onClose={onClose}
            onCancel={handleEscape}
            aria-label={title}
        >
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2>{title}</h2>
                <button
                    type="button"
                    aria-label="Fermer"
                    className="btn-secondary p-2"
                    disabled={busy}
                    onClick={closeModal}
                >
                    <X size={18} aria-hidden="true" />
                </button>
            </div>
            {children}
        </dialog>
    );
}
