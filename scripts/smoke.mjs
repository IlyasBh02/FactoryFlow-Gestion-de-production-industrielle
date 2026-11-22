import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

// Run only against a NEW, isolated database: this creates synthetic test records.
export async function runSmoke(base) {
    if (!base) throw new Error("Set SMOKE_URL to an isolated FactoryFlow instance.");
    async function request(method, path, token, body) {
        const response = await fetch(base + path, {
            method,
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
            body: body ? JSON.stringify(body) : undefined,
        });
        return { status: response.status, data: await response.json() };
    }
    const status = await request("GET", "/api/installation/status");
    assert.equal(status.data.installed, false, "Use a fresh test database; existing data will not be reset.");
    const password = randomUUID() + "Aa1!";
    const adminEmail = `admin-${randomUUID()}@example.test`;
    const setup = { name: "Admin Safi", email: adminEmail, password };
    const installations = await Promise.all([request("POST", "/api/installation", null, setup), request("POST", "/api/installation", null, setup)]);
    assert.deepEqual(installations.map(result => result.status).sort(), [201, 409], JSON.stringify(installations));
    assert.equal((await request("GET", "/api/installation/status")).data.installed, true);
    const login = await request("POST", "/api/auth/login", null, { email: adminEmail, password });
    assert.equal(login.status, 200);
    const admin = login.data.token;
    const email = `operator-${randomUUID()}@example.test`;
    const otherEmail = `other-${randomUUID()}@example.test`;
    for (const operatorEmail of [email, otherEmail]) assert.equal((await request("POST", "/api/auth/register", admin, { name: "Sara", email: operatorEmail, password })).status, 201);
    const operators = (await request("GET", "/api/auth/operators", admin)).data.operators;
    const operatorId = operators.find(operator => operator.email === email)._id;
    const operator = (await request("POST", "/api/auth/login", null, { email, password })).data.token;
    const other = (await request("POST", "/api/auth/login", null, { email: otherEmail, password })).data.token;
    assert.equal((await request("GET", "/api/material/all", operator)).status, 403);
    assert.equal((await request("POST", "/api/auth/register", null, setup)).status, 401);

    for (const [reference, name] of [["MAT-X", "Acier"], ["MAT-Y", "Bois"]]) {
        assert.equal((await request("POST", "/api/material/newMaterial", admin, { reference, name, unit: "kg" })).status, 201);
    }
    const materials = (await request("GET", "/api/material/all", admin)).data.allMaterial;
    const x = materials.find(material => material.reference === "MAT-X");
    const y = materials.find(material => material.reference === "MAT-Y");
    for (const [material, initial] of [[x, 100], [y, 0]]) assert.equal((await request("POST", "/api/stock/newStock", admin, { material: material._id, quantityInitial: initial, alertThreshold: 10 })).status, 201);
    for (const [reference, composition] of [["PRD-A", [{ material: x._id, quantityPerUnit: 2 }]], ["PRD-B", [{ material: x._id, quantityPerUnit: 3 }, { material: y._id, quantityPerUnit: 1 }]]]) {
        assert.equal((await request("POST", "/api/product/newProduct", admin, { reference, name: reference === "PRD-A" ? "Table" : "Chaise", composition })).status, 201);
    }
    const input = { assignedOperator: operatorId, products: [{ productReference: "PRD-A", quantity: 10 }, { productReference: "PRD-B", quantity: 5 }] };
    const created = await request("POST", "/api/production-orders", admin, input);
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const id = created.data.order._id;
    assert.equal((await request("PUT", "/api/product/update/PRD-A", admin, { name: "Table", composition: [{ material: x._id, quantityPerUnit: 99 }] })).status, 200);
    assert.equal((await request("PUT", `/api/production-orders/${id}`, admin, input)).status, 200);
    assert.equal((await request("GET", `/api/production-orders/${id}`, operator)).data.order.products[0].compositionSnapshot[0].quantityPerUnit, 2);
    assert.equal((await request("GET", `/api/production-orders/${id}`, other)).status, 403);
    assert.equal((await request("PATCH", `/api/production-orders/${id}/start`, operator)).status, 409);
    let stocks = (await request("GET", "/api/stock/all", admin)).data.stocks;
    assert.equal(stocks.find(stock => stock.material._id === x._id).quantityCurrent, 100, "A failed start must roll back the first material too.");
    assert.equal(stocks.every(stock => stock.movements.length === 1), true, "A failed start must not leave EXIT movements.");
    const yStock = stocks.find(stock => stock.material._id === y._id);
    assert.equal((await request("POST", `/api/stock/entry/${yStock._id}`, admin, { quantity: 5 })).status, 200);
    const starts = await Promise.all([request("PATCH", `/api/production-orders/${id}/start`, operator), request("PATCH", `/api/production-orders/${id}/start`, operator)]);
    assert.deepEqual(starts.map(result => result.status).sort(), [200, 409], JSON.stringify(starts));
    stocks = (await request("GET", "/api/stock/all", admin)).data.stocks;
    assert.equal(stocks.find(stock => stock.material._id === x._id).quantityCurrent, 65);
    assert.equal(stocks.find(stock => stock.material._id === y._id).quantityCurrent, 0);
    assert.equal(stocks.every(stock => stock.movements.filter(movement => movement.type === "EXIT").length === 1), true);
    assert.equal((await request("PATCH", `/api/production-orders/${id}/complete`, operator)).data.order.status, "COMPLETED");
    assert.equal((await request("PATCH", `/api/production-orders/${id}/cancel`, admin)).status, 409);
    assert.equal((await request("PUT", `/api/production-orders/${id}`, admin, input)).status, 409);
    assert.equal((await request("GET", "/api/production-orders", other)).data.orders.length, 0);
    assert.equal((await request("POST", "/api/auth/logout", operator)).status, 200);
    assert.equal((await request("GET", "/api/auth/me", operator)).status, 401);
    const page = await fetch(base + `/orders/${id}`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /FactoryFlow/);
    console.log("Docker smoke passed: single installation, permissions, snapshots, rollback, concurrent starts, movements, completion, JWT logout and SPA refresh.");
    return { base, adminEmail, password, adminToken: admin, orderId: id, operatorEmail: email };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runSmoke(process.env.SMOKE_URL).catch(error => { console.error(error.message); process.exitCode = 1; });
}
