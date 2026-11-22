import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/auth-context";
import { Layout, PrivateRoute } from "./components/Layout";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { Installation } from "./pages/installation";
import { Dashboard } from "./pages/dashboard";
import { Material } from "./pages/material";
import { Products } from "./pages/products";
import { Stock } from "./pages/stock";
import { Operators } from "./pages/operators";
import { Orders } from "./pages/orders";
import { OrderForm } from "./pages/orderForm";
import { OrderDetails } from "./pages/orderDetails";
import { NotFound, Forbidden } from "./pages/errors";

export function AppRoutes() {
    const { user, installed, loading, error, retry } = useAuth();
    if (loading)
        return (
            <div className="page">
                <p role="status">Chargement de FactoryFlow...</p>
            </div>
        );
    if (error)
        return (
            <div className="page">
                <p role="alert" className="error">
                    {error}
                </p>
                <button className="btn" onClick={retry}>
                    Reessayer
                </button>
            </div>
        );
    if (!installed)
        return (
            <Routes>
                <Route path="/installation" element={<Installation />} />
                <Route path="*" element={<Navigate to="/installation" replace />} />
            </Routes>
        );

    return (
        <Routes>
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            <Route path="/installation" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/:id" element={<OrderDetails />} />
                    <Route path="/forbidden" element={<Forbidden />} />
                    <Route element={<PrivateRoute adminOnly />}>
                        <Route path="/material" element={<Material />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/stock" element={<Stock />} />
                        <Route path="/operators" element={<Operators />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/orders/new" element={<OrderForm />} />
                        <Route path="/orders/:id/edit" element={<OrderForm />} />
                    </Route>
                </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
