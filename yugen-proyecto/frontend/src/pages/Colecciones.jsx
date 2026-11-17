// Índice completo de obras: punto intermedio entre el menú de colecciones y cada página individual.
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import DataState from "../components/DataState.jsx";
import BackLink from "../components/layout/BackLink.jsx";
import { WorkCover } from "../components/home/WorksSection.jsx";

export default function Colecciones() {
  const works = useApi("/works");
  return (
    <article className="collections-index">
      <BackLink to="/#colecciones">Volver al índice de Home</BackLink>
      <header className="collections-index__head">
        <p className="micro">Archivo Yugen · Obras</p>
        <h1>Historias que dejan algo en nosotros.</h1>
        <p>Explora las obras que dan contexto a las piezas de Yugen. Cada colección tiene su propio tono, recorrido y selección; puedes entrar en la que despierte tu curiosidad.</p>
        <span className="collections-index__folio">COLECCIONES / ÍNDICE COMPLETO</span>
      </header>
      <section className="collections-index__body" aria-labelledby="collections-index-title">
        <header className="section__head"><div><p className="micro">Todas las obras</p><h2 id="collections-index-title">El archivo, abierto.</h2></div><p>Las reunimos por la conexión que pueden despertar, no para ponerlas en una misma categoría.</p></header>
        <DataState state={works} emptyText="Pronto añadiremos nuevas obras al archivo." render={(items) => (
          <div className="collections-index__grid">
            {items.map((work, index) => (
              <Link className="collections-index-card" to={`/colecciones/${work.slug}`} key={work._id} state={{ returnTo: "/colecciones" }}>
                <div className="collections-index-card__art"><WorkCover work={work} compact={false} /></div>
                <div className="collections-index-card__meta"><span className="micro">{String(index + 1).padStart(2,"0")} · COLECCIÓN</span>{work.year ? <span>{work.year}</span> : null}</div>
                <h3>{work.title}</h3>
                <p>{work.synopsis || "Explora las piezas vinculadas a esta obra."}</p>
                <span className="text-link">Entrar en la colección ↗</span>
              </Link>
            ))}
          </div>
        )} />
      </section>
    </article>
  );
}
