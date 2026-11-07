// pages/ComingSoon.jsx
// Marcador honesto para rutas que llegan en etapas posteriores. No simula funcionalidad.
import { Link } from "react-router-dom";

export default function ComingSoon({ title, stage }) {
  return (
    <section className="soon">
      <h1>{title}</h1>
      {stage ? <p>Esta sección se construye en la {stage.toLowerCase()}.</p> : <p>La página que buscas no existe.</p>}
      <Link className="button" to="/">Volver al inicio</Link>
    </section>
  );
}
