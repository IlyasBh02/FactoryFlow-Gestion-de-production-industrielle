import { useState } from "react";

export function AccountForm({ onSubmit, saving, buttonText }) {
    const [data, setData] = useState({ name: "", email: "", password: "" });

    function change(event) {
        setData({ ...data, [event.target.name]: event.target.value });
    }

    function submit(event) {
        event.preventDefault();
        onSubmit({
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            password: data.password
        });
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <label className="label" htmlFor="account-name">
                    Nom
                </label>
                <input
                    className="input"
                    id="account-name"
                    name="name"
                    autoComplete="name"
                    value={data.name}
                    onChange={change}
                    required
                    pattern=".*\S.*"
                />
            </div>
            <div>
                <label className="label" htmlFor="account-email">
                    Email
                </label>
                <input
                    className="input"
                    id="account-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={data.email}
                    onChange={change}
                    required
                />
            </div>
            <div>
                <label className="label" htmlFor="account-password">
                    Mot de passe
                </label>
                <input
                    className="input"
                    id="account-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={data.password}
                    onChange={change}
                    minLength={8}
                    required
                    aria-describedby="password-help"
                />
                <p id="password-help" className="muted mt-1">
                    8 caracteres minimum.
                </p>
            </div>
            <button className="btn w-full" type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : buttonText}
            </button>
        </form>
    );
}
