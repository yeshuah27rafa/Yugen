// Índice editorial de obras; cada entrada abre una página de colección propia.
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import DataState from "../DataState.jsx";
import PieceArt from "../art/PieceArt.jsx";
import { toneFor } from "../../utils/artwork.js";

function WorkCover({ work, compact = false }) {
  const [failed, setFailed] = useState(false);
  if (work.cover && !failed) {
    return <img className={compact ? "works__cover" : "collection__cover-image"} src={work.cover} alt="" loading="lazy" onError={() => setFailed(true)} />;
  }
  return <PieceArt category="otro" seed={work.title} className={compact ? "works__cover" : "collection__cover-image"} />;
}

export { WorkCover };

export default function WorksSection({ state }) {
  const ref = useRef(null);
  function tint(work) {
    const tone = toneFor(work.title);
    if (ref.current !== null) {
      ref.current.style.setProperty("--tone-a", tone.a);
      ref.current.style.setProperty("--tone-b", tone.b);
    }
  }
  return (
    <section className="section section--works" id="colecciones" ref={ref} aria-labelledby="works-title">
      <header className="section__head" data-reveal>
        <div>
          <p className="micro">Colecciones</p>
          <h2 id="works-title">Una selección por obra.</h2>
        </div>
        <div className="works__intro"><p>No comparten género ni estética: las une una forma de sentir. Entra a la que te interese.</p><Link className="text-link" to="/colecciones">Ver todas las colecciones ↗</Link></div>
      </header>
      <DataState
        state={state}
        emptyText="Pronto añadiremos las obras de la tienda."
        render={(allWorks) => {
          const works = allWorks.filter((work) => work.showOnHome !== false);
          if (works.length === 0) return <p className="status">Pronto compartiremos nuevas colecciones.</p>;
          return (
            <ol className="works">
              {works.map((work, index) => (
                <li key={work._id}>
                  <Link className="works__link" to={`/colecciones/${work.slug}`} state={{ returnTo: "/#colecciones" }} onPointerEnter={() => tint(work)} onFocus={() => tint(work)}>
                    <span className="works__n">{String(index + 1).padStart(2, "0")}</span>
                    <span className="works__content">
                      <span className="works__title">{work.title}</span>
                      {work.synopsis ? <span className="works__synopsis">{work.synopsis}</span> : null}
                    </span>
                    <span className="works__year">{work.year || ""}</span>
                    <span className="works__visual"><WorkCover work={work} compact /></span>
                    <span className="works__arrow" aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ol>
          );
        }}
      />
    </section>
  );
}
