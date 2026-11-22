import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import * as service from "../src/services/productionOrderService.js";
import orders from "../src/repositories/productionOrderRepository.js";
import users from "../src/repositories/userRepository.js";
import products from "../src/repositories/productRepository.js";
import stocks from "../src/repositories/stockRepository.js";
import transactions from "../src/repositories/transactionRepository.js";
import ProductionOrder from "../src/models/ProductionOrder.js";

const admin = "111111111111111111111111";
const operator = "222222222222222222222222";
const orderId = "333333333333333333333333";
const x = { _id: "x", reference: "MAT-X", name: "Matiere X", unit: "kg" };
const y = { _id: "y", reference: "MAT-Y", name: "Matiere Y", unit: "kg" };
const catalog = {
    "PRD-A": { _id: "a", reference: "PRD-A", name: "A", composition: [{ material: x, quantityPerUnit: 2 }] },
    "PRD-B": { _id: "b", reference: "PRD-B", name: "B", composition: [{ material: x, quantityPerUnit: 3 }, { material: y, quantityPerUnit: 1 }] },
};
const input = { assignedOperator: operator, products: [{ productReference: "PRD-A", quantity: 10 }, { productReference: "PRD-B", quantity: 5 }] };

function setup(t) {
    t.mock.method(users, "findById", async id => ({ _id: id, role: id === admin ? "ADMIN" : "OPERATOR" }));
    t.mock.method(products, "findDetailsByReference", async ref => structuredClone(catalog[ref]));
    t.mock.method(orders, "create", async data => ({ _id: orderId, ...data }));
    t.mock.method(transactions, "run", async work => work({ session: true }));
}

test("a multi-product order snapshots both compositions and sums shared materials", async t => {
    setup(t);
    const order = await service.createOrder(input, admin);
    assert.equal(order.products.length, 2);
    assert.deepEqual(service.materialRequirements(order).map(line => [line.reference, line.quantity]), [["MAT-X", 35], ["MAT-Y", 5]]);
    t.mock.method(orders, "findById", async () => order);
    t.mock.method(orders, "transition", async (_, previous, changes) => ({ ...order, ...changes }));
    const consume = t.mock.method(stocks, "consume", async () => ({}));
    assert.equal((await service.startOrder(orderId, operator)).status, "IN_PROGRESS");
    assert.deepEqual(consume.mock.calls.map(call => call.arguments.slice(0, 2)), [["x", 35], ["y", 5]]);
});

test("empty products, duplicate references and invalid quantities are rejected", async t => {
    setup(t);
    for (const lines of [[], [input.products[0], { ...input.products[0], productReference: " prd-a " }], [{ productReference: "PRD-A", quantity: 0 }], [{ productReference: "PRD-A", quantity: Infinity }]]) {
        await assert.rejects(service.createOrder({ ...input, products: lines }, admin), { status: 400 });
    }
});

test("planned edits preserve existing snapshots even after the catalog changes", async t => {
    setup(t);
    const order = await service.createOrder(input, admin);
    t.mock.method(orders, "findById", async () => order);
    t.mock.method(products, "findDetailsByReference", async () => assert.fail("existing products must use the saved snapshot"));
    t.mock.method(orders, "transition", async (_, previous, changes) => ({ ...order, ...changes }));
    const updated = await service.updateOrder(orderId, { ...input, products: [{ productReference: "PRD-A", quantity: 4 }] }, admin);
    assert.equal(updated.products[0].compositionSnapshot[0].quantityPerUnit, 2);
    assert.equal(service.materialRequirements(updated)[0].quantity, 8);
    await assert.rejects(service.updateOrder(orderId, input, operator), { status: 403 });
    order.status = "IN_PROGRESS";
    await assert.rejects(service.updateOrder(orderId, input, admin), { status: 409 });
});

test("schema accepts multi-product orders and rejects duplicates and empty snapshots", () => {
    const line = {
        product: new mongoose.Types.ObjectId(), productReference: "PRD-A", productName: "A", quantity: 10,
        compositionSnapshot: [{ rawMaterial: new mongoose.Types.ObjectId(), reference: "MAT-X", name: "X", unit: "kg", quantityPerUnit: 2 }],
    };
    const base = { assignedOperator: new mongoose.Types.ObjectId(), createdBy: new mongoose.Types.ObjectId() };
    assert.equal(new ProductionOrder({ ...base, products: [line] }).validateSync(), undefined);
    assert.ok(new ProductionOrder({ ...base, products: [line, line] }).validateSync());
    assert.ok(new ProductionOrder({ ...base, products: [] }).validateSync());
    assert.ok(new ProductionOrder({ ...base, products: [{ ...line, compositionSnapshot: [] }] }).validateSync());
});
