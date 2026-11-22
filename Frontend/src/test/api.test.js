import api, { errorMessage } from "../services/api";

const originalAdapter = api.defaults.adapter;
afterEach(() => {
    api.defaults.adapter = originalAdapter;
    localStorage.clear();
});

test("the Axios client sends the JWT in Authorization", async () => {
    localStorage.setItem("token", "session-token");
    api.defaults.adapter = async config => {
        expect(config.headers.Authorization).toBe("Bearer session-token");
        return { data: { orders: [] }, status: 200, statusText: "OK", headers: {}, config };
    };
    expect((await api.get("/api/production-orders")).data.orders).toEqual([]);
});

test("only an authenticated 401 expires the shared session", async () => {
    const listener = jest.fn();
    window.addEventListener("session-expired", listener);
    try {
        localStorage.setItem("token", "expired-token");
        api.defaults.adapter = async config => { throw { config, response: { status: 403, data: { message_error: "Acces refuse" } } }; };
        await expect(api.get("/api/material/all")).rejects.toBeDefined();
        expect(listener).not.toHaveBeenCalled();
        api.defaults.adapter = async config => { throw { config, response: { status: 401 } }; };
        await expect(api.get("/api/auth/me")).rejects.toBeDefined();
        expect(listener).toHaveBeenCalledTimes(1);
    } finally { window.removeEventListener("session-expired", listener); }
});

test("HTTP and network errors produce readable messages", () => {
    expect(errorMessage({ response: { data: { message_error: "Stock insuffisant" } } })).toBe("Stock insuffisant");
    expect(errorMessage({})).toContain("Impossible de joindre le serveur");
});
