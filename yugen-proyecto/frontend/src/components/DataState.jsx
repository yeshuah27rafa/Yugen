// components/DataState.jsx
// Muestra carga, error o vacío antes de renderizar datos. El error indica el motivo real (código HTTP incluido).
export default function DataState({ state, emptyText, render }) {
  if (state.status === "loading") {
    return <p className="status">Cargando…</p>;
  }
  if (state.status === "error") {
    const detail = state.httpStatus === 401
      ? "Tu sesión expiró. Vuelve a iniciar sesión."
      : state.httpStatus === 0
        ? "No hay conexión con el servidor."
        : state.error || "No pudimos cargar esta sección.";
    return (
      <p className="status status--error" role="alert">
        {detail} <span className="status">(código {state.httpStatus || "sin respuesta"})</span>
      </p>
    );
  }
  if (state.data.length === 0) {
    return <div className="status">{emptyText}</div>;
  }
  return render(state.data);
}
