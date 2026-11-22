import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "",
    timeout: 10000
});

// Ajouter le token a chaque requete vers l'API.
api.interceptors.request.use(function (config) {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = "Bearer " + token;
    }
    return config;
});

api.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        // Le contexte de connexion ecoute cet evenement.
        if (error.response && error.response.status === 401 && localStorage.getItem("token")) {
            window.dispatchEvent(new Event("session-expired"));
        }
        return Promise.reject(error);
    }
);

export function errorMessage(error) {
    if (!error.response) {
        return "Impossible de joindre le serveur. Verifiez votre connexion.";
    }

    const data = error.response.data;
    if (data && data.message_error) {
        return data.message_error;
    }
    if (data && data.message) {
        return data.message;
    }

    return "La demande a echoue. Veuillez reessayer.";
}

export default api;
