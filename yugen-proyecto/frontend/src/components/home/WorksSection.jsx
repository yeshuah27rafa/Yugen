// components/home/WorksSection.jsx
// Colecciones por obra, en índice editorial. Al pasar por una obra cambia la atmósfera de la sección.
import { useRef } from "react";
import { Link } from "react-router-dom";
import DataState from "../DataState.jsx";
import { toneFor } from "../../utils/artwork.js";

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
        <p>No comparten género ni estética: las une una forma de sentir. Entra a la que te interese.</p>
      </header>
      <DataState
        state={state}
        emptyText="Pronto añadiremos las obras de la tienda."
        render={(works) => (
          <ol className="works">
            {works.map((work, index) => (
              <li key={work._id}>
                <Link to={`/catalogo?work=${work.slug}`} onPointerEnter={() => tint(work)} onFocus={() => tint(work)}>
                  <span className="works__n">{String(index + 1).padStart(2, "0")}</span>
                  <span className="works__title">{work.title}</span>
                  <span className="works__year">{work.year || ""}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      />
    </section>
  );
}
