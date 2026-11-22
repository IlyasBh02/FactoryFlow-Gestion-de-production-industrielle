import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import users from "../src/repositories/userRepository.js";
import revoked from "../src/repositories/revokedTokenRepository.js";

test("catalog, stocks and operator management deny operator access on the server", async t => {
    const previous = process.env.SECRET_KEY;
    process.env.SECRET_KEY = "permissions-test-secret";
    t.after(() => { if (previous === undefined) delete process.env.SECRET_KEY; else process.env.SECRET_KEY = previous; });
    t.mock.method(users, "findById", async () => ({ _id: "operator", role: "OPERATOR" }));
    t.mock.method(revoked, "existsByHash", async () => null);
    const token = jwt.sign({ sub: "operator" }, process.env.SECRET_KEY);
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise(resolve => server.close(resolve)));
    for (const [method, path] of [["GET", "/api/material/all"], ["POST", "/api/material/newMaterial"], ["GET", "/api/product/all"], ["GET", "/api/stock/all"], ["GET", "/api/auth/operators"], ["POST", "/api/auth/register"]]) {
        const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { Authorization: `Bearer ${token}` } });
        assert.equal(response.status, 403, `${method} ${path}`);
    }
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, { method: "POST" });
    assert.equal(response.status, 401);
});
