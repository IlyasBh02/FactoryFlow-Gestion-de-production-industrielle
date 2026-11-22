export function PageMessage({ loading, error, success }) {
    return (
        <>
            {loading && (
                <p role="status" className="muted">
                    Chargement...
                </p>
            )}
            {error && (
                <p role="alert" className="error">
                    {error}
                </p>
            )}
            {success && (
                <p role="status" className="success">
                    {success}
                </p>
            )}
        </>
    );
}
