import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [installed, setInstalled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const [notice, setNotice] = useState("");

    useEffect(() => {
        let active = true;
        async function loadSession() {
            setLoading(true);
            setError("");
            try {
                const response = await api.get("/api/installation/status");
                if (!active) return;
                setInstalled(response.data.installed);
                if (response.data.installed && localStorage.getItem("token")) {
                    try {
                        const profile = await api.get("/api/auth/me");
                        if (active) setUser(profile.data.user);
                    } catch (err) {
                        const status = err.response?.status;
                        if (status !== 401 && status !== 404) {
                            throw err;
                        }
                        localStorage.removeItem("token");
                        if (active) setUser(null);
                    }
                }
            } catch (err) {
                if (active) setError(errorMessage(err));
            } finally {
                if (active) setLoading(false);
            }
        }
        loadSession();
        return () => {
            active = false;
        };
    }, [attempt]);

    useEffect(() => {
        function expireSession() {
            localStorage.removeItem("token");
            setUser(null);
            setNotice("Votre session a expire. Veuillez vous reconnecter.");
        }
        window.addEventListener("session-expired", expireSession);
        return () => window.removeEventListener("session-expired", expireSession);
    }, []);

    async function login(email, password) {
        setNotice("");
        const response = await api.post("/api/auth/login", {
            email: email.trim().toLowerCase(),
            password
        });
        localStorage.setItem("token", response.data.token);
        try {
            const profile = await api.get("/api/auth/me");
            setUser(profile.data.user);
        } catch (err) {
            localStorage.removeItem("token");
            throw err;
        }
    }

    async function logout() {
        try {
            await api.post("/api/auth/logout");
            setNotice("");
        } catch {
            setNotice(
                "Deconnexion locale effectuee. Le serveur n'a pas pu confirmer la fermeture de la session."
            );
        } finally {
            localStorage.removeItem("token");
            setUser(null);
        }
    }

    function retry() {
        setAttempt(attempt + 1);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                installed,
                setInstalled,
                loading,
                error,
                notice,
                login,
                logout,
                retry
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
