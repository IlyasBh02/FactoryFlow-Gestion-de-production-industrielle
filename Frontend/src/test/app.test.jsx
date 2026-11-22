import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import api from "../services/api";

jest.mock("../services/api", () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
    errorMessage: error => error.response?.data?.message_error || "Impossible de joindre le serveur.",
}));

const admin = { _id: "admin", name: "Admin Safi", email: "admin@example.com", role: "ADMIN" };
const operator = { _id: "operator", name: "Sara", email: "sara@example.com", role: "OPERATOR" };
const x = { _id: "x", reference: "MAT-X", name: "Acier", unit: "kg" };
const y = { _id: "y", reference: "MAT-Y", name: "Bois", unit: "kg" };
const products = [
    { _id: "a", reference: "PRD-A", name: "Produit A", composition: [{ material: x, quantityPerUnit: 2 }] },
    { _id: "b", reference: "PRD-B", name: "Produit B", composition: [{ material: x, quantityPerUnit: 3 }, { material: y, quantityPerUnit: 1 }] },
];
const planned = {
    _id: "order12345678", status: "PLANNED", assignedOperator: operator, createdAt: "2026-11-19T12:00:00Z",
    products: products.map((product, i) => ({ product: product._id, productReference: product.reference, productName: product.name, quantity: i ? 5 : 10,
        compositionSnapshot: product.composition.map(line => ({ rawMaterial: line.material._id, reference: line.material.reference, name: line.material.name, unit: line.material.unit, quantityPerUnit: line.quantityPerUnit })) })),
};

function boot(path, profile = admin, data = {}) {
    window.history.replaceState({}, "", path);
    if (profile) localStorage.setItem("token", "test-token");
    api.get.mockImplementation(async url => {
        if (url === "/api/installation/status") return { data: { installed: true } };
        if (url === "/api/auth/me") return { data: { user: profile } };
        if (url === "/api/auth/operators") return { data: { operators: [operator] } };
        if (url === "/api/material/all") return { data: { allMaterial: data.materials || [x, y] } };
        if (url === "/api/product/all") return { data: { allProduct: products } };
        if (url === "/api/stock/all") return { data: { stocks: data.stocks || [] } };
        if (url === "/api/production-orders") return { data: { orders: data.orders || [planned] } };
        if (url.startsWith("/api/production-orders/")) return { data: { order: planned } };
        throw new Error(`Unexpected URL: ${url}`);
    });
    return render(<App />);
}

beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
});

test("first access redirects to installation and creates the first admin", async () => {
    window.history.replaceState({}, "", "/dashboard");
    api.get.mockResolvedValue({ data: { installed: false } });
    api.post.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Premiere installation" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nom"), " Admin ");
    await user.type(screen.getByLabelText("Email"), "ADMIN@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Installer FactoryFlow" }));
    await screen.findByRole("heading", { name: "Connexion" });
    expect(api.post).toHaveBeenCalledWith("/api/installation", { name: "Admin", email: "admin@example.com", password: "password123" });
});

test("a second installation error stays visible without navigating", async () => {
    window.history.replaceState({}, "", "/installation");
    api.get.mockResolvedValue({ data: { installed: false } });
    api.post.mockRejectedValue({ response: { status: 409, data: { message_error: "Application deja installee." } } });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Premiere installation" });
    await user.type(screen.getByLabelText("Nom"), "Admin");
    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Installer FactoryFlow" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("deja installee");
    expect(window.location.pathname).toBe("/installation");
});

test("private routes redirect to login and login restores the requested page", async () => {
    const user = userEvent.setup();
    boot("/orders", null);
    await screen.findByRole("heading", { name: "Connexion" });
    api.post.mockResolvedValue({ data: { token: "new-token" } });
    api.get.mockImplementation(async url => ({ data: url === "/api/auth/me" ? { user: operator } : { orders: [planned] } }));
    await user.type(screen.getByLabelText("Email"), "sara@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByRole("heading", { name: "Mes ordres" })).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("new-token");
    expect(screen.queryByRole("link", { name: "Produits" })).not.toBeInTheDocument();
});

test("login API errors do not create a session", async () => {
    const user = userEvent.setup();
    boot("/login", null);
    await screen.findByRole("heading", { name: "Connexion" });
    api.post.mockRejectedValue({ response: { status: 400, data: { message_error: "Identifiants incorrects" } } });
    await user.type(screen.getByLabelText("Email"), "bad@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "wrong");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Identifiants incorrects");
    expect(localStorage.getItem("token")).toBeNull();
});

test("operators cannot open admin pages even with a direct URL", async () => {
    boot("/material", operator);
    expect(await screen.findByRole("heading", { name: "Acces refuse" })).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/api/material/all");
});

test("material search and editing update the selected row", async () => {
    const user = userEvent.setup();
    boot("/material");
    await screen.findByRole("button", { name: "Modifier Acier" });
    await user.type(screen.getByLabelText("Rechercher une matiere"), "MAT-X");
    expect(screen.queryByRole("button", { name: "Modifier Bois" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Modifier Acier" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Reference")).toHaveAttribute("readonly");
    await user.clear(within(dialog).getByLabelText("Nom"));
    await user.type(within(dialog).getByLabelText("Nom"), "Acier inox");
    api.post.mockResolvedValue({ data: { info_Materiel: { reference: "MAT-X", name: "Acier inox", unit: "kg" } } });
    await user.click(within(dialog).getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Modifier Acier inox" })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/api/material/update/MAT-X", { name: "Acier inox", unit: "kg" });
});

test("failed material save keeps the popup and typed values", async () => {
    const user = userEvent.setup();
    boot("/material");
    await user.click(await screen.findByRole("button", { name: "Modifier Acier" }));
    api.post.mockRejectedValue({ response: { data: { message_error: "Modification refusee" } } });
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Enregistrer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Modification refusee");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("multi-product form sums shared materials and submits distinct quantities", async () => {
    const user = userEvent.setup();
    boot("/orders/new");
    await screen.findByRole("option", { name: "Produit A (PRD-A)" });
    await user.selectOptions(screen.getByLabelText("Operateur"), "operator");
    await user.selectOptions(screen.getByLabelText("Produit 1"), "PRD-A");
    fireEvent.change(screen.getByLabelText("Quantite a fabriquer"), { target: { value: "10" } });
    await user.click(screen.getByRole("button", { name: "Ajouter un produit" }));
    await user.selectOptions(screen.getByLabelText("Produit 2"), "PRD-B");
    fireEvent.change(screen.getAllByLabelText("Quantite a fabriquer")[1], { target: { value: "5" } });
    const needs = screen.getByRole("region", { name: "Besoins en matieres" });
    expect(within(needs).getByText("35 kg")).toBeInTheDocument();
    expect(within(needs).getByText("5 kg")).toBeInTheDocument();
    api.post.mockResolvedValue({ data: { order: planned } });
    await user.click(screen.getByRole("button", { name: "Enregistrer l'ordre" }));
    expect(await screen.findByRole("heading", { name: "Details de l'ordre" })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/api/production-orders", { assignedOperator: "operator", products: [{ productReference: "PRD-A", quantity: 10 }, { productReference: "PRD-B", quantity: 5 }] });
});

test("the order form rejects duplicate products before calling the API", async () => {
    const user = userEvent.setup();
    boot("/orders/new");
    await screen.findByRole("option", { name: "Produit A (PRD-A)" });
    await user.selectOptions(screen.getByLabelText("Operateur"), "operator");
    await user.selectOptions(screen.getByLabelText("Produit 1"), "PRD-A");
    await user.click(screen.getByRole("button", { name: "Ajouter un produit" }));
    await user.selectOptions(screen.getByLabelText("Produit 2"), "PRD-A");
    await user.click(screen.getByRole("button", { name: "Enregistrer l'ordre" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("une seule fois");
    expect(api.post).not.toHaveBeenCalled();
});

test("insufficient stock keeps an order planned; retry and completion refresh the status", async () => {
    const user = userEvent.setup();
    boot(`/orders/${planned._id}`, operator);
    await user.click(await screen.findByRole("button", { name: "Demarrer l'ordre" }));
    expect(api.patch).not.toHaveBeenCalled();
    api.patch.mockRejectedValueOnce({ response: { status: 409, data: { message_error: "Stock insuffisant pour MAT-Y !" } } });
    await user.click(screen.getByRole("button", { name: "Confirmer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Stock insuffisant");
    expect(screen.getByText("Planifie")).toBeInTheDocument();
    api.patch.mockResolvedValueOnce({ data: { order: { ...planned, status: "IN_PROGRESS" } } });
    await user.click(screen.getByRole("button", { name: "Confirmer" }));
    await screen.findByRole("button", { name: "Terminer l'ordre" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    api.patch.mockResolvedValueOnce({ data: { order: { ...planned, status: "COMPLETED" } } });
    await user.click(screen.getByRole("button", { name: "Terminer l'ordre" }));
    expect(await screen.findByText("Termine")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Demarrer l'ordre" })).not.toBeInTheDocument();
});

test("status, product, date filters and pagination include completed history", async () => {
    const user = userEvent.setup();
    const records = Array.from({ length: 12 }, (_, i) => ({ ...planned, _id: `order-${i}`, status: i < 10 ? "PLANNED" : "COMPLETED" }));
    boot("/orders", operator, { orders: records });
    await screen.findByText(/12 ordre/);
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByText(/Page 2 sur 2/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Statut"), "COMPLETED");
    expect(screen.getByText(/2 ordre.*Page 1 sur 1/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Produit"), "PRD-B");
    fireEvent.change(screen.getByLabelText("Cree a partir du"), { target: { value: "2026-11-20" } });
    expect(screen.getByText("Aucun ordre trouve.")).toBeInTheDocument();
});

test("logout revokes the session and removes the local token", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({ data: {} });
    boot("/orders", operator);
    await user.click(await screen.findByRole("button", { name: "Deconnexion" }));
    expect(await screen.findByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/api/auth/logout");
    expect(localStorage.getItem("token")).toBeNull();
});

test("expired sessions redirect to login and unknown URLs show 404", async () => {
    const view = boot("/unknown");
    expect(await screen.findByRole("heading", { name: "Page introuvable" })).toBeInTheDocument();
    view.unmount();
    boot("/orders", operator);
    await screen.findByRole("heading", { name: "Mes ordres" });
    act(() => { window.dispatchEvent(new Event("session-expired")); });
    expect(await screen.findByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(screen.getByText(/session a expire/)).toBeInTheDocument();
});

test("material creation normalizes the reference and refreshes the list", async () => {
    const user = userEvent.setup();
    const data = { materials: [] };
    boot("/material", admin, data);
    await screen.findByText("Aucune matiere trouvee.");
    await user.type(screen.getByLabelText("Reference"), " mat-z ");
    await user.type(screen.getByLabelText("Nom"), " Cuivre ");
    await user.type(screen.getByLabelText("Unite"), "kg");
    api.post.mockImplementation(async () => { data.materials = [{ reference: "MAT-Z", name: "Cuivre", unit: "kg" }]; return { data: {} }; });
    await user.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(await screen.findByRole("button", { name: "Modifier Cuivre" })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/api/material/newMaterial", { reference: "MAT-Z", name: "Cuivre", unit: "kg" });
    expect(screen.getByLabelText("Reference")).toHaveValue("");
});

test("product composition refuses repeated materials", async () => {
    const user = userEvent.setup();
    boot("/products");
    await screen.findByRole("option", { name: "Acier (kg)" });
    await user.type(screen.getByLabelText("Reference"), "PRD-C");
    await user.type(screen.getByLabelText("Nom du produit"), "Produit C");
    await user.selectOptions(screen.getByLabelText("Matiere 1"), "x");
    fireEvent.change(screen.getByLabelText("Quantite par unite"), { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "Ajouter une matiere" }));
    await user.selectOptions(screen.getByLabelText("Matiere 2"), "x");
    fireEvent.change(screen.getAllByLabelText("Quantite par unite")[1], { target: { value: "1" } });
    await user.click(screen.getByRole("button", { name: "Enregistrer le produit" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("une seule fois");
    expect(api.post).not.toHaveBeenCalled();
});

test("stock entries refresh the available quantity and movement history", async () => {
    const user = userEvent.setup();
    const data = { stocks: [{ _id: "stock-x", material: x, quantityCurrent: 10, alertThreshold: 20, movements: [] }] };
    boot("/stock", admin, data);
    await user.click(await screen.findByRole("button", { name: "Gerer" }));
    fireEvent.change(screen.getByLabelText("Quantite a ajouter (kg)"), { target: { value: "40" } });
    api.post.mockImplementation(async () => {
        data.stocks = [{ ...data.stocks[0], quantityCurrent: 50, movements: [{ _id: "entry", type: "ENTRY", quantity: 40, createdAt: "2026-11-19T12:00:00Z" }] }];
        return { data: {} };
    });
    await user.click(screen.getByRole("button", { name: "Enregistrer l'entree" }));
    expect(await screen.findByRole("heading", { name: "Acier — 50 kg" })).toBeInTheDocument();
    expect(screen.getByText("Entree")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/api/stock/entry/stock-x", { quantity: 40 });
});

test("an admin can edit a planned order and keep the saved composition", async () => {
    const user = userEvent.setup();
    boot(`/orders/${planned._id}/edit`);
    await waitFor(() => expect(screen.getByLabelText("Operateur")).toHaveValue("operator"));
    expect(screen.getAllByLabelText("Quantite a fabriquer")[0]).toHaveValue(10);
    fireEvent.change(screen.getAllByLabelText("Quantite a fabriquer")[0], { target: { value: "4" } });
    expect(screen.getByText("23 kg")).toBeInTheDocument();
    api.put.mockResolvedValue({ data: { order: planned } });
    await user.click(screen.getByRole("button", { name: "Enregistrer l'ordre" }));
    await screen.findByRole("heading", { name: "Details de l'ordre" });
    expect(api.put).toHaveBeenCalledWith(`/api/production-orders/${planned._id}`, { assignedOperator: "operator", products: [{ productReference: "PRD-A", quantity: 4 }, { productReference: "PRD-B", quantity: 5 }] });
});

test("only admins see cancellation and a confirmed cancel refreshes the status", async () => {
    const user = userEvent.setup();
    boot(`/orders/${planned._id}`);
    await user.click(await screen.findByRole("button", { name: "Annuler l'ordre" }));
    api.patch.mockResolvedValue({ data: { order: { ...planned, status: "CANCELLED" } } });
    await user.click(screen.getByRole("button", { name: "Confirmer" }));
    expect(await screen.findByText("Annule")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Demarrer l'ordre" })).not.toBeInTheDocument();
});

test("operator account creation uses the authenticated registration endpoint", async () => {
    const user = userEvent.setup();
    boot("/register");
    await screen.findByRole("heading", { name: "Nouvel operateur" });
    await user.type(screen.getByLabelText("Nom"), "Sara");
    await user.type(screen.getByLabelText("Email"), "sara@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "password123");
    api.post.mockResolvedValue({ data: {} });
    await user.click(screen.getByRole("button", { name: "Creer le compte" }));
    expect(await screen.findByRole("heading", { name: "Operateurs" })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/api/auth/register", { name: "Sara", email: "sara@example.com", password: "password123" });
});

test("a forbidden order redirects to the access-denied page", async () => {
    boot(`/orders/${planned._id}`, operator);
    const read = api.get.getMockImplementation();
    api.get.mockImplementation(url => url === `/api/production-orders/${planned._id}`
        ? Promise.reject({ response: { status: 403, data: { message_error: "Autre operateur" } } }) : read(url));
    expect(await screen.findByRole("heading", { name: "Acces refuse" })).toBeInTheDocument();
});

test("a deleted account clears a stored session and returns to login", async () => {
    boot("/orders", operator);
    const read = api.get.getMockImplementation();
    api.get.mockImplementation(url => url === "/api/auth/me" ? Promise.reject({ response: { status: 404 } }) : read(url));
    expect(await screen.findByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
});
