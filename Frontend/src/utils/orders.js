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

