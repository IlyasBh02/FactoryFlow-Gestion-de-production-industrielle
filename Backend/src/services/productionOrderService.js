import orders from "../repositories/productionOrderRepository.js";
import stocks from "../repositories/stockRepository.js";
import users from "../repositories/userRepository.js";
import transactions from "../repositories/transactionRepository.js";
import { getProduct } from "./productService.js";
import { ServiceError, quantity, requiredText } from "./serviceError.js";

async function actor(userId) {
    const user = await users.findById(userId);
    if (!user) throw new ServiceError(401, "Utilisateur introuvable !");
    return user;
}

function checkAccess(user, order) {
    if (user.role !== "ADMIN" && String(order.assignedOperator?._id || order.assignedOperator) !== String(user._id)) {
        throw new ServiceError(403, "Cet ordre est assigne a un autre operateur !");
    }
}

async function findOrder(id, session) {
    if (!orders.isValidId(id)) throw new ServiceError(400, "Identifiant d'ordre invalide !");
    const order = await orders.findById(id, session);
    if (!order) throw new ServiceError(404, "Ordre de production introuvable !");
    return order;
}

async function orderDetails(data, existingProducts = []) {
    const operatorId = requiredText(data.assignedOperator, "L'operateur est obligatoire !");
    const operator = await users.findById(operatorId);
    if (!operator || operator.role !== "OPERATOR") throw new ServiceError(400, "Operateur invalide !");
    // Accept old single-product requests as well as the new products array.
    const lines = data.products ?? [{ productReference: data.productReference, quantity: data.quantity }];
    if (!Array.isArray(lines) || !lines.length) throw new ServiceError(400, "Ajoutez au moins un produit.");
    const seen = new Set();
    const products = [];
    for (const line of lines) {
        const reference = requiredText(line?.productReference, "La reference du produit est obligatoire !").toUpperCase();
        if (seen.has(reference)) throw new ServiceError(400, "Un produit ne peut figurer qu'une seule fois.");
        seen.add(reference);
        const count = quantity(line.quantity, { positive: true, message: "La quantite doit etre strictement positive !" });
        const existing = existingProducts.find(product => product.productReference === reference);
        if (existing) {
            products.push({ product: existing.product, productReference: reference, productName: existing.productName,
                quantity: count, compositionSnapshot: existing.compositionSnapshot });
            continue;
        }
        const product = await getProduct(reference);
        const compositionSnapshot = product.composition.map(line => {
            const material = line.material;
            if (!material || !material.reference) throw new ServiceError(409, "Une matiere du produit est introuvable !");
            return { rawMaterial: material._id, reference: material.reference, name: material.name,
                unit: material.unit, quantityPerUnit: line.quantityPerUnit };
        });
        products.push({ product: product._id, productReference: product.reference, productName: product.name,
            quantity: count, compositionSnapshot });
    }
    materialRequirements({ products });
    return { products, assignedOperator: operator._id };
}

export function materialRequirements(order) {
    const products = order.products?.length ? order.products : [order];
    const needs = new Map();
    for (const product of products) {
        for (const line of product.compositionSnapshot) {
            const id = String(line.rawMaterial);
            const required = quantity(line.quantityPerUnit * product.quantity, { positive: true, message: "La quantite totale de matiere doit etre finie !" });
            const total = quantity((needs.get(id)?.quantity ?? 0) + required, { positive: true, message: "La quantite totale de matiere doit etre finie !" });
            needs.set(id, { rawMaterial: line.rawMaterial, reference: line.reference, name: line.name, unit: line.unit, quantity: total });
        }
    }
    return [...needs.values()];
}

export async function createOrder(data = {}, userId) {
    const user = await actor(userId);
    if (user.role !== "ADMIN") throw new ServiceError(403, "Seul un administrateur peut planifier un ordre !");
    const details = await orderDetails(data);
    return orders.create({
        ...details,
        // Legacy fields keep older clients and stored single-product orders compatible.
        ...(details.products.length === 1 ? details.products[0] : {}),
        createdBy: user._id, status: "PLANNED"
    });
}

export async function updateOrder(id, data = {}, userId) {
    const user = await actor(userId);
    if (user.role !== "ADMIN") throw new ServiceError(403, "Seul un administrateur peut modifier un ordre.");
    const order = await findOrder(id);
    if (order.status !== "PLANNED") throw new ServiceError(409, "Seul un ordre planifie peut etre modifie.");
    const details = await orderDetails(data, order.products?.length ? order.products : [order]);
    const updated = await orders.transition(id, "PLANNED", details);
    if (!updated) throw new ServiceError(409, "L'ordre a deja ete modifie !");
    return updated;
}

export async function listOrders(userId) {
    const user = await actor(userId);
    return orders.findAll(user.role === "ADMIN" ? {} : { assignedOperator: user._id });
}

export async function getOrder(id, userId) {
    const user = await actor(userId);
    const order = await findOrder(id);
    checkAccess(user, order);
    return order;
}

export async function startOrder(id, userId) {
    if (!orders.isValidId(id)) throw new ServiceError(400, "Identifiant d'ordre invalide !");
    const user = await actor(userId);
    return transactions.run(async session => {
        const order = await findOrder(id, session);
        checkAccess(user, order);
        if (order.status !== "PLANNED") throw new ServiceError(409, "Seul un ordre planifie peut demarrer !");
        for (const line of materialRequirements(order)) {
            if (!await stocks.consume(line.rawMaterial, line.quantity, session, order._id, user._id)) {
                throw new ServiceError(409, `Stock insuffisant pour ${line.reference} !`);
            }
        }
        const updated = await orders.transition(id, "PLANNED", {
            status: "IN_PROGRESS", startedBy: user._id, startedAt: new Date()
        }, session);
        if (!updated) throw new ServiceError(409, "L'ordre a deja ete modifie !");
        return updated;
    });
}

export async function completeOrder(id, userId) {
    const user = await actor(userId);
    const order = await findOrder(id);
    checkAccess(user, order);
    if (order.status !== "IN_PROGRESS") throw new ServiceError(409, "Seul un ordre en cours peut etre termine !");
    const updated = await orders.transition(id, "IN_PROGRESS", {
        status: "COMPLETED", completedBy: user._id, completedAt: new Date()
    });
    if (!updated) throw new ServiceError(409, "L'ordre a deja ete modifie !");
    return updated;
}

export async function cancelOrder(id, userId) {
    const user = await actor(userId);
    if (user.role !== "ADMIN") throw new ServiceError(403, "Seul un administrateur peut annuler un ordre.");
    const order = await findOrder(id);
    checkAccess(user, order);
    if (order.status !== "PLANNED") throw new ServiceError(409, "Seul un ordre planifie peut etre annule !");
    const updated = await orders.transition(id, "PLANNED", {
        status: "CANCELLED", cancelledBy: user._id, cancelledAt: new Date()
    });
    if (!updated) throw new ServiceError(409, "L'ordre a deja ete modifie !");
    return updated;
}
