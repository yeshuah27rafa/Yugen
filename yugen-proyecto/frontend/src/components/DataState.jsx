// components/DataState.jsx
// Muestra carga, error o vacío antes de renderizar datos. Así ninguna sección renderiza datos incompletos.
export default function DataState({ state, emptyText, render }) {
  if (state.status === "loading") {
    return <p className="status">Cargando…</p>;
  }
  if (state.status === "error") {
    return <p className="status status--error">No pudimos cargar esta sección. Revisa que el servidor esté encendido.</p>;
  }
  if (state.data.length === 0) {
    return <div className="status">{emptyText}</div>;
  }
  return render(state.data);
}
