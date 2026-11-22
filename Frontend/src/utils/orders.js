export const statuses = {
    PLANNED: "Planifie",
    IN_PROGRESS: "En cours",
    COMPLETED: "Termine",
    CANCELLED: "Annule"
};

export function orderProducts(order) {
    if (order.products && order.products.length > 0) {
        return order.products;
    }

    // Les anciens ordres contiennent un seul produit.
    if (order.productReference) {
        return [order];
    }

    return [];
}

export function calculateRequirements(products) {
    const requirements = [];

    for (const product of products) {
        let composition = product.compositionSnapshot;
        if (!composition) {
            composition = product.composition || [];
        }

        for (const line of composition) {
            let material = line.material;
            if (!material) {
                material = line;
            }

            const id = String(line.rawMaterial || material._id);
            const quantity = Number(line.quantityPerUnit) * Number(product.quantity);
            const existing = requirements.find(function (item) {
                return item.id === id;
            });

            if (existing) {
                existing.quantity += quantity;
            } else {
                requirements.push({
                    id: id,
                    reference: material.reference,
                    name: material.name,
                    unit: material.unit,
                    quantity: quantity
                });
            }
        }
    }

    return requirements;
}
